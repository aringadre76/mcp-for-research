const { ArXivAdapter } = require('../dist/adapters/arxiv');

async function testArXivAdapter() {
  console.log('Testing ArXiv Adapter...\n');
  
  const adapter = new ArXivAdapter();
  
  try {
    console.log('1. Testing adapter creation...');
    console.log('✓ ArXiv adapter created successfully');
    
    console.log('\n2. Testing search papers...');
    const searchResults = await adapter.searchPapers({
      query: 'machine learning',
      maxResults: 5,
      startYear: 2023,
      endYear: 2024,
      sortBy: 'relevance'
    });
    
    if (searchResults && searchResults.length > 0) {
      console.log(`✓ Search returned ${searchResults.length} papers`);
      console.log(`  - First paper: ${searchResults[0].title}`);
      console.log(`  - ArXiv ID: ${searchResults[0].id}`);
      console.log(`  - Authors: ${searchResults[0].authors.join(', ')}`);
      console.log(`  - Categories: ${searchResults[0].categories.join(', ')}`);
      console.log(`  - PDF URL: ${searchResults[0].pdfUrl}`);
      console.log(`  - Abstract URL: ${searchResults[0].absUrl}`);
    } else {
      console.log('⚠ Search returned no results (this might be expected)');
    }
    
    console.log('\n3. Testing get paper by ID...');
    if (searchResults && searchResults.length > 0) {
      const paperId = searchResults[0].id;
      const paper = await adapter.getPaperById(paperId);
      
      if (paper) {
        console.log(`✓ Retrieved paper: ${paper.title}`);
        console.log(`  - ArXiv ID: ${paper.id}`);
        console.log(`  - Authors: ${paper.authors.join(', ')}`);
        console.log(`  - Abstract length: ${paper.abstract.length} characters`);
        console.log(`  - Categories: ${paper.categories.join(', ')}`);
      } else {
        console.log('⚠ Failed to retrieve paper by ID');
      }
    } else {
      console.log('⚠ Skipping paper retrieval test (no search results)');
    }
    
    console.log('\n4. Testing related papers...');
    if (searchResults && searchResults.length > 0) {
      const paperId = searchResults[0].id;
      const relatedPapers = await adapter.getRelatedPapers(paperId, 3);
      
      if (relatedPapers && relatedPapers.length > 0) {
        console.log(`✓ Found ${relatedPapers.length} related papers`);
        relatedPapers.forEach((paper, index) => {
          console.log(`  ${index + 1}. ${paper.title} (${paper.id})`);
        });
      } else {
        console.log('⚠ No related papers found');
      }
    } else {
      console.log('⚠ Skipping related papers test (no search results)');
    }
    
    console.log('\n5. Testing PDF download...');
    if (searchResults && searchResults.length > 0) {
      const paperId = searchResults[0].id;
      try {
        const pdfBuffer = await adapter.getPaperPDF(paperId);
        if (pdfBuffer) {
          console.log(`✓ PDF downloaded successfully (${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
        } else {
          console.log('⚠ PDF download returned null');
        }
      } catch (error) {
        console.log(`⚠ PDF download failed: ${error.message}`);
      }
    } else {
      console.log('⚠ Skipping PDF download test (no search results)');
    }
    
    console.log('\n6. Testing advanced search options...');
    const advancedResults = await adapter.searchPapers({
      query: 'deep learning',
      maxResults: 3,
      startYear: 2024,
      endYear: 2024,
      sortBy: 'submittedDate',
      sortOrder: 'descending',
      categories: ['cs.AI', 'cs.LG']
    });
    
    if (advancedResults && advancedResults.length > 0) {
      console.log(`✓ Advanced search returned ${advancedResults.length} papers`);
      console.log(`  - Categories filter applied: ${advancedResults[0].categories.join(', ')}`);
    } else {
      console.log('⚠ Advanced search returned no results');
    }
    
    console.log('\n7. Testing error handling...');
    try {
      await adapter.getPaperById('invalid-id-12345');
      console.log('⚠ Should have thrown error for invalid ID');
    } catch (error) {
      console.log('✓ Error handling works correctly for invalid ID');
    }
    
    console.log('\n8. Testing adapter cleanup...');
    await adapter.close();
    console.log('✓ Adapter closed successfully');
    
    console.log('\n✅ All ArXiv adapter tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    try {
      await adapter.close();
    } catch (closeError) {
      console.error('Failed to close adapter:', closeError.message);
    }
  }
}

if (require.main === module) {
  testArXivAdapter().catch(console.error);
}

module.exports = { testArXivAdapter };
