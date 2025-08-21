const { PubMedAdapter } = require('../dist/adapters/pubmed');

describe('Enhanced PubMed functionality', () => {
  let adapter;

  beforeAll(() => {
    adapter = new PubMedAdapter();
  });

  test('should search for papers with DOIs', async () => {
    try {
      const papers = await adapter.searchPapers({ 
        query: 'machine learning review', 
        maxResults: 3 
      });
      
      expect(Array.isArray(papers)).toBe(true);
      
      if (papers.length > 0) {
        const paperWithDoi = papers.find(p => p.doi);
        
        if (paperWithDoi) {
          expect(paperWithDoi).toHaveProperty('title');
          expect(paperWithDoi).toHaveProperty('pmid');
          expect(paperWithDoi).toHaveProperty('doi');
          expect(paperWithDoi.doi).toBeTruthy();
          
          // Test additional functionality if available
          if (adapter.getFullTextContent) {
            const fullText = await adapter.getFullTextContent(paperWithDoi.pmid);
            // Full text may or may not be available
          }
          
          if (adapter.extractPaperSections) {
            const sections = await adapter.extractPaperSections(paperWithDoi.pmid, 800);
            expect(Array.isArray(sections)).toBe(true);
          }
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
