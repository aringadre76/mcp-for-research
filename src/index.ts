#!/usr/bin/env node
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { PubMedAdapter } from './adapters/pubmed';
import { GoogleScholarAdapter } from './adapters/google-scholar';
import { ArXivAdapter } from './adapters/arxiv';
import { UnifiedSearchAdapter } from './adapters/unified-search';
import { EnhancedUnifiedSearchAdapter } from './adapters/enhanced-unified-search';
import { PreferenceAwareUnifiedSearchAdapter } from './adapters/preference-aware-unified-search';
import { getFirecrawlClientFromEnv } from './adapters/firecrawl-api-client';
import { UserPreferencesManager } from './preferences/user-preferences';
import { z } from 'zod';
import { resolveScholarlyPaper } from './utils/resolve-scholarly-paper';
import { formatCitationWork, paperToCitableWork } from './utils/citation-format';
import { isLikelyArxivId } from './utils/identifiers';

const SERVER_VERSION = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
).version as string;

async function main() {
  const mcpServer = new McpServer({
    name: 'scholarly-research-mcp',
    version: SERVER_VERSION,
  });

  const firecrawlClient = getFirecrawlClientFromEnv();
  const pubmedApiKey = typeof process !== 'undefined' && process.env && typeof process.env.PUBMED_API_KEY === 'string' ? process.env.PUBMED_API_KEY : undefined;
  const pubmedAdapter = new PubMedAdapter(pubmedApiKey);
  const googleScholarAdapter = new GoogleScholarAdapter();
  const arxivAdapter = new ArXivAdapter();
  const unifiedSearchAdapter = new UnifiedSearchAdapter();
  const enhancedUnifiedSearchAdapter = new EnhancedUnifiedSearchAdapter(firecrawlClient ?? undefined);
  const preferenceAwareAdapter = new PreferenceAwareUnifiedSearchAdapter(firecrawlClient ?? undefined);
  const preferencesManager = UserPreferencesManager.getInstance();

  mcpServer.tool(
    'research_search',
    'Search PubMed, Google Scholar, and ArXiv. This tool passes overrideSources so the sources you list are queried even when a source is disabled in saved preferences. Date filters: startDate is passed to PubMed mindate as given (prefer YYYY/MM/DD). endDate supplies the publication year for ArXiv and Google Scholar (first path segment, e.g. YYYY from YYYY/MM/DD) and PubMed maxdate as that year string. sortBy citations mainly affects Google Scholar; ArXiv has no citation metadata here. Google Scholar may be blocked; partial failures appear under Source warnings when adapters throw. In-memory search caching applies when research_preferences cache.enabled is true (TTL from preferences).',
    {
      query: z.string().describe('Search query for papers'),
      maxResults: z.number().optional().describe('Maximum number of results after merge (default: 20)'),
      startDate: z.string().optional().describe('Start publication bound for PubMed mindate (YYYY/MM/DD recommended)'),
      endDate: z.string().optional().describe('End publication bound; year segment filters ArXiv and Scholar; PubMed uses the same year string as maxdate'),
      journal: z.string().optional().describe('Filter by journal (PubMed query fragment)'),
      author: z.string().optional().describe('Filter by author (PubMed query fragment)'),
      sources: z.array(z.enum(['pubmed', 'google-scholar', 'arxiv'])).optional().describe('Sources to search (default: all three)'),
      includeAbstracts: z.boolean().optional().describe('Include truncated abstracts in results (default: true)'),
      sortBy: z.enum(['relevance', 'date', 'citations']).optional().describe('Result sort: relevance preserves per-source order where applicable; date by publication string; citations by Scholar count when present')
    },
    async ({ query, maxResults = 20, startDate, endDate, journal, author, sources = ['pubmed', 'google-scholar', 'arxiv'], includeAbstracts = true, sortBy = 'relevance' }) => {
      try {
        if (!query || !String(query).trim()) {
          return {
            content: [
              { type: 'text', text: 'Error searching papers: Query is required.' }
            ]
          };
        }
        const searchSources = sources.length > 0 ? sources : ['pubmed', 'google-scholar', 'arxiv'];
        const prefs = preferencesManager.getPreferences();
        const endYear = endDate ? parseInt(endDate.split('/')[0], 10) : undefined;
        const NaNGuard = endYear !== undefined && Number.isNaN(endYear) ? undefined : endYear;

        const { papers: allPapers, sourceNotes } = await preferenceAwareAdapter.searchPapersWithNotes({
          query,
          maxResults,
          startDate,
          endDate: NaNGuard,
          journal,
          author,
          sources: searchSources,
          sortBy,
          preferFirecrawl: prefs.search.preferFirecrawl,
          respectUserPreferences: false,
          overrideSources: searchSources
        });

        const notesBlock = sourceNotes.length > 0 ? `\n\nSource warnings:\n${sourceNotes.map((n) => `- ${n}`).join('\n')}` : '';

        if (allPapers.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No papers found matching your search criteria.' + notesBlock
              }
            ]
          };
        }

        const resultsText = allPapers.map((paper, index) => {
          const authors = paper.authors.length > 0 ? paper.authors.join(', ') : 'Unknown authors';
          const pmcInfo = paper.pmcid ? `\n   - PMC ID: ${paper.pmcid} (Full text likely available)` : '';
          const doiInfo = paper.doi ? `\n   - DOI: ${paper.doi}` : '';
          const abstract = includeAbstracts && paper.abstract ? `\n   - Abstract: ${paper.abstract.substring(0, 200)}...` : '';
          const journalLine = paper.journal ? `\n   - Journal: ${paper.journal}` : '';
          const pmidLine = paper.pmid ? `\n   - PMID: ${paper.pmid}` : '';
          return `${index + 1}. **${paper.title}**
   - Authors: ${authors}
   - Publication Date: ${paper.publicationDate}${journalLine}${pmidLine}${pmcInfo}${doiInfo}${abstract}
`;
        }).join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `Found ${allPapers.length} papers from ${searchSources.join(', ')}:\n\n${resultsText}${notesBlock}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error searching papers: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'paper_analysis',
    'Retrieve metadata and optional full text for one paper. Identifiers: PMID (digits), PMCID (PMC plus digits), DOI (10.... or doi:...), ArXiv (YYYY.NNNNN, arxiv:..., or legacy category/number with slash). basic returns metadata and abstract only. full-text loads PubMed PMC text when available, splits heuristic sections capped by maxSectionLength, and otherwise shows a whitespace-normalized excerpt up to maxFullTextChars. textContains optionally keeps sentences containing that substring (case-insensitive). Non-PubMed records return abstract-only text for full-text mode.',
    {
      identifier: z.string().describe('PMID, PMCID, DOI, or ArXiv ID'),
      analysisType: z.enum(['basic', 'full-text']).optional().describe('basic (default) or full-text excerpt'),
      maxSectionLength: z.number().optional().describe('Max characters per detected section when PMC text is available (default: 1000)'),
      maxFullTextChars: z.number().optional().describe('Max characters for combined excerpt when sections are not used (default: 8000)'),
      textContains: z.string().optional().describe('Optional filter: prefer sentences containing this substring in excerpts')
    },
    async ({ identifier, analysisType = 'basic', maxSectionLength = 1000, maxFullTextChars = 8000, textContains }) => {
      try {
        const trimmed = identifier.trim();
        const looksValid =
          /^pmc/i.test(trimmed) ||
          /^10\./.test(trimmed) ||
          /^doi:/i.test(trimmed) ||
          isLikelyArxivId(trimmed) ||
          /^\d+$/.test(trimmed);
        if (!looksValid) {
          return {
            content: [
              {
                type: 'text',
                text: 'Invalid identifier format. Use PMID, PMCID, DOI, or ArXiv ID (including bare YYYY.NNNNN).'
              }
            ]
          };
        }

        const paper = await resolveScholarlyPaper(identifier, pubmedAdapter, arxivAdapter);

        if (!paper) {
          return {
            content: [
              {
                type: 'text',
                text: `No paper found with identifier: ${identifier}`
              }
            ]
          };
        }

        const journalLine = 'journal' in paper ? paper.journal : 'N/A';
        const pmidLine = 'pmid' in paper ? paper.pmid : 'N/A';
        const pmcidLine = 'pmcid' in paper && paper.pmcid ? paper.pmcid : 'None';
        let analysisText = `**${paper.title}**
- Authors: ${paper.authors.join(', ')}
- Journal: ${journalLine}
- Publication Date: ${paper.publicationDate}
- PMID: ${pmidLine}
- PMC ID: ${pmcidLine}
- DOI: ${paper.doi || 'None'}
- Abstract: ${paper.abstract || 'Not available'}`;

        if (analysisType === 'full-text') {
          if ('pmid' in paper && paper.pmid) {
            try {
              const sections = await pubmedAdapter.extractPaperSections(
                paper.pmid,
                maxSectionLength,
                paper.pmcid
              );
              if (sections.length > 0) {
                let block = sections.map((s) => `### ${s.title}\n${s.content}`).join('\n\n');
                if (textContains && textContains.trim()) {
                  const needle = textContains.toLowerCase();
                  const lines = block.split('\n').filter((line) => line.toLowerCase().includes(needle));
                  if (lines.length > 0) {
                    block = lines.join('\n');
                  }
                }
                const clipped = block.length > maxFullTextChars ? `${block.slice(0, maxFullTextChars)}\n...` : block;
                analysisText += `\n\n**Full text (structured excerpts)**\n${clipped}`;
              } else {
                const fullText = await pubmedAdapter.getFullTextContent(paper.pmid, paper.pmcid);
                let excerpt = fullText ? fullText.replace(/\s+/g, ' ').trim() : '';
                if (textContains && textContains.trim() && excerpt) {
                  const needle = textContains.toLowerCase();
                  const chunks = excerpt.split(/(?<=[.!?])\s+/);
                  const matched = chunks.filter((c) => c.toLowerCase().includes(needle));
                  if (matched.length > 0) {
                    excerpt = matched.join(' ');
                  }
                }
                if (excerpt) {
                  const clipped =
                    excerpt.length > maxFullTextChars ? `${excerpt.slice(0, maxFullTextChars)}...` : excerpt;
                  analysisText += `\n\n**Full text (excerpt)**\n${clipped}`;
                } else {
                  analysisText += '\n\n**Full text**: Not available from PMC or fallbacks for this record.';
                }
              }
            } catch (error) {
              analysisText += `\n\n**Full text**: Not available (${error instanceof Error ? error.message : 'Unknown error'})`;
            }
          } else if (paper.abstract) {
            let body = paper.abstract.replace(/\s+/g, ' ').trim();
            if (textContains && textContains.trim()) {
              const needle = textContains.toLowerCase();
              const chunks = body.split(/(?<=[.!?])\s+/);
              const matched = chunks.filter((c) => c.toLowerCase().includes(needle));
              if (matched.length > 0) {
                body = matched.join(' ');
              }
            }
            const clipped = body.length > maxFullTextChars ? `${body.slice(0, maxFullTextChars)}...` : body;
            analysisText += `\n\n**Body (abstract only for this source)**\n${clipped}`;
          } else {
            analysisText += '\n\n**Full text**: Metadata-only record; no abstract or PMC text for this tool to show.';
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: analysisText
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error analyzing paper: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'citation_manager',
    'Build citations and optional PubMed citation counts. Identifiers match paper_analysis. generate and all require format (apa, mla, bibtex, ris, endnote). Each format uses distinct punctuation and fields. count queries NCBI for linkouts when a PMID exists. all runs formatted output plus the count. Related-paper discovery is not available in this release.',
    {
      identifier: z.string().describe('PMID, PMCID, DOI, or ArXiv ID'),
      action: z.enum(['generate', 'count', 'all']).describe('generate formatted citation; count PubMed-linked count; all both'),
      format: z.enum(['apa', 'mla', 'bibtex', 'endnote', 'ris']).optional().describe('Required when action is generate or all')
    },
    async ({ identifier, action, format }) => {
      try {
        const trimmed = identifier.trim();
        const looksValid =
          /^pmc/i.test(trimmed) ||
          /^10\./.test(trimmed) ||
          /^doi:/i.test(trimmed) ||
          isLikelyArxivId(trimmed) ||
          /^\d+$/.test(trimmed);
        if (!looksValid) {
          return {
            content: [
              {
                type: 'text',
                text: 'Invalid identifier format. Use PMID, PMCID, DOI, or ArXiv ID (including bare YYYY.NNNNN).'
              }
            ]
          };
        }

        const paper = await resolveScholarlyPaper(identifier, pubmedAdapter, arxivAdapter);

        if (!paper) {
          return {
            content: [
              {
                type: 'text',
                text: `No paper found with identifier: ${identifier}`
              }
            ]
          };
        }

        const paperJournal = 'journal' in paper ? paper.journal : 'N/A';
        const paperPmid = 'pmid' in paper ? paper.pmid : 'N/A';
        const paperPmcid = 'pmcid' in paper && paper.pmcid ? paper.pmcid : 'None';
        let resultText = `**${paper.title}**
- Authors: ${paper.authors.join(', ')}
- Journal: ${paperJournal}
- Publication Date: ${paper.publicationDate}
- PMID: ${paperPmid}
- PMC ID: ${paperPmcid}
- DOI: ${paper.doi || 'None'}`;

        if (action === 'generate' || action === 'all') {
          if (!format) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Format is required for generate and all. Choose apa, mla, bibtex, endnote, or ris.'
                }
              ]
            };
          }

          try {
            const work = paperToCitableWork(paper);
            const citation = formatCitationWork(work, format);
            resultText += `\n\n**${format.toUpperCase()}**\n${citation}`;
          } catch (error) {
            resultText += `\n\n**${format.toUpperCase()}**: Not available (${error instanceof Error ? error.message : 'Unknown error'})`;
          }
        }

        if (action === 'count' || action === 'all') {
          try {
            if ('pmid' in paper) {
              const citationCount = await pubmedAdapter.getCitationCount(paper.pmid);
              resultText += `\n\n**Citation Count**: ${citationCount}`;
            } else {
              resultText += '\n\n**Citation Count**: Only available for PubMed records with a PMID.';
            }
          } catch (error) {
            resultText += `\n\n**Citation Count**: Not available (${error instanceof Error ? error.message : 'Unknown error'})`;
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: resultText
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error managing citations: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'research_preferences',
    'Read or update persisted preferences on disk under ~/.mcp-scholarly-research/preferences.json. Source list supports pubmed, google-scholar, arxiv only (no JSTOR adapter). cache.enabled and ttlMinutes back an in-memory bounded cache used by research_search through PreferenceAwareUnifiedSearchAdapter. Display toggles affect adapter formatters, not the MCP research_search text path.',
    {
      action: z.enum(['get', 'set', 'reset', 'export', 'import']).describe('Action to perform'),
      category: z.enum(['source', 'search', 'display', 'cache', 'all']).optional().describe('Preference category to manage'),
      preferences: z.union([z.string(), z.record(z.unknown())]).optional().describe('JSON string or object for import'),
      sourceName: z.string().optional().describe('Source name: pubmed, google-scholar, or arxiv'),
      enabled: z.boolean().optional().describe('Whether to enable a source'),
      priority: z.number().optional().describe('Priority order (1 is highest)'),
      maxResults: z.number().optional().describe('Maximum results to fetch'),
      defaultMaxResults: z.number().optional().describe('Default maximum number of results'),
      defaultSortBy: z.enum(['relevance', 'date', 'citations']).optional().describe('Default sort order'),
      preferFirecrawl: z.boolean().optional().describe('Prefer Firecrawl over Puppeteer for Google Scholar when FIRECRAWL_API_KEY is set'),
      enableDeduplication: z.boolean().optional().describe('Enable deduplication of unified search results'),
      showAbstracts: z.boolean().optional().describe('Whether adapters should include abstracts when formatting'),
      showCitations: z.boolean().optional().describe('Whether adapters should show citation counts when formatting'),
      showUrls: z.boolean().optional().describe('Whether adapters should show URLs when formatting'),
      maxAbstractLength: z.number().optional().describe('Maximum length of abstracts in adapter formatting'),
      cacheEnabled: z.boolean().optional().describe('Enable in-memory research_search cache'),
      cacheExpiry: z.number().optional().describe('Cache TTL in hours (converted to minutes internally)')
    },
    async (params) => {
      try {
        const { action, category, preferences, ...otherParams } = params;

        switch (action) {
          case 'get': {
            const getCategory = category;
            if (getCategory === 'all') {
              const prefs = preferencesManager.getPreferences();
              const sourceText = prefs.search.sources
                .map(
                  (s: { name: string; enabled: boolean; priority: number; maxResults?: number }) =>
                    `- ${s.name}: ${s.enabled ? 'Enabled' : 'Disabled'} (Priority: ${s.priority}, Max Results: ${
                      s.maxResults ?? 20
                    })`
                )
                .join('\n');
              const sp = prefs.search;
              const dp = prefs.display;
              const cp = prefs.cache;
              const combined = `**Source Preferences**
${sourceText}

**Search Preferences**
- Default Max Results: ${sp.defaultMaxResults}
- Default Sort By: ${sp.defaultSortBy}
- Prefer Firecrawl: ${sp.preferFirecrawl}
- Enable Deduplication: ${sp.enableDeduplication}

**Display Preferences**
- Show Abstracts: ${dp.showAbstracts}
- Show Citations: ${dp.showCitations}
- Show URLs: ${dp.showUrls}
- Max Abstract Length: ${dp.maxAbstractLength}

**Cache Preferences** (research_search in-process; max 32 entries)
- Cache Enabled: ${cp.enabled}
- Cache Expiry: ${Math.round(cp.ttlMinutes / 60)} hours (${cp.ttlMinutes} minutes)`;
              return {
                content: [{ type: 'text', text: combined }]
              };
            }
            if (getCategory === 'source') {
              const prefs = preferencesManager.getPreferences();
              const sourceList = prefs.search.sources;
              const sourceText = sourceList
                .map(
                  (s: { name: string; enabled: boolean; priority: number; maxResults?: number }) =>
                    `- ${s.name}: ${s.enabled ? 'Enabled' : 'Disabled'} (Priority: ${s.priority}, Max Results: ${
                      s.maxResults ?? 20
                    })`
                )
                .join('\n');
              return {
                content: [
                  {
                    type: 'text',
                    text: `**Source Preferences**\n${sourceText}`
                  }
                ]
              };
            }

            if (getCategory === 'search') {
              const searchPrefs = preferencesManager.getPreferences().search;
              return {
                content: [
                  {
                    type: 'text',
                    text: `**Search Preferences**
- Default Max Results: ${searchPrefs.defaultMaxResults}
- Default Sort By: ${searchPrefs.defaultSortBy}
- Prefer Firecrawl: ${searchPrefs.preferFirecrawl}
- Enable Deduplication: ${searchPrefs.enableDeduplication}`
                  }
                ]
              };
            }

            if (getCategory === 'display') {
              const displayPrefs = preferencesManager.getPreferences().display;
              return {
                content: [
                  {
                    type: 'text',
                    text: `**Display Preferences**
- Show Abstracts: ${displayPrefs.showAbstracts}
- Show Citations: ${displayPrefs.showCitations}
- Show URLs: ${displayPrefs.showUrls}
- Max Abstract Length: ${displayPrefs.maxAbstractLength}`
                  }
                ]
              };
            }

            if (getCategory === 'cache') {
              const cachePrefs = preferencesManager.getPreferences().cache;
              return {
                content: [
                  {
                    type: 'text',
                    text: `**Cache Preferences** (research_search in-process; max 32 entries)
- Cache Enabled: ${cachePrefs.enabled}
- Cache Expiry: ${Math.round(cachePrefs.ttlMinutes / 60)} hours (${cachePrefs.ttlMinutes} minutes)`
                  }
                ]
              };
            }

            return {
              content: [
                {
                  type: 'text',
                  text: 'Please specify a category (source, search, display, cache, or all) to get preferences.'
                }
              ]
            };
          }

          case 'set':
            if (category === 'source' && otherParams.sourceName) {
              await preferencesManager.setSourcePreference(otherParams.sourceName, {
                enabled: otherParams.enabled !== undefined ? otherParams.enabled : true,
                priority: otherParams.priority ?? 1,
                maxResults: otherParams.maxResults ?? 20
              });
              return {
                content: [
                  {
                    type: 'text',
                    text: `Source preference for ${otherParams.sourceName} updated successfully.`
                  }
                ]
              };
            }
            
            if (category === 'search') {
              await preferencesManager.updateSearchPreferences({
                defaultMaxResults: otherParams.defaultMaxResults,
                defaultSortBy: otherParams.defaultSortBy,
                preferFirecrawl: otherParams.preferFirecrawl,
                enableDeduplication: otherParams.enableDeduplication
              });
              return {
                content: [
                  {
                    type: 'text',
                    text: 'Search preferences updated successfully.'
                  }
                ]
              };
            }
            
            if (category === 'display') {
              await preferencesManager.updateDisplayPreferences({
                showAbstracts: otherParams.showAbstracts,
                showCitations: otherParams.showCitations,
                showUrls: otherParams.showUrls,
                maxAbstractLength: otherParams.maxAbstractLength
              });
              return {
                content: [
                  {
                    type: 'text',
                    text: 'Display preferences updated successfully.'
                  }
                ]
              };
            }
            
            if (category === 'cache') {
              await preferencesManager.updateCachePreferences({
                enabled: params.cacheEnabled,
                ttlMinutes: params.cacheExpiry != null ? params.cacheExpiry * 60 : undefined
              });
              return {
                content: [
                  {
                    type: 'text',
                    text: 'Cache preferences updated successfully.'
                  }
                ]
              };
            }
            
            return {
              content: [
                {
                  type: 'text',
                  text: 'Please specify a category and provide the appropriate parameters to set preferences.'
                }
              ]
            };

          case 'reset':
            await preferencesManager.resetToDefaults();
            return {
              content: [
                {
                  type: 'text',
                  text: 'All preferences have been reset to default values.'
                }
              ]
            };

          case 'export': {
            const exportedPrefs = preferencesManager.exportPreferences();
            return {
              content: [
                {
                  type: 'text',
                  text: `**Exported Preferences**
\`\`\`json
${exportedPrefs}
\`\`\``
                }
              ]
            };
          }

          case 'import': {
            if (!preferences) {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'Please provide preferences to import.'
                  }
                ]
              };
            }

            await preferencesManager.importPreferences(preferences);
            return {
              content: [
                {
                  type: 'text',
                  text: 'Preferences imported successfully.'
                }
              ]
            };
          }

          default:
            return {
              content: [
                {
                  type: 'text',
                  text: 'Invalid action. Please use: get, set, reset, export, or import.'
                }
              ]
            };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error managing preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'web_research',
    'Requires FIRECRAWL_API_KEY. Only scrape (GET-like markdown for one URL) and search (Firecrawl web search with optional per-result scrape options) are implemented. The bundled client POSTs to Firecrawl v2 /scrape and /search; unsupported parameters from older docs are omitted here so models are not misled.',
    {
      action: z.enum(['scrape', 'search']).describe('scrape a single URL or search the open web'),
      url: z.string().optional().describe('Absolute http(s) URL for scrape'),
      query: z.string().optional().describe('Search query for search'),
      maxResults: z.number().optional().describe('Maximum hits for search (default: 5)'),
      formats: z.array(z.string()).optional().describe('Firecrawl format names, default [markdown]'),
      onlyMainContent: z.boolean().optional().describe('Strip boilerplate when true (default true)'),
      waitFor: z.number().optional().describe('Milliseconds to wait on page before scrape'),
      actions: z
        .array(
          z.discriminatedUnion('type', [
            z.object({ type: z.literal('wait'), milliseconds: z.number().optional() }),
            z.object({ type: z.literal('scrape') })
          ])
        )
        .optional()
        .describe('Limited pre-scrape waits forwarded to Firecrawl')
    },
    async (params) => {
      try {
        if (!firecrawlClient) {
          return {
            content: [
              {
                type: 'text',
                text: 'Firecrawl is not configured. Set FIRECRAWL_API_KEY in the environment to enable web research.'
              }
            ]
          };
        }
        const { action, ...otherParams } = params;

        switch (action) {
          case 'scrape': {
            if (!otherParams.url) {
              return {
                content: [{ type: 'text', text: 'url is required for scrape.' }]
              };
            }
            const scrapeResult = await firecrawlClient.firecrawl_scrape({
              url: otherParams.url,
              formats: otherParams.formats && otherParams.formats.length > 0 ? otherParams.formats : ['markdown'],
              onlyMainContent: otherParams.onlyMainContent !== false,
              waitFor: otherParams.waitFor,
              actions: otherParams.actions
            });
            const preview =
              scrapeResult.content.length > 8000
                ? scrapeResult.content.slice(0, 8000) + '\n\n[... truncated]'
                : scrapeResult.content;
            return {
              content: [
                {
                  type: 'text',
                  text: `**Web scrape**\nURL: ${otherParams.url}\n\n${preview}`
                }
              ]
            };
          }

          case 'search': {
            if (!otherParams.query) {
              return {
                content: [{ type: 'text', text: 'query is required for search.' }]
              };
            }
            const searchResult = await firecrawlClient.firecrawl_search({
              query: otherParams.query,
              limit: otherParams.maxResults ?? 5,
              sources: ['web'],
              scrapeOptions: {
                formats: otherParams.formats && otherParams.formats.length > 0 ? otherParams.formats : ['markdown'],
                onlyMainContent: otherParams.onlyMainContent !== false
              }
            });
            const lines = searchResult.results.map((r, i) => {
              const title = r.title ?? 'Untitled';
              const url = r.url ?? '';
              const snippet = (r.snippet ?? r.description ?? '').slice(0, 200);
              return `${i + 1}. ${title}\n   URL: ${url}\n   ${snippet}${snippet.length >= 200 ? '...' : ''}`;
            });
            return {
              content: [
                {
                  type: 'text',
                  text: `**Web search**\nQuery: ${otherParams.query}\n\n${lines.join('\n\n')}`
                }
              ]
            };
          }

          default: {
            const _: never = action;
            return {
              content: [{ type: 'text', text: `Invalid action: ${String(_)}` }]
            };
          }
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error performing web research: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  const transport = new StdioServerTransport();
  mcpServer.connect(transport);

  console.error('Scholarly Research MCP Server (Consolidated) started');
}

main().catch(console.error);
