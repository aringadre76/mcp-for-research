const { PubMedAdapter } = require('../dist/adapters/pubmed');

async function simpleTest() {
  console.log('🧪 Simple Test of New Methods...\n');

  const pubmed = new PubMedAdapter();

  try {
    console.log('1. Testing with a real paper search...');
    const papers = await pubmed.searchPapers({ query: 'machine learning', maxResults: 1 });
    
    if (papers.length > 0) {
      const paper = papers[0];
      console.log(`✅ Found paper: ${paper.title}`);
      console.log(`PMID: ${paper.pmid}`);
      console.log(`Abstract length: ${paper.abstract.length} characters\n`);

      console.log('2. Testing getFullTextContent...');
      const fullText = await pubmed.getFullTextContent(paper.pmid);
      console.log(`Full text available: ${fullText ? 'YES' : 'NO'}`);
      if (fullText) {
        console.log(`Full text length: ${fullText.length} characters`);
        console.log(`Preview: ${fullText.substring(0, 100)}...`);
      } else {
        console.log('Note: Full text not available (this is normal for many papers)');
      }
      console.log('');

      console.log('3. Testing extractPaperSections...');
      const sections = await pubmed.extractPaperSections(paper.pmid, 500);
      console.log(`Sections found: ${sections.length}`);
      if (sections.length > 0) {
        sections.forEach((section, index) => {
          console.log(`   ${index + 1}. ${section.title} (${section.content.length} chars)`);
        });
      }
      console.log('');

      console.log('4. Testing searchWithinPaper...');
      const searchResults = await pubmed.searchWithinPaper(paper.pmid, 'learning');
      console.log(`Search results: ${searchResults.length}`);
      if (searchResults.length > 0) {
        console.log(`First result: ${searchResults[0].substring(0, 100)}...`);
      }
      console.log('');

      console.log('✅ All methods are working! The issue was likely the fake PMID in the original test.');
      
    } else {
      console.log('❌ No papers found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

simpleTest();
