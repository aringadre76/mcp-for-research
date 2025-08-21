const { PubMedAdapter } = require('../dist/adapters/pubmed');

describe('PubMed Content Extraction', () => {
  let pubmed;

  beforeAll(() => {
    pubmed = new PubMedAdapter();
  });

  test('should handle fake PMID gracefully', async () => {
    const testPmid = '12345678'; // Fake PMID
    
    // Test full text extraction
    const fullText = await pubmed.getFullTextContent(testPmid);
    expect(fullText).toBeDefined();
    
    // Test section extraction
    const sections = await pubmed.extractPaperSections(testPmid, 800);
    expect(Array.isArray(sections)).toBe(true);
    
    // Test content search
    const searchResults = await pubmed.searchWithinPaper(testPmid, 'research');
    expect(Array.isArray(searchResults)).toBe(true);
  }, 30000);

  test('should work with real PubMed search', async () => {
    try {
      const papers = await pubmed.searchPapers({ query: 'machine learning', maxResults: 1 });
      if (papers.length > 0) {
        const realPmid = papers[0].pmid;
        expect(realPmid).toBeDefined();
        expect(papers[0].title).toBeDefined();
      }
    } catch (error) {
      // Don't fail test for API rate limiting
      if (error.message && error.message.includes('429')) {
        console.log('Skipping test due to PubMed API rate limiting');
        return;
      }
      throw error;
    }
  }, 30000);
});
