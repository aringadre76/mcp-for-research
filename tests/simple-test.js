const { PubMedAdapter } = require('../dist/adapters/pubmed');

describe('Simple PubMed functionality', () => {
  let adapter;

  beforeAll(() => {
    adapter = new PubMedAdapter();
  });

  test('should perform basic operations', async () => {
    try {
      const papers = await adapter.searchPapers({ query: 'machine learning', maxResults: 1 });
      
      expect(Array.isArray(papers)).toBe(true);
      
      if (papers.length > 0) {
        const paper = papers[0];
        expect(paper).toHaveProperty('title');
        expect(paper).toHaveProperty('pmid');
        expect(paper).toHaveProperty('abstract');
        
        // Test getting full content (may or may not be available)
        if (adapter.getFullTextContent) {
          const fullText = await adapter.getFullTextContent(paper.pmid);
          // No assertion needed - this may legitimately be null
        }
        
        // Test section extraction if method exists
        if (adapter.extractPaperSections) {
          const sections = await adapter.extractPaperSections(paper.pmid, 500);
          expect(Array.isArray(sections)).toBe(true);
        }
        
        // Test search within paper if method exists
        if (adapter.searchWithinPaper) {
          const searchResults = await adapter.searchWithinPaper(paper.pmid, 'learning');
          expect(Array.isArray(searchResults)).toBe(true);
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
