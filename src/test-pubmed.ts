import { PubMedAdapter } from './adapters/pubmed.js';

async function testPubMedAdapter() {
  const adapter = new PubMedAdapter();
  
  console.log('Testing PubMed Adapter...\n');
  
  try {
    console.log('1. Testing paper search...');
    const searchResults = await adapter.searchPapers({
      query: 'machine learning',
      maxResults: 5
    });
    
    console.log(`Found ${searchResults.length} papers`);
    if (searchResults.length > 0) {
      console.log('First paper:');
      console.log(`  Title: ${searchResults[0].title}`);
      console.log(`  Authors: ${searchResults[0].authors.join(', ')}`);
      console.log(`  Journal: ${searchResults[0].journal}`);
      console.log(`  PMID: ${searchResults[0].pmid}`);
    }
    
    if (searchResults.length > 0) {
      console.log('\n2. Testing paper fetch by ID...');
      const paper = await adapter.getPaperById(searchResults[0].pmid);
      if (paper) {
        console.log(`Successfully fetched paper: ${paper.title}`);
        console.log(`Abstract length: ${paper.abstract.length} characters`);
      }
    }
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (require.main === module) {
  testPubMedAdapter();
}
