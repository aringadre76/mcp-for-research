import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { PubMedAdapter } from './adapters/pubmed';
import { GoogleScholarAdapter } from './adapters/google-scholar';
import { ArXivAdapter } from './adapters/arxiv';
import { UnifiedSearchAdapter } from './adapters/unified-search';
import { EnhancedUnifiedSearchAdapter } from './adapters/enhanced-unified-search';
import { PreferenceAwareUnifiedSearchAdapter } from './adapters/preference-aware-unified-search';
import { UserPreferencesManager } from './preferences/user-preferences';
import { z } from 'zod';

async function main() {
  const mcpServer = new McpServer({
    name: 'scholarly-research-mcp',
    version: '2.0.0',
  });

  const pubmedAdapter = new PubMedAdapter();
  const googleScholarAdapter = new GoogleScholarAdapter();
  const arxivAdapter = new ArXivAdapter();
  const unifiedSearchAdapter = new UnifiedSearchAdapter();
  const enhancedUnifiedSearchAdapter = new EnhancedUnifiedSearchAdapter();
  const preferenceAwareAdapter = new PreferenceAwareUnifiedSearchAdapter();
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
        let allPapers = [];
        
        if (sources.includes('pubmed')) {
          const pubmedPapers = await pubmedAdapter.searchPapers({
            query,
            maxResults: Math.ceil(maxResults / sources.length),
            startDate,
            endDate,
            journal,
            author
          });
          allPapers.push(...pubmedPapers);
        }

        if (sources.includes('google-scholar')) {
          try {
            const scholarPapers = await googleScholarAdapter.searchPapers({
              query,
              maxResults: Math.ceil(maxResults / sources.length),
              startDate,
              endDate,
              journal,
              author
            });
            allPapers.push(...scholarPapers);
          } catch (error) {
            console.warn('Google Scholar search failed:', error);
          }
        }

        if (sources.includes('arxiv')) {
          try {
            const arxivPapers = await arxivAdapter.searchPapers({
              query,
              maxResults: Math.ceil(maxResults / sources.length),
              startDate,
              endDate,
              journal,
              author
            });
            allPapers.push(...arxivPapers);
          } catch (error) {
            console.warn('ArXiv search failed:', error);
          }
        }

        if (allPapers.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No papers found matching your search criteria.'
              }
            ]
          };
        }

        const resultsText = allPapers.map((paper, index) => {
          const authors = paper.authors.length > 0 ? paper.authors.join(', ') : 'Unknown authors';
          const pmcInfo = paper.pmcid ? `\n   - PMC ID: ${paper.pmcid} (Full text likely available)` : '';
          const doiInfo = paper.doi ? `\n   - DOI: ${paper.doi}` : '';
          const abstract = includeAbstracts && paper.abstract ? `\n   - Abstract: ${paper.abstract.substring(0, 200)}...` : '';
          
          return `${index + 1}. **${paper.title}**
   - Authors: ${authors}
   - Journal: ${paper.journal}
   - Publication Date: ${paper.publicationDate}
   - PMID: ${paper.pmid}${pmcInfo}${doiInfo}${abstract}
`;
        }).join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `Found ${allPapers.length} papers from ${sources.join(', ')}:\n\n${resultsText}`
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
          paper = await pubmedAdapter.getPaperByDOI(identifier.replace('doi:', ''));
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

        let analysisText = `**${paper.title}**
- Authors: ${paper.authors.join(', ')}
- Journal: ${paper.journal}
- Publication Date: ${paper.publicationDate}
- PMID: ${paper.pmid}
- PMC ID: ${paper.pmcid || 'None'}
- DOI: ${paper.doi || 'None'}
- Abstract: ${paper.abstract || 'Not available'}`;

        if (analysisType === 'full-text' || analysisType === 'complete') {
          try {
            const fullText = await pubmedAdapter.getFullText(paper.pmid, 50000);
            if (fullText) {
              analysisText += `\n\n**Full Text (Excerpt)**
${fullText.substring(0, 2000)}...`;
            }
          } catch (error) {
            analysisText += `\n\n**Full Text**: Not available (${error instanceof Error ? error.message : 'Unknown error'})`;
          }
        }

        if (analysisType === 'quotes' || analysisType === 'complete') {
          try {
            const quotes = await pubmedAdapter.getEvidenceQuotes(paper.pmid, 'all', maxQuotes);
            if (quotes && quotes.length > 0) {
              analysisText += `\n\n**Key Quotes and Evidence**
${quotes.map((quote, i) => `${i + 1}. ${quote}`).join('\n')}`;
            }
          } catch (error) {
            analysisText += `\n\n**Quotes**: Not available (${error instanceof Error ? error.message : 'Unknown error'})`;
          }
        }

        if (analysisType === 'statistics' || analysisType === 'complete') {
          try {
            const stats = await pubmedAdapter.getEvidenceQuotes(paper.pmid, 'statistics', 10);
            if (stats && stats.length > 0) {
              analysisText += `\n\n**Key Statistics**
${stats.map((stat, i) => `${i + 1}. ${stat}`).join('\n')}`;
            }
          } catch (error) {
            analysisText += `\n\n**Statistics**: Not available (${error instanceof Error ? error.message : 'Unknown error'})`;
          }
        }

        if (analysisType === 'findings' || analysisType === 'complete') {
          try {
            const findings = await pubmedAdapter.getEvidenceQuotes(paper.pmid, 'findings', 10);
            if (findings && findings.length > 0) {
              analysisText += `\n\n**Key Findings**
${findings.map((finding, i) => `${i + 1}. ${finding}`).join('\n')}`;
            }
          } catch (error) {
            analysisText += `\n\n**Findings**: Not available (${error instanceof Error ? error.message : 'Unknown error'})`;
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
          paper = await pubmedAdapter.getPaperByDOI(identifier.replace('doi:', ''));
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

        let resultText = `**${paper.title}**
- Authors: ${paper.authors.join(', ')}
- Journal: ${paper.journal}
- Publication Date: ${paper.publicationDate}
- PMID: ${paper.pmid}
- PMC ID: ${paper.pmcid || 'None'}
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
            const citation = await pubmedAdapter.getCitation(paper.pmid, format);
            resultText += `\n\n**Citation (${format.toUpperCase()})**
${citation}`;
          } catch (error) {
            resultText += `\n\n**Citation (${format.toUpperCase()})**: Not available (${error instanceof Error ? error.message : 'Unknown error'})`;
          }
        }

        if (action === 'count' || action === 'all') {
          try {
            const citationCount = await pubmedAdapter.getCitationCount(paper.pmid);
            resultText += `\n\n**Citation Count**: ${citationCount}`;
          } catch (error) {
            resultText += `\n\n**Citation Count**: Not available (${error instanceof Error ? error.message : 'Unknown error'})`;
          }
        }

        if (action === 'related' || action === 'all') {
          try {
            const relatedPapers = await pubmedAdapter.getRelatedPapers(paper.pmid, 'pubmed', maxRelated);
            if (relatedPapers && relatedPapers.length > 0) {
              resultText += `\n\n**Related Papers**
${relatedPapers.map((related, i) => `${i + 1}. ${related.title} (PMID: ${related.pmid})`).join('\n')}`;
            } else {
              resultText += `\n\n**Related Papers**: None found`;
            }
          } catch (error) {
            resultText += `\n\n**Related Papers**: Not available (${error instanceof Error ? error.message : 'Unknown error'})`;
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
          case 'get':
            if (category === 'source' || category === 'all') {
              const sourcePrefs = await preferencesManager.getSourcePreferences();
              return {
                content: [
                  {
                    type: 'text',
                    text: `**Source Preferences**
${Object.entries(sourcePrefs).map(([source, prefs]) => `- ${source}: ${prefs.enabled ? 'Enabled' : 'Disabled'} (Priority: ${prefs.priority}, Max Results: ${prefs.maxResults})`).join('\n')}`
                  }
                ]
              };
            }
            
            if (category === 'search' || category === 'all') {
              const searchPrefs = await preferencesManager.getSearchPreferences();
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
            
            if (category === 'display' || category === 'all') {
              const displayPrefs = await preferencesManager.getDisplayPreferences();
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
            
            if (category === 'cache' || category === 'all') {
              const cachePrefs = await preferencesManager.getCachePreferences();
              return {
                content: [
                  {
                    type: 'text',
                    text: `**Cache Preferences**
- Cache Enabled: ${cachePrefs.cacheEnabled}
- Cache Expiry: ${cachePrefs.cacheExpiry} hours`
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

          case 'set':
            if (category === 'source' && otherParams.sourceName) {
              await preferencesManager.setSourcePreference(
                otherParams.sourceName,
                otherParams.enabled !== undefined ? otherParams.enabled : true,
                otherParams.priority || 1,
                otherParams.maxResults || 20
              );
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
              await preferencesManager.setSearchPreferences({
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
              await preferencesManager.setDisplayPreferences({
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
              await preferencesManager.setCachePreferences({
                cacheEnabled: otherParams.cacheEnabled,
                cacheExpiry: otherParams.cacheExpiry
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
            await preferencesManager.resetPreferences();
            return {
              content: [
                {
                  type: 'text',
                  text: 'All preferences have been reset to default values.'
                }
              ]
            };

          case 'export':
            const exportedPrefs = await preferencesManager.exportPreferences();
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
        const { action, ...otherParams } = params;

        switch (action) {
          case 'scrape':
            if (!otherParams.url) {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'URL is required for scraping action.'
                  }
                ]
              };
            }
            
            return {
              content: [
                {
                  type: 'text',
                  text: `**Web Scraping Result**
URL: ${otherParams.url}
Formats: ${(otherParams.formats || ['markdown']).join(', ')}
Main Content Only: ${otherParams.onlyMainContent !== false}
Mobile Viewport: ${otherParams.mobile || false}
Max Age: ${otherParams.maxAge || 172800000}ms

Note: This is a placeholder response. In a real implementation, this would call the Firecrawl scraping API to extract content from the specified URL.`
                }
              ]
            };

          case 'search':
            if (!otherParams.query) {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'Query is required for search action.'
                  }
                ]
              };
            }
            
            return {
              content: [
                {
                  type: 'text',
                  text: `**Web Search Result**
Query: ${otherParams.query}
Max Results: ${otherParams.maxResults || 5}
Formats: ${(otherParams.formats || ['markdown']).join(', ')}
Main Content Only: ${otherParams.onlyMainContent !== false}

Note: This is a placeholder response. In a real implementation, this would call the Firecrawl search API to find relevant web content.`
                }
              ]
            };

          case 'extract':
            if (!otherParams.urls || otherParams.urls.length === 0) {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'URLs array is required for extract action.'
                  }
                ]
              };
            }
            
            if (!otherParams.prompt) {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'Prompt is required for extract action.'
                  }
                ]
              };
            }
            
            return {
              content: [
                {
                  type: 'text',
                  text: `**Content Extraction Result**
URLs: ${otherParams.urls.join(', ')}
Prompt: ${otherParams.prompt}
Schema: ${otherParams.schema ? 'Provided' : 'None'}
Allow External Links: ${otherParams.allowExternalLinks || false}
Enable Web Search: ${otherParams.enableWebSearch || false}

Note: This is a placeholder response. In a real implementation, this would call the Firecrawl extraction API to extract structured information from the specified URLs.`
                }
              ]
            };

          case 'map':
            if (!otherParams.url) {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'URL is required for map action.'
                  }
                ]
              };
            }
            
            return {
              content: [
                {
                  type: 'text',
                  text: `**Website Mapping Result**
Starting URL: ${otherParams.url}
Search Term: ${otherParams.searchTerm || 'None'}
Sitemap Handling: ${otherParams.sitemap || 'include'}
Include Subdomains: ${otherParams.includeSubdomains || false}
Limit: ${otherParams.limit || 'None'}
Ignore Query Parameters: ${otherParams.ignoreQueryParameters !== false}

Note: This is a placeholder response. In a real implementation, this would call the Firecrawl mapping API to discover URLs on the specified website.`
                }
              ]
            };

          case 'crawl':
            if (!otherParams.url) {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'URL is required for crawl action.'
                  }
                ]
              };
            }
            
            return {
              content: [
                {
                  type: 'text',
                  text: `**Website Crawling Result**
Starting URL: ${otherParams.url}
Max Discovery Depth: ${otherParams.maxDiscoveryDepth || 5}
Limit: ${otherParams.limit || 10000}
Allow External Links: ${otherParams.allowExternalLinks || false}
Deduplicate Similar URLs: ${otherParams.deduplicateSimilarURLs !== false}
Delay: ${otherParams.delay || 'None'} seconds

Note: This is a placeholder response. In a real implementation, this would start a Firecrawl crawling job to extract content from multiple pages on the specified website.`
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
