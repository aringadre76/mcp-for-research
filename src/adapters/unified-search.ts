import { PubMedAdapter } from './pubmed';
import { GoogleScholarAdapter } from './google-scholar';

export interface UnifiedPaper {
  title: string;
  authors: string[];
  journal: string;
  publicationDate: string;
  abstract: string;
  source: 'pubmed' | 'google-scholar' | 'both';
  pmid?: string;
  pmcid?: string;
  doi?: string;
  url?: string;
  pdfUrl?: string;
  citations: number;
  pmcFullTextUrl?: string;
}

export interface UnifiedSearchOptions {
  query: string;
  maxResults?: number;
  startDate?: string;
  endDate?: number;
  journal?: string;
  author?: string;
  sources?: ('pubmed' | 'google-scholar')[];
  sortBy?: 'relevance' | 'date' | 'citations';
}

export class UnifiedSearchAdapter {
  private pubmedAdapter: PubMedAdapter;
  private googleScholarAdapter: GoogleScholarAdapter;

  constructor() {
    this.pubmedAdapter = new PubMedAdapter();
    this.googleScholarAdapter = new GoogleScholarAdapter();
  }

  async searchPapers(options: UnifiedSearchOptions): Promise<UnifiedPaper[]> {
    const { sources = ['pubmed', 'google-scholar'], maxResults = 20 } = options;
    const results: UnifiedPaper[] = [];
    
    try {
      if (sources.includes('pubmed')) {
        const pubmedResults = await this.pubmedAdapter.searchPapers({
          query: options.query,
          maxResults: Math.ceil(maxResults / 2),
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
        const googleResults = await this.googleScholarAdapter.searchPapers({
          query: options.query,
          maxResults: Math.ceil(maxResults / 2),
          startYear: options.startDate ? parseInt(options.startDate.split('/')[0]) : undefined,
          endYear: options.endDate,
          sortBy: options.sortBy
        });
        
        const unifiedGoogleResults: UnifiedPaper[] = googleResults.map(paper => ({
          title: paper.title,
          authors: paper.authors,
          journal: paper.journal,
          publicationDate: paper.publicationDate,
          abstract: paper.abstract,
          source: 'google-scholar' as const,
          url: paper.url,
          pdfUrl: paper.pdfUrl,
          citations: paper.citations
        }));
        
        results.push(...unifiedGoogleResults);
      }
      
      return this.deduplicateAndSort(results, options.sortBy).slice(0, maxResults);
    } catch (error) {
      throw new Error(`Failed to perform unified search: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
            pmcFullTextUrl: paper.pmcFullTextUrl || existing.pmcFullTextUrl
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

  async getPaperDetails(identifier: string, source: 'pubmed' | 'google-scholar'): Promise<UnifiedPaper | null> {
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
      } else {
        const paper = await this.googleScholarAdapter.getPaperDetails(identifier);
        if (!paper) return null;
        
        return {
          ...paper,
          source: 'google-scholar' as const
        };
      }
    } catch (error) {
      throw new Error(`Failed to get paper details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCitationCount(identifier: string, source: 'pubmed' | 'google-scholar'): Promise<number | null> {
    try {
      if (source === 'pubmed') {
        return await this.pubmedAdapter.getCitationCount(identifier);
      } else {
        const paper = await this.googleScholarAdapter.getPaperDetails(identifier);
        if (!paper) return null;
        return await this.googleScholarAdapter.getCitationCount(paper.title);
      }
    } catch (error) {
      throw new Error(`Failed to get citation count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRelatedPapers(identifier: string, source: 'pubmed' | 'google-scholar', maxResults: number = 10): Promise<UnifiedPaper[]> {
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
          citations: p.citations
        }));
      }
    } catch (error) {
      throw new Error(`Failed to get related papers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async close(): Promise<void> {
    await this.googleScholarAdapter.close();
  }
}
