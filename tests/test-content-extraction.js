const { PubMedAdapter } = require('../dist/adapters/pubmed');

async function testContentExtraction() {
  console.log('🧪 Testing Enhanced PubMed Content Extraction...\n');

  const pubmed = new PubMedAdapter();

  try {
    const testPmid = '12345678';
    
    console.log('1. Testing Full Text Extraction...');
    const fullText = await pubmed.getFullTextContent(testPmid);
    if (fullText) {
      console.log(`✅ Full text retrieved (${fullText.length} characters)`);
      console.log(`Preview: ${fullText.substring(0, 200)}...\n`);
    } else {
      console.log('⚠️  Full text not available (this is normal for many papers)\n');
    }

    console.log('2. Testing Section Extraction...');
    const sections = await pubmed.extractPaperSections(testPmid, 800);
    if (sections.length > 0) {
      console.log(`✅ Extracted ${sections.length} sections:`);
      sections.forEach((section, index) => {
        console.log(`   ${index + 1}. ${section.title} (${section.content.length} chars)`);
      });
      console.log('');
    } else {
      console.log('⚠️  No sections extracted (paper may not have full text)\n');
    }

    console.log('3. Testing Content Search...');
    const searchResults = await pubmed.searchWithinPaper(testPmid, 'research');
    if (searchResults.length > 0) {
      console.log(`✅ Found ${searchResults.length} matching sentences`);
      console.log(`First result: ${searchResults[0].substring(0, 100)}...\n`);
    } else {
      console.log('⚠️  No search results (paper may not have searchable content)\n');
    }

    console.log('4. Testing with a Real PubMed ID...');
    console.log('Searching for papers about "machine learning"...');
    
    const papers = await pubmed.searchPapers({ query: 'machine learning', maxResults: 1 });
    if (papers.length > 0) {
      const realPmid = papers[0].pmid;
      console.log(`✅ Found paper: ${papers[0].title}`);
      console.log(`PMID: ${realPmid}\n`);

      console.log('5. Testing Section Extraction on Real Paper...');
      const realSections = await pubmed.extractPaperSections(realPmid, 500);
      if (realSections.length > 0) {
        console.log(`✅ Extracted ${realSections.length} sections from real paper:`);
        realSections.forEach((section, index) => {
          console.log(`   ${index + 1}. ${section.title}`);
        });
      } else {
        console.log('⚠️  No sections extracted (paper may not have full text access)');
      }
    }

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

testContentExtraction();
