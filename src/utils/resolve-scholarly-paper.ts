import { PubMedAdapter, PubMedPaper } from '../adapters/pubmed';
import { ArXivAdapter, ArXivPaper } from '../adapters/arxiv';
import { isLikelyArxivId, normalizeArxivId } from './identifiers';

export type ResolvedScholarlyPaper = PubMedPaper | ArXivPaper;

export async function resolveScholarlyPaper(
  identifier: string,
  pubmedAdapter: PubMedAdapter,
  arxivAdapter: ArXivAdapter
): Promise<ResolvedScholarlyPaper | null> {
  const id = identifier.trim();
  if (/^pmc/i.test(id)) {
    const normalized = id.replace(/^pmc/i, 'PMC');
    return pubmedAdapter.getPaperByPMCID(normalized);
  }
  if (/^10\./.test(id) || /^doi:/i.test(id)) {
    const doi = id.replace(/^doi:/i, '').trim();
    return pubmedAdapter.getPaperById(doi);
  }
  if (isLikelyArxivId(id)) {
    return arxivAdapter.getPaperById(normalizeArxivId(id));
  }
  if (/^\d+$/.test(id)) {
    return pubmedAdapter.getPaperById(id);
  }
  return null;
}
