const { formatCitationWork, paperToCitableWork } = require('../dist/utils/citation-format');

describe('citation-format', () => {
  test('formats apa from PubMed-shaped paper', () => {
    const w = paperToCitableWork({
      pmid: '33844136',
      title: 'Example Study',
      authors: ['Smith J', 'Jones K'],
      journal: 'J Example',
      publicationDate: '2022',
      abstract: 'x',
      pmcid: undefined,
      doi: '10.1000/182',
    });
    const out = formatCitationWork(w, 'apa');
    expect(out).toContain('Example Study');
    expect(out).toContain('J Example');
    expect(out).toMatch(/2022/);
    expect(out).toContain('doi.org');
  });

  test('bibtex has distinct shape from apa', () => {
    const w = paperToCitableWork({
      pmid: '1',
      title: 'T',
      authors: ['Author A'],
      journal: 'J',
      publicationDate: '2020',
      abstract: '',
    });
    const bib = formatCitationWork(w, 'bibtex');
    const apa = formatCitationWork(w, 'apa');
    expect(bib).toContain('@article{');
    expect(bib).toContain('title = {T}');
    expect(apa).not.toContain('@article');
  });

  test('ris contains TY and ER', () => {
    const w = paperToCitableWork({
      id: '2401.00001',
      title: 'Arxiv Title',
      authors: ['A B'],
      abstract: '',
      categories: [],
      publicationDate: '2024',
      lastUpdated: '',
      pdfUrl: 'https://arxiv.org/pdf/2401.00001.pdf',
      absUrl: 'https://arxiv.org/abs/2401.00001',
    });
    const ris = formatCitationWork(w, 'ris');
    expect(ris).toContain('TY  - JOUR');
    expect(ris).toContain('ER  - ');
    expect(ris).toContain('Arxiv Title');
  });
});
