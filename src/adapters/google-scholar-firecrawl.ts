export interface GoogleScholarPaper {
  title: string;
  authors: string[];
  journal: string;
  publicationDate: string;
  abstract: string;
  citations: number;
  url: string;
  doi?: string;
  pdfUrl?: string;
  relatedArticles?: string[];
}

export interface GoogleScholarSearchOptions {
  query: string;
  maxResults?: number;
  startYear?: number;
  endYear?: number;
  sortBy?: 'relevance' | 'date' | 'citations';
}

export interface FirecrawlMCPClient {
  firecrawl_scrape: (params: {
    url: string;
    formats?: string[];
    onlyMainContent?: boolean;
    waitFor?: number;
    actions?: any[];
  }) => Promise<{ content: string }>;
  
  firecrawl_search: (params: {
    query: string;
    limit?: number;
    sources?: string[];
    scrapeOptions?: {
      formats: string[];
      onlyMainContent?: boolean;
    };
  }) => Promise<{ results: any[] }>;
}

export class GoogleScholarFirecrawlAdapter {
  private firecrawlClient: FirecrawlMCPClient | null = null;

  constructor(firecrawlClient?: FirecrawlMCPClient) {
    this.firecrawlClient = firecrawlClient || null;
  }

  setFirecrawlClient(client: FirecrawlMCPClient) {
    this.firecrawlClient = client;
  }

