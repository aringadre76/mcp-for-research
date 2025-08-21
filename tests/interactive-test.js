const { PubMedAdapter } = require('../dist/adapters/pubmed.js');

describe('Interactive test simulation', () => {
  let adapter;

  beforeAll(() => {
    adapter = new PubMedAdapter();
  });

  test('should simulate interactive functionality', async () => {
    try {
      // Simulate an interactive test with predefined inputs
      const query = 'machine learning';
      const maxResults = 2;
      
      const searchResults = await adapter.searchPapers({
        query: query,
        maxResults: maxResults
      });
      
      expect(Array.isArray(searchResults)).toBe(true);
      expect(searchResults.length).toBeGreaterThanOrEqual(0);
      
      if (searchResults.length > 0) {
        const selectedPaper = searchResults[0];
        expect(selectedPaper).toHaveProperty('title');
        expect(selectedPaper).toHaveProperty('pmid');
        
        const detailedPaper = await adapter.getPaperById(selectedPaper.pmid);
        if (detailedPaper) {
          expect(detailedPaper).toHaveProperty('title');
          expect(detailedPaper).toHaveProperty('abstract');
        }
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
