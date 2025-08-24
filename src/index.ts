import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { PubMedAdapter } from './adapters/pubmed';
import { GoogleScholarAdapter } from './adapters/google-scholar';
import { UnifiedSearchAdapter } from './adapters/unified-search';
import { EnhancedUnifiedSearchAdapter } from './adapters/enhanced-unified-search';
import { PreferenceAwareUnifiedSearchAdapter } from './adapters/preference-aware-unified-search';
import { UserPreferencesManager } from './preferences/user-preferences';
import { z } from 'zod';

async function main() {
  const mcpServer = new McpServer({
    name: 'scholarly-research-mcp',
    version: '1.2.0',
  });

  const pubmedAdapter = new PubMedAdapter();
  const googleScholarAdapter = new GoogleScholarAdapter();
  const unifiedSearchAdapter = new UnifiedSearchAdapter();
  const enhancedUnifiedSearchAdapter = new EnhancedUnifiedSearchAdapter();
  const preferenceAwareAdapter = new PreferenceAwareUnifiedSearchAdapter();
  const preferencesManager = UserPreferencesManager.getInstance();

  mcpServer.tool(
    'search_papers',
    'Search for academic papers across multiple sources',
    {
      query: z.string().describe('Search query for papers'),
      maxResults: z.number().optional().describe('Maximum number of results (default: 20)'),
      startDate: z.string().optional().describe('Start date for publication range (YYYY/MM/DD format)'),
      endDate: z.string().optional().describe('End date for publication range (YYYY/MM/DD format)'),
      journal: z.string().optional().describe('Filter by specific journal'),
      author: z.string().optional().describe('Filter by specific author')
    },
    async ({ query, maxResults = 20, startDate, endDate, journal, author }) => {
      try {
        const papers = await pubmedAdapter.searchPapers({
          query,
          maxResults,
          startDate,
          endDate,
          journal,
          author
        });

        if (papers.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No papers found matching your search criteria.'
              }
            ]
          };
        }

        const resultsText = papers.map((paper, index) => {
          const authors = paper.authors.length > 0 ? paper.authors.join(', ') : 'Unknown authors';
          const pmcInfo = paper.pmcid ? `\n   - PMC ID: ${paper.pmcid} (Full text likely available)` : '';
          const doiInfo = paper.doi ? `\n   - DOI: ${paper.doi}` : '';
          
          return `${index + 1}. **${paper.title}**
   - Authors: ${authors}
   - Journal: ${paper.journal}
   - Publication Date: ${paper.publicationDate}
   - PMID: ${paper.pmid}${pmcInfo}${doiInfo}
   ${paper.abstract ? `- Abstract: ${paper.abstract.substring(0, 200)}...` : ''}
`;
        }).join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `Found ${papers.length} papers:\n\n${resultsText}`
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
    'get_paper_by_pmcid',
    'Fetch a specific paper by its PubMed Central ID (PMCID) for full text access',
    {
      pmcid: z.string().describe('PubMed Central ID of the paper (e.g., PMC8353807)')
    },
    async ({ pmcid }) => {
      try {
        const paper = await pubmedAdapter.getPaperByPMCID(pmcid);
        
        if (!paper) {
          return {
            content: [
              {
                type: 'text',
                text: `No paper found with PMC ID: ${pmcid}`
              }
            ]
          };
        }

        const pmcUrl = paper.pmcFullTextUrl || `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`;
        
        return {
          content: [
            {
              type: 'text',
              text: `**${paper.title}**
- Authors: ${paper.authors.join(', ')}
- Journal: ${paper.journal}
- Publication Date: ${paper.publicationDate}
- PMID: ${paper.pmid}
- PMC ID: ${pmcid}
- Full Text URL: ${pmcUrl}

**Abstract**
${paper.abstract}

**Full Text Access**
This paper is available in PubMed Central (PMC), which typically provides free access to the complete article. Use the URL above to access the full text, or use the \`get_full_text\` tool to extract the content directly.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching paper by PMC ID: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'get_pmc_access_info',
    'Get detailed PMC access information and URLs for a paper',
    {
      pmcid: z.string().describe('PubMed Central ID of the paper (e.g., PMC8353807)')
    },
    async ({ pmcid }) => {
      try {
        const paper = await pubmedAdapter.getPaperByPMCID(pmcid);
        
        if (!paper) {
          return {
            content: [
              {
                type: 'text',
                text: `No paper found with PMC ID: ${pmcid}`
              }
            ]
          };
        }

        const cleanPmcid = pmcid.replace(/^PMC/, '');
        const baseUrl = `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${cleanPmcid}`;
        
        return {
          content: [
            {
              type: 'text',
              text: `**PMC Access Information for ${pmcid}**

**Paper Details**
Title: ${paper.title}
Authors: ${paper.authors.join(', ')}
Journal: ${paper.journal}
Publication Date: ${paper.publicationDate}
PMID: ${paper.pmid}
DOI: ${paper.doi || 'None'}

**PMC Access URLs**
- **Main Article Page**: ${baseUrl}/
- **PDF Version**: ${baseUrl}/pdf/
- **XML Version**: ${baseUrl}/xml/
- **Full Text**: ${baseUrl}/fulltext/

**How to Access Full Text**
1. **Direct Browser Access**: Visit ${baseUrl}/ in your web browser
2. **PDF Download**: Click the PDF link on the PMC page
3. **Programmatic Access**: Use the \`get_full_text\` tool with PMID: ${paper.pmid}
4. **Alternative Sources**: Check if the paper has a DOI for additional access

**Note**: Some PMC papers may have limited full text access depending on their age and publisher agreements. The abstract is always available.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching PMC access info: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'get_paper_by_id',
    'Fetch a specific paper by its PubMed ID (PMID)',
    {
      pmid: z.string().describe('PubMed ID of the paper to fetch')
    },
    async ({ pmid }) => {
      try {
        const paper = await pubmedAdapter.getPaperById(pmid);
        
        if (!paper) {
          return {
            content: [
              {
                type: 'text',
                text: `No paper found with PMID: ${pmid}`
              }
            ]
          };
        }

        const pmcInfo = paper.pmcid ? `\n- PMC ID: ${paper.pmcid} (Full text likely available)` : '';
        const doiInfo = paper.doi ? `\n- DOI: ${paper.doi}` : '';

        return {
          content: [
            {
              type: 'text',
              text: `**${paper.title}**
- Authors: ${paper.authors.join(', ')}
- Journal: ${paper.journal}
- Publication Date: ${paper.publicationDate}
- PMID: ${pmid}${pmcInfo}${doiInfo}
- Abstract: ${paper.abstract}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching paper: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'get_paper_details',
    'Get detailed information about a paper including abstract and metadata',
    {
      pmid: z.string().describe('PubMed ID of the paper')
    },
    async ({ pmid }) => {
      try {
        const paper = await pubmedAdapter.getPaperById(pmid);
        
        if (!paper) {
          return {
            content: [
              {
                type: 'text',
                text: `No paper found with PMID: ${pmid}`
              }
            ]
          };
        }

        const pmcInfo = paper.pmcid ? `\nPMC ID: ${paper.pmcid} (Full text likely available)` : '';
        const doiInfo = paper.doi ? `\nDOI: ${paper.doi}` : '';

        return {
          content: [
            {
              type: 'text',
              text: `**Paper Details**
Title: ${paper.title}
Authors: ${paper.authors.join(', ')}
Journal: ${paper.journal}
Publication Date: ${paper.publicationDate}
PMID: ${pmid}${pmcInfo}${doiInfo}

**Abstract**
${paper.abstract}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching paper details: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'get_full_text',
    'Get the full text content of a paper for detailed analysis',
    {
      pmid: z.string().describe('PubMed ID of the paper'),
      maxLength: z.number().optional().describe('Maximum length of text to return (default: 50000 characters)')
    },
    async ({ pmid, maxLength = 50000 }) => {
      try {
        const fullText = await pubmedAdapter.getFullTextContent(pmid);
        
        if (!fullText) {
          return {
            content: [
              {
                type: 'text',
                text: `Could not retrieve full text for PMID: ${pmid}. This might be due to access restrictions or the paper not being available in full text.`
              }
            ]
          };
        }

        const truncatedText = fullText.length > maxLength 
          ? fullText.substring(0, maxLength) + '...'
          : fullText;

        return {
          content: [
            {
              type: 'text',
              text: `**Full Text Content (PMID: ${pmid})**
${truncatedText}

${fullText.length > maxLength ? `\n*Note: Text truncated to ${maxLength} characters. Full text is ${fullText.length} characters long.*` : ''}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching full text: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'extract_paper_sections',
    'Extract and organize the main sections of a paper (Introduction, Methods, Results, etc.)',
    {
      pmid: z.string().describe('PubMed ID of the paper'),
      maxSectionLength: z.number().optional().describe('Maximum length of each section (default: 1000 characters)')
    },
    async ({ pmid, maxSectionLength = 1000 }) => {
      try {
        const sections = await pubmedAdapter.extractPaperSections(pmid, maxSectionLength);
        
        if (sections.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `Could not extract sections for PMID: ${pmid}. This might be due to the paper not being available in full text or having an unusual structure.`
              }
            ]
          };
        }

        const sectionsText = sections.map((section, index) => {
          const levelIndicator = section.level === 1 ? '#' : '##';
          return `${levelIndicator} ${section.title}
${section.content}

`;
        }).join('');

        return {
          content: [
            {
              type: 'text',
              text: `**Paper Sections (PMID: ${pmid})**

${sectionsText}

*Found ${sections.length} sections. Each section is limited to ${maxSectionLength} characters for readability.*`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error extracting paper sections: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'search_within_paper',
    'Search for specific terms, quotes, or evidence within a paper',
    {
      pmid: z.string().describe('PubMed ID of the paper'),
      searchTerm: z.string().describe('Term or phrase to search for within the paper'),
      maxResults: z.number().optional().describe('Maximum number of matching sentences to return (default: 10)')
    },
    async ({ pmid, searchTerm, maxResults = 10 }) => {
      try {
        const matchingSentences = await pubmedAdapter.searchWithinPaper(pmid, searchTerm);
        
        if (matchingSentences.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No matches found for "${searchTerm}" in paper PMID: ${pmid}. Try using different search terms or check if the paper contains the content you're looking for.`
              }
            ]
          };
        }

        const resultsText = matchingSentences
          .slice(0, maxResults)
          .map((sentence, index) => `${index + 1}. ${sentence}`)
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `**Search Results for "${searchTerm}" in PMID: ${pmid}**

Found ${matchingSentences.length} matching sentences:

${resultsText}

${matchingSentences.length > maxResults ? `\n*Showing first ${maxResults} results. Total matches: ${matchingSentences.length}*` : ''}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error searching within paper: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'get_evidence_quotes',
    'Extract specific quotes and evidence from a paper for use in essays or research',
    {
      pmid: z.string().describe('PubMed ID of the paper'),
      evidenceType: z.enum(['quotes', 'statistics', 'findings', 'conclusions', 'all']).optional().describe('Type of evidence to extract (default: all)'),
      maxQuotes: z.number().optional().describe('Maximum number of quotes to return (default: 15)')
    },
    async ({ pmid, evidenceType = 'all', maxQuotes = 15 }) => {
      try {
        const fullText = await pubmedAdapter.getFullTextContent(pmid);
        
        if (!fullText) {
          return {
            content: [
              {
                type: 'text',
                text: `Could not retrieve full text for PMID: ${pmid}. This might be due to access restrictions or the paper not being available in full text.`
              }
            ]
          };
        }

        const sentences = fullText.split(/[.!?]+/).filter(sentence => sentence.trim().length > 20);
        let evidenceSentences: string[] = [];

        if (evidenceType === 'all' || evidenceType === 'quotes') {
          const quotePatterns = [
            /"[^"]+"/g,
            /'[^']+'/g,
            /\([^)]+\)/g
          ];
          
          sentences.forEach(sentence => {
            if (quotePatterns.some(pattern => pattern.test(sentence))) {
              evidenceSentences.push(sentence.trim());
            }
          });
        }

        if (evidenceType === 'all' || evidenceType === 'statistics') {
          const statPatterns = [
            /\d+%/, /\d+\.\d+%/, /\d+ out of \d+/, /\d+ of \d+/, /\d+ patients/, /\d+ participants/
          ];
          
          sentences.forEach(sentence => {
            if (statPatterns.some(pattern => pattern.test(sentence))) {
              evidenceSentences.push(sentence.trim());
            }
          });
        }

        if (evidenceType === 'all' || evidenceType === 'findings') {
          const findingKeywords = ['found', 'discovered', 'revealed', 'showed', 'demonstrated', 'indicated', 'suggested'];
          
          sentences.forEach(sentence => {
            if (findingKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
              evidenceSentences.push(sentence.trim());
            }
          });
        }

        if (evidenceType === 'all' || evidenceType === 'conclusions') {
          const conclusionKeywords = ['conclude', 'conclusion', 'therefore', 'thus', 'hence', 'consequently'];
          
          sentences.forEach(sentence => {
            if (conclusionKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
              evidenceSentences.push(sentence.trim());
            }
          });
        }

        evidenceSentences = [...new Set(evidenceSentences)].slice(0, maxQuotes);

        if (evidenceSentences.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No evidence of type "${evidenceType}" found in paper PMID: ${pmid}. Try using a different evidence type or check if the paper contains the content you're looking for.`
              }
            ]
          };
        }

        const evidenceText = evidenceSentences
          .map((sentence, index) => `${index + 1}. ${sentence}`)
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `**Evidence and Quotes from PMID: ${pmid}**
Type: ${evidenceType}

${evidenceText}

*Found ${evidenceSentences.length} pieces of evidence. Use these quotes and findings to support your research or essays.*`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error extracting evidence: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'get_citation',
    'Get citation in various formats (BibTeX, EndNote, APA, MLA)',
    {
      pmid: z.string().describe('PubMed ID of the paper'),
      format: z.enum(['bibtex', 'endnote', 'apa', 'mla', 'ris']).describe('Citation format')
    },
    async ({ pmid, format }) => {
      try {
        const paper = await pubmedAdapter.getPaperById(pmid);
        
        if (!paper) {
          return {
            content: [
              {
                type: 'text',
                text: `No paper found with PMID: ${pmid}`
              }
            ]
          };
        }

        let citation = '';
        switch (format) {
          case 'bibtex':
            citation = `@article{${paper.pmid},
  title={${paper.title}},
  author={${paper.authors.join(' and ')}},
  journal={${paper.journal}},
  year={${paper.publicationDate}},
  doi={${paper.doi || 'N/A'}},
  pmid={${paper.pmid}}
}`;
            break;
          
          case 'endnote':
            citation = `%0 Journal Article
%T ${paper.title}
%A ${paper.authors.join('\n%A ')}
%J ${paper.journal}
%D ${paper.publicationDate}
%R ${paper.doi || 'N/A'}
%M ${paper.pmid}`;
            break;
          
          case 'apa':
            citation = `${paper.authors.join(', ')} (${paper.publicationDate}). ${paper.title}. ${paper.journal}. ${paper.doi ? `https://doi.org/${paper.doi}` : ''}`;
            break;
          
          case 'mla':
            citation = `${paper.authors.join(', ')}. "${paper.title}." ${paper.journal}, ${paper.publicationDate}. ${paper.doi ? `https://doi.org/${paper.doi}` : ''}`;
            break;
          
          case 'ris':
            citation = `TY  - JOUR
TI  - ${paper.title}
AU  - ${paper.authors.join('\nAU  - ')}
JO  - ${paper.journal}
PY  - ${paper.publicationDate}
DO  - ${paper.doi || 'N/A'}
ID  - ${paper.pmid}
ER  -`;
            break;
        }

        return {
          content: [
            {
              type: 'text',
              text: `**Citation in ${format.toUpperCase()} format:**

\`\`\`${format === 'bibtex' ? 'bibtex' : format === 'endnote' ? 'endnote' : 'text'}
${citation}
\`\`\``
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error generating citation: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'get_citation_count',
    'Get the number of times a paper has been cited',
    {
      pmid: z.string().describe('PubMed ID of the paper')
    },
    async ({ pmid }) => {
      try {
        const citationCount = await pubmedAdapter.getCitationCount(pmid);
        
        if (citationCount === null) {
          return {
            content: [
              {
                type: 'text',
                text: `Citation count not available for PMID: ${pmid}`
              }
            ]
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `**Citation Count**
Paper PMID: ${pmid}
Citations: ${citationCount}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching citation count: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'search_google_scholar',
    'Search for academic papers on Google Scholar',
    {
      query: z.string().describe('Search query for papers'),
      maxResults: z.number().optional().describe('Maximum number of results (default: 20)'),
      startYear: z.number().optional().describe('Start year for publication range'),
      endYear: z.number().optional().describe('End year for publication range'),
      sortBy: z.enum(['relevance', 'date', 'citations']).optional().describe('Sort order (default: relevance)')
    },
    async ({ query, maxResults = 20, startYear, endYear, sortBy = 'relevance' }) => {
      try {
        const papers = await googleScholarAdapter.searchPapers({
          query,
          maxResults,
          startYear,
          endYear,
          sortBy
        });

        if (papers.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No papers found on Google Scholar matching your search criteria.'
              }
            ]
          };
        }

        const resultsText = papers.map((paper, index) => {
          const authors = paper.authors.length > 0 ? paper.authors.join(', ') : 'Unknown authors';
          const pdfInfo = paper.pdfUrl ? `\n   - PDF: ${paper.pdfUrl}` : '';
          const citationsInfo = paper.citations > 0 ? `\n   - Citations: ${paper.citations}` : '';
          
          return `${index + 1}. **${paper.title}**
   - Authors: ${authors}
   - Journal: ${paper.journal}
   - Publication Date: ${paper.publicationDate}
   - URL: ${paper.url}${pdfInfo}${citationsInfo}
   ${paper.abstract ? `- Abstract: ${paper.abstract.substring(0, 200)}...` : ''}
`;
        }).join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `Found ${papers.length} papers on Google Scholar:\n\n${resultsText}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error searching Google Scholar: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'search_all_sources',
    'Search for academic papers across both PubMed and Google Scholar',
    {
      query: z.string().describe('Search query for papers'),
      maxResults: z.number().optional().describe('Maximum number of results (default: 20)'),
      startDate: z.string().optional().describe('Start date for publication range (YYYY/MM/DD format)'),
      endDate: z.number().optional().describe('End year for publication range'),
      journal: z.string().optional().describe('Filter by specific journal'),
      author: z.string().optional().describe('Filter by specific author'),
      sources: z.array(z.enum(['pubmed', 'google-scholar'])).optional().describe('Sources to search (default: both)'),
      sortBy: z.enum(['relevance', 'date', 'citations']).optional().describe('Sort order (default: relevance)')
    },
    async ({ query, maxResults = 20, startDate, endDate, journal, author, sources, sortBy = 'relevance' }) => {
      try {
        const papers = await unifiedSearchAdapter.searchPapers({
          query,
          maxResults,
          startDate,
          endDate,
          journal,
          author,
          sources,
          sortBy
        });

        if (papers.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No papers found across all sources matching your search criteria.'
              }
            ]
          };
        }

        const resultsText = papers.map((paper, index) => {
          const authors = paper.authors.length > 0 ? paper.authors.join(', ') : 'Unknown authors';
          const sourceInfo = `\n   - Source: ${paper.source}`;
          const pmidInfo = paper.pmid ? `\n   - PMID: ${paper.pmid}` : '';
          const pmcInfo = paper.pmcid ? `\n   - PMC ID: ${paper.pmcid} (Full text likely available)` : '';
          const doiInfo = paper.doi ? `\n   - DOI: ${paper.doi}` : '';
          const urlInfo = paper.url ? `\n   - URL: ${paper.url}` : '';
          const pdfInfo = paper.pdfUrl ? `\n   - PDF: ${paper.pdfUrl}` : '';
          const citationsInfo = paper.citations > 0 ? `\n   - Citations: ${paper.citations}` : '';
          
          return `${index + 1}. **${paper.title}**
   - Authors: ${authors}
   - Journal: ${paper.journal}
   - Publication Date: ${paper.publicationDate}${sourceInfo}${pmidInfo}${pmcInfo}${doiInfo}${urlInfo}${pdfInfo}${citationsInfo}
   ${paper.abstract ? `- Abstract: ${paper.abstract.substring(0, 200)}...` : ''}
`;
        }).join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `Found ${papers.length} papers across all sources:\n\n${resultsText}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error searching all sources: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'get_google_scholar_citations',
    'Get citation count for a paper from Google Scholar',
    {
      title: z.string().describe('Title of the paper to search for')
    },
    async ({ title }) => {
      try {
        const citationCount = await googleScholarAdapter.getCitationCount(title);
        
        if (citationCount === null) {
          return {
            content: [
              {
                type: 'text',
                text: `Citation count not available for: "${title}"`
              }
            ]
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `**Google Scholar Citation Count**
Paper: "${title}"
Citations: ${citationCount}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching citation count: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'get_related_papers',
    'Get related papers from either PubMed or Google Scholar',
    {
      identifier: z.string().describe('Paper identifier (PMID for PubMed, URL for Google Scholar)'),
      source: z.enum(['pubmed', 'google-scholar']).describe('Source to search for related papers'),
      maxResults: z.number().optional().describe('Maximum number of related papers (default: 10)')
    },
    async ({ identifier, source, maxResults = 10 }) => {
      try {
        const relatedPapers = await unifiedSearchAdapter.getRelatedPapers(identifier, source, maxResults);
        
        if (relatedPapers.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No related papers found for ${source} identifier: ${identifier}`
              }
            ]
          };
        }

        const resultsText = relatedPapers.map((paper, index) => {
          const authors = paper.authors.length > 0 ? paper.authors.join(', ') : 'Unknown authors';
          const sourceInfo = `\n   - Source: ${paper.source}`;
          const pmidInfo = paper.pmid ? `\n   - PMID: ${paper.pmid}` : '';
          const urlInfo = paper.url ? `\n   - URL: ${paper.url}` : '';
          const pdfInfo = paper.pdfUrl ? `\n   - PDF: ${paper.pdfUrl}` : '';
          const citationsInfo = paper.citations > 0 ? `\n   - Citations: ${paper.citations}` : '';
          
          return `${index + 1}. **${paper.title}**
   - Authors: ${authors}
   - Journal: ${paper.journal}
   - Publication Date: ${paper.publicationDate}${sourceInfo}${pmidInfo}${urlInfo}${pdfInfo}${citationsInfo}
   ${paper.abstract ? `- Abstract: ${paper.abstract.substring(0, 200)}...` : ''}
`;
        }).join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `**Related Papers from ${source}**
Found ${relatedPapers.length} related papers:

${resultsText}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching related papers: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'search_with_firecrawl',
    'Search for academic papers using Firecrawl MCP server (more reliable than Puppeteer)',
    {
      query: z.string().describe('Search query for papers'),
      maxResults: z.number().optional().describe('Maximum number of results (default: 20)'),
      startDate: z.string().optional().describe('Start date for publication range (YYYY/MM/DD format)'),
      endDate: z.number().optional().describe('End year for publication range'),
      journal: z.string().optional().describe('Filter by specific journal'),
      author: z.string().optional().describe('Filter by specific author'),
      sources: z.array(z.enum(['pubmed', 'google-scholar'])).optional().describe('Sources to search (default: both)'),
      sortBy: z.enum(['relevance', 'date', 'citations']).optional().describe('Sort order (default: relevance)'),
      preferFirecrawl: z.boolean().optional().describe('Prefer Firecrawl over Puppeteer for Google Scholar (default: true)')
    },
    async ({ query, maxResults = 20, startDate, endDate, journal, author, sources, sortBy = 'relevance', preferFirecrawl = true }) => {
      try {
        const papers = await enhancedUnifiedSearchAdapter.searchPapers({
          query,
          maxResults,
          startDate,
          endDate,
          journal,
          author,
          sources,
          sortBy,
          preferFirecrawl
        });

        if (papers.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No papers found across all sources matching your search criteria.'
              }
            ]
          };
        }

        const resultsText = papers.map((paper, index) => {
          const authors = paper.authors.length > 0 ? paper.authors.join(', ') : 'Unknown authors';
          const sourceInfo = `\n   - Source: ${paper.source}`;
          const searchMethodInfo = paper.searchMethod ? `\n   - Search Method: ${paper.searchMethod}` : '';
          const pmidInfo = paper.pmid ? `\n   - PMID: ${paper.pmid}` : '';
          const pmcInfo = paper.pmcid ? `\n   - PMC ID: ${paper.pmcid} (Full text likely available)` : '';
          const doiInfo = paper.doi ? `\n   - DOI: ${paper.doi}` : '';
          const urlInfo = paper.url ? `\n   - URL: ${paper.url}` : '';
          const pdfInfo = paper.pdfUrl ? `\n   - PDF: ${paper.pdfUrl}` : '';
          const citationsInfo = paper.citations > 0 ? `\n   - Citations: ${paper.citations}` : '';
          
          return `${index + 1}. **${paper.title}**
   - Authors: ${authors}
   - Journal: ${paper.journal}
   - Publication Date: ${paper.publicationDate}${sourceInfo}${searchMethodInfo}${pmidInfo}${pmcInfo}${doiInfo}${urlInfo}${pdfInfo}${citationsInfo}
   ${paper.abstract ? `- Abstract: ${paper.abstract.substring(0, 200)}...` : ''}
`;
        }).join('');

        const searchMethod = enhancedUnifiedSearchAdapter.getSearchMethod();
        const firecrawlStatus = enhancedUnifiedSearchAdapter.isFirecrawlAvailable() ? 'enabled' : 'disabled';

        return {
          content: [
            {
              type: 'text',
              text: `**Enhanced Search Results (${searchMethod} method, Firecrawl: ${firecrawlStatus})**
Found ${papers.length} papers across all sources:

${resultsText}

**Search Method**: ${searchMethod}
**Firecrawl Status**: ${firecrawlStatus}
**Note**: Firecrawl provides more reliable web scraping than Puppeteer.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error performing enhanced search: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'set_firecrawl_preference',
    'Set whether to prefer Firecrawl over Puppeteer for Google Scholar searches',
    {
      preferFirecrawl: z.boolean().describe('Whether to prefer Firecrawl over Puppeteer')
    },
    async ({ preferFirecrawl }) => {
      try {
        enhancedUnifiedSearchAdapter.setPreferFirecrawl(preferFirecrawl);
        
        return {
          content: [
            {
              type: 'text',
              text: `**Firecrawl Preference Updated**
Preference set to: ${preferFirecrawl ? 'Firecrawl (recommended)' : 'Puppeteer (fallback)'}

**Benefits of Firecrawl:**
- More reliable web scraping
- Better rate limiting
- Enhanced error handling
- Professional web scraping service

**Current Status**: ${enhancedUnifiedSearchAdapter.isFirecrawlAvailable() ? 'Firecrawl available' : 'Firecrawl not available, using Puppeteer'}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error setting Firecrawl preference: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'get_search_method_info',
    'Get information about the current search method and Firecrawl availability',
    {},
    async () => {
      try {
        const searchMethod = enhancedUnifiedSearchAdapter.getSearchMethod();
        const firecrawlAvailable = enhancedUnifiedSearchAdapter.isFirecrawlAvailable();
        
        let methodDescription = '';
        let recommendations = '';
        
        if (searchMethod === 'firecrawl') {
          methodDescription = 'Firecrawl MCP server (recommended)';
          recommendations = '- More reliable web scraping\n- Better rate limiting\n- Professional service\n- Enhanced error handling';
        } else if (searchMethod === 'puppeteer') {
          methodDescription = 'Puppeteer (local browser automation)';
          recommendations = '- Local processing\n- No external dependencies\n- May be less reliable\n- Requires Chrome/Chromium';
        } else {
          methodDescription = 'Mixed (both methods available)';
          recommendations = '- Automatic fallback between methods\n- Best of both worlds\n- Optimal reliability';
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `**Search Method Information**

**Current Method**: ${methodDescription}
**Firecrawl Available**: ${firecrawlAvailable ? 'Yes' : 'No'}

**Method Details**:
${methodDescription}

**Recommendations**:
${recommendations}

**To Change Method**:
Use the \`set_firecrawl_preference\` tool to switch between methods.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error getting search method info: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'get_user_preferences',
    'Get current user preferences for search and display settings',
    {},
    async () => {
      try {
        const preferences = preferencesManager.getPreferences();
        
        return {
          content: [
            {
              type: 'text',
              text: `**Current User Preferences**

**Search Settings:**
- Default Max Results: ${preferences.search.defaultMaxResults}
- Default Sort By: ${preferences.search.defaultSortBy}
- Prefer Firecrawl: ${preferences.search.preferFirecrawl}
- Enable Deduplication: ${preferences.search.enableDeduplication}

**Source Preferences:**
${preferences.search.sources.map(source => 
  `- ${source.name}: ${source.enabled ? 'enabled' : 'disabled'} (priority: ${source.priority}, max results: ${source.maxResults || 'default'})`
).join('\n')}

**Display Settings:**
- Show Abstracts: ${preferences.display.showAbstracts}
- Show Citations: ${preferences.display.showCitations}
- Show URLs: ${preferences.display.showUrls}
- Max Abstract Length: ${preferences.display.maxAbstractLength}

**Cache Settings:**
- Enabled: ${preferences.cache.enabled}
- TTL Minutes: ${preferences.cache.ttlMinutes}

To modify these preferences, use the set_source_preference, set_search_preferences, set_display_preferences, or set_cache_preferences tools.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error getting user preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'set_source_preference',
    'Set preferences for a specific source (pubmed, google-scholar, jstor)',
    {
      sourceName: z.string().describe('Name of the source (pubmed, google-scholar, jstor)'),
      enabled: z.boolean().optional().describe('Whether to enable this source'),
      priority: z.number().optional().describe('Priority order (1 is highest priority)'),
      maxResults: z.number().optional().describe('Maximum results to fetch from this source')
    },
    async ({ sourceName, enabled, priority, maxResults }) => {
      try {
        const validSources = ['pubmed', 'google-scholar', 'jstor'];
        if (!validSources.includes(sourceName)) {
          throw new Error(`Invalid source name. Must be one of: ${validSources.join(', ')}`);
        }

        const updates: any = {};
        if (enabled !== undefined) updates.enabled = enabled;
        if (priority !== undefined) updates.priority = priority;
        if (maxResults !== undefined) updates.maxResults = maxResults;

        preferencesManager.setSourcePreference(sourceName, updates);
        
        const updatedPrefs = preferencesManager.getPreferences();
        const source = updatedPrefs.search.sources.find(s => s.name === sourceName);
        
        return {
          content: [
            {
              type: 'text',
              text: `**Source Preference Updated**

Source: ${sourceName}
- Enabled: ${source?.enabled}
- Priority: ${source?.priority}
- Max Results: ${source?.maxResults || 'default'}

The preferences have been saved and will be used for future searches.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error setting source preference: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'set_search_preferences',
    'Set general search preferences',
    {
      defaultMaxResults: z.number().optional().describe('Default maximum number of results'),
      defaultSortBy: z.enum(['relevance', 'date', 'citations']).optional().describe('Default sort order'),
      preferFirecrawl: z.boolean().optional().describe('Prefer Firecrawl over Puppeteer for Google Scholar'),
      enableDeduplication: z.boolean().optional().describe('Enable deduplication of results across sources')
    },
    async ({ defaultMaxResults, defaultSortBy, preferFirecrawl, enableDeduplication }) => {
      try {
        const updates: any = {};
        if (defaultMaxResults !== undefined) updates.defaultMaxResults = defaultMaxResults;
        if (defaultSortBy !== undefined) updates.defaultSortBy = defaultSortBy;
        if (preferFirecrawl !== undefined) updates.preferFirecrawl = preferFirecrawl;
        if (enableDeduplication !== undefined) updates.enableDeduplication = enableDeduplication;

        preferencesManager.updateSearchPreferences(updates);
        
        const updatedPrefs = preferencesManager.getPreferences().search;
        
        return {
          content: [
            {
              type: 'text',
              text: `**Search Preferences Updated**

- Default Max Results: ${updatedPrefs.defaultMaxResults}
- Default Sort By: ${updatedPrefs.defaultSortBy}
- Prefer Firecrawl: ${updatedPrefs.preferFirecrawl}
- Enable Deduplication: ${updatedPrefs.enableDeduplication}

The preferences have been saved and will be used for future searches.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error setting search preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'set_display_preferences',
    'Set display preferences for search results',
    {
      showAbstracts: z.boolean().optional().describe('Whether to show abstracts in results'),
      showCitations: z.boolean().optional().describe('Whether to show citation counts'),
      showUrls: z.boolean().optional().describe('Whether to show URLs'),
      maxAbstractLength: z.number().optional().describe('Maximum length of abstracts to display')
    },
    async ({ showAbstracts, showCitations, showUrls, maxAbstractLength }) => {
      try {
        const updates: any = {};
        if (showAbstracts !== undefined) updates.showAbstracts = showAbstracts;
        if (showCitations !== undefined) updates.showCitations = showCitations;
        if (showUrls !== undefined) updates.showUrls = showUrls;
        if (maxAbstractLength !== undefined) updates.maxAbstractLength = maxAbstractLength;

        preferencesManager.updateDisplayPreferences(updates);
        
        const updatedPrefs = preferencesManager.getPreferences().display;
        
        return {
          content: [
            {
              type: 'text',
              text: `**Display Preferences Updated**

- Show Abstracts: ${updatedPrefs.showAbstracts}
- Show Citations: ${updatedPrefs.showCitations}
- Show URLs: ${updatedPrefs.showUrls}
- Max Abstract Length: ${updatedPrefs.maxAbstractLength}

The preferences have been saved and will affect how search results are displayed.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error setting display preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'search_with_preferences',
    'Search for papers using your saved preferences',
    {
      query: z.string().describe('Search query for papers'),
      maxResults: z.number().optional().describe('Override max results (uses preference if not specified)'),
      overrideSources: z.array(z.string()).optional().describe('Override enabled sources for this search'),
      respectUserPreferences: z.boolean().optional().describe('Whether to respect user preferences (default: true)')
    },
    async ({ query, maxResults, overrideSources, respectUserPreferences = true }) => {
      try {
        const papers = await preferenceAwareAdapter.searchPapers({
          query,
          maxResults,
          overrideSources,
          respectUserPreferences
        });

        if (papers.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No papers found matching your search criteria with current preferences.'
              }
            ]
          };
        }

        const resultsText = preferenceAwareAdapter.formatResults(papers);
        const enabledSources = preferencesManager.getEnabledSources().map(s => s.name);
        const actualSources = overrideSources || enabledSources;

        return {
          content: [
            {
              type: 'text',
              text: `Found ${papers.length} papers using your preferences (sources: ${actualSources.join(', ')}):\n\n${resultsText}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error searching with preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'reset_preferences',
    'Reset all preferences to default values',
    {},
    async () => {
      try {
        preferencesManager.resetToDefaults();
        
        return {
          content: [
            {
              type: 'text',
              text: `**Preferences Reset to Defaults**

All user preferences have been reset to their default values:

- Default max results: 20
- Default sort: relevance
- Prefer Firecrawl: true
- Deduplication: enabled
- All sources enabled with default priorities
- All display options enabled

Use get_user_preferences to see the complete default configuration.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error resetting preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'export_preferences',
    'Export current preferences as JSON',
    {},
    async () => {
      try {
        const json = preferencesManager.exportPreferences();
        
        return {
          content: [
            {
              type: 'text',
              text: `**Exported Preferences (JSON)**

\`\`\`json
${json}
\`\`\`

You can save this JSON and import it later using the import_preferences tool.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error exporting preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  mcpServer.tool(
    'import_preferences',
    'Import preferences from JSON',
    {
      preferencesJson: z.string().describe('JSON string containing preferences to import')
    },
    async ({ preferencesJson }) => {
      try {
        preferencesManager.importPreferences(preferencesJson);
        
        return {
          content: [
            {
              type: 'text',
              text: `**Preferences Imported Successfully**

Your preferences have been updated from the provided JSON.
Use get_user_preferences to see the current configuration.`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error importing preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    }
  );

  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
}

main().catch(console.error);
