# Scholarly Research MCP Server - Consolidated Version

A streamlined version of the scholarly research tool that combines 24 individual tools into 5 powerful, multi-functional tools.

## What Changed

Instead of having 24 separate tools, this consolidated version provides the same functionality through 5 comprehensive tools:

### **Before (24 Tools)**
- `search_papers` - PubMed search
- `get_paper_by_pmcid` - Get paper by PMC ID
- `get_pmc_access_info` - PMC access information
- `get_paper_by_id` - Get paper by PMID
- `get_paper_details` - Paper details
- `get_full_text` - Full text extraction
- `extract_paper_sections` - Section extraction
- `search_within_paper` - Search within paper
- `get_evidence_quotes` - Evidence extraction
- `get_citation` - Citation generation
- `get_citation_count` - Citation count
- `get_related_papers` - Related papers
- `search_google_scholar` - Google Scholar search
- `get_google_scholar_citations` - Scholar citations
- `search_arxiv` - ArXiv search
- `get_arxiv_paper` - ArXiv paper details
- `search_jstor` - JSTOR search
- `get_jstor_paper` - JSTOR paper details
- `search_with_firecrawl` - Firecrawl search
- `set_firecrawl_preference` - Firecrawl settings
- `set_source_preference` - Source preferences
- `set_search_preferences` - Search preferences
- `set_display_preferences` - Display preferences
- `export_preferences` - Export preferences

### **After (5 Tools)**
1. **`research_search`** - Unified search across all sources
2. **`paper_analysis`** - Comprehensive paper analysis and content extraction
3. **`citation_manager`** - Citation generation, counts, and related papers
4. **`research_preferences`** - All preference management in one place
5. **`web_research`** - Web scraping and content extraction

## Benefits of Consolidation

### **Easier to Use**
- **Fewer tools to remember** - 5 instead of 24
- **Logical grouping** - Related functions are together
- **Consistent interface** - Similar parameter patterns across tools

### **More Powerful**
- **Combined functionality** - Multiple operations in single calls
- **Better error handling** - Centralized error management
- **Unified results** - Consistent output format

### **Easier to Maintain**
- **Less code duplication** - Shared logic between functions
- **Simpler testing** - Fewer individual tools to test
- **Easier debugging** - Centralized error handling

## Tool Details

### 1. `research_search`
**What it does**: Searches across PubMed, Google Scholar, ArXiv, and JSTOR simultaneously
**Combines**: All individual search tools from the original 24
**Parameters**:
- `query` - Search term
- `sources` - Which databases to search
- `filters` - Date ranges, journals, authors
- `display` - Abstracts, sorting, result limits

**Example**:
```json
{
  "query": "machine learning",
  "sources": ["pubmed", "arxiv"],
  "maxResults": 15,
  "startDate": "2020/01/01"
}
```

### 2. `paper_analysis`
**What it does**: Gets comprehensive paper information, full text, quotes, statistics, and findings
**Combines**: Paper retrieval, content extraction, and analysis tools
**Parameters**:
- `identifier` - PMID, PMCID, DOI, or ArXiv ID
- `analysisType` - Basic, full-text, quotes, statistics, findings, or complete
- `limits` - Quote counts, section lengths

**Example**:
```json
{
  "identifier": "12345678",
  "analysisType": "complete",
  "maxQuotes": 20
}
```

### 3. `citation_manager`
**What it does**: Generates citations, gets citation counts, and finds related papers
**Combines**: Citation tools, citation counting, and related paper discovery
**Parameters**:
- `identifier` - Paper identifier
- `action` - Generate, count, related, or all
- `format` - APA, MLA, BibTeX, EndNote, RIS

**Example**:
```json
{
  "identifier": "12345678",
  "action": "all",
  "format": "apa"
}
```

### 4. `research_preferences`
**What it does**: Manages all user preferences for sources, search, display, and caching
**Combines**: All preference management tools
**Parameters**:
- `action` - Get, set, reset, export, or import
- `category` - Source, search, display, cache, or all
- `settings` - Various preference values

**Example**:
```json
{
  "action": "set",
  "category": "search",
  "defaultMaxResults": 25,
  "preferFirecrawl": true
}
```

### 5. `web_research`
**What it does**: Performs web scraping, searching, content extraction, and crawling
**Combines**: Firecrawl integration and web research tools
**Parameters**:
- `action` - Scrape, search, extract, map, or crawl
- `targets` - URLs, queries, or websites
- `options` - Formats, content filtering, crawling limits

**Example**:
```json
{
  "action": "scrape",
  "url": "https://example.com",
  "formats": ["markdown"],
  "onlyMainContent": true
}
```

## Migration Guide

### **From Individual Tools to Consolidated**

| Old Tool | New Tool | Notes |
|----------|----------|-------|
| `search_papers` | `research_search` | Use `sources: ["pubmed"]` |
| `get_paper_by_id` | `paper_analysis` | Use `analysisType: "basic"` |
| `get_full_text` | `paper_analysis` | Use `analysisType: "full-text"` |
| `get_citation` | `citation_manager` | Use `action: "generate"` |
| `set_source_preference` | `research_preferences` | Use `action: "set", category: "source"` |

### **Parameter Mapping**

**Old**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "search_papers",
    "arguments": {
      "query": "AI research",
      "maxResults": 10
    }
  }
}
```

**New**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "research_search",
    "arguments": {
      "query": "AI research",
      "maxResults": 10,
      "sources": ["pubmed"]
    }
  }
}
```

## Installation and Usage

### **Build the Consolidated Version**
```bash
npm run build
```

### **Run the Consolidated Server**
```bash
node dist/index-consolidated.js
```

### **Test the Consolidated Tools**
```bash
npm run test:all-tools-bash
```

## Performance Benefits

### **Reduced Tool Discovery**
- **Faster startup** - Fewer tools to register
- **Less memory** - Reduced tool metadata
- **Quicker responses** - Fewer tool lookups

### **Better Resource Management**
- **Shared connections** - Database connections reused
- **Unified caching** - Centralized result caching
- **Efficient batching** - Multiple operations in single calls

### **Improved Error Handling**
- **Centralized logging** - All errors in one place
- **Better fallbacks** - Graceful degradation
- **Consistent error format** - Same error structure

## Future Enhancements

### **Planned Improvements**
- **Smart defaults** - Automatic parameter optimization
- **Result caching** - Intelligent result reuse
- **Batch operations** - Multiple papers in single calls
- **Advanced filtering** - Semantic search and filtering

### **Extensibility**
- **Plugin system** - Easy to add new sources
- **Custom adapters** - Support for new databases
- **API versioning** - Backward compatibility

## Conclusion

The consolidated version maintains all the functionality of the original 24 tools while providing a much cleaner and easier-to-use interface. Users get the same powerful research capabilities with less complexity and better performance.

This approach follows the principle of "do more with less" - fewer tools that do more, rather than many tools that do less.
