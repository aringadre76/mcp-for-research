import 'dotenv/config';
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

async function main() {
  const mcpServer = new McpServer({
    name: 'scholarly-research-mcp',
    version: '2.0.0',
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
    'Comprehensive research paper search across multiple sources with advanced filtering and unified results',
    {
      query: z.string().describe('Search query for papers'),
      maxResults: z.number().optional().describe('Maximum number of results (default: 20)'),
      startDate: z.string().optional().describe('Start date for publication range (YYYY/MM/DD format)'),
      endDate: z.string().optional().describe('End date for publication range (YYYY/MM/DD format)'),
      journal: z.string().optional().describe('Filter by specific journal'),
      author: z.string().optional().describe('Filter by specific author'),
      sources: z.array(z.enum(['pubmed', 'google-scholar', 'arxiv', 'jstor'])).optional().describe('Sources to search (default: all)'),
      includeAbstracts: z.boolean().optional().describe('Include paper abstracts in results (default: true)'),
      sortBy: z.enum(['relevance', 'date', 'citations']).optional().describe('Sort order (default: relevance)')
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
        const effectiveSources = sources.filter((s) => s !== 'jstor');
        const jstorRequested = sources.includes('jstor');
        const searchSources = effectiveSources.length > 0 ? effectiveSources : ['pubmed', 'google-scholar', 'arxiv'];
        const prefs = preferencesManager.getPreferences();
        const endYear = endDate ? parseInt(endDate.split('/')[0], 10) : undefined;

        const allPapers = await preferenceAwareAdapter.searchPapers({
          query,
          maxResults,
          startDate,
          endDate: endYear,
          journal,
          author,
          sources: searchSources,
          sortBy,
          preferFirecrawl: prefs.search.preferFirecrawl,
          respectUserPreferences: false,
          overrideSources: searchSources
        });

        if (allPapers.length === 0) {
          const jstorNote = jstorRequested ? '\n\nJSTOR is not implemented; results are from other sources.' : '';
          return {
            content: [
              {
                type: 'text',
                text: 'No papers found matching your search criteria.' + jstorNote
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

        const jstorNote = jstorRequested ? '\n\nJSTOR is not implemented; results are from other sources.' : '';
        return {
          content: [
            {
              type: 'text',
              text: `Found ${allPapers.length} papers from ${searchSources.join(', ')}:\n\n${resultsText}${jstorNote}`
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
    'Get comprehensive paper information, full text, and analysis including quotes, statistics, and findings',
    {
      identifier: z.string().describe('Paper identifier (PMID, PMCID, DOI, or ArXiv ID)'),
      analysisType: z.enum(['basic', 'full-text', 'quotes', 'statistics', 'findings', 'complete']).optional().describe('Type of analysis to perform (default: complete)'),
      maxQuotes: z.number().optional().describe('Maximum number of quotes to extract (default: 15)'),
      maxSectionLength: z.number().optional().describe('Maximum length of each section (default: 1000 characters)')
    },
    async ({ identifier, analysisType = 'complete', maxQuotes = 15, maxSectionLength = 1000 }) => {
      try {
        let paper;
        
        if (identifier.startsWith('PMC')) {
          paper = await pubmedAdapter.getPaperByPMCID(identifier);
        } else if (identifier.startsWith('PMC') || /^\d+$/.test(identifier)) {
          paper = await pubmedAdapter.getPaperById(identifier);
        } else if (identifier.startsWith('10.') || identifier.startsWith('doi:')) {
          paper = await pubmedAdapter.getPaperById(identifier.replace('doi:', ''));
        } else if (identifier.startsWith('arxiv:') || identifier.includes('/')) {
          paper = await arxivAdapter.getPaperById(identifier);
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Invalid identifier format. Please use PMID, PMCID, DOI, or ArXiv ID.`
              }
            ]
          };
        }

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

        const journalLine = 'journal' in paper ? paper.journal : (paper as { journal?: string }).journal ?? 'N/A';
        const pmidLine = 'pmid' in paper ? paper.pmid : (paper as { pmid?: string }).pmid ?? 'N/A';
        const pmcidLine = 'pmcid' in paper ? (paper as { pmcid?: string }).pmcid : (paper as { pmcid?: string }).pmcid ?? 'None';
        let analysisText = `**${paper.title}**
- Authors: ${paper.authors.join(', ')}
- Journal: ${journalLine}
- Publication Date: ${paper.publicationDate}
- PMID: ${pmidLine}
- PMC ID: ${pmcidLine}
- DOI: ${paper.doi || 'None'}
- Abstract: ${paper.abstract || 'Not available'}`;

        if (analysisType === 'full-text' || analysisType === 'complete') {
          try {
            if ('pmid' in paper) {
              const fullText = await pubmedAdapter.getFullTextContent(paper.pmid, (paper as { pmcid?: string }).pmcid);
              if (fullText) {
                analysisText += `\n\n**Full Text (Excerpt)**\n${fullText.substring(0, 2000)}...`;
              }
            }
          } catch (error) {
            analysisText += `\n\n**Full Text**: Not available (${error instanceof Error ? error.message : 'Unknown error'})`;
          }
        }

        if (analysisType === 'quotes' || analysisType === 'complete') {
          analysisText += `\n\n**Key Quotes and Evidence**: Not available (extraction not implemented)`;
        }

        if (analysisType === 'statistics' || analysisType === 'complete') {
          analysisText += `\n\n**Key Statistics**: Not available (extraction not implemented)`;
        }

        if (analysisType === 'findings' || analysisType === 'complete') {
          analysisText += `\n\n**Key Findings**: Not available (extraction not implemented)`;
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
    'Generate citations in multiple formats and get citation information including counts and related papers',
    {
      identifier: z.string().describe('Paper identifier (PMID, PMCID, DOI, or ArXiv ID)'),
      action: z.enum(['generate', 'count', 'related', 'all']).describe('Action to perform'),
      format: z.enum(['apa', 'mla', 'bibtex', 'endnote', 'ris']).optional().describe('Citation format (required for generate action)'),
      maxRelated: z.number().optional().describe('Maximum number of related papers (default: 10)')
    },
    async ({ identifier, action, format, maxRelated = 10 }) => {
      try {
        let paper;
        
        if (identifier.startsWith('PMC')) {
          paper = await pubmedAdapter.getPaperByPMCID(identifier);
        } else if (identifier.startsWith('PMC') || /^\d+$/.test(identifier)) {
          paper = await pubmedAdapter.getPaperById(identifier);
        } else if (identifier.startsWith('10.') || identifier.startsWith('doi:')) {
          paper = await pubmedAdapter.getPaperById(identifier.replace('doi:', ''));
        } else if (identifier.startsWith('arxiv:') || identifier.includes('/')) {
          paper = await arxivAdapter.getPaperById(identifier);
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Invalid identifier format. Please use PMID, PMCID, DOI, or ArXiv ID.`
              }
            ]
          };
        }

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
        const paperPmid = 'pmid' in paper ? (paper as { pmid: string }).pmid : 'N/A';
        const paperPmcid = 'pmcid' in paper ? (paper as { pmcid?: string }).pmcid : 'None';
        let resultText = `**${paper.title}**
- Authors: ${paper.authors.join(', ')}
- Journal: ${paperJournal}
- Publication Date: ${paper.publicationDate}
- PMID: ${paperPmid}
- PMC ID: ${paperPmcid || 'None'}
- DOI: ${paper.doi || 'None'}`;

        if (action === 'generate' || action === 'all') {
          if (!format) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Format parameter is required for generate action. Please specify apa, mla, bibtex, endnote, or ris.'
                }
              ]
            };
          }

          try {
            if (!('pmid' in paper)) throw new Error('Citation generation only supported for PubMed papers');
            const citationCount = await pubmedAdapter.getCitationCount(paper.pmid);
            const citedBy = citationCount != null ? ' Cited by ' + citationCount + '.' : '';
            const citation = paper.authors.join(', ') + ' (' + paper.publicationDate + '). ' + paper.title + '. ' + paper.journal + '. PMID: ' + paper.pmid + '.' + citedBy;
            resultText += '\n\n**Citation (' + format.toUpperCase() + ')**\n' + citation;
          } catch (error) {
            resultText += '\n\n**Citation (' + format.toUpperCase() + ')**: Not available (' + (error instanceof Error ? error.message : 'Unknown error') + ')';
          }
        }

        if (action === 'count' || action === 'all') {
          try {
            if ('pmid' in paper) {
              const citationCount = await pubmedAdapter.getCitationCount((paper as { pmid: string }).pmid);
              resultText += `\n\n**Citation Count**: ${citationCount}`;
            } else {
              resultText += '\n\n**Citation Count**: Not available (not a PubMed paper)';
            }
          } catch (error) {
            resultText += `\n\n**Citation Count**: Not available (${error instanceof Error ? error.message : 'Unknown error'})`;
          }
        }

        if (action === 'related' || action === 'all') {
          resultText += `\n\n**Related Papers**: Not available (not implemented)`;
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
    'Manage research preferences including source priorities, search settings, display options, and caching',
    {
      action: z.enum(['get', 'set', 'reset', 'export', 'import']).describe('Action to perform'),
      category: z.enum(['source', 'search', 'display', 'cache', 'all']).optional().describe('Preference category to manage'),
      preferences: z.any().optional().describe('Preferences to set (JSON object for set/import actions)'),
      sourceName: z.string().optional().describe('Source name for source-specific preferences'),
      enabled: z.boolean().optional().describe('Whether to enable a source'),
      priority: z.number().optional().describe('Priority order (1 is highest)'),
      maxResults: z.number().optional().describe('Maximum results to fetch'),
      defaultMaxResults: z.number().optional().describe('Default maximum number of results'),
      defaultSortBy: z.enum(['relevance', 'date', 'citations']).optional().describe('Default sort order'),
      preferFirecrawl: z.boolean().optional().describe('Prefer Firecrawl over Puppeteer for Google Scholar'),
      enableDeduplication: z.boolean().optional().describe('Enable deduplication of results across sources'),
      showAbstracts: z.boolean().optional().describe('Whether to show abstracts in results'),
      showCitations: z.boolean().optional().describe('Whether to show citation counts'),
      showUrls: z.boolean().optional().describe('Whether to show URLs'),
      maxAbstractLength: z.number().optional().describe('Maximum length of abstracts to display'),
      cacheEnabled: z.boolean().optional().describe('Enable result caching'),
      cacheExpiry: z.number().optional().describe('Cache expiry time in hours')
    },
    async (params) => {
      try {
        const { action, category, preferences, ...otherParams } = params;

        switch (action) {
          case 'get': {
            const getCategory = category;
            const wantAll = getCategory === 'all';
            if (getCategory === 'source' || wantAll) {
              const prefs = preferencesManager.getPreferences();
              const sourceList = prefs.search.sources;
              const sourceText = sourceList.map((s: { name: string; enabled: boolean; priority: number; maxResults?: number }) => `- ${s.name}: ${s.enabled ? 'Enabled' : 'Disabled'} (Priority: ${s.priority}, Max Results: ${s.maxResults ?? 20})`).join('\n');
              return {
                content: [
                  {
                    type: 'text',
                    text: `**Source Preferences**\n${sourceText}`
                  }
                ]
              };
            }
            
            if (getCategory === 'search' || wantAll) {
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
            
            if (getCategory === 'display' || wantAll) {
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
            
            if (getCategory === 'cache' || wantAll) {
              const cachePrefs = preferencesManager.getPreferences().cache;
              return {
                content: [
                  {
                    type: 'text',
                    text: `**Cache Preferences**
- Cache Enabled: ${cachePrefs.enabled}
- Cache Expiry: ${Math.round(cachePrefs.ttlMinutes / 60)} hours`
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

          case 'export':
            const exportedPrefs = preferencesManager.exportPreferences();
            return {
              content: [
                {
                  type: 'text',
                  text: `**Exported Preferences**
\`\`\`json
${JSON.stringify(exportedPrefs, null, 2)}
\`\`\``
                }
              ]
            };

          case 'import':
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
    'Perform web-based research using Firecrawl for reliable content extraction and analysis',
    {
      action: z.enum(['scrape', 'search', 'extract', 'map', 'crawl']).describe('Action to perform'),
      url: z.string().optional().describe('URL to scrape or starting URL for mapping/crawling'),
      query: z.string().optional().describe('Search query for web search'),
      urls: z.array(z.string()).optional().describe('Array of URLs for batch operations'),
      prompt: z.string().optional().describe('Prompt for content extraction'),
      schema: z.any().optional().describe('JSON schema for structured extraction'),
      maxResults: z.number().optional().describe('Maximum number of results (default: 5)'),
      formats: z.array(z.string()).optional().describe('Content formats to extract (default: markdown)'),
      onlyMainContent: z.boolean().optional().describe('Extract only main content (default: true)'),
      waitFor: z.number().optional().describe('Time to wait for dynamic content in milliseconds'),
      actions: z.array(z.any()).optional().describe('Actions to perform before scraping'),
      mobile: z.boolean().optional().describe('Use mobile viewport (default: false)'),
      maxAge: z.number().optional().describe('Maximum age for cached content in milliseconds (default: 172800000)'),
      maxDiscoveryDepth: z.number().optional().describe('Maximum discovery depth for crawling (default: 5)'),
      limit: z.number().optional().describe('Maximum number of pages to crawl (default: 10000)'),
      allowExternalLinks: z.boolean().optional().describe('Allow crawling external links (default: false)'),
      deduplicateSimilarURLs: z.boolean().optional().describe('Remove similar URLs during crawl (default: true)')
    },
    async (params) => {
      try {
        if (!firecrawlClient) {
          return {
            content: [
              {
                type: 'text',
                text: 'Firecrawl is not configured. Set FIRECRAWL_API_KEY or provide a Firecrawl client to enable web research.'
              }
            ]
          };
        }
        const { action, ...otherParams } = params;

        switch (action) {
          case 'scrape': {
            if (!otherParams.url) {
              return {
                content: [{ type: 'text', text: 'URL is required for scraping action.' }]
              };
            }
            const scrapeResult = await firecrawlClient.firecrawl_scrape({
              url: otherParams.url,
              formats: otherParams.formats || ['markdown'],
              onlyMainContent: otherParams.onlyMainContent !== false,
              waitFor: otherParams.waitFor,
              actions: otherParams.actions
            });
            const preview = scrapeResult.content.length > 8000 ? scrapeResult.content.slice(0, 8000) + '\n\n[... truncated]' : scrapeResult.content;
            return {
              content: [
                {
                  type: 'text',
                  text: `**Web Scraping Result**\nURL: ${otherParams.url}\n\n${preview}`
                }
              ]
            };
          }

          case 'search': {
            if (!otherParams.query) {
              return {
                content: [{ type: 'text', text: 'Query is required for search action.' }]
              };
            }
            const searchResult = await firecrawlClient.firecrawl_search({
              query: otherParams.query,
              limit: otherParams.maxResults ?? 5,
              sources: ['web'],
              scrapeOptions: {
                formats: otherParams.formats || ['markdown'],
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
                  text: `**Web Search Result**\nQuery: ${otherParams.query}\n\n${lines.join('\n\n')}`
                }
              ]
            };
          }

          case 'extract':
          case 'map':
          case 'crawl':
            return {
              content: [
                {
                  type: 'text',
                  text: 'Not implemented for this server; use scrape or search.'
                }
              ]
            };

          default:
            return {
              content: [
                {
                  type: 'text',
                  text: 'Invalid action. Please use: scrape, search, extract, map, or crawl.'
                }
              ]
            };
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
