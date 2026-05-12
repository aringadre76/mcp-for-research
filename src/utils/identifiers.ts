export function normalizeArxivId(identifier: string): string {
  return identifier.trim().replace(/^arxiv:/i, '').trim();
}

export function isLikelyArxivId(identifier: string): boolean {
  const s = normalizeArxivId(identifier);
  if (s.includes('/')) {
    return /^[a-z0-9.-]+\/\d{4,7}(v\d+)?$/i.test(s);
  }
  return /^\d{4}\.\d{4,5}(v\d+)?$/i.test(s);
}
