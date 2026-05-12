import type { PubMedPaper } from '../adapters/pubmed';
import type { ArXivPaper } from '../adapters/arxiv';

export type CitableWork = {
  authors: string[];
  title: string;
  journal: string;
  publicationYear: string;
  doi?: string;
  pmid?: string;
  url?: string;
};

function bibtexKey(work: CitableWork): string {
  const raw = (work.authors[0] || 'unknown').trim().split(/[\s,]+/)[0];
  const last = raw.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'unknown';
  const y = work.publicationYear.match(/\d{4}/)?.[0] ?? '0000';
  return `${last}${y}`;
}

export function formatApa(work: CitableWork): string {
  const year = work.publicationYear.match(/\d{4}/)?.[0] ?? work.publicationYear;
  const names = work.authors.join(', ');
  let out = `${names} (${year}). ${work.title}. ${work.journal}.`;
  if (work.doi) {
    const d = work.doi.replace(/^doi:\s*/i, '');
    out += ` https://doi.org/${d}`;
  } else if (work.pmid) {
    out += ` https://pubmed.ncbi.nlm.nih.gov/${work.pmid}/`;
  } else if (work.url) {
    out += ` ${work.url}`;
  }
  return out;
}

export function formatMla(work: CitableWork): string {
  const yearBlock = work.publicationYear.match(/\d{4}/)?.[0] ?? work.publicationYear;
  const names = work.authors.join(', ');
  let out = `${names}. "${work.title}." ${work.journal}, ${yearBlock}.`;
  if (work.url && !work.doi) {
    out += ` ${work.url}`;
  }
  if (work.doi) {
    out += ` DOI ${work.doi.replace(/^doi:\s*/i, '')}.`;
  }
  return out;
}

export function formatBibtex(work: CitableWork): string {
  const key = bibtexKey(work);
  const year = work.publicationYear.match(/\d{4}/)?.[0] ?? '0000';
  const author = work.authors.join(' and ');
  const lines: string[] = [
    `@article{${key},`,
    `  title = {${work.title}},`,
    `  author = {${author}},`,
    `  journal = {${work.journal}},`,
    `  year = {${year}},`,
  ];
  if (work.doi) lines.push(`  doi = {${work.doi.replace(/^doi:\s*/i, '')}},`);
  if (work.pmid) lines.push(`  pmid = {${work.pmid}},`);
  if (work.url) lines.push(`  url = {${work.url}},`);
  lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, '');
  lines.push(`}`);
  return lines.join('\n');
}

export function formatRis(work: CitableWork): string {
  const year = work.publicationYear.match(/\d{4}/)?.[0] ?? work.publicationYear;
  const lines: string[] = ['TY  - JOUR'];
  for (const a of work.authors) {
    lines.push(`AU  - ${a}`);
  }
  lines.push(`TI  - ${work.title}`);
  lines.push(`JO  - ${work.journal}`);
  lines.push(`PY  - ${year}`);
  if (work.doi) lines.push(`DO  - ${work.doi.replace(/^doi:\s*/i, '')}`);
  if (work.pmid) lines.push(`PMID  - ${work.pmid}`);
  if (work.url) lines.push(`UR  - ${work.url}`);
  lines.push('ER  - ');
  return lines.join('\n');
}

export function formatEndnoteTagged(work: CitableWork): string {
  const year = work.publicationYear.match(/\d{4}/)?.[0] ?? work.publicationYear;
  const lines: string[] = ['%0 Journal Article'];
  for (const a of work.authors) {
    lines.push(`%A ${a}`);
  }
  lines.push(`%T ${work.title}`);
  lines.push(`%J ${work.journal}`);
  lines.push(`%D ${year}`);
  if (work.doi) lines.push(`%R ${work.doi.replace(/^doi:\s*/i, '')}`);
  if (work.pmid) lines.push(`%M ${work.pmid}`);
  if (work.url) lines.push(`%U ${work.url}`);
  return lines.join('\n');
}

export function paperToCitableWork(paper: PubMedPaper | ArXivPaper): CitableWork {
  if ('pmid' in paper) {
    return {
      authors: paper.authors,
      title: paper.title,
      journal: paper.journal,
      publicationYear: paper.publicationDate,
      doi: paper.doi,
      pmid: paper.pmid,
      url: paper.pmcFullTextUrl,
    };
  }
  return {
    authors: paper.authors,
    title: paper.title,
    journal: paper.journalRef && paper.journalRef.length > 0 ? paper.journalRef : 'arXiv preprint',
    publicationYear: paper.publicationDate,
    doi: paper.doi,
    url: paper.absUrl,
  };
}

export function formatCitationWork(work: CitableWork, format: 'apa' | 'mla' | 'bibtex' | 'ris' | 'endnote'): string {
  switch (format) {
    case 'apa':
      return formatApa(work);
    case 'mla':
      return formatMla(work);
    case 'bibtex':
      return formatBibtex(work);
    case 'ris':
      return formatRis(work);
    case 'endnote':
      return formatEndnoteTagged(work);
    default: {
      const _: never = format;
      return _;
    }
  }
}
