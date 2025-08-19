import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { PubMedAdapter } from './adapters/pubmed';
import { z } from 'zod';

async function main() {
  const mcpServer = new McpServer({
    name: 'scholarly-research-mcp',
    version: '1.0.0',
  });

  const pubmedAdapter = new PubMedAdapter();

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
          return `${index + 1}. **${paper.title}**
   - Authors: ${authors}
   - Journal: ${paper.journal}
   - Publication Date: ${paper.publicationDate}
   - PMID: ${paper.pmid}
   ${paper.doi ? `- DOI: ${paper.doi}` : ''}
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

        return {
          content: [
            {
              type: 'text',
              text: `**${paper.title}**
- Authors: ${paper.authors.join(', ')}
- Journal: ${paper.journal}
- Publication Date: ${paper.publicationDate}
- PMID: ${paper.pmid}
${paper.doi ? `- DOI: ${paper.doi}` : ''}
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

        return {
          content: [
            {
              type: 'text',
              text: `**Paper Details**
Title: ${paper.title}
Authors: ${paper.authors.join(', ')}
Journal: ${paper.journal}
Publication Date: ${paper.publicationDate}
PMID: ${pmid}
${paper.doi ? `DOI: ${paper.doi}` : ''}

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

  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
}

main().catch(console.error);
