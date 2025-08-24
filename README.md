# Scholarly Research MCP Server

A powerful, consolidated research tool that helps you find and analyze academic research papers from PubMed, Google Scholar, ArXiv, and JSTOR through just 5 powerful tools.

[![NPM](https://img.shields.io/badge/npm-published-orange)](https://www.npmjs.com/package/scholarly-research-mcp)
[![GitHub](https://img.shields.io/badge/github-repo-blue)](https://github.com/aringadre76/mcp-for-research)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## What This Tool Does

This tool helps you:
- **Find research papers** on any topic from multiple academic databases
- **Read full papers** when available (not just abstracts)
- **Extract key information** like quotes, statistics, and findings
- **Get citations** in the format you need for your work
- **Search within papers** to find specific information
- **Organize research** with customizable preferences

## Key Features

- **5 Consolidated Tools**: Powerful, multi-functional tools instead of 24 separate ones
- **Multi-Source Search**: PubMed, Google Scholar, ArXiv, and JSTOR
- **User Preferences**: Customizable search and display settings
- **Content Extraction**: Full-text paper access and analysis
- **Citation Management**: Multiple citation format support
- **Error Handling**: Robust fallback mechanisms

## Project Structure

This tool is organized into several key components:

### **Core Components**
```
src/
├── index.ts                           # Main server entry point (consolidated)
├── adapters/                          # Data source connectors
│   ├── pubmed.ts                      # PubMed API integration
│   ├── google-scholar.ts              # Google Scholar web scraping
│   ├── google-scholar-firecrawl.ts    # Firecrawl integration
│   ├── arxiv.ts                       # ArXiv integration
│   ├── unified-search.ts              # Basic multi-source search
│   ├── enhanced-unified-search.ts     # Advanced multi-source search
│   └── preference-aware-unified-search.ts # User preference integration
├── preferences/                       # User preference management
│   └── user-preferences.ts            # Preference storage and retrieval
└── models/                            # Data structures and interfaces
    ├── paper.ts                       # Paper data models
    ├── search.ts                      # Search parameter models
    └── preferences.ts                 # Preference models
```

### **Documentation**
```
docs/
├── ARCHITECTURE.md                    # Technical system design
├── API_REFERENCE.md                   # Complete API documentation
├── DATA_MODELS.md                     # Data structure definitions
├── DEVELOPMENT.md                     # Developer setup guide
└── TROUBLESHOOTING.md                 # Problem-solving guide
```

### **Testing**
```
tests/
├── test-preferences.js                # Preference system tests
├── test-all-tools-simple.sh           # Bash test runner (recommended)
├── test_all_tools.py                  # Python test runner
└── test-all-tools.js                  # JavaScript test runner
```

### **Configuration**
```
├── package.json                       # Project dependencies and scripts
├── tsconfig.json                      # TypeScript configuration
├── .env.example                       # Environment variables template
└── README.md                          # This file
```

## Available Tools

The server provides **5 consolidated MCP tools** that replace the previous 24 individual tools:

### 1. **`research_search`**
Comprehensive research paper search across multiple sources with advanced filtering and unified results.

**Combines**: All individual search tools from PubMed, Google Scholar, ArXiv, and JSTOR
**Parameters**: Query, sources, filters, display options, sorting

### 2. **`paper_analysis`**
Get comprehensive paper information, full text, and analysis including quotes, statistics, and findings.

**Combines**: Paper retrieval, content extraction, and analysis tools
**Parameters**: Identifier, analysis type, quote limits, section lengths

### 3. **`citation_manager`**
Generate citations in multiple formats and get citation information including counts and related papers.

**Combines**: Citation tools, citation counting, and related paper discovery
**Parameters**: Identifier, action, format, related paper limits

### 4. **`research_preferences`**
Manage research preferences including source priorities, search settings, display options, and caching.

**Combines**: All preference management tools
**Parameters**: Action, category, various preference values

### 5. **`web_research`**
Perform web-based research using Firecrawl for reliable content extraction and analysis.

**Combines**: Firecrawl integration and web research tools
**Parameters**: Action, targets, options, crawling limits

## Quick Start

### Option 1: Use Through AI Assistants (Easiest - No Setup Required)
If you're not comfortable with technical setup, you can use this tool through AI assistants like:
- **Claude** (Anthropic)
- **ChatGPT** (OpenAI) 
- **Cursor** (Code editor with AI)

These assistants can use this tool to help you find research papers without any setup on your part.

### Option 2: Set Up MCP on Your Computer (For Advanced Users)
This option lets you use the tool directly with AI assistants on your computer. It's like giving your AI assistant a special tool to find research papers.

## Setting Up MCP (Model Context Protocol)

MCP is like a "language" that lets AI assistants talk to tools on your computer. Think of it like installing a special app that your AI assistant can use.

### What You Need
- **A computer** (Windows, Mac, or Linux)
- **An AI assistant** that supports MCP (like Claude Desktop, Cursor, or others)
- **Basic computer skills** (downloading files, running programs)

### Step-by-Step Setup

1. **Download the tool**
   ```bash
   git clone https://github.com/aringadre76/mcp-for-research.git
   cd mcp-for-research
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the tool**
   ```bash
   npm run build
   ```

4. **Configure your AI assistant**
   - Find "MCP Servers" or "Tools" in your AI assistant's settings
   - Add a new MCP server
   - Set the command to: `node dist/index.js`
   - Set the working directory to your project folder

5. **Test the setup**
   ```bash
   npm run test:all-tools-bash
   ```

## Usage Examples

### Search for Papers
```json
{
  "method": "tools/call",
  "params": {
    "name": "research_search",
    "arguments": {
      "query": "machine learning",
      "sources": ["pubmed", "arxiv"],
      "maxResults": 15,
      "startDate": "2020/01/01"
    }
  }
}
```

### Analyze a Paper
```json
{
  "method": "tools/call",
  "params": {
    "name": "paper_analysis",
    "arguments": {
      "identifier": "12345678",
      "analysisType": "complete",
      "maxQuotes": 20
    }
  }
}
```

### Get Citations
```json
{
  "method": "tools/call",
  "params": {
    "name": "citation_manager",
    "arguments": {
      "identifier": "12345678",
      "action": "all",
      "format": "apa"
    }
  }
}
```

## Benefits of the Consolidated Approach

✅ **80% reduction** in tool count (24 → 5)  
✅ **Easier to remember** and use  
✅ **More powerful** - multiple operations in single calls  
✅ **Better performance** - fewer tool registrations  
✅ **Easier maintenance** - less code duplication  
✅ **Consistent interface** - similar parameter patterns  

## Migration from Previous Version

The consolidated tools are **backward compatible** - you can still access the same functionality, just through fewer, more powerful tools. Each consolidated tool accepts parameters that let you specify exactly what you want to do.

| Old Tool | New Tool | Notes |
|----------|----------|-------|
| `search_papers` | `research_search` | Use `sources: ["pubmed"]` |
| `get_paper_by_id` | `paper_analysis` | Use `analysisType: "basic"` |
| `get_full_text` | `paper_analysis` | Use `analysisType: "full-text"` |
| `get_citation` | `citation_manager` | Use `action: "generate"` |
| `set_source_preference` | `research_preferences` | Use `action: "set", category: "source"` |

## Troubleshooting

### Common Issues

**Q: The tool doesn't start**
A: Make sure you've run `npm install` and `npm run build` first.

**Q: My AI assistant can't find the tools**
A: Check that the MCP server path is correct in your AI assistant's settings.

**Q: Searches return no results**
A: Try different search terms or check if your sources are enabled in preferences.

**Q: How do I get papers in a specific format?**
A: Use the citation tools to get the paper in the format you need (APA, MLA, etc.).

## Development

### Running Tests
```bash
npm run test:all-tools-bash
```

### Building
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

## Contributing

We welcome contributions! Please see our contributing guidelines and feel free to submit issues or pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you need help:
1. Check the troubleshooting section above
2. Look at the documentation in the `docs/` folder
3. Open an issue on GitHub
4. Check the CHANGELOG.md for recent updates

## Version History

- **v2.0.0**: Consolidated 24 tools into 5 powerful tools
- **v1.4.x**: Previous version with 24 individual tools
- **v1.0.x**: Initial release

---

**Note**: This tool is designed to be easy to use while providing powerful research capabilities. The consolidated approach makes it simpler to use while maintaining all the functionality of the previous version.
