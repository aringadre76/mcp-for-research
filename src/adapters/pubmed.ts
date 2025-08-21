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
  fullText?: string;
  sections?: PaperSection[];
}

export interface PaperSection {
  title: string;
  content: string;
  level: number;
  subsections?: PaperSection[];
}

export interface PubMedSearchParams {
  query: string;
  maxResults?: number;
  startDate?: string;
  endDate?: string;
  journal?: string;
  author?: string;
}

export interface TextExtractionParams {
  pmid: string;
  includeFullText?: boolean;
  extractSections?: boolean;
  maxSectionLength?: number;
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
          
          let pmid = '';
          if (medline?.PMID?.[0]) {
            pmid = typeof medline.PMID[0] === 'string' ? medline.PMID[0] : medline.PMID[0]._ || '';
          }
          
          let title = '';
          if (medline?.Article?.[0]?.ArticleTitle?.[0]) {
            title = typeof medline.Article[0].ArticleTitle[0] === 'string' 
              ? medline.Article[0].ArticleTitle[0] 
              : medline.Article[0].ArticleTitle[0]._ || '';
          }
          
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
          
          let journal = '';
          if (medline?.MedlineJournalInfo?.[0]?.MedlineTA?.[0]) {
            journal = typeof medline.MedlineJournalInfo[0].MedlineTA[0] === 'string'
              ? medline.MedlineJournalInfo[0].MedlineTA[0]
              : medline.MedlineJournalInfo[0].MedlineTA[0]._ || '';
          }
          
          let publicationDate = '';
          if (medline?.Article?.[0]?.Journal?.[0]?.JournalIssue?.[0]?.PubDate?.[0]?.Year?.[0]) {
            publicationDate = typeof medline.Article[0].Journal[0].JournalIssue[0].PubDate[0].Year[0] === 'string'
              ? medline.Article[0].Journal[0].JournalIssue[0].PubDate[0].Year[0]
              : medline.Article[0].Journal[0].JournalIssue[0].PubDate[0].Year[0]._ || '';
          }
          
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

  async getFullTextContent(pmid: string): Promise<string | null> {
    try {
      const paper = await this.getPaperById(pmid);
      if (!paper) return null;

      let fullText = paper.abstract || '';

      if (paper.doi) {
        try {
          const fullTextResponse = await this.fetchFullTextFromDOI(paper.doi);
          if (fullTextResponse) {
            fullText = fullTextResponse;
          }
        } catch (error) {
          console.warn(`Could not fetch full text from DOI ${paper.doi}:`, error);
        }
      }

      return fullText;
    } catch (error) {
      console.error('Error fetching full text content:', error);
      return null;
    }
  }

  private async fetchFullTextFromDOI(doi: string): Promise<string | null> {
    try {
      const response = await axios.get(`https://doi.org/${doi}`, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ScholarlyResearchMCP/1.0)'
        }
      });

      if (response.data) {
        return this.extractTextFromHTML(response.data);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private extractTextFromHTML(html: string): string {
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return text;
  }

  async extractPaperSections(pmid: string, maxSectionLength: number = 1000): Promise<PaperSection[]> {
    try {
      const fullText = await this.getFullTextContent(pmid);
      if (!fullText) return [];

      const sections: PaperSection[] = [];
      const lines = fullText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

      let currentSection: PaperSection | null = null;
      let currentContent: string[] = [];

      for (const line of lines) {
        if (this.isSectionHeader(line)) {
          if (currentSection) {
            currentSection.content = currentContent.join(' ').substring(0, maxSectionLength);
            sections.push(currentSection);
          }

          currentSection = {
            title: line,
            content: '',
            level: this.getSectionLevel(line)
          };
          currentContent = [];
        } else if (currentSection) {
          currentContent.push(line);
        }
      }

      if (currentSection) {
        currentSection.content = currentContent.join(' ').substring(0, maxSectionLength);
        sections.push(currentSection);
      }

      return sections;
    } catch (error) {
      console.error('Error extracting paper sections:', error);
      return [];
    }
  }

  private isSectionHeader(line: string): boolean {
    const headerPatterns = [
      /^[A-Z][A-Z\s]+$/,
      /^[0-9]+\.\s+[A-Z]/,
      /^[A-Z][a-z]+\s+[A-Z]/,
      /^Abstract$/i,
      /^Introduction$/i,
      /^Methods?$/i,
      /^Results?$/i,
      /^Discussion$/i,
      /^Conclusion$/i,
      /^References?$/i
    ];

    return headerPatterns.some(pattern => pattern.test(line));
  }

  private getSectionLevel(title: string): number {
    if (/^[0-9]+\.\s+/.test(title)) return 2;
    if (/^[A-Z][A-Z\s]+$/.test(title)) return 1;
    return 1;
  }

  async searchWithinPaper(pmid: string, searchTerm: string): Promise<string[]> {
    try {
      const fullText = await this.getFullTextContent(pmid);
      if (!fullText) return [];

      const searchTermLower = searchTerm.toLowerCase();
      const sentences = fullText.split(/[.!?]+/).filter(sentence => 
        sentence.toLowerCase().includes(searchTermLower)
      );

      return sentences
        .map(sentence => sentence.trim())
        .filter(sentence => sentence.length > 20 && sentence.length < 500)
        .slice(0, 10);
    } catch (error) {
      console.error('Error searching within paper:', error);
      return [];
    }
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

          const medline = article.MedlineCitation?.[0];
          const pubmedData = article.PubmedData?.[0];
          
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

          resolve(null);
        });
      });
    } catch (error) {
      console.error('Error fetching citation count:', error);
      return null;
    }
  }
}
