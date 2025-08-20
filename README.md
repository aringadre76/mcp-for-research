# Scholarly Research MCP Server

A Model Context Protocol (MCP) server that provides access to academic research papers across multiple sources including PubMed, JSTOR, and Google Scholar.

## Features

- **PubMed Integration**: Search and fetch papers using NCBI's E-utilities API
- **Rate Limiting**: Built-in rate limiting to respect API constraints
- **Structured Data**: Clean, normalized paper objects with metadata
- **MCP Protocol**: Standard interface for AI assistants and tools

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd scholarly-research-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Configuration

### PubMed API Key (Optional)
While not required, you can get a free API key from NCBI to increase rate limits:
1. Go to [NCBI Account](https://www.ncbi.nlm.nih.gov/account/)
2. Create an account and get your API key
3. Set the environment variable: `export PUBMED_API_KEY=your_key_here`

## Usage

### Starting the Server
```bash
npm start
```

### Development Mode
```bash
npm run dev
```

## Available Tools

### 1. search_papers
Search for academic papers with various filters.

**Parameters:**
- `query` (required): Search query string
- `maxResults` (optional): Maximum number of results (default: 20)
- `startDate` (optional): Start date in YYYY/MM/DD format
- `endDate` (optional): End date in YYYY/MM/DD format
- `journal` (optional): Filter by specific journal
- `author` (optional): Filter by specific author

**Example:**
```json
{
  "query": "machine learning",
  "maxResults": 10,
  "startDate": "2020/01/01",
  "journal": "Nature"
}
```

### 2. get_paper_by_id
Fetch a specific paper by its PubMed ID (PMID).

**Parameters:**
- `pmid` (required): PubMed ID of the paper

**Example:**
```json
{
  "pmid": "12345678"
}
```

### 3. get_paper_details
Get detailed information about a paper including abstract and metadata.

**Parameters:**
- `pmid` (required): PubMed ID of the paper

**Example:**
```json
{
  "pmid": "12345678"
}
```

### 4. get_citation
Get citation in various formats (BibTeX, EndNote, APA, MLA, RIS).

**Parameters:**
- `pmid` (required): PubMed ID of the paper
- `format` (required): Citation format (`bibtex`, `endnote`, `apa`, `mla`, `ris`)

**Example:**
```json
{
  "pmid": "12345678",
  "format": "bibtex"
}
```

### 5. get_citation_count
Get the number of times a paper has been cited.

**Parameters:**
- `pmid` (required): PubMed ID of the paper

**Example:**
```json
{
  "pmid": "12345678"
}
```

## Paper Object Structure

Each paper returned includes:
- `pmid`: PubMed ID
- `title`: Paper title
- `abstract`: Abstract text
- `authors`: Array of author names
- `journal`: Journal name
- `publicationDate`: Publication year
- `doi`: Digital Object Identifier (if available)
- `citationCount`: Citation count (if available)

## Rate Limiting

The server implements rate limiting to respect PubMed's API constraints:
- Minimum 100ms between requests
- Automatic delays to prevent API abuse
- Configurable intervals for different API endpoints

## Error Handling

The server provides comprehensive error handling:
- Network timeout protection (10 seconds)
- XML parsing error handling
- Graceful fallbacks for missing data
- User-friendly error messages

## Development

### Project Structure
```
├── src/                    # Source code
│   ├── index.ts           # Main server entry point
│   └── adapters/
│       └── pubmed.ts      # PubMed API adapter
├── tests/                  # Test files
│   ├── test-pubmed-adapter.js
│   ├── test-mcp-client.js
│   ├── test-citations.js
│   └── interactive-test.js
├── scripts/                # Utility scripts
│   ├── cursor-mcp-client.js
│   └── mcp-config.json
├── docs/                   # Documentation
│   ├── CURSOR_SETUP.md
│   └── PLAN.md
├── dist/                   # Built output (generated)
├── package.json            # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

### Adding New Sources
To add support for new academic sources:

1. Create a new adapter in `src/adapters/`
2. Implement the source-specific API calls
3. Add the adapter to the main server
4. Update the tool implementations

### Testing
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Roadmap

- [x] Phase 1: PubMed Integration
- [ ] Phase 2: JSTOR Integration
- [ ] Phase 3: Google Scholar Integration
- [ ] Phase 4: Advanced Features
- [ ] Phase 5: Integration & Testing

## Support

For issues and questions, please open an issue on GitHub.
