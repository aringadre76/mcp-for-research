# Scholarly Research MCP Server

A Model Context Protocol (MCP) server that provides access to academic research papers across multiple sources including PubMed, JSTOR, and Google Scholar. **Now with enhanced capabilities for reading full text content, extracting paper sections, and finding specific evidence and quotes for research and essays.**

## 🆕 What's New in v1.3.0

- **Fixed PMC URL Issues**: Corrected PubMed Central URL handling for reliable full-text access
- **Enhanced Full Text Retrieval**: Increased default text length from 5,000 to 50,000 characters
- **Improved Section Extraction**: Better algorithms for identifying and organizing paper sections
- **Dual URL Support**: Now supports both PMCID and PMID formats for accessing papers
- **Better Content Processing**: Enhanced HTML cleaning and text extraction from PMC sources

## Features

- **PubMed Integration**: Search and fetch papers using NCBI's E-utilities API
- **Full Text Extraction**: Access complete paper content when available (up to 50,000+ characters)
- **Section Analysis**: Extract and organize paper sections (Introduction, Methods, Results, etc.)
- **Evidence Mining**: Find specific quotes, statistics, findings, and conclusions
- **Content Search**: Search within papers for specific terms and phrases
- **Rate Limiting**: Built-in rate limiting to respect API constraints
- **Structured Data**: Clean, normalized paper objects with metadata
- **MCP Protocol**: Standard interface for AI assistants and tools
- **PMC Integration**: Direct access to PubMed Central full-text articles
- **Dual Identifier Support**: Works with both PMID and PMCID identifiers

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

### **Paper Discovery Tools**

#### 1. search_papers
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

#### 2. get_paper_by_id
Fetch a specific paper by its PubMed ID (PMID).

**Parameters:**
- `pmid` (required): PubMed ID of the paper

#### 3. get_paper_details
Get detailed information about a paper including abstract and metadata.

**Parameters:**
- `pmid` (required): PubMed ID of the paper

### **Content Extraction Tools** 🆕

#### 4. get_full_text
Get the complete text content of a paper for detailed analysis.

**Parameters:**
- `pmid` (required): PubMed ID of the paper
- `maxLength` (optional): Maximum length of text to return (default: 50000 characters)

**Example:**
```json
{
  "pmid": "12345678",
  "maxLength": 10000
}
```

#### 5. extract_paper_sections
Extract and organize the main sections of a paper (Introduction, Methods, Results, etc.).

**Parameters:**
- `pmid` (required): PubMed ID of the paper
- `maxSectionLength` (optional): Maximum length of each section (default: 1000 characters)

**Example:**
```json
{
  "pmid": "12345678",
  "maxSectionLength": 1500
}
```

#### 6. search_within_paper
Search for specific terms, quotes, or evidence within a paper.

**Parameters:**
- `pmid` (required): PubMed ID of the paper
- `searchTerm` (required): Term or phrase to search for within the paper
- `maxResults` (optional): Maximum number of matching sentences to return (default: 10)

**Example:**
```json
{
  "pmid": "12345678",
  "searchTerm": "statistical significance",
  "maxResults": 15
}
```

#### 7. get_evidence_quotes
Extract specific quotes and evidence from a paper for use in essays or research.

**Parameters:**
- `pmid` (required): PubMed ID of the paper
- `evidenceType` (optional): Type of evidence to extract (`quotes`, `statistics`, `findings`, `conclusions`, `all`) (default: `all`)
- `maxQuotes` (optional): Maximum number of quotes to return (default: 15)

**Example:**
```json
{
  "pmid": "12345678",
  "evidenceType": "statistics",
  "maxQuotes": 20
}
```

### **Citation and Reference Tools**

#### 8. get_citation
Get citation in various formats (BibTeX, EndNote, APA, MLA, RIS).

**Parameters:**
- `pmid` (required): PubMed ID of the paper
- `format` (required): Citation format (`bibtex`, `endnote`, `apa`, `mla`, `ris`)

#### 9. get_citation_count
Get the number of times a paper has been cited.

**Parameters:**
- `pmid` (required): PubMed ID of the paper

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
- `fullText`: Full text content (when available)
- `sections`: Organized paper sections (when extracted)

## 🚀 Enhanced Full Text Access

The server now provides significantly improved access to full-text papers:

### **Default Text Length**
- **Previous**: Limited to 5,000 characters by default
- **Current**: Now provides up to 50,000 characters by default
- **Customizable**: Can be set to any length up to the full paper content

