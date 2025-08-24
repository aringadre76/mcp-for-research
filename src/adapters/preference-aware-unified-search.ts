import { PubMedAdapter } from './pubmed';
import { GoogleScholarAdapter } from './google-scholar';
import { GoogleScholarFirecrawlAdapter } from './google-scholar-firecrawl';
import { UnifiedPaper, EnhancedUnifiedSearchOptions, FirecrawlMCPClient } from './enhanced-unified-search';
import { UserPreferencesManager, SourcePreference } from '../preferences/user-preferences';

export interface PreferenceAwareSearchOptions extends Omit<EnhancedUnifiedSearchOptions, 'sources'> {
  sources?: string[];
  overrideSources?: string[];
  respectUserPreferences?: boolean;
}

export class PreferenceAwareUnifiedSearchAdapter {
  private pubmedAdapter: PubMedAdapter;
  private googleScholarAdapter: GoogleScholarAdapter;
  private googleScholarFirecrawlAdapter: GoogleScholarFirecrawlAdapter;
  private preferencesManager: UserPreferencesManager;
  private useFirecrawl: boolean = false;

  constructor(firecrawlClient?: FirecrawlMCPClient) {
    this.pubmedAdapter = new PubMedAdapter();
    this.googleScholarAdapter = new GoogleScholarAdapter();
    this.googleScholarFirecrawlAdapter = new GoogleScholarFirecrawlAdapter(firecrawlClient);
    this.preferencesManager = UserPreferencesManager.getInstance();
    
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

  isFirecrawlAvailable(): boolean {
    return this.useFirecrawl && this.googleScholarFirecrawlAdapter !== null;
  }

  async searchPapers(options: PreferenceAwareSearchOptions): Promise<UnifiedPaper[]> {
    const preferences = this.preferencesManager.getPreferences();
    
    const sources = options.overrideSources || 
      (options.respectUserPreferences !== false ? this.preferencesManager.getSourcesForSearch() : 
       options.sources || ['pubmed', 'google-scholar']);
    
    const maxResults = options.maxResults || preferences.search.defaultMaxResults;
    const sortBy = options.sortBy || preferences.search.defaultSortBy;
    const preferFirecrawl = options.preferFirecrawl ?? preferences.search.preferFirecrawl;
    
    const enabledSources = this.preferencesManager.getEnabledSources();
    const results: UnifiedPaper[] = [];
    
    try {
      for (const sourceName of sources) {
        const sourcePrefs = enabledSources.find(s => s.name === sourceName);
        if (!sourcePrefs?.enabled) continue;
        
        const sourceMaxResults = sourcePrefs.maxResults || Math.ceil(maxResults / sources.length);
        
        try {
          if (sourceName === 'pubmed') {
            const pubmedResults = await this.pubmedAdapter.searchPapers({
              query: options.query,
              maxResults: sourceMaxResults,
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
          
          if (sourceName === 'google-scholar') {
            const useFirecrawlForThisSearch = preferFirecrawl && this.isFirecrawlAvailable();
            
            if (useFirecrawlForThisSearch) {
              try {
                const scholarResults = await this.googleScholarFirecrawlAdapter.searchPapers({
                  query: options.query,
                  maxResults: sourceMaxResults,
                  startYear: options.startDate ? parseInt(options.startDate.split('/')[0]) : undefined,
                  endYear: options.endDate || undefined,
                  sortBy: sortBy
                });
                
                const unifiedScholarResults: UnifiedPaper[] = scholarResults.map(paper => ({
                  title: paper.title,
                  authors: paper.authors,
                  journal: paper.journal,
                  publicationDate: paper.publicationDate,
                  abstract: paper.abstract,
                  source: 'google-scholar' as const,
                  pmid: undefined,
                  pmcid: undefined,
                  doi: undefined,
                  url: paper.url,
                  citations: paper.citations || 0,
                  pmcFullTextUrl: undefined,
                  pdfUrl: paper.pdfUrl,
                  searchMethod: 'firecrawl' as const
                }));
                
                results.push(...unifiedScholarResults);
              } catch (firecrawlError) {
                console.warn('Firecrawl search failed, falling back to Puppeteer:', firecrawlError);
                
                const scholarResults = await this.googleScholarAdapter.searchPapers({
                  query: options.query,
                  maxResults: sourceMaxResults,
                  startYear: options.startDate ? parseInt(options.startDate.split('/')[0]) : undefined,
                  endYear: options.endDate || undefined,
                  sortBy: sortBy
                });
                
                const unifiedScholarResults: UnifiedPaper[] = scholarResults.map(paper => ({
                  title: paper.title,
                  authors: paper.authors,
                  journal: paper.journal,
                  publicationDate: paper.publicationDate,
                  abstract: paper.abstract,
                  source: 'google-scholar' as const,
                  pmid: undefined,
                  pmcid: undefined,
                  doi: undefined,
                  url: paper.url,
                  citations: paper.citations || 0,
                  pmcFullTextUrl: undefined,
                  pdfUrl: paper.pdfUrl,
                  searchMethod: 'puppeteer' as const
                }));
                
                results.push(...unifiedScholarResults);
              }
            } else {
              const scholarResults = await this.googleScholarAdapter.searchPapers({
                query: options.query,
                maxResults: sourceMaxResults,
                startYear: options.startDate ? parseInt(options.startDate.split('/')[0]) : undefined,
                endYear: options.endDate || undefined,
                sortBy: sortBy
              });
              
              const unifiedScholarResults: UnifiedPaper[] = scholarResults.map(paper => ({
                title: paper.title,
                authors: paper.authors,
                journal: paper.journal,
                publicationDate: paper.publicationDate,
                abstract: paper.abstract,
                source: 'google-scholar' as const,
                pmid: undefined,
                pmcid: undefined,
                doi: undefined,
                url: paper.url,
                citations: paper.citations || 0,
                pmcFullTextUrl: undefined,
                pdfUrl: paper.pdfUrl,
                searchMethod: 'puppeteer' as const
              }));
              
              results.push(...unifiedScholarResults);
            }
          }
          
        } catch (sourceError) {
          console.warn(`Search failed for source ${sourceName}:`, sourceError);
        }
      }
      
      if (preferences.search.enableDeduplication) {
        return this.deduplicateResults(results, sortBy);
      }
      
      return this.sortResults(results, sortBy).slice(0, maxResults);
      
    } catch (error) {
      throw new Error(`Unified search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private deduplicateResults(results: UnifiedPaper[], sortBy: string): UnifiedPaper[] {
    const seen = new Set<string>();
    const deduplicated: UnifiedPaper[] = [];
    
    for (const paper of results) {
      const normalizedTitle = paper.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
      if (!seen.has(normalizedTitle)) {
        seen.add(normalizedTitle);
        deduplicated.push(paper);
      }
    }
    
    return this.sortResults(deduplicated, sortBy);
  }

  private sortResults(results: UnifiedPaper[], sortBy: string): UnifiedPaper[] {
    switch (sortBy) {
      case 'date':
        return results.sort((a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime());
      case 'citations':
        return results.sort((a, b) => (b.citations || 0) - (a.citations || 0));
      case 'relevance':
      default:
        return results;
    }
  }

  formatResults(papers: UnifiedPaper[]): string {
    const preferences = this.preferencesManager.getPreferences();
    const { showAbstracts, showCitations, showUrls, maxAbstractLength } = preferences.display;
    
    return papers.map((paper, index) => {
      const authors = paper.authors.length > 0 ? paper.authors.join(', ') : 'Unknown authors';
      const sourceInfo = `\n   - Source: ${paper.source}`;
      const pmidInfo = paper.pmid ? `\n   - PMID: ${paper.pmid}` : '';
      const pmcInfo = paper.pmcid ? `\n   - PMC ID: ${paper.pmcid} (Full text likely available)` : '';
      const doiInfo = paper.doi ? `\n   - DOI: ${paper.doi}` : '';
      const urlInfo = showUrls && paper.url ? `\n   - URL: ${paper.url}` : '';
      const pdfInfo = showUrls && paper.pdfUrl ? `\n   - PDF: ${paper.pdfUrl}` : '';
      const citationsInfo = showCitations && paper.citations > 0 ? `\n   - Citations: ${paper.citations}` : '';
      const searchMethodInfo = paper.searchMethod ? `\n   - Search Method: ${paper.searchMethod}` : '';
      
      const abstractText = showAbstracts && paper.abstract ? 
        `   - Abstract: ${paper.abstract.substring(0, maxAbstractLength)}${paper.abstract.length > maxAbstractLength ? '...' : ''}` : '';
      
      return `${index + 1}. **${paper.title}**
   - Authors: ${authors}
   - Journal: ${paper.journal}
   - Publication Date: ${paper.publicationDate}${sourceInfo}${pmidInfo}${pmcInfo}${doiInfo}${urlInfo}${pdfInfo}${citationsInfo}${searchMethodInfo}
${abstractText}
`;
    }).join('\n');
  }
}

