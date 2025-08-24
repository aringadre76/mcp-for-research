import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';

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

export class GoogleScholarAdapter {
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
    
    const page = await this.createPage();
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      await page.waitForSelector('.gs_r', { timeout: 10000 });
      
      const html = await page.content();
      return html;
    } finally {
      await page.close();
    }
  }

  private parseSearchResults(html: string, maxResults: number): GoogleScholarPaper[] {
    const $ = cheerio.load(html);
    const papers: GoogleScholarPaper[] = [];
    
    $('.gs_r').each((index: number, element: cheerio.Element) => {
      if (index >= maxResults) return false;
      
      const $element = $(element);
      
      const titleElement = $element.find('.gs_rt a');
      const title = titleElement.text().trim();
      const url = titleElement.attr('href') || '';
      
      const authorsElement = $element.find('.gs_a');
      const authorsText = authorsElement.text();
      const authors = this.extractAuthors(authorsText);
      
      const journal = this.extractJournal(authorsText);
      const publicationDate = this.extractPublicationDate(authorsText);
      
      const abstractElement = $element.find('.gs_rs');
      const abstract = abstractElement.text().trim();
      
      const citationsElement = $element.find('.gs_fl a');
      let citations = 0;
      citationsElement.each((i: number, el: cheerio.Element) => {
        const text = $(el).text();
        if (text.includes('Cited by')) {
          const match = text.match(/Cited by (\d+)/);
          if (match) citations = parseInt(match[1]);
        }
      });
      
      const pdfElement = $element.find('.gs_or_ggsm a');
      const pdfUrl = pdfElement.attr('href') || undefined;
      
      if (title) {
        papers.push({
          title,
          authors,
          journal,
          publicationDate,
          abstract,
          citations,
          url,
          pdfUrl
        });
      }
    });
    
    return papers;
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

  async searchPapers(options: GoogleScholarSearchOptions): Promise<GoogleScholarPaper[]> {
    try {
      await this.initializeBrowser();
      const html = await this.searchGoogleScholar(options);
      return this.parseSearchResults(html, options.maxResults || 20);
    } catch (error) {
      throw new Error(`Failed to search Google Scholar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPaperDetails(url: string): Promise<GoogleScholarPaper | null> {
    try {
      await this.initializeBrowser();
      const page = await this.createPage();
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      const html = await page.content();
      const $ = cheerio.load(html);
      
      const title = $('h1, .title, h2').first().text().trim();
      const authors = $('.authors, .author, .byline').text().split(',').map((author: string) => author.trim());
      const abstract = $('.abstract, .summary, .description').text().trim();
      
      if (!title) {
        return null;
      }
      
      return {
        title,
        authors: authors.filter((author: string) => author.length > 0),
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
    try {
      await this.initializeBrowser();
      const page = await this.createPage();
      
      const searchUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(title)}&hl=en&as_sdt=0,5`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      await page.waitForSelector('.gs_r', { timeout: 10000 });
      
      const citationText = await page.$eval('.gs_fl a', (el) => {
        const text = el.textContent || '';
        const match = text.match(/Cited by (\d+)/);
        return match ? match[1] : null;
      }).catch(() => null);
      
      if (citationText) {
        return parseInt(citationText);
      }
      
      return null;
    } catch (error) {
      throw new Error(`Failed to get citation count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRelatedPapers(title: string, maxResults: number = 10): Promise<GoogleScholarPaper[]> {
    try {
      await this.initializeBrowser();
      const page = await this.createPage();
      
      const searchUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(title)}&hl=en&as_sdt=0,5`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      await page.waitForSelector('.gs_r', { timeout: 10000 });
      
      const html = await page.content();
      return this.parseSearchResults(html, maxResults);
    } catch (error) {
      throw new Error(`Failed to get related papers: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
