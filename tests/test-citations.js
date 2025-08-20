const { PubMedAdapter } = require('./dist/adapters/pubmed.js');

async function testCitations() {
  console.log('📚 Testing Citation Functionality\n');
  
  const adapter = new PubMedAdapter();
  
  try {
    // Test with a known paper
    const pmid = '33844136';
    console.log(`🔍 Testing citations for PMID: ${pmid}\n`);
    
    const paper = await adapter.getPaperById(pmid);
    if (!paper) {
      console.log('❌ Paper not found');
      return;
    }
    
    console.log(`📄 Paper: ${paper.title}\n`);
    
    // Test citation count
    console.log('1️⃣ Testing citation count...');
    const citationCount = await adapter.getCitationCount(pmid);
    if (citationCount !== null) {
      console.log(`✅ Citation count: ${citationCount}`);
    } else {
      console.log('ℹ️ Citation count not available');
    }
    
    console.log('\n2️⃣ Testing citation formats...\n');
    
    // Test different citation formats
    const formats = [
      { name: 'BibTeX', format: 'bibtex' },
      { name: 'EndNote', format: 'endnote' },
      { name: 'APA', format: 'apa' },
      { name: 'MLA', format: 'mla' },
      { name: 'RIS', format: 'ris' }
    ];
    
    for (const { name, format } of formats) {
      console.log(`📝 ${name} Format:`);
      
      let citation = '';
      switch (format) {
        case 'bibtex':
          citation = `@article{${paper.pmid},
  title={${paper.title}},
  author={${paper.authors.join(' and ')}},
  journal={${paper.journal}},
  year={${paper.publicationDate}},
  doi={${paper.doi || 'N/A'}},
  pmid={${paper.pmid}}
}`;
          break;
        
        case 'endnote':
          citation = `%0 Journal Article
%T ${paper.title}
%A ${paper.authors.join('\n%A ')}
%J ${paper.journal}
%D ${paper.publicationDate}
%R ${paper.doi || 'N/A'}
%M ${paper.pmid}`;
          break;
        
        case 'apa':
          citation = `${paper.authors.join(', ')} (${paper.publicationDate}). ${paper.title}. ${paper.journal}. ${paper.doi ? `https://doi.org/${paper.doi}` : ''}`;
          break;
        
        case 'mla':
          citation = `${paper.authors.join(', ')}. "${paper.title}." ${paper.journal}, ${paper.publicationDate}. ${paper.doi ? `https://doi.org/${paper.doi}` : ''}`;
          break;
        
        case 'ris':
          citation = `TY  - JOUR
TI  - ${paper.title}
AU  - ${paper.authors.join('\nAU  - ')}
JO  - ${paper.journal}
PY  - ${paper.publicationDate}
DO  - ${paper.doi || 'N/A'}
ID  - ${paper.pmid}
ER  -`;
          break;
      }
      
      console.log(citation);
      console.log('');
    }
    
    console.log('🎉 Citation testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  testCitations();
}
