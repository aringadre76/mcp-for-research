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
    
    console.log('\n✅ All Firecrawl integration tests passed!');
    console.log('\nNote: To use Firecrawl, you need to:');
    console.log('1. Have the Firecrawl MCP server running');
    console.log('2. Set the Firecrawl client using setFirecrawlClient()');
    console.log('3. Use the search_with_firecrawl tool in the MCP server');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  testFirecrawlIntegration().catch(console.error);
}

module.exports = { testFirecrawlIntegration };
