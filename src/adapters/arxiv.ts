import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';

export interface ArXivPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  categories: string[];
  publicationDate: string;
  lastUpdated: string;
  pdfUrl: string;
  absUrl: string;
  doi?: string;
  journalRef?: string;
  comment?: string;
  mscClass?: string;
  acmClass?: string;
  reportNumber?: string;
}

export interface ArXivSearchOptions {
  query: string;
  maxResults?: number;
  startYear?: number;
  endYear?: number;
  sortBy?: 'relevance' | 'lastUpdatedDate' | 'submittedDate';
  sortOrder?: 'descending' | 'ascending';
  categories?: string[];
}

export class ArXivAdapter {
  private browser: Browser | null = null;
  private isInitialized = false;

  private async initializeBrowser(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize browser: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    return page;
  }

  private buildSearchUrl(options: ArXivSearchOptions): string {
    const { query, maxResults = 20, startYear, endYear, sortBy = 'relevance', sortOrder = 'descending', categories } = options;
    
    let url = `https://arxiv.org/search/?query=${encodeURIComponent(query)}&searchtype=all&source=header`;
    
    if (maxResults) {
      url += `&size=${maxResults}`;
    }
    
    if (startYear || endYear) {
      const currentYear = new Date().getFullYear();
      const start = startYear || 1900;
      const end = endYear || currentYear;
      url += `&date-filter_by=date_range&date-year_from=${start}&date-year_to=${end}`;
    }
    
    if (sortBy === 'lastUpdatedDate') {
      url += '&sortBy=lastUpdatedDate';
    } else if (sortBy === 'submittedDate') {
      url += '&sortBy=submittedDate';
    } else {
      url += '&sortBy=relevance';
    }
    
    if (sortOrder === 'ascending') {
      url += '&sortOrder=ascending';
    } else {
      url += '&sortOrder=descending';
    }
    
    if (categories && categories.length > 0) {
      url += `&classification-physics_archives=all&classification-include_cross_list=include&classification-physics_archives=${categories.join(',')}`;
    }
    
    return url;
  }

