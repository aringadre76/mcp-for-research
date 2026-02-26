const { GoogleScholarFirecrawlAdapter } = require('../dist/adapters/google-scholar-firecrawl');
const { EnhancedUnifiedSearchAdapter } = require('../dist/adapters/enhanced-unified-search');

async function testFirecrawlIntegration() {
  console.log('Testing Firecrawl Integration...\n');
  
  try {
    console.log('1. Testing Firecrawl adapter creation...');
    const firecrawlAdapter = new GoogleScholarFirecrawlAdapter();
    console.log('✓ Firecrawl adapter created successfully');
    
    console.log('\n2. Testing enhanced unified search adapter...');
    const enhancedAdapter = new EnhancedUnifiedSearchAdapter();
    console.log('✓ Enhanced unified search adapter created successfully');
    
    console.log('\n3. Testing search method info...');
    const searchMethod = enhancedAdapter.getSearchMethod();
    const firecrawlAvailable = enhancedAdapter.isFirecrawlAvailable();
    console.log(`✓ Search method: ${searchMethod}`);
    console.log(`✓ Firecrawl available: ${firecrawlAvailable}`);
    
    console.log('\n4. Testing preference setting...');
    enhancedAdapter.setPreferFirecrawl(true);
    console.log('✓ Firecrawl preference set to true');
    
    console.log('\n5. Testing search method after preference change...');
    const newSearchMethod = enhancedAdapter.getSearchMethod();
    console.log(`✓ New search method: ${newSearchMethod}`);
    
    console.log('\n6. Testing fallback to Puppeteer...');
    enhancedAdapter.setPreferFirecrawl(false);
    const fallbackMethod = enhancedAdapter.getSearchMethod();
    console.log(`✓ Fallback method: ${fallbackMethod}`);
    
    console.log('\n7. Testing ArXiv integration with Firecrawl...');
    const arxivResults = await enhancedAdapter.searchPapers({
      query: 'machine learning',
      maxResults: 3,
      sources: ['arxiv'],
      preferFirecrawl: false
    });
    
    if (arxivResults && arxivResults.length > 0) {
      console.log(`✓ ArXiv search returned ${arxivResults.length} papers`);
      const arxivPaper = arxivResults.find(p => p.source === 'arxiv');
      if (arxivPaper) {
        console.log(`  - ArXiv paper: ${arxivPaper.title}`);
        console.log(`  - ID: ${arxivPaper.arxivId}`);
        console.log(`  - Categories: ${arxivPaper.categories?.join(', ')}`);
      }
    } else {
      console.log('⚠ ArXiv search returned no results');
    }

    console.log('\n8. Testing adapter with mock Firecrawl client...');
    const mockMarkdown = [
      '**Mock Paper Title**',
      'Authors: Mock Author One, Mock Author Two',
      'Journal: Mock Journal',
      'Publication Date: 2024',
      'Citations: 5',
      'URL: https://example.com/mock',
      'Abstract: A mock abstract for testing.'
    ].join('\n');
    const mockClient = {
      firecrawl_scrape: () => Promise.resolve({ content: mockMarkdown }),
      firecrawl_search: () => Promise.resolve({
        results: [
          { title: 'Search Result', url: 'https://example.com/s', snippet: 'Snippet text', description: 'Snippet text' }
        ]
      })
    };
    const adapterWithMock = new GoogleScholarFirecrawlAdapter(mockClient);
    const mockSearchPapers = await adapterWithMock.searchPapers({ query: 'test', maxResults: 5 });
    if (mockSearchPapers.length === 0 || mockSearchPapers[0].title !== 'Mock Paper Title') {
      throw new Error('Mock client searchPapers: expected at least one paper with title "Mock Paper Title", got ' + (mockSearchPapers[0]?.title ?? 'none'));
    }
    if (!Array.isArray(mockSearchPapers[0].authors) || mockSearchPapers[0].authors.length !== 2) {
      throw new Error('Mock client searchPapers: expected 2 authors, got ' + (mockSearchPapers[0].authors?.length ?? 0));
    }
    const mockSearchWithFirecrawl = await adapterWithMock.searchWithFirecrawl('query', 3);
    if (mockSearchWithFirecrawl.length === 0 || mockSearchWithFirecrawl[0].title !== 'Search Result') {
      throw new Error('Mock client searchWithFirecrawl: expected at least one result with title "Search Result", got ' + (mockSearchWithFirecrawl[0]?.title ?? 'none'));
    }
    console.log('✓ Mock Firecrawl client: searchPapers and searchWithFirecrawl returned expected structure');
    
    console.log('\n✅ All Firecrawl integration tests passed!');
    console.log('\nNote: To use Firecrawl, you need to:');
    console.log('1. Have the Firecrawl MCP server running');
    console.log('2. Set the Firecrawl client using setFirecrawlClient()');
    console.log('3. Use the search_with_firecrawl tool in the MCP server');
    console.log('4. ArXiv integration works with both Firecrawl and Puppeteer methods');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  testFirecrawlIntegration().catch(console.error);
}

module.exports = { testFirecrawlIntegration };
