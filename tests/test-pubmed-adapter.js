const { PubMedAdapter } = require('../dist/adapters/pubmed.js');

describe('PubMedAdapter', () => {
  let adapter;

  beforeAll(() => {
    adapter = new PubMedAdapter();
  });

  test('should search for papers', async () => {
    try {
      const searchResults = await adapter.searchPapers({
        query: 'machine learning',
        maxResults: 3
      });
      
      expect(Array.isArray(searchResults)).toBe(true);
      expect(searchResults.length).toBeGreaterThanOrEqual(0);
      
      if (searchResults.length > 0) {
        const firstPaper = searchResults[0];
        expect(firstPaper).toHaveProperty('title');
        expect(firstPaper).toHaveProperty('authors');
        expect(firstPaper).toHaveProperty('journal');
        expect(firstPaper).toHaveProperty('pmid');
      }
    } catch (error) {
      if (error.message && error.message.includes('429')) {
        console.log('Skipping test due to PubMed API rate limiting');
        return;
      }
      throw error;
    }
  }, 30000);

  test('should fetch paper by ID', async () => {
    try {
      const searchResults = await adapter.searchPapers({
        query: 'machine learning',
        maxResults: 1
      });
      
      if (searchResults.length > 0) {
        const paper = await adapter.getPaperById(searchResults[0].pmid);
        expect(paper).toBeTruthy();
        expect(paper).toHaveProperty('title');
        expect(paper).toHaveProperty('abstract');
      }
    } catch (error) {
      if (error.message && error.message.includes('429')) {
        console.log('Skipping test due to PubMed API rate limiting');
        return;
      }
      throw error;
    }
  }, 30000);
});