  private async searchGoogleScholar(options: GoogleScholarSearchOptions): Promise<string> {
    const { query, maxResults = 20, startYear, endYear, sortBy = 'relevance' } = options;
    
    let url = `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}&hl=en&as_sdt=0,5`;
    
    if (startYear || endYear) {
      const currentYear = new Date().getFullYear();
      const start = startYear || 1900;
      const end = endYear || currentYear;
      url += `&as_ylo=${start}&as_yhi=${end}`;
    }
    
    if (sortBy === 'date') {
      url += '&scisbd=1';
    } else if (sortBy === 'citations') {
      url += '&scisbd=2';
    }

    if (!this.firecrawlClient) {
      throw new Error('Firecrawl client not available. Please set the Firecrawl MCP client first.');
    }

    try {
      const result = await this.firecrawlClient.firecrawl_scrape({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
        actions: [
          { type: 'wait', milliseconds: 2000 },
          { type: 'scrape' }
        ]
      });

      return result.content;
    } catch (error) {
      throw new Error(`Failed to scrape Google Scholar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseSearchResults(html: string, maxResults: number): GoogleScholarPaper[] {
    const papers: GoogleScholarPaper[] = [];
    
    const lines = html.split('\n');
    let currentPaper: Partial<GoogleScholarPaper> = {};
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (papers.length >= maxResults) break;
      
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        if (currentPaper.title && currentPaper.authors) {
          papers.push(currentPaper as GoogleScholarPaper);
        }
        currentPaper = { title: trimmedLine.replace(/\*\*/g, '') };
      } else if (trimmedLine.includes('Authors:')) {
        const authorsMatch = trimmedLine.match(/Authors: (.+)/);
        if (authorsMatch) {
          currentPaper.authors = authorsMatch[1].split(',').map(a => a.trim());
        }
      } else if (trimmedLine.includes('Journal:')) {
        const journalMatch = trimmedLine.match(/Journal: (.+)/);
        if (journalMatch) {
          currentPaper.journal = journalMatch[1];
        }
      } else if (trimmedLine.includes('Publication Date:')) {
        const dateMatch = trimmedLine.match(/Publication Date: (.+)/);
        if (dateMatch) {
          currentPaper.publicationDate = dateMatch[1];
        }
      } else if (trimmedLine.includes('Citations:')) {
        const citationsMatch = trimmedLine.match(/Citations: (\d+)/);
        if (citationsMatch) {
          currentPaper.citations = parseInt(citationsMatch[1]);
        }
      } else if (trimmedLine.includes('URL:')) {
        const urlMatch = trimmedLine.match(/URL: (.+)/);
        if (urlMatch) {
          currentPaper.url = urlMatch[1];
        }
      } else if (trimmedLine.includes('PDF:')) {
        const pdfMatch = trimmedLine.match(/PDF: (.+)/);
        if (pdfMatch) {
          currentPaper.pdfUrl = pdfMatch[1];
        }
      } else if (trimmedLine.includes('Abstract:')) {
        const abstractMatch = trimmedLine.match(/Abstract: (.+)/);
        if (abstractMatch) {
          currentPaper.abstract = abstractMatch[1];
        }
      }
    }
    
    if (currentPaper.title && currentPaper.authors && papers.length < maxResults) {
      papers.push(currentPaper as GoogleScholarPaper);
    }
    
    return papers;
  }

  async searchPapers(options: GoogleScholarSearchOptions): Promise<GoogleScholarPaper[]> {
    try {
      const html = await this.searchGoogleScholar(options);
      return this.parseSearchResults(html, options.maxResults || 20);
    } catch (error) {
      throw new Error(`Failed to search Google Scholar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPaperDetails(url: string): Promise<GoogleScholarPaper | null> {
    if (!this.firecrawlClient) {
      throw new Error('Firecrawl client not available');
    }

    try {
      const result = await this.firecrawlClient.firecrawl_scrape({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 2000
      });

      const content = result.content;
      const lines = content.split('\n');
      
      let title = '';
      let authors: string[] = [];
      let abstract = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('# ')) {
          title = trimmedLine.substring(2);
        } else if (trimmedLine.includes('Authors:') || trimmedLine.includes('Author:')) {
          const authorsMatch = trimmedLine.match(/(?:Authors?):\s*(.+)/);
          if (authorsMatch) {
            authors = authorsMatch[1].split(',').map(a => a.trim());
          }
        } else if (trimmedLine.includes('Abstract:') || trimmedLine.includes('Summary:')) {
          const abstractMatch = trimmedLine.match(/(?:Abstract|Summary):\s*(.+)/);
          if (abstractMatch) {
            abstract = abstractMatch[1];
          }
        }
      }
      
      if (!title) {
        return null;
      }
      
      return {
        title,
        authors: authors.filter(author => author.length > 0),
        journal: 'Unknown journal',
        publicationDate: 'Unknown date',
        abstract,
        citations: 0,
        url
      };
    } catch (error) {
      throw new Error(`Failed to get paper details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCitationCount(title: string): Promise<number | null> {
    if (!this.firecrawlClient) {
      throw new Error('Firecrawl client not available');
    }

    try {
      const searchUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(title)}&hl=en&as_sdt=0,5`;
      
      const result = await this.firecrawlClient.firecrawl_scrape({
        url: searchUrl,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000
      });

      const content = result.content;
      const citationMatch = content.match(/Cited by (\d+)/);
      
      if (citationMatch) {
        return parseInt(citationMatch[1]);
      }
      
      return null;
    } catch (error) {
      throw new Error(`Failed to get citation count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRelatedPapers(title: string, maxResults: number = 10): Promise<GoogleScholarPaper[]> {
    if (!this.firecrawlClient) {
      throw new Error('Firecrawl client not available');
    }

    try {
      const searchUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(title)}&hl=en&as_sdt=0,5`;
      
      const result = await this.firecrawlClient.firecrawl_scrape({
        url: searchUrl,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000
      });

      return this.parseSearchResults(result.content, maxResults);
    } catch (error) {
      throw new Error(`Failed to get related papers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchWithFirecrawl(query: string, maxResults: number = 20): Promise<GoogleScholarPaper[]> {
    if (!this.firecrawlClient) {
      throw new Error('Firecrawl client not available');
    }

    try {
      const result = await this.firecrawlClient.firecrawl_search({
        query: `${query} site:scholar.google.com`,
        limit: maxResults,
        sources: ['web'],
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true
        }
      });

      return result.results.map((item: any) => ({
        title: item.title || 'Unknown title',
        authors: this.extractAuthors(item.snippet || ''),
        journal: this.extractJournal(item.snippet || ''),
        publicationDate: this.extractPublicationDate(item.snippet || ''),
        abstract: item.snippet || '',
        citations: 0,
        url: item.url || ''
      }));
    } catch (error) {
      throw new Error(`Failed to search with Firecrawl: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractAuthors(text: string): string[] {
    const authorMatch = text.match(/^([^-]+)/);
    if (authorMatch) {
      return authorMatch[1].split(',').map(author => author.trim()).filter(author => author.length > 0);
    }
    return [];
  }

  private extractJournal(text: string): string {
    const parts = text.split('-');
    if (parts.length > 1) {
      return parts[1].trim();
    }
    return 'Unknown journal';
  }

  private extractPublicationDate(text: string): string {
    const dateMatch = text.match(/(\d{4})/);
    if (dateMatch) {
      return dateMatch[1];
    }
    return 'Unknown date';
  }
}