### **URL Format Support**
- **PMCID Format**: `https://pmc.ncbi.nlm.nih.gov/articles/PMC{pmcid}/`
- **PMID Format**: `https://pmc.ncbi.nlm.nih.gov/articles/pmid/{pmid}/`
- **Fallback Logic**: Automatically tries multiple access methods for maximum success rate

### **Content Quality Improvements**
- Better HTML tag removal and text cleaning
- Improved section detection algorithms
- Enhanced error handling and fallback mechanisms

## Paper Section Structure

When extracting sections, each section includes:
- `title`: Section title (e.g., "Introduction", "Methods", "Results")

## 🔧 Troubleshooting

### **Full Text Access Issues**
If you're having trouble accessing full text content:

1. **Check Paper Availability**: Ensure the paper has a PMCID (PubMed Central ID)
2. **Use PMID Fallback**: The system automatically tries both PMCID and PMID formats
3. **Increase maxLength**: Set a higher `maxLength` parameter for longer content
4. **Check PMC Status**: Verify the paper is available in PubMed Central

### **Section Extraction**
- **No Sections Found**: Some papers may not have clearly defined sections
- **Use Search Instead**: Try `search_within_paper` for specific content
- **Adjust Section Length**: Increase `maxSectionLength` for more detailed sections

### **Rate Limiting**
- **429 Errors**: PubMed API rate limits are automatically handled
- **API Key**: Consider adding a PubMed API key for higher rate limits
- `content`: Section content text
- `level`: Section hierarchy level (1 for main sections, 2 for subsections)
- `subsections`: Nested subsections (if any)

## Evidence Types

The `get_evidence_quotes` tool can extract different types of evidence:

- **quotes**: Direct quotes, parenthetical statements, and quoted text
- **statistics**: Numerical data, percentages, ratios, and statistical findings
- **findings**: Sentences containing research findings and discoveries
- **conclusions**: Concluding statements and implications
- **all**: All types of evidence combined

## Use Cases

### **For Researchers:**
- Extract specific findings from papers
- Find statistical evidence for arguments
- Gather quotes for literature reviews
- Analyze paper structure and organization

### **For Students:**
- Find evidence for essays and papers
- Extract key statistics and findings
- Get properly formatted citations
- Understand paper organization

### **For Writers:**
- Find supporting evidence for articles
- Extract relevant quotes and statistics
- Verify claims with primary sources
- Build comprehensive bibliographies

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
- Full text access fallbacks

## Development

### Project Structure
```
├── src/                    # Source code
│   ├── index.ts           # Main server entry point
│   └── adapters/
│       └── pubmed.ts      # PubMed API adapter with full text support
├── tests/                  # Test files
├── scripts/                # Utility scripts
├── docs/                   # Documentation
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

## 📋 Changelog

### v1.3.0 (Latest)
- **Fixed PMC URL Issues**: Corrected base URL from `www.ncbi.nlm.nih.gov/pmc` to `pmc.ncbi.nlm.nih.gov`
- **Added PMID-based URL Support**: Now supports both PMCID and PMID formats for full text access
- **Increased Default Text Length**: Default `maxLength` increased from 5,000 to 50,000 characters
- **Enhanced Content Processing**: Better HTML cleaning and text extraction from PMC sources
- **Improved Section Detection**: Better algorithms for identifying and organizing paper sections
- **Fallback Logic**: Added automatic fallback between PMCID and PMID access methods

### v1.2.3
- Initial release with basic PubMed integration
- Full text extraction capabilities
- Section analysis and evidence mining

## Roadmap

- [x] Phase 1: PubMed Integration
- [x] Phase 2: Full Text Extraction
- [x] Phase 3: Section Analysis
- [x] Phase 4: Evidence Mining
- [x] Phase 5: Enhanced PMC Access & URL Handling
- [ ] Phase 6: JSTOR Integration
- [ ] Phase 7: Google Scholar Integration
- [ ] Phase 8: Advanced Features
- [ ] Phase 9: Integration & Testing

## Support

For issues and questions, please open an issue on GitHub.

## Examples

### **Finding Evidence for an Essay**
```json
{
  "pmid": "12345678",
  "evidenceType": "statistics",
  "maxQuotes": 10
}
```

### **Extracting Paper Sections**
```json
{
  "pmid": "12345678",
  "maxSectionLength": 2000
}
```

### **Searching Within a Paper**
```json
{
  "pmid": "12345678",
  "searchTerm": "machine learning algorithm",
  "maxResults": 20
}
```
