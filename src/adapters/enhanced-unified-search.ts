import { PubMedAdapter } from './pubmed';
import { GoogleScholarAdapter } from './google-scholar';
import { ArXivAdapter } from './arxiv';
import { GoogleScholarFirecrawlAdapter } from './google-scholar-firecrawl';

export interface UnifiedPaper {
  title: string;
  authors: string[];
  journal: string;
  publicationDate: string;
  abstract: string;
  source: 'pubmed' | 'google-scholar' | 'arxiv' | 'both';
  pmid?: string;
  pmcid?: string;
  doi?: string;
  url?: string;
  pdfUrl?: string;
  citations: number;
  pmcFullTextUrl?: string;
  searchMethod?: 'puppeteer' | 'firecrawl';
  arxivId?: string;
  categories?: string[];
}

export interface EnhancedUnifiedSearchOptions {
  query: string;
  maxResults?: number;
  startDate?: string;
  endDate?: number;
  journal?: string;
  author?: string;
  sources?: ('pubmed' | 'google-scholar' | 'arxiv')[];
  sortBy?: 'relevance' | 'date' | 'citations';
  preferFirecrawl?: boolean;
}

export interface FirecrawlMCPClient {
  firecrawl_scrape: (params: any) => Promise<{ content: string }>;
  firecrawl_search: (params: any) => Promise<{ results: any[] }>;
}

export class EnhancedUnifiedSearchAdapter {
  private pubmedAdapter: PubMedAdapter;
  private googleScholarAdapter: GoogleScholarAdapter;
  private arxivAdapter: ArXivAdapter;
  private googleScholarFirecrawlAdapter: GoogleScholarFirecrawlAdapter;
  private useFirecrawl: boolean = false;

  constructor(firecrawlClient?: FirecrawlMCPClient) {
    this.pubmedAdapter = new PubMedAdapter();
    this.googleScholarAdapter = new GoogleScholarAdapter();
    this.arxivAdapter = new ArXivAdapter();
    this.googleScholarFirecrawlAdapter = new GoogleScholarFirecrawlAdapter(firecrawlClient);
    
    if (firecrawlClient) {
      this.useFirecrawl = true;
    }
  }

  setFirecrawlClient(client: FirecrawlMCPClient) {
    this.googleScholarFirecrawlAdapter.setFirecrawlClient(client);
    this.useFirecrawl = true;
  }

  setPreferFirecrawl(prefer: boolean) {
    this.useFirecrawl = prefer;
  }

