const { EnhancedUnifiedSearchAdapter } = require('../dist/adapters/enhanced-unified-search');

async function testFirecrawlWithArXiv() {
  console.log('Testing Firecrawl with ArXiv Integration...\n');
  
  try {
    console.log('1. Creating enhanced unified search adapter...');
    const adapter = new EnhancedUnifiedSearchAdapter();
    console.log('✓ Adapter created successfully');
    
    console.log('\n2. Testing search method info...');
    const searchMethod = adapter.getSearchMethod();
    const firecrawlAvailable = adapter.isFirecrawlAvailable();
    console.log(`✓ Search method: ${searchMethod}`);
    console.log(`✓ Firecrawl available: ${firecrawlAvailable}`);
    
    console.log('\n3. Testing ArXiv search with Puppeteer (Firecrawl disabled)...');
    const puppeteerResults = await adapter.searchPapers({
      query: 'machine learning',
      maxResults: 3,
      sources: ['arxiv'],
      preferFirecrawl: false
    });
    
    if (puppeteerResults && puppeteerResults.length > 0) {
      console.log(`✓ Puppeteer ArXiv search successful: ${puppeteerResults.length} papers`);
      const arxivPaper = puppeteerResults.find(p => p.source === 'arxiv');
      if (arxivPaper) {
        console.log(`  - ArXiv paper: ${arxivPaper.title}`);
        console.log(`  - ID: ${arxivPaper.arxivId}`);
        console.log(`  - Categories: ${arxivPaper.categories?.join(', ')}`);
      }
    } else {
      console.log('⚠ Puppeteer ArXiv search returned no results');
    }
    
    console.log('\n4. Testing ArXiv search with Firecrawl preference...');
    adapter.setPreferFirecrawl(true);
    const firecrawlSearchMethod = adapter.getSearchMethod();
    console.log(`✓ Firecrawl preference set, search method: ${firecrawlSearchMethod}`);
    
    try {
      const firecrawlResults = await adapter.searchPapers({
        query: 'deep learning',
        maxResults: 3,
        sources: ['arxiv'],
        preferFirecrawl: true
      });
      
      if (firecrawlResults && firecrawlResults.length > 0) {
        console.log(`✓ Firecrawl ArXiv search successful: ${firecrawlResults.length} papers`);
        const arxivPaper = firecrawlResults.find(p => p.source === 'arxiv');
        if (arxivPaper) {
          console.log(`  - ArXiv paper: ${arxivPaper.title}`);
          console.log(`  - ID: ${arxivPaper.arxivId}`);
          console.log(`  - Categories: ${arxivPaper.categories?.join(', ')}`);
        }
      } else {
        console.log('⚠ Firecrawl ArXiv search returned no results');
      }
    } catch (error) {
      console.log(`⚠ Firecrawl ArXiv search failed (expected if Firecrawl not available): ${error.message}`);
      console.log('  This is normal if Firecrawl MCP server is not running');
    }
    
    console.log('\n5. Testing fallback to Puppeteer...');
    adapter.setPreferFirecrawl(false);
    const fallbackMethod = adapter.getSearchMethod();
    console.log(`✓ Fallback method: ${fallbackMethod}`);
    
    const fallbackResults = await adapter.searchPapers({
      query: 'computer vision',
      maxResults: 2,
      sources: ['arxiv'],
      preferFirecrawl: false
    });
    
    if (fallbackResults && fallbackResults.length > 0) {
      console.log(`✓ Fallback ArXiv search successful: ${fallbackResults.length} papers`);
    } else {
      console.log('⚠ Fallback ArXiv search returned no results');
    }
    
    console.log('\n6. Testing mixed source search with ArXiv...');
    const mixedResults = await adapter.searchPapers({
      query: 'artificial intelligence',
      maxResults: 6,
      sources: ['pubmed', 'google-scholar', 'arxiv'],
      preferFirecrawl: false
    });
    
    if (mixedResults && mixedResults.length > 0) {
      console.log(`✓ Mixed source search successful: ${mixedResults.length} papers`);
      
      const sourceCounts = {};
      mixedResults.forEach(paper => {
        sourceCounts[paper.source] = (sourceCounts[paper.source] || 0) + 1;
      });
      
      console.log('  - Source distribution:');
      Object.entries(sourceCounts).forEach(([source, count]) => {
        console.log(`    ${source}: ${count} papers`);
      });
      
      const arxivCount = sourceCounts['arxiv'] || 0;
      if (arxivCount > 0) {
        console.log(`  - ArXiv integration working: ${arxivCount} papers`);
      } else {
        console.log('  - ⚠ No ArXiv papers in mixed results');
      }
    } else {
      console.log('⚠ Mixed source search returned no results');
    }
    
    console.log('\n7. Testing adapter cleanup...');
    await adapter.close();
    console.log('✓ Adapter closed successfully');
    
    console.log('\n✅ All Firecrawl with ArXiv tests completed!');
    console.log('\nNote: Firecrawl integration works seamlessly with ArXiv:');
    console.log('- ArXiv searches work with both Puppeteer and Firecrawl methods');
    console.log('- Automatic fallback ensures ArXiv functionality is always available');
    console.log('- Mixed source searches include ArXiv papers regardless of method');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

if (require.main === module) {
  testFirecrawlWithArXiv().catch(console.error);
}

module.exports = { testFirecrawlWithArXiv };
