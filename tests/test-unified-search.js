const { UnifiedSearchAdapter } = require('../dist/adapters/unified-search');

async function testUnifiedSearch() {
  console.log('Testing Unified Search Adapter...\n');
  
  const adapter = new UnifiedSearchAdapter();
  
  try {
    console.log('1. Testing unified search across all sources...');
    const unifiedResults = await adapter.searchPapers({
      query: 'artificial intelligence',
      maxResults: 6,
      sources: ['pubmed', 'google-scholar'],
      sortBy: 'relevance'
    });
    
    console.log(`Found ${unifiedResults.length} papers across all sources:`);
    unifiedResults.forEach((paper, index) => {
      console.log(`\n${index + 1}. ${paper.title}`);
      console.log(`   Authors: ${paper.authors.join(', ')}`);
      console.log(`   Journal: ${paper.journal}`);
      console.log(`   Date: ${paper.publicationDate}`);
      console.log(`   Source: ${paper.source}`);
      if (paper.pmid) {
        console.log(`   PMID: ${paper.pmid}`);
      }
      if (paper.pmcid) {
        console.log(`   PMC ID: ${paper.pmcid}`);
      }
      if (paper.doi) {
        console.log(`   DOI: ${paper.doi}`);
      }
      if (paper.url) {
        console.log(`   URL: ${paper.url}`);
      }
      if (paper.pdfUrl) {
        console.log(`   PDF: ${paper.pdfUrl}`);
      }
      if (paper.citations > 0) {
        console.log(`   Citations: ${paper.citations}`);
      }
    });
    
    console.log('\n2. Testing PubMed-only search...');
    const pubmedResults = await adapter.searchPapers({
      query: 'machine learning',
      maxResults: 3,
      sources: ['pubmed']
    });
    
    console.log(`Found ${pubmedResults.length} papers from PubMed:`);
    pubmedResults.forEach((paper, index) => {
      console.log(`   ${index + 1}. ${paper.title} (${paper.source})`);
    });
    
    console.log('\n3. Testing Google Scholar-only search...');
    const googleResults = await adapter.searchPapers({
      query: 'deep learning',
      maxResults: 3,
      sources: ['google-scholar'],
      sortBy: 'citations'
    });
    
    console.log(`Found ${googleResults.length} papers from Google Scholar:`);
    googleResults.forEach((paper, index) => {
      console.log(`   ${index + 1}. ${paper.title} (${paper.source})`);
    });
    
    console.log('\n4. Testing date-based sorting...');
    const dateSortedResults = await adapter.searchPapers({
      query: 'neural networks',
      maxResults: 5,
      sources: ['pubmed', 'google-scholar'],
      sortBy: 'date'
    });
    
    console.log(`Found ${dateSortedResults.length} papers sorted by date:`);
    dateSortedResults.forEach((paper, index) => {
      console.log(`   ${index + 1}. ${paper.title} (${paper.publicationDate})`);
    });
    
    if (unifiedResults.length > 0) {
      console.log('\n5. Testing paper details retrieval...');
      const firstPaper = unifiedResults[0];
      const paperDetails = await adapter.getPaperDetails(
        firstPaper.pmid || firstPaper.url || 'test',
        firstPaper.source === 'pubmed' ? 'pubmed' : 'google-scholar'
      );
      
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
  testUnifiedSearch().catch(console.error);
}

module.exports = { testUnifiedSearch };
