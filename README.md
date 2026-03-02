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
- **Web research (Firecrawl)**: When `FIRECRAWL_API_KEY` is set in the environment (or a Firecrawl client is provided), the `web_research` tool can scrape URLs and run web search. See [Configuration](#configuration) and copy `.env.example` to `.env` to set your key. Get an API key at [firecrawl.dev](https://firecrawl.dev).

## Configuration Overview

Configuration for environment variables and API keys is documented in more detail in the `docs/` folder and `.env.example`. At a high level, you configure API keys via environment variables and should avoid committing any secret values.

## Project Structure

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
├── README.md                          # Documentation index and overview
├── CONSOLIDATION_GUIDE.md             # Complete consolidation guide
├── TOOL_CONSOLIDATION.md              # Quick tool mapping reference
├── PROJECT_STRUCTURE.md               # Clean project organization
├── API_REFERENCE.md                   # Complete API documentation
├── ARCHITECTURE.md                    # Technical system design
├── DATA_MODELS.md                     # Data structure definitions
└── DEVELOPMENT.md                     # Developer setup guide
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

## Quick Start

Pick your AI tool below to get started quickly:

[![Add to Cursor](https://img.shields.io/badge/Add_to_Cursor-black?style=for-the-badge)](cursor://anysphere.cursor-deeplink/mcp/install?name=scholarly-research-mcp&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsInNjaG9sYXJseS1yZXNlYXJjaC1tY3AiXX0=)
[![Add to VS Code](https://img.shields.io/badge/Add_to_VS_Code-black?style=for-the-badge&logo=visualstudiocode&logoColor=007ACC)](#vs-code--copy-configuration)
[![Add to Claude](https://img.shields.io/badge/Add_to_Claude-black?style=for-the-badge&logo=anthropic&logoColor=white)](#claude-desktop--copy-configuration)
[![Add to ChatGPT](https://img.shields.io/badge/Add_to_ChatGPT-black?style=for-the-badge&logo=openai&logoColor=white)](#manual--copy-configuration-json)
[![Add to Codex](https://img.shields.io/badge/Add_to_Codex-black?style=for-the-badge&logo=openai&logoColor=white)](#claude-code--gemini--codex--cli)
[![Add to Gemini](https://img.shields.io/badge/Add_to_Gemini-black?style=for-the-badge&logo=googlegemini&logoColor=white)](#claude-code--gemini--codex--cli)

> **Cursor** is a true one-click install via the deeplink above. For other tools, the buttons jump to the relevant configuration section.

### Claude Desktop – Copy configuration

Add this to your `claude_desktop_config.json` under `mcpServers`:

```json
{
  "mcpServers": {
    "scholarly-research-mcp": {
      "command": "npx",
      "args": ["-y", "scholarly-research-mcp"]
    }
  }
}
```

Then fully restart Claude Desktop.  
Config file locations:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Cursor IDE – One‑click install

If you use Cursor, you can install this MCP server with a single click:

[**One‑Click – Add to Cursor**](cursor://anysphere.cursor-deeplink/mcp/install?name=scholarly-research-mcp&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsInNjaG9sYXJseS1yZXNlYXJjaC1tY3AiXX0=)

This opens Cursor and pre-fills an MCP server that runs `npx -y scholarly-research-mcp`. You’ll need Node.js and npm available on your system.

### VS Code – Copy configuration

Create `.vscode/mcp.json` in your project (or edit your global MCP config) and add:

```json
{
  "servers": {
    "scholarly-research-mcp": {
      "command": "npx",
      "args": ["-y", "scholarly-research-mcp"]
    }
  }
}
```

Then reload VS Code so the Copilot / MCP integration picks it up.

### Claude Code / Gemini / Codex – CLI

If your tool lets you point at a local MCP server command, use:

```bash
npx -y scholarly-research-mcp
```

or, after cloning this repo and building:

```bash
node dist/index.js
```

Configure your AI tool to use that command as an MCP server.

### Manual – Copy configuration JSON

For any MCP-compatible assistant that accepts a JSON config (similar to `mcp.json`), use:

```json
{
  "mcpServers": {
    "scholarly-research-mcp": {
      "command": "npx",
      "args": ["-y", "scholarly-research-mcp"]
    }
  }
}
```

Paste this into the assistant’s MCP configuration and adjust paths/env vars if needed.

## Requirements

- **Node.js >= 18.17** (LTS recommended). Check with `node -v`.
- **npm** (comes with Node.js).
- **Google Chrome or Chromium** (optional) – only needed for Google Scholar scraping and ArXiv full-text extraction. If you only use PubMed, ArXiv API search, or Firecrawl-based features, no browser is required. You can point to a custom binary with `PUPPETEER_EXECUTABLE_PATH` or `CHROME_PATH`.

## Local MCP Setup

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

6. **Connect from your AI assistant**
   - Open your assistant's settings and find the section for MCP servers or tools.
   - Add a new MCP server that runs the command `node dist/index.js` in the `mcp-for-research` folder.
   - Save the configuration and ask the assistant to list or use the `research_search` tool to confirm it is working.

## Available Tools

The server provides **5 consolidated MCP tools** that replace the previous 24 individual tools:

### 1. **`research_search`**
Comprehensive research paper search across PubMed, Google Scholar, and ArXiv. Uses the preference-aware adapter: when Firecrawl is configured and the preference is set, Google Scholar can use Firecrawl instead of Puppeteer. JSTOR is accepted in `sources` but not implemented; if requested, a note is appended: "JSTOR is not implemented; results are from other sources."

**Parameters**: Query, sources (pubmed, google-scholar, arxiv, jstor), maxResults, startDate, endDate, journal, author, includeAbstracts, sortBy

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

**Requires**: Set `FIRECRAWL_API_KEY` for scrape and search. Extract, map, and crawl are not implemented; use scrape or search.
**Parameters**: Action (scrape, search, extract, map, crawl), url, query, maxResults, formats, onlyMainContent, waitFor

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
A: Make sure you have Node.js >= 18.17 installed (`node -v`). If running from a clone, run `npm install && npm run build` first.

**Q: My AI assistant can't find the tools**
A: Check that the MCP server path is correct in your AI assistant's settings. After adding the config, fully restart the assistant.

**Q: Google Scholar or ArXiv full-text features fail with a Chrome error**
A: These features need a local Chrome or Chromium binary. Install Google Chrome, or set `PUPPETEER_EXECUTABLE_PATH=/path/to/chrome`. PubMed, ArXiv API search, and Firecrawl features work without a browser.

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

## Documentation

For comprehensive documentation, guides, and technical details, see the [`docs/`](./docs/) directory:

- **[Documentation Overview](./docs/README.md)** - Complete documentation index
- **[Consolidation Guide](./docs/CONSOLIDATION_GUIDE.md)** - Detailed explanation of the new approach
- **[Tool Reference](./docs/TOOL_CONSOLIDATION.md)** - Quick mapping from old to new tools
- **[API Reference](./docs/API_REFERENCE.md)** - Complete tool documentation
- **[Project Structure](./docs/PROJECT_STRUCTURE.md)** - Clean project organization

## Version History

- **v2.0.2**: One-click install buttons, switched to puppeteer-core (no Chromium download), pinned cheerio for Node 18 compatibility, added engines field, security fix for .env in npm package
- **v2.0.1**: Firecrawl web research and Google Scholar integration improvements, documentation cleanup
- **v2.0.0**: Consolidated 24 tools into 5 powerful tools
- **v1.4.x**: Previous version with 24 individual tools
- **v1.0.x**: Initial release

