const { PubMedAdapter } = require('./dist/adapters/pubmed.js');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const adapter = new PubMedAdapter();

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function interactiveTest() {
  console.log('🔬 Interactive PubMed Adapter Test\n');
  console.log('This will test the PubMed integration with real API calls.\n');

  try {
    // Test 1: Search papers
    console.log('1️⃣ Testing paper search...');
    const query = await askQuestion('Enter search query (e.g., "machine learning"): ');
    const maxResults = await askQuestion('Enter max results (default 5): ') || '5';
    
    console.log(`\n🔍 Searching for: "${query}" (max ${maxResults} results)...`);
    
    const searchResults = await adapter.searchPapers({
      query: query,
      maxResults: parseInt(maxResults)
    });
    
    console.log(`\n✅ Found ${searchResults.length} papers:\n`);
    
    searchResults.forEach((paper, index) => {
      console.log(`${index + 1}. ${paper.title}`);
      console.log(`   Authors: ${paper.authors.join(', ')}`);
      console.log(`   Journal: ${paper.journal}`);
      console.log(`   PMID: ${paper.pmid}`);
      console.log(`   Year: ${paper.publicationDate}`);
      if (paper.doi) console.log(`   DOI: ${paper.doi}`);
      console.log('');
    });

    // Test 2: Get paper details if we found any
    if (searchResults.length > 0) {
      console.log('2️⃣ Testing paper details fetch...');
      const choice = await askQuestion(`Enter paper number (1-${searchResults.length}) to get details: `);
      const paperIndex = parseInt(choice) - 1;
      
      if (paperIndex >= 0 && paperIndex < searchResults.length) {
        const selectedPaper = searchResults[paperIndex];
        console.log(`\n📄 Fetching details for: ${selectedPaper.title}`);
        
        const detailedPaper = await adapter.getPaperById(selectedPaper.pmid);
        if (detailedPaper) {
          console.log('\n📋 Paper Details:');
          console.log(`Title: ${detailedPaper.title}`);
          console.log(`Authors: ${detailedPaper.authors.join(', ')}`);
          console.log(`Journal: ${detailedPaper.journal}`);
          console.log(`Publication Date: ${detailedPaper.publicationDate}`);
          console.log(`PMID: ${detailedPaper.pmid}`);
          if (detailedPaper.doi) console.log(`DOI: ${detailedPaper.doi}`);
          console.log(`\nAbstract:\n${detailedPaper.abstract}`);
        }
      }
    }

    console.log('\n🎉 Interactive test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  interactiveTest();
}
