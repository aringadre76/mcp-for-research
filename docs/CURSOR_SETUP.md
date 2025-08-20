# 🚀 Cursor MCP Setup Guide

## Quick Start

### 1. Build and Start the MCP Server
```bash
npm run prod
```

### 2. Test the MCP Server
```bash
npm run cursor
```

This will start an interactive client where you can test all the tools:
- `search` - Search for papers
- `paper` - Get paper by PMID
- `citation` - Get citations in various formats
- `citations` - Get citation count
- `help` - Show available commands
- `quit` - Exit

## Adding to Cursor

### Option 1: Use the MCP Config File
1. Copy `mcp-config.json` to your Cursor configuration directory
2. Restart Cursor
3. The MCP server will be available as "scholarly-research"

### Option 2: Manual Setup in Cursor
1. In Cursor, go to Settings → MCP
2. Add a new MCP server:
   - **Name**: `scholarly-research`
   - **Command**: `node`
   - **Arguments**: `["dist/index.js"]`
   - **Working Directory**: Your project folder

## Available Tools

### 1. `search_papers`
Search for academic papers with filters.
```json
{
  "query": "machine learning",
  "maxResults": 5,
  "startDate": "2020/01/01",
  "journal": "Nature"
}
```

### 2. `get_paper_by_id`
Get a specific paper by PMID.
```json
{
  "pmid": "33844136"
}
```

### 3. `get_paper_details`
Get detailed paper information.
```json
{
  "pmid": "33844136"
}
```

### 4. `get_citation`
Get citations in various formats.
```json
{
  "pmid": "33844136",
  "format": "bibtex"
}
```

### 5. `get_citation_count`
Get paper citation count.
```json
{
  "pmid": "33844136"
}
```

## Testing Examples

### Search for Papers
```bash
npm run cursor
# Then type: search
# Enter query: "artificial intelligence"
# Max results: 3
```

### Get Paper Details
```bash
npm run cursor
# Then type: paper
# Enter PMID: 33844136
```

### Get Citation
```bash
npm run cursor
# Then type: citation
# Enter PMID: 33844136
# Format: bibtex
```

## Troubleshooting

### Server Won't Start
- Make sure you've run `npm install`
- Check that TypeScript is compiled: `npm run build`
- Verify Node.js version: `node --version` (should be 16+)

### MCP Connection Issues
- Ensure the server is running: `npm start`
- Check Cursor's MCP settings
- Restart Cursor after adding the MCP server

### API Errors
- Check your internet connection
- PubMed API might be temporarily unavailable
- Rate limiting: wait a few seconds between requests

## Production Use

For production use with Cursor:
1. Build the project: `npm run build`
2. Start the server: `npm start`
3. Add to Cursor MCP settings
4. Use in your AI conversations!

## Support

If you encounter issues:
1. Check the console output for error messages
2. Verify all dependencies are installed
3. Test with the interactive client first
4. Check the README.md for more details
