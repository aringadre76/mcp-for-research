const { UnifiedSearchAdapter } = require('../dist/adapters/unified-search');
const { EnhancedUnifiedSearchAdapter } = require('../dist/adapters/enhanced-unified-search');
const { PreferenceAwareUnifiedSearchAdapter } = require('../dist/adapters/preference-aware-unified-search');

async function testUnifiedSearchWithArXiv() {
  console.log('Testing Unified Search with ArXiv Integration...\n');
  
  try {
    console.log('1. Testing basic unified search adapter...');
    const basicAdapter = new UnifiedSearchAdapter();
    
    const basicResults = await basicAdapter.searchPapers({
      query: 'artificial intelligence',
      maxResults: 6,
      sources: ['pubmed', 'google-scholar', 'arxiv']
    });
    
    if (basicResults && basicResults.length > 0) {
      console.log(`✓ Basic unified search returned ${basicResults.length} papers`);
      
      const sourceCounts = {};
      basicResults.forEach(paper => {
        sourceCounts[paper.source] = (sourceCounts[paper.source] || 0) + 1;
      });
      
      console.log('  - Source distribution:');
      Object.entries(sourceCounts).forEach(([source, count]) => {
        console.log(`    ${source}: ${count} papers`);
      });
      
      const arxivPaper = basicResults.find(p => p.source === 'arxiv');
      if (arxivPaper) {
        console.log(`  - ArXiv paper example: ${arxivPaper.title}`);
        console.log(`    ID: ${arxivPaper.arxivId}, Categories: ${arxivPaper.categories?.join(', ')}`);
      }
    } else {
      console.log('⚠ Basic unified search returned no results');
    }
    
    await basicAdapter.close();
    console.log('✓ Basic adapter closed');
    
    console.log('\n2. Testing enhanced unified search adapter...');
    const enhancedAdapter = new EnhancedUnifiedSearchAdapter();
    
    const enhancedResults = await enhancedAdapter.searchPapers({
      query: 'machine learning',
      maxResults: 6,
      sources: ['pubmed', 'google-scholar', 'arxiv'],
      preferFirecrawl: false
    });
    
    if (enhancedResults && enhancedResults.length > 0) {
      console.log(`✓ Enhanced unified search returned ${enhancedResults.length} papers`);
      
      const sourceCounts = {};
      enhancedResults.forEach(paper => {
        sourceCounts[paper.source] = (sourceCounts[paper.source] || 0) + 1;
      });
      
      console.log('  - Source distribution:');
      Object.entries(sourceCounts).forEach(([source, count]) => {
        console.log(`    ${source}: ${count} papers`);
      });
      
      const arxivPaper = enhancedResults.find(p => p.source === 'arxiv');
      if (arxivPaper) {
        console.log(`  - ArXiv paper example: ${arxivPaper.title}`);
        console.log(`    ID: ${arxivPaper.arxivId}, Categories: ${arxivPaper.categories?.join(', ')}`);
      }
    } else {
      console.log('⚠ Enhanced unified search returned no results');
    }
    
    await enhancedAdapter.close();
    console.log('✓ Enhanced adapter closed');
    
    console.log('\n3. Testing preference-aware unified search adapter...');
    const preferenceAdapter = new PreferenceAwareUnifiedSearchAdapter();
    
    const preferenceResults = await preferenceAdapter.searchPapers({
      query: 'deep learning',
      maxResults: 6,
      sources: ['pubmed', 'google-scholar', 'arxiv'],
      respectUserPreferences: false
    });
    
    if (preferenceResults && preferenceResults.length > 0) {
      console.log(`✓ Preference-aware unified search returned ${preferenceResults.length} papers`);
      
      const sourceCounts = {};
      preferenceResults.forEach(paper => {
        sourceCounts[paper.source] = (sourceCounts[paper.source] || 0) + 1;
      });
      
      console.log('  - Source distribution:');
      Object.entries(sourceCounts).forEach(([source, count]) => {
        console.log(`    ${source}: ${count} papers`);
      });
      
      const arxivPaper = preferenceResults.find(p => p.source === 'arxiv');
      if (arxivPaper) {
        console.log(`  - ArXiv paper example: ${arxivPaper.title}`);
        console.log(`    ID: ${arxivPaper.arxivId}, Categories: ${arxivPaper.categories?.join(', ')}`);
      }
    } else {
      console.log('⚠ Preference-aware unified search returned no results');
    }
    
    console.log('\n4. Testing paper details retrieval...');
    const arxivPaper = preferenceResults?.find(p => p.source === 'arxiv');
    if (arxivPaper && arxivPaper.arxivId) {
      const paperDetails = await preferenceAdapter.getPaperDetails(arxivPaper.arxivId, 'arxiv');
      if (paperDetails) {
        console.log(`✓ Retrieved ArXiv paper details: ${paperDetails.title}`);
        console.log(`  - Source: ${paperDetails.source}`);
        console.log(`  - ArXiv ID: ${paperDetails.arxivId}`);
        console.log(`  - Categories: ${paperDetails.categories?.join(', ')}`);
      } else {
        console.log('⚠ Failed to retrieve ArXiv paper details');
      }
    } else {
      console.log('⚠ Skipping paper details test (no ArXiv papers found)');
    }
    
    console.log('\n5. Testing related papers...');
    if (arxivPaper && arxivPaper.arxivId) {
      const relatedPapers = await preferenceAdapter.getRelatedPapers(arxivPaper.arxivId, 'arxiv', 3);
      if (relatedPapers && relatedPapers.length > 0) {
        console.log(`✓ Found ${relatedPapers.length} related ArXiv papers`);
        relatedPapers.forEach((paper, index) => {
          console.log(`  ${index + 1}. ${paper.title} (${paper.arxivId})`);
        });
      } else {
        console.log('⚠ No related ArXiv papers found');
      }
    } else {
      console.log('⚠ Skipping related papers test (no ArXiv papers found)');
    }
    
    console.log('\n6. Testing citation count (should be 0 for ArXiv)...');
    if (arxivPaper && arxivPaper.arxivId) {
      const citationCount = await preferenceAdapter.getCitationCount(arxivPaper.arxivId, 'arxiv');
      if (citationCount === 0) {
        console.log('✓ ArXiv citation count correctly returns 0');
      } else {
        console.log(`⚠ Unexpected citation count for ArXiv: ${citationCount}`);
      }
    } else {
      console.log('⚠ Skipping citation count test (no ArXiv papers found)');
    }
    
    console.log('\n✅ All unified search with ArXiv tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

if (require.main === module) {
  testUnifiedSearchWithArXiv().catch(console.error);
}

module.exports = { testUnifiedSearchWithArXiv };
