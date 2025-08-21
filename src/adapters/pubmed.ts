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
  pmcid?: string;
  pmcFullTextUrl?: string;
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
  private pmcBaseUrl = 'https://www.ncbi.nlm.nih.gov/pmc';
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
          let pmcid: string | undefined = undefined;
          if (pubmedData?.ArticleIdList?.[0]?.ArticleId) {
            const articleIds = pubmedData.ArticleIdList[0].ArticleId;
            if (Array.isArray(articleIds)) {
              const doiId = articleIds.find((id: any) => id.$.IdType === 'doi');
              if (doiId) {
                doi = typeof doiId === 'string' ? doiId : doiId._ || '';
              }
              
              const pmcId = articleIds.find((id: any) => id.$.IdType === 'pmc');
              if (pmcId) {
                pmcid = typeof pmcId === 'string' ? pmcId : pmcId._ || '';
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
            doi,
            pmcid
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

  async getFullTextContent(pmid: string, pmcid?: string): Promise<string | null> {
    try {
      const paper = await this.getPaperById(pmid);
      if (!paper) return null;

      let fullText = paper.abstract || '';
      
      // Use provided pmcid or paper.pmcid
      const targetPmcid = pmcid || paper.pmcid;

      // Try PMC first if available (most reliable for full text)
      if (targetPmcid) {
        try {
          console.log(`Attempting to fetch full text from PMC: ${targetPmcid}`);
          const pmcText = await this.fetchFullTextFromPMC(targetPmcid);
          if (pmcText && pmcText.length > fullText.length) {
            console.log(`✅ Successfully fetched ${pmcText.length} characters from PMC`);
            return pmcText;
          } else {
            console.log(`PMC text length: ${pmcText ? pmcText.length : 0}, not longer than abstract`);
          }
        } catch (error) {
          console.warn(`Could not fetch full text from PMC ${targetPmcid}:`, error);
        }
      } else {
        console.log(`No PMC ID found for paper: ${paper.pmid}`);
      }

      // Try DOI as fallback
      if (paper.doi) {
        try {
          console.log(`Attempting to fetch full text from DOI: ${paper.doi}`);
          const doiText = await this.fetchFullTextFromDOI(paper.doi);
          if (doiText && doiText.length > fullText.length) {
            console.log(`✅ Successfully fetched ${doiText.length} characters from DOI`);
            return doiText;
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

  private async fetchFullTextFromPMC(pmcid: string): Promise<string | null> {
    try {
      // Remove "PMC" prefix if present
      const cleanPmcid = pmcid.replace(/^PMC/, '');
      
      console.log(`Trying multiple PMC access methods for PMC${cleanPmcid}...`);
      
      // Method 1: Try the PMC article page
      try {
        const pmcUrl = `${this.pmcBaseUrl}/articles/PMC${cleanPmcid}/`;
        console.log(`Method 1: Fetching from PMC article page: ${pmcUrl}`);
        
        const response = await axios.get(pmcUrl, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ScholarlyResearchMCP/1.0)'
          }
        });

        if (response.data) {
          const extractedText = this.extractTextFromPMC(response.data);
          if (extractedText && extractedText.length > 1000) {
            console.log(`✅ Method 1 successful: ${extractedText.length} characters`);
            return extractedText;
          }
        }
              } catch (error) {
          console.log(`Method 1 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

      // Method 2: Try the PMC API
      try {
        const apiUrl = `${this.pmcBaseUrl}/utils/oa/oa.fcgi?id=PMC${cleanPmcid}`;
        console.log(`Method 2: Trying PMC API: ${apiUrl}`);
        
        const response = await axios.get(apiUrl, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ScholarlyResearchMCP/1.0)'
          }
        });

        if (response.data) {
          const extractedText = this.extractTextFromPMC(response.data);
          if (extractedText && extractedText.length > 1000) {
            console.log(`✅ Method 2 successful: ${extractedText.length} characters`);
            return extractedText;
          }
        }
              } catch (error) {
          console.log(`Method 2 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

      // Method 3: Try the PMC full text endpoint
      try {
        const fullTextUrl = `${this.pmcBaseUrl}/articles/PMC${cleanPmcid}/pdf/`;
        console.log(`Method 3: Trying PMC full text endpoint: ${fullTextUrl}`);
        
        const response = await axios.get(fullTextUrl, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ScholarlyResearchMCP/1.0)'
          }
        });

        if (response.data) {
          const extractedText = this.extractTextFromPMC(response.data);
          if (extractedText && extractedText.length > 1000) {
            console.log(`✅ Method 3 successful: ${extractedText.length} characters`);
            return extractedText;
          }
        }
              } catch (error) {
          console.log(`Method 3 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

      // Method 4: Try the PMC XML endpoint
      try {
        const xmlUrl = `${this.pmcBaseUrl}/articles/PMC${cleanPmcid}/xml/`;
        console.log(`Method 4: Trying PMC XML endpoint: ${xmlUrl}`);
        
        const response = await axios.get(xmlUrl, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ScholarlyResearchMCP/1.0)'
          }
        });

        if (response.data) {
          const extractedText = this.extractTextFromPMC(response.data);
          if (extractedText && extractedText.length > 1000) {
            console.log(`✅ Method 4 successful: ${extractedText.length} characters`);
            return extractedText;
          }
        }
              } catch (error) {
          console.log(`Method 4 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

      console.log(`❌ All PMC methods failed for PMC${cleanPmcid}`);
      return null;
    } catch (error) {
      console.warn(`PMC fetch failed for ${pmcid}:`, error);
      return null;
    }
  }

  private async fetchFromPMCApi(pmcid: string): Promise<string | null> {
    try {
      const apiUrl = `${this.pmcBaseUrl}/utils/oa/oa.fcgi?id=PMC${pmcid}`;
      console.log(`Trying PMC API: ${apiUrl}`);
      
      const response = await axios.get(apiUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ScholarlyResearchMCP/1.0)'
        }
      });

      if (response.data) {
        return this.extractTextFromPMC(response.data);
      }
      return null;
    } catch (error) {
      console.warn(`PMC API fetch failed:`, error);
      return null;
    }
  }

  private extractTextFromPMC(html: string): string {
    // Extract text from PMC HTML, focusing on article content
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');

    // Try multiple content extraction strategies
    let extractedText = '';

    // Strategy 1: Look for article tag
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      extractedText = articleMatch[1];
    }

    // Strategy 2: Look for main content area
    if (!extractedText || extractedText.length < 1000) {
      const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
      if (mainMatch) {
        extractedText = mainMatch[1];
      }
    }

    // Strategy 3: Look for specific PMC content divs
    if (!extractedText || extractedText.length < 1000) {
      const contentMatch = html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      if (contentMatch) {
        extractedText = contentMatch[1];
      }
    }

    // Strategy 4: Look for abstract and body content
    if (!extractedText || extractedText.length < 1000) {
      const abstractMatch = html.match(/<div[^>]*class="[^"]*abstract[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      const bodyMatch = html.match(/<div[^>]*class="[^"]*body[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      
      if (abstractMatch) {
        extractedText = abstractMatch[1];
      }
      if (bodyMatch) {
        extractedText += ' ' + bodyMatch[1];
      }
    }

    // Strategy 5: Fallback to extracting from specific PMC sections
    if (!extractedText || extractedText.length < 1000) {
      const sections = ['abstract', 'introduction', 'methods', 'results', 'discussion', 'conclusion'];
      const sectionTexts: string[] = [];
      
      sections.forEach(section => {
        const sectionMatch = html.match(new RegExp(`<div[^>]*class="[^"]*${section}[^"]*"[^>]*>([\\s\\S]*?)<\\/div>`, 'i'));
        if (sectionMatch) {
          sectionTexts.push(sectionMatch[1]);
        }
      });
      
      if (sectionTexts.length > 0) {
        extractedText = sectionTexts.join(' ');
      }
    }

    // If no specific content found, use the cleaned HTML
    if (!extractedText || extractedText.length < 1000) {
      extractedText = html;
    }

    // Clean up the extracted text
    text = extractedText
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\\n/g, ' ')
      .replace(/\\t/g, ' ')
      .trim();

    return text;
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

  async extractPaperSections(pmid: string, maxSectionLength: number = 1000, pmcid?: string): Promise<PaperSection[]> {
    try {
      const fullText = await this.getFullTextContent(pmid, pmcid);
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

  async searchWithinPaper(pmid: string, searchTerm: string, pmcid?: string): Promise<string[]> {
    try {
      const fullText = await this.getFullTextContent(pmid, pmcid);
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

  async getPaperByPMCID(pmcid: string): Promise<PubMedPaper | null> {
    try {
      // Remove "PMC" prefix if present
      const cleanPmcid = pmcid.replace(/^PMC/, '');
      
      // Search for papers with this PMC ID
      const searchParams = {
        db: 'pmc',
        term: `PMC${cleanPmcid}`,
        retmax: '1'
      };

      const searchResponse = await this.makeRequest('esearch.fcgi', searchParams);
      
      return new Promise((resolve, reject) => {
        parseString(searchResponse, (err, result) => {
          if (err) {
            reject(new Error(`Failed to parse PMC search response: ${err.message}`));
            return;
          }

          const idList = result.eSearchResult?.IdList?.[0]?.Id || [];
          if (idList.length === 0) {
            resolve(null);
            return;
          }

          // Get the paper details
          this.fetchPapersByIds(idList).then(papers => {
            if (papers.length > 0) {
              const paper = papers[0];
              // Ensure pmcid is properly set
              paper.pmcid = pmcid;
              paper.pmcFullTextUrl = `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${cleanPmcid}/`;
              console.log(`Paper found with PMC ID: ${paper.pmcid}`);
              resolve(paper);
            } else {
              resolve(null);
            }
          }).catch(reject);
        });
      });
    } catch (error) {
      console.error('Error fetching paper by PMC ID:', error);
      return null;
    }
  }
}
