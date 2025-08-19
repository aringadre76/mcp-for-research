import axios from 'axios';
import { parseString } from 'xml2js';

export interface PubMedPaper {
  pmid: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  publicationDate: string;
  doi?: string;
  citationCount?: number;
}

export interface PubMedSearchParams {
  query: string;
  maxResults?: number;
  startDate?: string;
  endDate?: string;
  journal?: string;
  author?: string;
}

export class PubMedAdapter {
  private baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  private apiKey?: string;
  private lastRequestTime = 0;
  private readonly minRequestInterval = 100;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  private async delay(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();
  }

  private async makeRequest(endpoint: string, params: Record<string, string>): Promise<any> {
    await this.delay();
    
    try {
      const response = await axios.get(`${this.baseUrl}/${endpoint}`, {
        params: {
          ...params,
          ...(this.apiKey && { api_key: this.apiKey }),
          retmode: 'xml'
        },
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`PubMed API error: ${error.message}`);
      }
      throw error;
    }
  }

  async searchPapers(params: PubMedSearchParams): Promise<PubMedPaper[]> {
    const searchParams: Record<string, string> = {
      db: 'pubmed',
      term: params.query,
      retmax: (params.maxResults || 20).toString(),
      sort: 'relevance'
    };

    if (params.startDate) {
      searchParams.mindate = params.startDate;
    }
    if (params.endDate) {
      searchParams.maxdate = params.endDate;
    }
    if (params.journal) {
      searchParams.term += ` AND ${params.journal}[journal]`;
    }
    if (params.author) {
      searchParams.term += ` AND ${params.author}[author]`;
    }

    const searchResponse = await this.makeRequest('esearch.fcgi', searchParams);
    
    return new Promise((resolve, reject) => {
      parseString(searchResponse, (err, result) => {
        if (err) {
          reject(new Error(`Failed to parse PubMed search response: ${err.message}`));
          return;
        }

        const idList = result.eSearchResult?.IdList?.[0]?.Id || [];
        if (idList.length === 0) {
          resolve([]);
          return;
        }

        this.fetchPapersByIds(idList).then(resolve).catch(reject);
      });
    });
  }