  private async searchArXiv(options: ArXivSearchOptions): Promise<string> {
    const url = this.buildSearchUrl(options);
    
    const page = await this.createPage();
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for search results to load - try multiple possible selectors
      try {
        await page.waitForSelector('.arxiv-result', { timeout: 5000 });
      } catch (error) {
        try {
          await page.waitForSelector('.result', { timeout: 5000 });
        } catch (error2) {
          try {
            await page.waitForSelector('[data-testid="result"]', { timeout: 5000 });
          } catch (error3) {
            // If no specific selector works, wait for any content
            await page.waitForSelector('body', { timeout: 5000 });
          }
        }
      }
      
      const html = await page.content();
      return html;
    } finally {
      await page.close();
    }
  }

  private parseSearchResults(html: string, maxResults: number): ArXivPaper[] {
    const $ = cheerio.load(html);
    const papers: ArXivPaper[] = [];
    
    // Try multiple possible selectors for search results
    const selectors = ['.arxiv-result', '.result', '[data-testid="result"]', '.gs_r'];
    let resultsFound = false;
    
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        resultsFound = true;
        
        elements.each((index: number, element: cheerio.Element) => {
          if (index >= maxResults) return false;
          
          const $el = $(element);
          
          // Try multiple possible selectors for title
          let titleElement = $el.find('.title a, h3 a, .gs_rt a, a[href*="/abs/"]').first();
          if (titleElement.length === 0) {
            titleElement = $el.find('a[href*="/abs/"]').first();
          }
          
          const title = titleElement.text().trim();
          const absUrl = titleElement.attr('href') || '';
          let id = '';
          
          if (absUrl.includes('/abs/')) {
            id = absUrl.split('/').pop() || '';
          } else if (absUrl.includes('arxiv.org')) {
            id = absUrl.split('/').pop() || '';
          }
          
          if (!id || !title) return;
          
          // Try multiple possible selectors for authors
          let authors = $el.find('.authors a, .gs_a a, .author a').map((_, author) => $(author).text().trim()).get();
          if (authors.length === 0) {
            authors = $el.find('.gs_a, .author').text().split(',').map(author => author.trim()).filter(author => author.length > 0);
          }
          
          // Try multiple possible selectors for abstract
          let abstract = $el.find('.abstract-full, .abstract, .gs_s, .summary').text().trim();
          if (!abstract) {
            abstract = $el.find('.gs_rs, .description').text().trim();
          }
          
          // Try multiple possible selectors for categories
          let categories = $el.find('.tag-list a, .category a, .subject a').map((_, tag) => $(tag).text().trim()).get();
          if (categories.length === 0) {
            categories = $el.find('.category, .subject').text().split(' ').filter(cat => cat.length > 0);
          }
          
          // Try to extract dates
          let publicationDate = $el.find('.is-mobile-block .has-text-black-bis, .date, .gs_fl').first().text().trim();
          let lastUpdated = $el.find('.is-mobile-block .has-text-black-bis, .date, .gs_fl').last().text().trim();
          
          if (!publicationDate) {
            publicationDate = new Date().toISOString().split('T')[0];
          }
          if (!lastUpdated) {
            lastUpdated = publicationDate;
          }
          
          const pdfUrl = `https://arxiv.org/pdf/${id}.pdf`;
          
          // Try multiple possible selectors for metadata
          let doi = $el.find('.doi a, .doi').text().trim() || undefined;
          let journalRef = $el.find('.journal-ref, .journal').text().trim() || undefined;
          let comment = $el.find('.comment, .note').text().trim() || undefined;
          
          if (doi === '') doi = undefined;
          if (journalRef === '') journalRef = undefined;
          if (comment === '') comment = undefined;
          
          papers.push({
            id,
            title,
            authors,
            abstract,
            categories,
            publicationDate,
            lastUpdated,
            pdfUrl,
            absUrl,
            doi,
            journalRef,
            comment
          });
        });
        
        break;
      }
    }
    
    if (!resultsFound) {
      // If no results found with specific selectors, try to extract any papers from the page
      $('a[href*="/abs/"]').each((index: number, element: cheerio.Element) => {
        if (index >= maxResults) return false;
        
        const $el = $(element);
        const title = $el.text().trim();
        const absUrl = $el.attr('href') || '';
        const id = absUrl.split('/').pop() || '';
        
        if (title && id && title.length > 10) {
          papers.push({
            id,
            title,
            authors: ['Unknown authors'],
            abstract: 'Abstract not available',
            categories: [],
            publicationDate: new Date().toISOString().split('T')[0],
            lastUpdated: new Date().toISOString().split('T')[0],
            pdfUrl: `https://arxiv.org/pdf/${id}.pdf`,
            absUrl,
            doi: undefined,
            journalRef: undefined,
            comment: undefined
          });
        }
      });
    }
    
    return papers;
  }

  async searchPapers(options: ArXivSearchOptions): Promise<ArXivPaper[]> {
    try {
      await this.initializeBrowser();
      const html = await this.searchArXiv(options);
      return this.parseSearchResults(html, options.maxResults || 20);
    } catch (error) {
      throw new Error(`ArXiv search error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPaperById(id: string): Promise<ArXivPaper | null> {
    try {
      await this.initializeBrowser();
      
      const url = `https://arxiv.org/abs/${id}`;
      const page = await this.createPage();
      
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        const html = await page.content();
        const $ = cheerio.load(html);
        
        const title = $('h1.title').text().trim();
        const authors = $('.authors a').map((_, author) => $(author).text().trim()).get();
        const abstract = $('.abstract').text().replace('Abstract:', '').trim();
        const categories = $('.primary-subject').text().trim().split(' ').filter(cat => cat.length > 0);
        
        const publicationDate = $('.dateline').text().trim();
        const lastUpdated = $('.dateline').text().trim();
        
        const pdfUrl = `https://arxiv.org/pdf/${id}.pdf`;
        const absUrl = url;
        
        const doi = $('.doi a').text().trim() || undefined;
        const journalRef = $('.journal-ref').text().trim() || undefined;
        const comment = $('.comment').text().trim() || undefined;
        
        return {
          id,
          title,
          authors,
          abstract,
          categories,
          publicationDate,
          lastUpdated,
          pdfUrl,
          absUrl,
          doi,
          journalRef,
          comment
        };
      } finally {
        await page.close();
      }
    } catch (error) {
      throw new Error(`Failed to fetch paper ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPaperPDF(id: string): Promise<Buffer | null> {
    try {
      const pdfUrl = `https://arxiv.org/pdf/${id}.pdf`;
      const response = await fetch(pdfUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      throw new Error(`Failed to fetch PDF for ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRelatedPapers(id: string, maxResults: number = 10): Promise<ArXivPaper[]> {
    try {
      await this.initializeBrowser();
      
      const url = `https://arxiv.org/abs/${id}`;
      const page = await this.createPage();
      
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        await page.waitForSelector('.related-papers', { timeout: 10000 });
        
        const html = await page.content();
        const $ = cheerio.load(html);
        
        const relatedPapers: ArXivPaper[] = [];
        
        $('.related-papers .paper').each((index: number, element: cheerio.Element) => {
          if (index >= maxResults) return false;
          
          const $el = $(element);
          const title = $el.find('.title').text().trim();
          const authors = $el.find('.authors').text().trim().split(',').map(author => author.trim());
          const relatedId = $el.find('a').attr('href')?.split('/').pop() || '';
          
          if (relatedId) {
            relatedPapers.push({
              id: relatedId,
              title,
              authors,
              abstract: '',
              categories: [],
              publicationDate: '',
              lastUpdated: '',
              pdfUrl: `https://arxiv.org/pdf/${relatedId}.pdf`,
              absUrl: `https://arxiv.org/abs/${relatedId}`
            });
          }
        });
        
        return relatedPapers;
      } finally {
        await page.close();
      }
    } catch (error) {
      throw new Error(`Failed to fetch related papers for ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isInitialized = false;
    }
  }
}
