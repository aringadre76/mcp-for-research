import type { FirecrawlMCPClient, FirecrawlScrapeAction, FirecrawlSearchResultItem } from './google-scholar-firecrawl';

const FIRECRAWL_BASE = 'https://api.firecrawl.dev/v2';

interface ScrapeApiResponse {
  success?: boolean;
  data?: { markdown?: string };
  error?: string;
}

interface SearchApiResponse {
  success?: boolean;
  data?: {
    web?: Array<{ title?: string; url?: string; description?: string; markdown?: string | null; metadata?: Record<string, unknown> }>;
  };
  error?: string;
}

function getApiKey(): string | undefined {
  if (typeof process === 'undefined' || !process.env) return undefined;
  const v = process.env.FIRECRAWL_API_KEY;
  return typeof v === 'string' ? v : undefined;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxAttempts: number = 3
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
        const delay = attempt * 1000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      return res;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt < maxAttempts) {
        const delay = attempt * 1000;
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw lastError;
      }
    }
  }
  throw lastError || new Error('fetch failed');
}

export function createFirecrawlApiClient(apiKey: string): FirecrawlMCPClient {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  return {
    async firecrawl_scrape(params: Parameters<FirecrawlMCPClient['firecrawl_scrape']>[0]): Promise<{ content: string }> {
      const body: Record<string, unknown> = {
        url: params.url,
        formats: params.formats && params.formats.length > 0 ? params.formats.map((f) => (typeof f === 'string' ? { type: f } : f)) : [{ type: 'markdown' }],
        onlyMainContent: params.onlyMainContent !== false,
        waitFor: params.waitFor ?? 0,
      };
      if (params.actions && params.actions.length > 0) {
        body.actions = params.actions.map((a: FirecrawlScrapeAction) => {
          if (a.type === 'wait') {
            return { type: 'wait', milliseconds: a.milliseconds ?? 1000 };
          }
          return { type: 'wait', milliseconds: 1000 };
        });
      }
      const res = await fetchWithRetry(`${FIRECRAWL_BASE}/scrape`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as ScrapeApiResponse;
      if (!res.ok) {
        throw new Error(json.error || `Firecrawl scrape failed: ${res.status}`);
      }
      if (!json.success || !json.data) {
        throw new Error(json.error || 'Firecrawl scrape returned no data');
      }
      const content = json.data.markdown ?? '';
      return { content };
    },

    async firecrawl_search(params: Parameters<FirecrawlMCPClient['firecrawl_search']>[0]): Promise<{ results: FirecrawlSearchResultItem[] }> {
      const body: Record<string, unknown> = {
        query: params.query,
        limit: params.limit ?? 5,
        sources: (params.sources && params.sources.length > 0 ? params.sources : ['web']).map((s) => ({ type: s })),
      };
      if (params.scrapeOptions) {
        body.scrapeOptions = {
          formats: (params.scrapeOptions.formats || ['markdown']).map((f) => (typeof f === 'string' ? { type: f } : f)),
          onlyMainContent: params.scrapeOptions.onlyMainContent !== false,
        };
      }
      const res = await fetchWithRetry(`${FIRECRAWL_BASE}/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as SearchApiResponse;
      if (!res.ok) {
        throw new Error(json.error || `Firecrawl search failed: ${res.status}`);
      }
      if (!json.success || !json.data) {
        throw new Error(json.error || 'Firecrawl search returned no data');
      }
      const web = json.data.web || [];
      const results: FirecrawlSearchResultItem[] = web.map((item) => ({
        title: item.title,
        url: item.url,
        description: item.description,
        snippet: item.description,
        markdown: item.markdown ?? undefined,
        metadata: item.metadata,
      }));
      return { results };
    },
  };
}

export function getFirecrawlClientFromEnv(): FirecrawlMCPClient | null {
  const key = getApiKey();
  if (!key || key.trim() === '') return null;
  return createFirecrawlApiClient(key.trim());
}