  async fetchPapersByIds(pmids: string[]): Promise<PubMedPaper[]> {
    if (pmids.length === 0) return [];

    const fetchParams = {
      db: 'pubmed',
      id: pmids.join(','),
      rettype: 'abstract',
      retmode: 'xml'
    };

    const fetchResponse = await this.makeRequest('efetch.fcgi', fetchParams);
    
    return new Promise((resolve, reject) => {
      parseString(fetchResponse, (err, result) => {
        if (err) {
          reject(new Error(`Failed to parse PubMed fetch response: ${err.message}`));
          return;
        }

        const articles = result.PubmedArticleSet?.PubmedArticle || [];
        const papers: PubMedPaper[] = articles.map((article: any) => {
          const medline = article.MedlineCitation?.[0];
          const pubmedData = article.PubmedData?.[0];
          
          // Handle PMID - it can be either a string or an object with _ property
          let pmid = '';
          if (medline?.PMID?.[0]) {
            pmid = typeof medline.PMID[0] === 'string' ? medline.PMID[0] : medline.PMID[0]._ || '';
          }
          
          // Handle title
          let title = '';
          if (medline?.Article?.[0]?.ArticleTitle?.[0]) {
            title = typeof medline.Article[0].ArticleTitle[0] === 'string' 
              ? medline.Article[0].ArticleTitle[0] 
              : medline.Article[0].ArticleTitle[0]._ || '';
          }
          
          // Handle abstract - AbstractText can be an array or single element
          let abstract = '';
          if (medline?.Article?.[0]?.Abstract?.[0]?.AbstractText) {
            const abstractText = medline.Article[0].Abstract[0].AbstractText;
            if (Array.isArray(abstractText)) {
              abstract = abstractText.map(text => 
                typeof text === 'string' ? text : text._ || ''
              ).join(' ');
            } else {
              abstract = typeof abstractText === 'string' ? abstractText : abstractText._ || '';
            }
          }
          
          // Handle authors
          let authors: string[] = [];
          if (medline?.Article?.[0]?.AuthorList?.[0]?.Author) {
            const authorList = medline.Article[0].AuthorList[0].Author;
            if (Array.isArray(authorList)) {
              authors = authorList.map((author: any) => {
                const lastName = author.LastName?.[0] || '';
                const initials = author.Initials?.[0] || '';
                const foreName = author.ForeName?.[0] || '';
                return `${lastName} ${foreName || initials}`.trim();
              }).filter((name: string) => name.length > 0);
            }
          }
          
          // Handle journal
          let journal = '';
          if (medline?.MedlineJournalInfo?.[0]?.MedlineTA?.[0]) {
            journal = typeof medline.MedlineJournalInfo[0].MedlineTA[0] === 'string'
              ? medline.MedlineJournalInfo[0].MedlineTA[0]
              : medline.MedlineJournalInfo[0].MedlineTA[0]._ || '';
          }
          
          // Handle publication date
          let publicationDate = '';
          if (medline?.Article?.[0]?.Journal?.[0]?.JournalIssue?.[0]?.PubDate?.[0]?.Year?.[0]) {
            publicationDate = typeof medline.Article[0].Journal[0].JournalIssue[0].PubDate[0].Year[0] === 'string'
              ? medline.Article[0].Journal[0].JournalIssue[0].PubDate[0].Year[0]
              : medline.Article[0].Journal[0].JournalIssue[0].PubDate[0].Year[0]._ || '';
          }
          
          // Handle DOI
          let doi: string | undefined = undefined;
          if (pubmedData?.ArticleIdList?.[0]?.ArticleId) {
            const articleIds = pubmedData.ArticleIdList[0].ArticleId;
            if (Array.isArray(articleIds)) {
              const doiId = articleIds.find((id: any) => id.$.IdType === 'doi');
              if (doiId) {
                doi = typeof doiId === 'string' ? doiId : doiId._ || '';
              }
            }
          }
          
          return {
            pmid,
            title,
            abstract,
            authors,
            journal,
            publicationDate,
            doi
          };
        });

        resolve(papers);
      });
    });
  }

  async getPaperById(pmid: string): Promise<PubMedPaper | null> {
    const papers = await this.fetchPapersByIds([pmid]);
    return papers.length > 0 ? papers[0] : null;
  }

  async getCitationCount(pmid: string): Promise<number | null> {
    try {
      const fetchParams = {
        db: 'pubmed',
        id: pmid,
        rettype: 'abstract',
        retmode: 'xml'
      };

      const fetchResponse = await this.makeRequest('efetch.fcgi', fetchParams);
      
      return new Promise((resolve, reject) => {
        parseString(fetchResponse, (err, result) => {
          if (err) {
            reject(new Error(`Failed to parse PubMed response: ${err.message}`));
            return;
          }

          const article = result.PubmedArticleSet?.PubmedArticle?.[0];
          if (!article) {
            resolve(null);
            return;
          }

          // Try to get citation count from various sources
          const medline = article.MedlineCitation?.[0];
          const pubmedData = article.PubmedData?.[0];
          
          // Check for citation count in ArticleIdList
          if (pubmedData?.ArticleIdList?.[0]?.ArticleId) {
            const articleIds = pubmedData.ArticleIdList[0].ArticleId;
            if (Array.isArray(articleIds)) {
              const citationId = articleIds.find((id: any) => id.$.IdType === 'pmc-cited');
              if (citationId) {
                const count = typeof citationId === 'string' ? citationId : citationId._ || '';
                const numCount = parseInt(count);
                if (!isNaN(numCount)) {
                  resolve(numCount);
                  return;
                }
              }
            }
          }

          // If no citation count found, return null
          resolve(null);
        });
      });
    } catch (error) {
      console.error('Error fetching citation count:', error);
      return null;
    }
  }
}
