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
- PMID: ${pmid}
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
    'get_full_text',
    'Get the full text content of a paper for detailed analysis',
    {
      pmid: z.string().describe('PubMed ID of the paper'),
      maxLength: z.number().optional().describe('Maximum length of text to return (default: 5000 characters)')
    },
    async ({ pmid, maxLength = 5000 }) => {
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

  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
}

main().catch(console.error);
