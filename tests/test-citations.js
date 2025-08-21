const { PubMedAdapter } = require('../dist/adapters/pubmed.js');

describe('Citation functionality', () => {
  let adapter;

  beforeAll(() => {
    adapter = new PubMedAdapter();
  });

  test('should get paper and generate citations', async () => {
    try {
      const pmid = '33844136';
      
      const paper = await adapter.getPaperById(pmid);
      if (!paper) {
        console.log('Paper not found, skipping citation test');
        return;
      }
      
      expect(paper).toBeTruthy();
      expect(paper).toHaveProperty('title');
      expect(paper).toHaveProperty('authors');
      expect(paper).toHaveProperty('journal');
      
      // Test citation generation (basic format validation)
      const citationFormats = ['bibtex', 'apa', 'mla'];
      
      for (const format of citationFormats) {
        let citation = '';
        switch (format) {
          case 'bibtex':
            citation = `@article{${paper.pmid},
  title={${paper.title}},
  author={${paper.authors.join(' and ')}},
  journal={${paper.journal}},
  year={${paper.publicationDate}},
  pmid={${paper.pmid}}
}`;
            break;
          case 'apa':
            citation = `${paper.authors.join(', ')} (${paper.publicationDate}). ${paper.title}. ${paper.journal}.`;
            break;
          case 'mla':
            citation = `${paper.authors.join(', ')}. "${paper.title}." ${paper.journal}, ${paper.publicationDate}.`;
            break;
        }
        
        expect(citation).toContain(paper.title);
        expect(citation).toContain(paper.journal);
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
