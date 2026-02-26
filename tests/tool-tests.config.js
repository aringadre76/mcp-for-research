module.exports = {
  tools: [
    {
      name: 'research_search',
      cases: [
        {
          args: { query: 'machine learning', maxResults: 2, sources: ['pubmed'] },
          expectContent: true,
          expectSubstring: 'papers'
        },
        {
          args: { query: '', maxResults: 1 },
          expectContent: true,
          expectSubstring: 'Error'
        }
      ]
    },
    {
      name: 'paper_analysis',
      cases: [
        {
          args: { identifier: '33844136', analysisType: 'basic' },
          expectContent: true
        },
        {
          args: { identifier: '99999999999' },
          expectContent: true,
          expectSubstring: 'No paper found'
        }
      ]
    },
    {
      name: 'citation_manager',
      cases: [
        {
          args: { identifier: '33844136', action: 'count' },
          expectContent: true
        },
        {
          args: { identifier: '33844136', action: 'generate', format: 'apa' },
          expectContent: true
        }
      ]
    },
    {
      name: 'research_preferences',
      cases: [
        {
          args: { action: 'get', category: 'search' },
          expectContent: true,
          expectSubstring: 'Prefer Firecrawl'
        },
        {
          args: { action: 'get', category: 'all' },
          expectContent: true
        }
      ]
    },
    {
      name: 'web_research',
      cases: [
        {
          args: { action: 'scrape', url: 'https://example.com' },
          expectContent: true
        },
        {
          args: { action: 'search', query: 'test' },
          expectContent: true
        }
      ]
    }
  ]
};
