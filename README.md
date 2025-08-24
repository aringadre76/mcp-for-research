# Scholarly Research MCP Server

A comprehensive Model Context Protocol (MCP) server that provides access to academic research papers across multiple sources including PubMed, JSTOR, and Google Scholar. **Now with enhanced capabilities for reading full text content, extracting paper sections, finding specific evidence and quotes for research and essays, comprehensive Google Scholar integration via web scraping, and professional Firecrawl MCP integration for enhanced reliability.**

## 📊 Project Status

![Tests](https://img.shields.io/badge/tests-13%2F13%20passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.4.0-blue)
![Node.js](https://img.shields.io/badge/node.js-18%2B-green)
![License](https://img.shields.io/badge/license-MIT-yellow)
![NPM](https://img.shields.io/badge/npm-published-orange)

## 🚀 Quick Start

```bash
# Install from npm
npm install -g scholarly-research-mcp

# Or clone and run locally
git clone https://github.com/aringadre76/mcp-for-research.git
cd mcp-for-research
npm install
npm run build
npm start
```

## 🆕 What's New in v1.4.0

- **Google Scholar Integration**: Full web scraping support for Google Scholar search and paper details
- **Firecrawl MCP Integration**: Professional web scraping service for enhanced reliability
- **Unified Search Interface**: Combined search across PubMed and Google Scholar with deduplication
- **Enhanced Citation Tracking**: Google Scholar citation counts and related paper discovery
- **Multi-Source Paper Retrieval**: Access papers from both PubMed and Google Scholar simultaneously
- **Advanced Sorting Options**: Sort by relevance, date, or citation count across all sources
- **Dual Scraping Methods**: Choose between Firecrawl (recommended) and Puppeteer with automatic fallback

## 🆕 What's New in v1.3.0

- **Fixed PMC URL Issues**: Corrected PubMed Central URL handling for reliable full-text access
- **Enhanced Full Text Retrieval**: Increased default text length from 5,000 to 50,000 characters
- **Improved Section Extraction**: Better algorithms for identifying and organizing paper sections
- **Dual URL Support**: Now supports both PMCID and PMID formats for accessing papers
- **Better Content Processing**: Enhanced HTML cleaning and text extraction from PMC sources

## ✨ Features

### **Core Capabilities**
- **PubMed Integration**: Search and fetch papers using NCBI's E-utilities API
- **Google Scholar Integration**: Web scraping for comprehensive paper discovery
- **Firecrawl MCP Integration**: Professional web scraping service for enhanced reliability
- **Unified Search**: Combined search across multiple sources with deduplication
- **Full Text Extraction**: Access complete paper content when available (up to 50,000+ characters)

### **Advanced Features**
- **Section Analysis**: Extract and organize paper sections (Introduction, Methods, Results, etc.)
- **Evidence Mining**: Find specific quotes, statistics, findings, and conclusions
- **Content Search**: Search within papers for specific terms and phrases
- **Citation Tracking**: Google Scholar citation counts and related paper discovery
- **Dual Scraping Methods**: Choose between Firecrawl (recommended) and Puppeteer

### **Technical Features**
- **Rate Limiting**: Built-in rate limiting to respect API constraints
- **Structured Data**: Clean, normalized paper objects with metadata
- **MCP Protocol**: Standard interface for AI assistants and tools
- **PMC Integration**: Direct access to PubMed Central full-text articles
- **Dual Identifier Support**: Works with both PMID and PMCID identifiers
- **Automatic Fallback**: Seamless switching between scraping methods

## Installation

### Prerequisites

Before installing the Scholarly Research MCP Server, ensure you have the following prerequisites installed on your system:

**Note**: This server now includes Google Scholar integration via web scraping, which requires additional system dependencies for Puppeteer (Chrome/Chromium).

#### **Node.js and npm**
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)

#### **Git** (for cloning from repository)
- **Git**: Version 2.20.0 or higher

### Platform-Specific Installation

#### **Linux (Ubuntu/Debian)**

1. **Update system packages:**
```bash
sudo apt update && sudo apt upgrade -y
```

2. **Install Node.js and npm:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Install Puppeteer dependencies:**
```bash
sudo apt-get install -y \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget
```

4. **Verify installation:**
```bash
node --version
npm --version
```

5. **Install Git (if not already installed):**
```bash
sudo apt install git -y
```

6. **Clone the repository:**
```bash
git clone https://github.com/aringad76/mcp-for-research.git
cd mcp-for-research
```

7. **Install dependencies:**
```bash
npm install
```

8. **Build the project:**
```bash
npm run build
```

#### **Linux (CentOS/RHEL/Fedora)**

1. **Update system packages:**
```bash
sudo yum update -y
# For Fedora: sudo dnf update -y
```

2. **Install Node.js and npm:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
# For Fedora: sudo dnf install -y nodejs
```

3. **Verify installation:**
```bash
node --version
npm --version
```

4. **Install Git (if not already installed):**
```bash
sudo yum install git -y
# For Fedora: sudo dnf install git -y
```

5. **Clone and setup (same as Ubuntu/Debian):**
```bash
git clone https://github.com/aringad76/mcp-for-research.git
cd mcp-for-research
npm install
npm run build
```

#### **Linux (Arch Linux)**

1. **Update system packages:**
```bash
sudo pacman -Syu
```

2. **Install Node.js and npm:**
```bash
sudo pacman -S nodejs npm
```

3. **Install Git (if not already installed):**
```bash
sudo pacman -S git
```

4. **Clone and setup:**
```bash
git clone https://github.com/aringad76/mcp-for-research.git
cd mcp-for-research
npm install
npm run build
```

#### **macOS**

1. **Install Homebrew (if not already installed):**
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. **Add Homebrew to PATH (if using Apple Silicon):**
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

3. **Install Node.js and npm:**
```bash
brew install node
```

4. **Verify installation:**
```bash
node --version
npm --version
```

5. **Install Git (if not already installed):**
```bash
brew install git
```

6. **Clone the repository:**
```bash
git clone https://github.com/aringad76/mcp-for-research.git
cd mcp-for-research
```

7. **Install dependencies:**
```bash
npm install
```

8. **Build the project:**
```bash
npm run build
```

#### **Windows**

1. **Install Node.js:**
   - Go to [https://nodejs.org/](https://nodejs.org/)
   - Download the LTS version (18.x or higher)
   - Run the installer and follow the setup wizard
   - Ensure "Add to PATH" is checked during installation

2. **Verify Node.js installation:**
   - Open Command Prompt or PowerShell
   - Run:
```cmd
node --version
npm --version
```

3. **Install Git:**
   - Go to [https://git-scm.com/](https://git-scm.com/)
   - Download and install Git for Windows
   - Use default settings during installation

4. **Clone the repository:**
   - Open Command Prompt or PowerShell
   - Navigate to your desired directory
   - Run:
```cmd
git clone https://github.com/aringad76/mcp-for-research.git
cd mcp-for-research
```

5. **Install dependencies:**
```cmd
npm install
```

6. **Build the project:**
```cmd
npm run build
```

### Alternative Installation Methods

#### **Using npm directly (if already published):**
```bash
npm install -g scholarly-research-mcp
```

#### **Using Docker (if available):**
```bash
docker pull aringad76/scholarly-research-mcp
docker run -p 3000:3000 aringad76/scholarly-research-mcp
```

### Post-Installation Verification

After installation, verify everything is working:

1. **Check if the server starts:**
```bash
npm start
```

2. **Test the build:**
```bash
npm run build
```

3. **Run tests:**
```bash
npm test
```

4. **Test Google Scholar integration:**
```bash
npm run test:google-scholar
```

5. **Test unified search:**
```bash
npm run test:unified
```

6. **Test Firecrawl integration:**
```bash
npm run test:firecrawl
```

### Troubleshooting Installation Issues

#### **Common Linux Issues:**

**Permission Denied Errors:**
```bash
sudo chown -R $USER:$USER ~/.npm
sudo chown -R $USER:$USER ~/.config
```

**Node.js Version Issues:**
```bash
# Install Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

**Build Failures:**
```bash
# Clear npm cache
npm cache clean --force
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### **Common macOS Issues:**

**Homebrew Permission Issues:**
```bash
sudo chown -R $(whoami) /usr/local/bin /usr/local/lib /usr/local/sbin
chmod u+w /usr/local/bin /usr/local/lib /usr/local/sbin
```

**Node.js Path Issues:**
```bash
# Add to ~/.zshrc or ~/.bash_profile
export PATH="/usr/local/bin:$PATH"
```

#### **Common Windows Issues:**

**Path Not Found:**
- Ensure Node.js and Git are added to PATH during installation
- Restart Command Prompt/PowerShell after installation
- Check System Environment Variables

**Build Script Failures:**
```cmd
# Run as Administrator if needed
npm cache clean --force
rmdir /s node_modules
del package-lock.json
npm install
```

**Git Issues:**
- Ensure Git is installed and accessible from PATH
- Use Git Bash for better compatibility

### Development Environment Setup

For developers who want to contribute:

1. **Install TypeScript globally:**
```bash
npm install -g typescript ts-node
```

2. **Install development dependencies:**
```bash
npm install --save-dev
```

3. **Set up pre-commit hooks:**
```bash
npm run setup:hooks
```

4. **Configure your editor:**
   - Install TypeScript extensions
   - Configure ESLint and Prettier if using

### Configuration

#### **PubMed API Key (Optional)**
While not required, you can get a free API key from NCBI to increase rate limits:

1. Go to [NCBI Account](https://www.ncbi.nlm.nih.gov/account/)
2. Create an account and get your API key
3. Set the environment variable:

**Linux/macOS:**
```bash
export PUBMED_API_KEY=your_key_here
echo 'export PUBMED_API_KEY=your_key_here' >> ~/.bashrc
```

**Windows:**
```cmd
set PUBMED_API_KEY=your_key_here
```

**Or create a .env file:**
```bash
echo "PUBMED_API_KEY=your_key_here" > .env
```

## Usage

### Starting the Server
```bash
npm start
```

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run prod
```

## 🛠️ Available Tools

The server provides **16 comprehensive MCP tools** for scholarly research:

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

### **Google Scholar Integration Tools** 🆕

#### 8. search_google_scholar
Search for academic papers on Google Scholar using web scraping.

**Parameters:**
- `query` (required): Search query string
- `maxResults` (optional): Maximum number of results (default: 20)
- `startYear` (optional): Start year for publication range
- `endYear` (optional): End year for publication range
- `sortBy` (optional): Sort order (`relevance`, `date`, `citations`) (default: `relevance`)

**Example:**
```json
{
  "query": "deep learning",
  "maxResults": 15,
  "startYear": 2020,
  "sortBy": "citations"
}
```

#### 9. search_all_sources
Search for academic papers across both PubMed and Google Scholar with unified results.

**Parameters:**
- `query` (required): Search query string
- `maxResults` (optional): Maximum number of results (default: 20)
- `startDate` (optional): Start date in YYYY/MM/DD format
- `endDate` (optional): End year for publication range
- `journal` (optional): Filter by specific journal
- `author` (optional): Filter by specific author
- `sources` (optional): Sources to search (`pubmed`, `google-scholar`) (default: both)
- `sortBy` (optional): Sort order (`relevance`, `date`, `citations`) (default: `relevance`)

**Example:**
```json
{
  "query": "artificial intelligence",
  "maxResults": 25,
  "startDate": "2019/01/01",
  "endDate": 2024,
  "sources": ["pubmed", "google-scholar"],
  "sortBy": "citations"
}
```

#### 10. get_google_scholar_citations
Get citation count for a paper from Google Scholar.

**Parameters:**
- `title` (required): Title of the paper to search for

**Example:**
```json
{
  "title": "Attention Is All You Need"
}
```

#### 11. get_related_papers
Get related papers from either PubMed or Google Scholar.

**Parameters:**
- `identifier` (required): Paper identifier (PMID for PubMed, URL for Google Scholar)
- `source` (required): Source to search for related papers (`pubmed`, `google-scholar`)
- `maxResults` (optional): Maximum number of related papers (default: 10)

**Example:**
```json
{
  "identifier": "12345678",
  "source": "pubmed",
  "maxResults": 15
}
```

### **Firecrawl Integration Tools** 🆕

#### 12. search_with_firecrawl
Search for academic papers using Firecrawl MCP server for enhanced reliability.

**Parameters:**
- `query` (required): Search query for papers
- `maxResults` (optional): Maximum number of results (default: 20)
- `startDate` (optional): Start date in YYYY/MM/DD format
- `endDate` (optional): End year for publication range
- `journal` (optional): Filter by specific journal
- `author` (optional): Filter by specific author
- `sources` (optional): Sources to search (`pubmed`, `google-scholar`) (default: both)
- `sortBy` (optional): Sort order (`relevance`, `date`, `citations`) (default: relevance)
- `preferFirecrawl` (optional): Prefer Firecrawl over Puppeteer (default: true)

**Example:**
```json
{
  "query": "machine learning",
  "maxResults": 25,
  "sources": ["pubmed", "google-scholar"],
  "sortBy": "citations",
  "preferFirecrawl": true
}
```

#### 13. set_firecrawl_preference
Set whether to prefer Firecrawl over Puppeteer for Google Scholar searches.

**Parameters:**
- `preferFirecrawl` (required): Whether to prefer Firecrawl over Puppeteer

**Example:**
```json
{
  "preferFirecrawl": true
}
```

#### 14. get_search_method_info
Get information about the current search method and Firecrawl availability.

**Parameters:** None

**Example:**
```json
{}
```

### **Citation and Reference Tools**

#### 15. get_citation
Get citation in various formats (BibTeX, EndNote, APA, MLA, RIS).

**Parameters:**
- `pmid` (required): PubMed ID of the paper
- `format` (required): Citation format (`bibtex`, `endnote`, `apa`, `mla`, `ris`)

#### 16. get_citation_count
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

## 🆕 Google Scholar Integration

### **Web Scraping Approach**
Since Google Scholar doesn't provide an official API, this server uses two web scraping methods:

#### **Firecrawl MCP Server (Recommended)**
- **Professional Service**: Uses Firecrawl MCP server for enhanced reliability
- **Better Rate Limiting**: Professional web scraping with built-in rate limiting
- **Enhanced Error Handling**: Robust error handling and fallback mechanisms
- **Higher Success Rate**: More reliable than local browser automation

#### **Puppeteer (Local Fallback)**
- **Headless Browser**: Uses Puppeteer for reliable page rendering
- **Rate Limiting**: Built-in delays to respect Google Scholar's terms of service
- **User Agent Spoofing**: Mimics real browser behavior to avoid detection
- **Error Handling**: Graceful fallbacks when scraping encounters issues
- **Automatic Fallback**: Used when Firecrawl is unavailable

### **Data Sources**
- **Search Results**: Comprehensive paper search with filtering options
- **Citation Counts**: Real-time citation tracking from Google Scholar
- **Related Papers**: Discovery of related research papers
- **PDF Links**: Direct access to available PDF versions
- **Paper Details**: Enhanced metadata extraction from search results

### **Unified Search Benefits**
- **Deduplication**: Automatic removal of duplicate papers across sources
- **Source Attribution**: Clear indication of where each paper was found
- **Combined Metadata**: Rich information from both PubMed and Google Scholar
- **Flexible Filtering**: Choose specific sources or search across all
- **Advanced Sorting**: Sort by relevance, date, or citation count
- **Dual Scraping Methods**: Automatic fallback between Firecrawl and Puppeteer
- **Search Method Tracking**: Know which scraping method was used for each result
- **Enhanced Reliability**: Better success rates with professional web scraping

## Development

### Project Structure
```
├── src/                    # Source code
│   ├── index.ts           # Main server entry point
│   └── adapters/
│       ├── pubmed.ts      # PubMed API integration
│       ├── google-scholar.ts # Google Scholar web scraping
│       └── unified-search.ts # Combined search interface
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
# Run all tests
npm run test:all-tools-bash

# Run specific test suites
npm run test:google-scholar
npm run test:unified
npm run test:firecrawl

# Individual test suites
npm run test:all-tools-bash -- --basic
npm run test:all-tools-bash -- --adapters
npm run test:all-tools-bash -- --data
```

### **Test Coverage**
- ✅ **13/13 tests passing**
- ✅ Basic functionality validation
- ✅ Adapter instantiation testing
- ✅ Data validation and file checks
- ✅ Google Scholar scraping verification
- ✅ Unified search functionality
- ✅ Firecrawl integration testing

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
- [x] Phase 6: Google Scholar Integration ✅
- [x] Phase 7: Firecrawl MCP Integration ✅
- [x] Phase 8: Unified Search & Advanced Features ✅
- [x] Phase 9: Integration & Testing ✅
- [ ] Phase 10: JSTOR Integration
- [ ] Phase 11: Enhanced Analytics & Insights

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
