const { PubMedAdapter } = require('../dist/adapters/pubmed');

async function testPMC() {
  console.log('🔍 Testing PMC (PubMed Central) Functionality...\n');

  const pubmed = new PubMedAdapter();

  try {
    const testPMCID = 'PMC8353807';
    console.log(`Testing with PMC ID: ${testPMCID}\n`);

    console.log('1. Fetching paper by PMC ID...');
    const paper = await pubmed.getPaperByPMCID(testPMCID);
    
    if (paper) {
      console.log(`✅ Found paper: ${paper.title}`);
      console.log(`   PMID: ${paper.pmid}`);
      console.log(`   PMC ID: ${paper.pmcid}`);
      console.log(`   DOI: ${paper.doi || 'None'}`);
      console.log(`   Journal: ${paper.journal}`);
      console.log(`   Abstract length: ${paper.abstract.length} characters`);
      console.log(`   PMC URL: ${paper.pmcFullTextUrl}\n`);

      console.log('2. Testing full text extraction from PMC...');
      const fullText = await pubmed.getFullTextContent(paper.pmid, paper.pmcid);
      
      if (fullText) {
        console.log(`✅ Full text available: ${fullText.length} characters`);
        console.log(`   Abstract: ${paper.abstract.length} characters`);
        console.log(`   Additional content: ${fullText.length - paper.abstract.length} characters`);
        
        if (fullText.length > paper.abstract.length) {
          console.log(`   🎉 Successfully extracted ${fullText.length - paper.abstract.length} extra characters from PMC!`);
          
          console.log('\n3. Testing section extraction...');
          const sections = await pubmed.extractPaperSections(paper.pmid, 1000, paper.pmcid);
          console.log(`   Sections found: ${sections.length}`);
          if (sections.length > 0) {
            sections.forEach((section, index) => {
              console.log(`      ${index + 1}. ${section.title} (${section.content.length} chars)`);
            });
          }
          
          console.log('\n4. Testing content search...');
          const searchResults = await pubmed.searchWithinPaper(paper.pmid, 'method', paper.pmcid);
          console.log(`   Search results for "method": ${searchResults.length}`);
          if (searchResults.length > 0) {
            console.log(`   First result: ${searchResults[0].substring(0, 100)}...`);
          }
          
          console.log('\n5. Testing evidence extraction...');
          const sentences = fullText.split(/[.!?]+/).filter(sentence => sentence.trim().length > 20);
          const evidenceSentences = sentences.filter(sentence => 
            sentence.toLowerCase().includes('found') || 
            sentence.toLowerCase().includes('showed') ||
            sentence.toLowerCase().includes('demonstrated') ||
            sentence.toLowerCase().includes('concluded')
          );
          console.log(`   Evidence sentences found: ${evidenceSentences.length}`);
          if (evidenceSentences.length > 0) {
            console.log(`   First evidence: ${evidenceSentences[0].substring(0, 100)}...`);
          }
          
        } else {
          console.log('   ⚠️  Only abstract content available');
        }
      } else {
        console.log('   ❌ No full text available');
      }
      
    } else {
      console.log('❌ Paper not found');
    }

    console.log('\n💡 PMC Papers are Great Because:');
    console.log('1. They often have free full text access');
    console.log('2. Content is typically well-structured');
    console.log('3. Better for section extraction and evidence mining');
    console.log('4. More reliable than DOI-based extraction');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPMC();
