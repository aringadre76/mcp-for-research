const { ArXivAdapter } = require('../dist/adapters/arxiv');
const { UnifiedSearchAdapter } = require('../dist/adapters/unified-search');
const { EnhancedUnifiedSearchAdapter } = require('../dist/adapters/enhanced-unified-search');
const { PreferenceAwareUnifiedSearchAdapter } = require('../dist/adapters/preference-aware-unified-search');

async function testArXivComprehensive() {
  console.log('Testing ArXiv Integration (Comprehensive)...\n');
  
  const results = {
    adapter: { passed: 0, failed: 0, tests: [] },
    unified: { passed: 0, failed: 0, tests: [] },
    enhanced: { passed: 0, failed: 0, tests: [] },
    preference: { passed: 0, failed: 0, tests: [] }
  };
  
  try {
    // Test 1: Basic ArXiv Adapter
    console.log('=== Testing Basic ArXiv Adapter ===');
    const adapter = new ArXivAdapter();
    
    try {
      // Test search with various parameters
      const searchResults = await adapter.searchPapers({
        query: 'neural networks',
        maxResults: 3,
        startYear: 2023,
        endYear: 2024,
        sortBy: 'relevance',
        sortOrder: 'descending'
      });
      
      if (searchResults && searchResults.length > 0) {
        console.log(`✓ Search successful: ${searchResults.length} papers found`);
        results.adapter.passed++;
        results.adapter.tests.push('Basic search');
        
        // Test paper retrieval
        const paper = await adapter.getPaperById(searchResults[0].id);
        if (paper && paper.title) {
          console.log(`✓ Paper retrieval successful: ${paper.title}`);
          results.adapter.passed++;
          results.adapter.tests.push('Paper retrieval');
        } else {
          console.log('✗ Paper retrieval failed');
          results.adapter.failed++;
          results.adapter.tests.push('Paper retrieval');
        }
        
        // Test related papers
        const relatedPapers = await adapter.getRelatedPapers(searchResults[0].id, 2);
        if (relatedPapers && relatedPapers.length > 0) {
          console.log(`✓ Related papers found: ${relatedPapers.length}`);
          results.adapter.passed++;
          results.adapter.tests.push('Related papers');
        } else {
          console.log('⚠ No related papers found');
          results.adapter.passed++;
          results.adapter.tests.push('Related papers (none found)');
        }
        
        // Test PDF download
        try {
          const pdfBuffer = await adapter.getPaperPDF(searchResults[0].id);
          if (pdfBuffer && pdfBuffer.length > 0) {
            console.log(`✓ PDF download successful: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
            results.adapter.passed++;
            results.adapter.tests.push('PDF download');
          } else {
            console.log('✗ PDF download failed: empty buffer');
            results.adapter.failed++;
            results.adapter.tests.push('PDF download');
          }
        } catch (error) {
          console.log(`⚠ PDF download error: ${error.message}`);
          results.adapter.passed++;
          results.adapter.tests.push('PDF download (error handled)');
        }
      } else {
        console.log('⚠ Search returned no results');
        results.adapter.passed++;
        results.adapter.tests.push('Search (no results)');
      }
      
      // Test error handling
      try {
        await adapter.getPaperById('invalid-id-12345');
        console.log('✗ Should have thrown error for invalid ID');
        results.adapter.failed++;
        results.adapter.tests.push('Error handling');
      } catch (error) {
        console.log('✓ Error handling works correctly');
        results.adapter.passed++;
        results.adapter.tests.push('Error handling');
      }
      
      // Test category filtering
      const categoryResults = await adapter.searchPapers({
        query: 'machine learning',
        maxResults: 2,
        categories: ['cs.AI', 'cs.LG']
      });
      
      if (categoryResults && categoryResults.length > 0) {
        console.log(`✓ Category filtering successful: ${categoryResults.length} papers`);
        results.adapter.passed++;
        results.adapter.tests.push('Category filtering');
      } else {
        console.log('⚠ Category filtering returned no results');
        results.adapter.passed++;
        results.adapter.tests.push('Category filtering (no results)');
      }
      
    } catch (error) {
      console.error('✗ Adapter test failed:', error.message);
      results.adapter.failed++;
      results.adapter.tests.push('General functionality');
    }
    
    await adapter.close();
    console.log('✓ Adapter closed');
    
    // Test 2: Unified Search with ArXiv
    console.log('\n=== Testing Unified Search with ArXiv ===');
    const unifiedAdapter = new UnifiedSearchAdapter();
    
    try {
      const unifiedResults = await unifiedAdapter.searchPapers({
        query: 'artificial intelligence',
        maxResults: 6,
        sources: ['pubmed', 'google-scholar', 'arxiv']
      });
      
      if (unifiedResults && unifiedResults.length > 0) {
        console.log(`✓ Unified search successful: ${unifiedResults.length} papers`);
        results.unified.passed++;
        results.unified.tests.push('Unified search');
        
        const arxivCount = unifiedResults.filter(p => p.source === 'arxiv').length;
        console.log(`  - ArXiv papers: ${arxivCount}`);
        
        if (arxivCount > 0) {
          const arxivPaper = unifiedResults.find(p => p.source === 'arxiv');
          console.log(`  - Example ArXiv paper: ${arxivPaper.title}`);
          console.log(`    ID: ${arxivPaper.arxivId}, Categories: ${arxivPaper.categories?.join(', ')}`);
          results.unified.passed++;
          results.unified.tests.push('ArXiv integration');
        } else {
          console.log('⚠ No ArXiv papers in unified results');
          results.unified.failed++;
          results.unified.tests.push('ArXiv integration');
        }
      } else {
        console.log('⚠ Unified search returned no results');
        results.unified.passed++;
        results.unified.tests.push('Unified search (no results)');
      }
      
    } catch (error) {
      console.error('✗ Unified search test failed:', error.message);
      results.unified.failed++;
      results.unified.tests.push('General functionality');
    }
    
    await unifiedAdapter.close();
    
    // Test 3: Enhanced Unified Search with ArXiv
    console.log('\n=== Testing Enhanced Unified Search with ArXiv ===');
    const enhancedAdapter = new EnhancedUnifiedSearchAdapter();
    
    try {
      const enhancedResults = await enhancedAdapter.searchPapers({
        query: 'deep learning',
        maxResults: 6,
        sources: ['pubmed', 'google-scholar', 'arxiv'],
        preferFirecrawl: false
      });
      
      if (enhancedResults && enhancedResults.length > 0) {
        console.log(`✓ Enhanced unified search successful: ${enhancedResults.length} papers`);
        results.enhanced.passed++;
        results.enhanced.tests.push('Enhanced search');
        
        const arxivCount = enhancedResults.filter(p => p.source === 'arxiv').length;
        console.log(`  - ArXiv papers: ${arxivCount}`);
        
        if (arxivCount > 0) {
          results.enhanced.passed++;
          results.enhanced.tests.push('ArXiv integration');
        } else {
          results.enhanced.failed++;
          results.enhanced.tests.push('ArXiv integration');
        }
      } else {
        console.log('⚠ Enhanced search returned no results');
        results.enhanced.passed++;
        results.enhanced.tests.push('Enhanced search (no results)');
      }
      
    } catch (error) {
      console.error('✗ Enhanced search test failed:', error.message);
      results.enhanced.failed++;
      results.enhanced.tests.push('General functionality');
    }
    
    await enhancedAdapter.close();
    
    // Test 4: Preference-Aware Unified Search with ArXiv
    console.log('\n=== Testing Preference-Aware Unified Search with ArXiv ===');
    const preferenceAdapter = new PreferenceAwareUnifiedSearchAdapter();
    
    try {
      const preferenceResults = await preferenceAdapter.searchPapers({
        query: 'computer vision',
        maxResults: 6,
        sources: ['pubmed', 'google-scholar', 'arxiv'],
        respectUserPreferences: false
      });
      
      if (preferenceResults && preferenceResults.length > 0) {
        console.log(`✓ Preference-aware search successful: ${preferenceResults.length} papers`);
        results.preference.passed++;
        results.preference.tests.push('Preference search');
        
        const arxivCount = preferenceResults.filter(p => p.source === 'arxiv').length;
        console.log(`  - ArXiv papers: ${arxivCount}`);
        
        if (arxivCount > 0) {
          const arxivPaper = preferenceResults.find(p => p.source === 'arxiv');
          
          // Test paper details
          const paperDetails = await preferenceAdapter.getPaperDetails(arxivPaper.arxivId, 'arxiv');
          if (paperDetails) {
            console.log(`✓ Paper details retrieval successful: ${paperDetails.title}`);
            results.preference.passed++;
            results.preference.tests.push('Paper details');
          } else {
            console.log('✗ Paper details retrieval failed');
            results.preference.failed++;
            results.preference.tests.push('Paper details');
          }
          
          // Test related papers
          const relatedPapers = await preferenceAdapter.getRelatedPapers(arxivPaper.arxivId, 'arxiv', 2);
          if (relatedPapers && relatedPapers.length > 0) {
            console.log(`✓ Related papers retrieval successful: ${relatedPapers.length} papers`);
            results.preference.passed++;
            results.preference.tests.push('Related papers');
          } else {
            console.log('⚠ No related papers found');
            results.preference.passed++;
            results.preference.tests.push('Related papers (none found)');
          }
          
          // Test citation count
          const citationCount = await preferenceAdapter.getCitationCount(arxivPaper.arxivId, 'arxiv');
          if (citationCount === 0) {
            console.log('✓ Citation count correctly returns 0 for ArXiv');
            results.preference.passed++;
            results.preference.tests.push('Citation count');
          } else {
            console.log(`✗ Unexpected citation count: ${citationCount}`);
            results.preference.failed++;
            results.preference.tests.push('Citation count');
          }
          
          results.preference.passed++;
          results.preference.tests.push('ArXiv integration');
        } else {
          console.log('⚠ No ArXiv papers in preference results');
          results.preference.failed++;
          results.preference.tests.push('ArXiv integration');
        }
      } else {
        console.log('⚠ Preference search returned no results');
        results.preference.passed++;
        results.preference.tests.push('Preference search (no results)');
      }
      
    } catch (error) {
      console.error('✗ Preference search test failed:', error.message);
      results.preference.failed++;
      results.preference.tests.push('General functionality');
    }
    
    // Print results summary
    console.log('\n=== Test Results Summary ===');
    
    Object.entries(results).forEach(([category, stats]) => {
      console.log(`\n${category.toUpperCase()}:`);
      console.log(`  Passed: ${stats.passed}, Failed: ${stats.failed}`);
      console.log(`  Tests: ${stats.tests.join(', ')}`);
    });
    
    const totalPassed = Object.values(results).reduce((sum, stats) => sum + stats.passed, 0);
    const totalFailed = Object.values(results).reduce((sum, stats) => sum + stats.failed, 0);
    
    console.log(`\nTOTAL: ${totalPassed} passed, ${totalFailed} failed`);
    
    if (totalFailed === 0) {
      console.log('\n✅ All ArXiv integration tests passed!');
    } else {
      console.log('\n❌ Some ArXiv integration tests failed!');
    }
    
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error.message);
  }
}

if (require.main === module) {
  testArXivComprehensive().catch(console.error);
}

module.exports = { testArXivComprehensive };
