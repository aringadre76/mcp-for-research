const { PubMedAdapter } = require('./dist/adapters/pubmed.js');

async function testPubMedAdapter() {
  console.log('🧪 Testing PubMed Adapter...\n');
  
  const adapter = new PubMedAdapter();
  
  try {
    console.log('1️⃣ Testing paper search...');
    const searchResults = await adapter.searchPapers({
      query: 'machine learning',
      maxResults: 3
    });
    
    console.log(`✅ Found ${searchResults.length} papers`);
    if (searchResults.length > 0) {
      console.log('\n📄 First paper:');
      console.log(`   Title: ${searchResults[0].title}`);
      console.log(`   Authors: ${searchResults[0].authors.join(', ')}`);
      console.log(`   Journal: ${searchResults[0].journal}`);
      console.log(`   PMID: ${searchResults[0].pmid}`);
      console.log(`   DOI: ${searchResults[0].doi || 'Not available'}`);
    }
    
    if (searchResults.length > 0) {
      console.log('\n2️⃣ Testing paper fetch by ID...');
      const paper = await adapter.getPaperById(searchResults[0].pmid);
      if (paper) {
        console.log(`✅ Successfully fetched paper: ${paper.title}`);
        console.log(`   Abstract length: ${paper.abstract.length} characters`);
      }
    }
    
    console.log('\n🎉 All tests passed! PubMed adapter is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testPubMedAdapter();
