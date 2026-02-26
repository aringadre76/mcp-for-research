const { GoogleScholarFirecrawlAdapter } = require('../dist/adapters/google-scholar-firecrawl');

const singleLineAbstractMarkdown = `
**First Paper Title**
Authors: Alice Smith, Bob Jones
Journal: Nature
Publication Date: 2023
Citations: 42
URL: https://example.com/1
Abstract: This is a single line abstract.

**Second Paper Title**
Authors: Carol Lee
Journal: Science
Publication Date: 2022
Citations: 10
URL: https://example.com/2
Abstract: Another short abstract.
`;

const multiLineAbstractMarkdown = `
**Paper With Long Abstract**
Authors: Dave Wilson, Eve Brown
Journal: Cell
Publication Date: 2024
Citations: 100
URL: https://example.com/3
Abstract: This is the first sentence of the abstract.
This is the second sentence.
And here is the third sentence that continues the abstract.
Journal: Ignored inside abstract
`;

function mockClient(content) {
  return {
    firecrawl_scrape: () => Promise.resolve({ content }),
    firecrawl_search: () => Promise.resolve({ results: [] })
  };
}

function runParserTests() {
  let passed = 0;
  let failed = 0;

  const adapter1 = new GoogleScholarFirecrawlAdapter(mockClient(singleLineAbstractMarkdown));
  adapter1.searchPapers({ query: 'test', maxResults: 5 }).then((papers) => {
    if (papers.length !== 2) {
      console.error('FAIL: expected 2 papers, got', papers.length);
      failed++;
    } else {
      passed++;
    }
    const first = papers[0];
    if (first.title !== 'First Paper Title') {
      console.error('FAIL: first paper title expected "First Paper Title", got', first.title);
      failed++;
    } else {
      passed++;
    }
    if (!Array.isArray(first.authors) || first.authors.length !== 2) {
      console.error('FAIL: first paper expected 2 authors, got', first.authors);
      failed++;
    } else {
      passed++;
    }
    if (first.abstract !== 'This is a single line abstract.') {
      console.error('FAIL: first paper abstract mismatch, got', first.abstract);
      failed++;
    } else {
      passed++;
    }
    return adapter1.searchPapers({ query: 'x', maxResults: 1 });
  }).then((papers) => {
    if (papers.length !== 1) {
      console.error('FAIL: maxResults=1 expected 1 paper, got', papers.length);
      failed++;
    } else {
      passed++;
    }
    const adapter2 = new GoogleScholarFirecrawlAdapter(mockClient(multiLineAbstractMarkdown));
    return adapter2.searchPapers({ query: 'test', maxResults: 5 });
  }).then((papers) => {
    if (papers.length !== 1) {
      console.error('FAIL: multi-line abstract test expected 1 paper, got', papers.length);
      failed++;
    } else {
      passed++;
    }
    const p = papers[0];
    const expectedAbstract = 'This is the first sentence of the abstract. This is the second sentence. And here is the third sentence that continues the abstract. Journal: Ignored inside abstract';
    if (!p.abstract || !p.abstract.includes('first sentence') || !p.abstract.includes('third sentence')) {
      console.error('FAIL: multi-line abstract expected to contain multiple sentences, got', p.abstract);
      failed++;
    } else {
      passed++;
    }
    if (p.title !== 'Paper With Long Abstract') {
      console.error('FAIL: title expected "Paper With Long Abstract", got', p.title);
      failed++;
    } else {
      passed++;
    }
    console.log('Parser tests: ' + passed + ' passed, ' + failed + ' failed');
    process.exit(failed > 0 ? 1 : 0);
  }).catch((err) => {
    console.error('Parser test error:', err);
    process.exit(1);
  });
}

runParserTests();