  async searchPapers(options: EnhancedUnifiedSearchOptions): Promise<UnifiedPaper[]> {
    const { sources = ['pubmed', 'google-scholar'], maxResults = 20, preferFirecrawl } = options;
    const results: UnifiedPaper[] = [];
    
    try {
      if (sources.includes('pubmed')) {
        const pubmedResults = await this.pubmedAdapter.searchPapers({
          query: options.query,
          maxResults: Math.ceil(maxResults / 3),
          startDate: options.startDate,
          endDate: options.endDate ? options.endDate.toString() : undefined,
          journal: options.journal,
          author: options.author
        });
        
        const unifiedPubmedResults: UnifiedPaper[] = pubmedResults.map(paper => ({
          title: paper.title,
          authors: paper.authors,
          journal: paper.journal,
          publicationDate: paper.publicationDate,
          abstract: paper.abstract,
          source: 'pubmed' as const,
          pmid: paper.pmid,
          pmcid: paper.pmcid,
          doi: paper.doi,
          url: paper.pmcFullTextUrl,
          citations: 0,
          pmcFullTextUrl: paper.pmcFullTextUrl
        }));
        
        results.push(...unifiedPubmedResults);
      }
      
      if (sources.includes('google-scholar')) {
        let googleResults: any[] = [];
        
        if (this.useFirecrawl && preferFirecrawl !== false) {
          try {
            googleResults = await this.googleScholarFirecrawlAdapter.searchPapers({
              query: options.query,
              maxResults: Math.ceil(maxResults / 3),
              startYear: options.startDate ? parseInt(options.startDate.split('/')[0]) : undefined,
              endYear: options.endDate,
              sortBy: options.sortBy
            });
          } catch (error) {
            console.warn('Firecrawl failed, falling back to Puppeteer:', error);
            this.useFirecrawl = false;
          }
        }
        
        if (!this.useFirecrawl || googleResults.length === 0) {
          googleResults = await this.googleScholarAdapter.searchPapers({
            query: options.query,
            maxResults: Math.ceil(maxResults / 3),
            startYear: options.startDate ? parseInt(options.startDate.split('/')[0]) : undefined,
            endYear: options.endDate,
            sortBy: options.sortBy
          });
        }
        
        const unifiedGoogleResults: UnifiedPaper[] = googleResults.map(paper => ({
          title: paper.title,
          authors: paper.authors,
          journal: paper.journal,
          publicationDate: paper.publicationDate,
          abstract: paper.abstract,
          source: 'google-scholar' as const,
          url: paper.url,
          pdfUrl: paper.pdfUrl,
          citations: paper.citations,
          searchMethod: this.useFirecrawl ? 'firecrawl' : 'puppeteer'
        }));
        
        results.push(...unifiedGoogleResults);
      }

      if (sources.includes('arxiv')) {
        const arxivResults = await this.arxivAdapter.searchPapers({
          query: options.query,
          maxResults: Math.ceil(maxResults / 3),
          startYear: options.startDate ? parseInt(options.startDate.split('/')[0]) : undefined,
          endYear: options.endDate,
          sortBy: options.sortBy === 'date' ? 'submittedDate' : 'relevance'
        });
        
        const unifiedArxivResults: UnifiedPaper[] = arxivResults.map(paper => ({
          title: paper.title,
          authors: paper.authors,
          journal: 'ArXiv preprint',
          publicationDate: paper.publicationDate,
          abstract: paper.abstract,
          source: 'arxiv' as const,
          url: paper.absUrl,
          pdfUrl: paper.pdfUrl,
          citations: 0,
          arxivId: paper.id,
          categories: paper.categories
        }));
        
        results.push(...unifiedArxivResults);
      }
      
      return this.deduplicateAndSort(results, options.sortBy).slice(0, maxResults);
    } catch (error) {
      throw new Error(`Failed to perform enhanced unified search: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchWithFirecrawl(query: string, maxResults: number = 20): Promise<UnifiedPaper[]> {
    if (!this.useFirecrawl) {
      throw new Error('Firecrawl is not available or not enabled');
    }

    try {
      const firecrawlResults = await this.googleScholarFirecrawlAdapter.searchWithFirecrawl(query, maxResults);
      
      return firecrawlResults.map(paper => ({
        title: paper.title,
        authors: paper.authors,
        journal: paper.journal,
        publicationDate: paper.publicationDate,
        abstract: paper.abstract,
        source: 'google-scholar' as const,
        url: paper.url,
        pdfUrl: paper.pdfUrl,
        citations: paper.citations,
        searchMethod: 'firecrawl'
      }));
    } catch (error) {
      throw new Error(`Failed to search with Firecrawl: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private deduplicateAndSort(papers: UnifiedPaper[], sortBy?: string): UnifiedPaper[] {
    const uniquePapers = new Map<string, UnifiedPaper>();
    
    papers.forEach(paper => {
      const key = paper.title.toLowerCase().trim();
      if (!uniquePapers.has(key)) {
        uniquePapers.set(key, paper);
      } else {
        const existing = uniquePapers.get(key)!;
        if (paper.source === 'both' || existing.source === 'both') {
          uniquePapers.set(key, {
            ...paper,
            source: 'both',
            pmid: paper.pmid || existing.pmid,
            pmcid: paper.pmcid || existing.pmcid,
            doi: paper.doi || existing.doi,
            url: paper.url || existing.url,
            pdfUrl: paper.pdfUrl || existing.pdfUrl,
            citations: Math.max(paper.citations, existing.citations),
            pmcFullTextUrl: paper.pmcFullTextUrl || existing.pmcFullTextUrl,
            searchMethod: paper.searchMethod || existing.searchMethod,
            arxivId: paper.arxivId || existing.arxivId,
            categories: paper.categories || existing.categories
          });
        }
      }
    });
    
    const sortedPapers = Array.from(uniquePapers.values());
    
    switch (sortBy) {
      case 'date':
        return sortedPapers.sort((a, b) => {
          const dateA = new Date(a.publicationDate);
          const dateB = new Date(b.publicationDate);
          return dateB.getTime() - dateA.getTime();
        });
      case 'citations':
        return sortedPapers.sort((a, b) => b.citations - a.citations);
      default:
        return sortedPapers;
    }
  }

  async getPaperDetails(identifier: string, source: 'pubmed' | 'google-scholar' | 'arxiv'): Promise<UnifiedPaper | null> {
    try {
      if (source === 'pubmed') {
        const paper = await this.pubmedAdapter.getPaperById(identifier);
        if (!paper) return null;
        
        return {
          title: paper.title,
          authors: paper.authors,
          journal: paper.journal,
          publicationDate: paper.publicationDate,
          abstract: paper.abstract,
          source: 'pubmed',
          pmid: paper.pmid,
          pmcid: paper.pmcid,
          doi: paper.doi,
          url: paper.pmcFullTextUrl,
          citations: 0,
          pmcFullTextUrl: paper.pmcFullTextUrl
        };
      } else if (source === 'google-scholar') {
        if (this.useFirecrawl) {
          const paper = await this.googleScholarFirecrawlAdapter.getPaperDetails(identifier);
          if (!paper) return null;
          
          return {
            ...paper,
            source: 'google-scholar' as const,
            searchMethod: 'firecrawl'
          };
        } else {
          const paper = await this.googleScholarAdapter.getPaperDetails(identifier);
          if (!paper) return null;
          
          return {
            ...paper,
            source: 'google-scholar' as const,
            searchMethod: 'puppeteer'
          };
        }
      } else if (source === 'arxiv') {
        const paper = await this.arxivAdapter.getPaperById(identifier);
        if (!paper) return null;
        
        return {
          title: paper.title,
          authors: paper.authors,
          journal: 'ArXiv preprint',
          publicationDate: paper.publicationDate,
          abstract: paper.abstract,
          source: 'arxiv',
          url: paper.absUrl,
          pdfUrl: paper.pdfUrl,
          citations: 0,
          arxivId: paper.id,
          categories: paper.categories
        };
      }
      return null;
    } catch (error) {
      throw new Error(`Failed to get paper details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCitationCount(identifier: string, source: 'pubmed' | 'google-scholar' | 'arxiv'): Promise<number | null> {
    try {
      if (source === 'pubmed') {
        return await this.pubmedAdapter.getCitationCount(identifier);
      } else if (source === 'google-scholar') {
        if (this.useFirecrawl) {
          const paper = await this.googleScholarFirecrawlAdapter.getPaperDetails(identifier);
          if (!paper) return null;
          return await this.googleScholarFirecrawlAdapter.getCitationCount(paper.title);
        } else {
          const paper = await this.googleScholarAdapter.getPaperDetails(identifier);
          if (!paper) return null;
          return await this.googleScholarAdapter.getCitationCount(paper.title);
        }
      } else if (source === 'arxiv') {
        return 0;
      }
      return null;
    } catch (error) {
      throw new Error(`Failed to get citation count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRelatedPapers(identifier: string, source: 'pubmed' | 'google-scholar' | 'arxiv', maxResults: number = 10): Promise<UnifiedPaper[]> {
    try {
      if (source === 'pubmed') {
        const paper = await this.pubmedAdapter.getPaperById(identifier);
        if (!paper) return [];
        
        const related = await this.pubmedAdapter.searchPapers({
          query: paper.title,
          maxResults: maxResults
        });
        
        return related.map(p => ({
          title: p.title,
          authors: p.authors,
          journal: p.journal,
          publicationDate: p.publicationDate,
          abstract: p.abstract,
          source: 'pubmed' as const,
          pmid: p.pmid,
          pmcid: p.pmcid,
          doi: p.doi,
          url: p.pmcFullTextUrl,
          citations: 0,
          pmcFullTextUrl: p.pmcFullTextUrl
        }));
      } else if (source === 'google-scholar') {
        if (this.useFirecrawl) {
          const paper = await this.googleScholarFirecrawlAdapter.getPaperDetails(identifier);
          if (!paper) return [];
          
          const related = await this.googleScholarFirecrawlAdapter.getRelatedPapers(paper.title, maxResults);
          
          return related.map(p => ({
            title: p.title,
            authors: p.authors,
            journal: p.journal,
            publicationDate: p.publicationDate,
            abstract: p.abstract,
            source: 'google-scholar' as const,
            url: p.url,
            pdfUrl: p.pdfUrl,
            citations: p.citations,
            searchMethod: 'firecrawl'
          }));
        } else {
          const paper = await this.googleScholarAdapter.getPaperDetails(identifier);
          if (!paper) return [];
          
          const related = await this.googleScholarAdapter.getRelatedPapers(paper.title, maxResults);
          
          return related.map(p => ({
            title: p.title,
            authors: p.authors,
            journal: p.journal,
            publicationDate: p.publicationDate,
            abstract: p.abstract,
            source: 'google-scholar' as const,
            url: p.url,
            pdfUrl: p.pdfUrl,
            citations: p.citations,
            searchMethod: 'puppeteer'
          }));
        }
      } else if (source === 'arxiv') {
        const related = await this.arxivAdapter.getRelatedPapers(identifier, maxResults);
        
        return related.map(p => ({
          title: p.title,
          authors: p.authors,
          journal: 'ArXiv preprint',
          publicationDate: p.publicationDate,
          abstract: p.abstract,
          source: 'arxiv' as const,
          url: p.absUrl,
          pdfUrl: p.pdfUrl,
          citations: 0,
          arxivId: p.id,
          categories: p.categories
        }));
      }
      return [];
    } catch (error) {
      throw new Error(`Failed to get related papers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async close(): Promise<void> {
    await this.googleScholarAdapter.close();
    await this.arxivAdapter.close();
  }

  getSearchMethod(): 'puppeteer' | 'firecrawl' | 'mixed' {
    if (this.useFirecrawl) {
      return 'firecrawl';
    }
    return 'puppeteer';
  }

  isFirecrawlAvailable(): boolean {
    return this.useFirecrawl;
  }
}
