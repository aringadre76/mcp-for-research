const { GoogleScholarAdapter } = require('../dist/adapters/google-scholar');

async function testGoogleScholar() {
  console.log('Testing Google Scholar Adapter...\n');
  
  const adapter = new GoogleScholarAdapter();
  
  try {
    console.log('1. Testing paper search...');
    const searchResults = await adapter.searchPapers({
      query: 'machine learning',
      maxResults: 5,
      sortBy: 'relevance'
    });
    
    console.log(`Found ${searchResults.length} papers:`);
    searchResults.forEach((paper, index) => {
      console.log(`\n${index + 1}. ${paper.title}`);
      console.log(`   Authors: ${paper.authors.join(', ')}`);
      console.log(`   Journal: ${paper.journal}`);
      console.log(`   Date: ${paper.publicationDate}`);
      console.log(`   Citations: ${paper.citations}`);
      console.log(`   URL: ${paper.url}`);
      if (paper.pdfUrl) {
        console.log(`   PDF: ${paper.pdfUrl}`);
      }
    });
    
    if (searchResults.length > 0) {
      console.log('\n2. Testing citation count...');
      const firstPaper = searchResults[0];
      const citationCount = await adapter.getCitationCount(firstPaper.title);
      console.log(`Citation count for "${firstPaper.title}": ${citationCount || 'Not available'}`);
      
      console.log('\n3. Testing related papers...');
      const relatedPapers = await adapter.getRelatedPapers(firstPaper.title, 3);
      console.log(`Found ${relatedPapers.length} related papers`);
      relatedPapers.forEach((paper, index) => {
        console.log(`   ${index + 1}. ${paper.title}`);
      });
    }
    
    console.log('\n4. Testing paper details...');
    if (searchResults.length > 0) {
      const paperDetails = await adapter.getPaperDetails(searchResults[0].url);
      if (paperDetails) {
        console.log(`Paper details retrieved: ${paperDetails.title}`);
      } else {
        console.log('Could not retrieve paper details');
      }
    }
    
  } catch (error) {
    console.error('Error during testing:', error.message);
  } finally {
    await adapter.close();
    console.log('\nTest completed.');
  }
}

if (require.main === module) {
  testGoogleScholar().catch(console.error);
}

module.exports = { testGoogleScholar };
