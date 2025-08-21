const { PubMedAdapter } = require('../dist/adapters/pubmed');

async function betterTest() {
  console.log('🔍 Better Test: Looking for Papers with More Content...\n');

  const pubmed = new PubMedAdapter();

  try {
    console.log('1. Searching for papers with DOIs (more likely to have full text)...');
    const papers = await pubmed.searchPapers({ 
      query: 'machine learning review', 
      maxResults: 5 
    });
    
    console.log(`Found ${papers.length} papers. Checking each for content...\n`);

    for (let i = 0; i < papers.length; i++) {
      const paper = papers[i];
      console.log(`📄 Paper ${i + 1}: ${paper.title}`);
      console.log(`   PMID: ${paper.pmid}`);
      console.log(`   DOI: ${paper.doi || 'None'}`);
      console.log(`   Abstract: ${paper.abstract.length} characters`);
      
      if (paper.doi) {
        console.log('   🔍 This paper has a DOI - checking for full text...');
        const fullText = await pubmed.getFullTextContent(paper.pmid);
        console.log(`   Full text available: ${fullText ? 'YES' : 'NO'}`);
        
        if (fullText && fullText.length > paper.abstract.length) {
          console.log(`   ✅ Found additional content! (${fullText.length - paper.abstract.length} extra characters)`);
          
          console.log('   📖 Testing section extraction...');
          const sections = await pubmed.extractPaperSections(paper.pmid, 800);
          console.log(`   Sections found: ${sections.length}`);
          if (sections.length > 0) {
            sections.forEach((section, index) => {
              console.log(`      ${index + 1}. ${section.title}`);
            });
          }
          
          console.log('   🔎 Testing content search...');
          const searchResults = await pubmed.searchWithinPaper(paper.pmid, 'method');
          console.log(`   Search results for "method": ${searchResults.length}`);
          
          console.log('   💬 Testing evidence extraction...');
          // Test the evidence extraction logic manually
          const sentences = fullText.split(/[.!?]+/).filter(sentence => sentence.trim().length > 20);
          const evidenceSentences = sentences.filter(sentence => 
            sentence.toLowerCase().includes('found') || 
            sentence.toLowerCase().includes('showed') ||
            sentence.toLowerCase().includes('demonstrated')
          );
          console.log(`   Evidence sentences found: ${evidenceSentences.length}`);
          if (evidenceSentences.length > 0) {
            console.log(`   First evidence: ${evidenceSentences[0].substring(0, 100)}...`);
          }
          
          console.log('   🎯 This paper has substantial content for analysis!\n');
          break; // Found a good paper, stop here
        } else {
          console.log('   ⚠️  Only abstract available\n');
        }
      } else {
        console.log('   ⚠️  No DOI - likely abstract only\n');
      }
      console.log('');
    }

    console.log('💡 Tips for Better Results:');
    console.log('1. Look for papers with DOIs');
    console.log('2. Search for "review" papers (often longer)');
    console.log('3. Try different search terms');
    console.log('4. Many papers only have abstracts due to paywalls');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

betterTest();
