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

export type FirecrawlScrapeAction =
  | { type: 'wait'; milliseconds?: number }
  | { type: 'scrape' };

export interface FirecrawlSearchResultItem {
  title?: string;
  url?: string;
  snippet?: string;
  description?: string;
  markdown?: string | null;
  metadata?: Record<string, unknown>;
}

export interface FirecrawlMCPClient {
  firecrawl_scrape: (params: {
    url: string;
    formats?: string[];
    onlyMainContent?: boolean;
    waitFor?: number;
    actions?: FirecrawlScrapeAction[];
  }) => Promise<{ content: string }>;
  firecrawl_search: (params: {
    query: string;
    limit?: number;
    sources?: string[];
    scrapeOptions?: {
      formats: string[];
      onlyMainContent?: boolean;
    };
  }) => Promise<{ results: FirecrawlSearchResultItem[] }>;
}

const TRANSIENT_HTTP_CODES = new Set([429, 500, 502, 503, 504]);

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      const message = lastError.message.toLowerCase();
      const isTransient =
        message.includes('429') ||
        message.includes('5') ||
        message.includes('rate') ||
        message.includes('timeout') ||
        message.includes('network');
      if (attempt < maxAttempts && isTransient) {
        const delayMs = attempt * 1000;
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      throw lastError;
    }
  }
  throw lastError;
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
      const result = await withRetry(() =>
        this.firecrawlClient!.firecrawl_scrape({
          url,
          formats: ['markdown'],
          onlyMainContent: true,
          waitFor: 3000,
          actions: [
            { type: 'wait', milliseconds: 2000 },
            { type: 'scrape' }
          ]
        })
      );
      return result.content;
    } catch (error) {
      throw new Error(`Failed to scrape Google Scholar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseSearchResults(html: string, maxResults: number): GoogleScholarPaper[] {
    const papers: GoogleScholarPaper[] = [];
    const lines = html.split('\n');
    const fieldStartPattern = /^(Authors?|Journal|Publication Date|Citations?|URL|PDF|Abstract):/i;
    let currentPaper: Partial<GoogleScholarPaper> = {
      authors: [],
      journal: '',
      publicationDate: '',
      abstract: '',
      citations: 0,
      url: ''
    };
    let inAbstract = false;
    const abstractLines: string[] = [];

    const pushCurrent = () => {
      if (!currentPaper.title) return;
      const hasUrl = Boolean(currentPaper.url && currentPaper.url.trim());
      const hasAuthors = Array.isArray(currentPaper.authors) && currentPaper.authors.length > 0;
      if (hasUrl || hasAuthors) {
        papers.push({
          title: currentPaper.title,
          authors: currentPaper.authors ?? [],
          journal: currentPaper.journal ?? '',
          publicationDate: currentPaper.publicationDate ?? '',
          abstract: currentPaper.abstract ?? '',
          citations: currentPaper.citations ?? 0,
          url: currentPaper.url ?? '',
          doi: currentPaper.doi,
          pdfUrl: currentPaper.pdfUrl,
          relatedArticles: currentPaper.relatedArticles
        } as GoogleScholarPaper);
      }
    };

    for (let i = 0; i < lines.length && papers.length < maxResults; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (inAbstract) {
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') || fieldStartPattern.test(trimmedLine)) {
          currentPaper.abstract = abstractLines.join(' ').trim();
          inAbstract = false;
          abstractLines.length = 0;
        } else {
          abstractLines.push(trimmedLine);
          continue;
        }
      }

      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        pushCurrent();
        currentPaper = {
          title: trimmedLine.replace(/\*\*/g, '').trim(),
          authors: [],
          journal: '',
          publicationDate: '',
          abstract: '',
          citations: 0,
          url: ''
        };
      } else if (trimmedLine.includes('Authors:')) {
        const authorsMatch = trimmedLine.match(/Authors?:\s*(.+)/i);
        currentPaper.authors = authorsMatch?.[1]?.split(',').map((a) => a.trim()).filter(Boolean) ?? currentPaper.authors ?? [];
      } else if (trimmedLine.includes('Journal:')) {
        const journalMatch = trimmedLine.match(/Journal:\s*(.+)/i);
        if (journalMatch?.[1]) currentPaper.journal = journalMatch[1].trim();
      } else if (trimmedLine.includes('Publication Date:')) {
        const dateMatch = trimmedLine.match(/Publication Date:\s*(.+)/i);
        if (dateMatch?.[1]) currentPaper.publicationDate = dateMatch[1].trim();
      } else if (trimmedLine.includes('Citations:')) {
        const citationsMatch = trimmedLine.match(/Citations?:\s*(\d+)/i);
        if (citationsMatch?.[1]) currentPaper.citations = parseInt(citationsMatch[1], 10);
      } else if (trimmedLine.includes('URL:')) {
        const urlMatch = trimmedLine.match(/URL:\s*(.+)/i);
        if (urlMatch?.[1]) currentPaper.url = urlMatch[1].trim();
      } else if (trimmedLine.includes('PDF:')) {
        const pdfMatch = trimmedLine.match(/PDF:\s*(.+)/i);
        if (pdfMatch?.[1]) currentPaper.pdfUrl = pdfMatch[1].trim();
      } else if (trimmedLine.includes('Abstract:')) {
        const abstractMatch = trimmedLine.match(/Abstract:\s*(.+)/i);
        if (abstractMatch?.[1]) {
          abstractLines.length = 0;
          abstractLines.push(abstractMatch[1]);
        }
        inAbstract = true;
      }
    }

    if (inAbstract && abstractLines.length > 0) {
      currentPaper.abstract = abstractLines.join(' ').trim();
    }
    pushCurrent();
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
      const result = await withRetry(() =>
        this.firecrawlClient!.firecrawl_scrape({
          url,
          formats: ['markdown'],
          onlyMainContent: true,
          waitFor: 2000
        })
      );
      const content = result.content;
      const lines = content.split('\n');
      let title = '';
      let authors: string[] = [];
      let abstract = '';
      let journal = 'Unknown journal';
      let publicationDate = 'Unknown date';
      let citations = 0;

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('# ')) {
          title = trimmedLine.substring(2).trim();
        } else if (/Authors?:\s*/i.test(trimmedLine)) {
          const m = trimmedLine.match(/(?:Authors?):\s*(.+)/i);
          if (m?.[1]) authors = m[1].split(',').map((a) => a.trim()).filter(Boolean);
        } else if (/Abstract:\s*|Summary:\s*/i.test(trimmedLine)) {
          const m = trimmedLine.match(/(?:Abstract|Summary):\s*(.+)/i);
          if (m?.[1]) abstract = m[1].trim();
        } else if (/Journal:\s*/i.test(trimmedLine)) {
          const m = trimmedLine.match(/Journal:\s*(.+)/i);
          if (m?.[1]) journal = m[1].trim();
        } else if (/Publication Date:\s*|Date:\s*|Year:\s*/i.test(trimmedLine)) {
          const m = trimmedLine.match(/(?:Publication Date|Date|Year):\s*(.+)/i);
          if (m?.[1]) publicationDate = m[1].trim();
        } else if (/Cited by\s+(\d+)/i.test(trimmedLine)) {
          const m = trimmedLine.match(/Cited by\s+(\d+)/i);
          if (m?.[1]) citations = parseInt(m[1], 10);
        } else if (/Citations?:\s*(\d+)/i.test(trimmedLine)) {
          const m = trimmedLine.match(/Citations?:\s*(\d+)/i);
          if (m?.[1]) citations = parseInt(m[1], 10);
        }
      }
      if (!title) return null;
      const citedMatch = content.match(/Cited by\s+(\d+)/i);
      if (citedMatch?.[1] && citations === 0) citations = parseInt(citedMatch[1], 10);

      return {
        title,
        authors: authors.filter((a) => a.length > 0),
        journal,
        publicationDate,
        abstract,
        citations,
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
      const result = await withRetry(() =>
        this.firecrawlClient!.firecrawl_scrape({
          url: searchUrl,
          formats: ['markdown'],
          onlyMainContent: true,
          waitFor: 3000
        })
      );
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
      const result = await withRetry(() =>
        this.firecrawlClient!.firecrawl_scrape({
          url: searchUrl,
          formats: ['markdown'],
          onlyMainContent: true,
          waitFor: 3000
        })
      );
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
      const result = await withRetry(() =>
        this.firecrawlClient!.firecrawl_search({
          query: `${query} site:scholar.google.com`,
          limit: maxResults,
          sources: ['web'],
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true
          }
        })
      );
      const snippet = (item: FirecrawlSearchResultItem) =>
        item.snippet ?? item.description ?? '';
      return result.results.map((item: FirecrawlSearchResultItem) => ({
        title: item.title ?? 'Unknown title',
        authors: this.extractAuthors(snippet(item)),
        journal: this.extractJournal(snippet(item)),
        publicationDate: this.extractPublicationDate(snippet(item)),
        abstract: snippet(item),
        citations: 0,
        url: item.url ?? ''
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
