# API Reference

This document provides comprehensive technical details for all MCP tools available in the Scholarly Research MCP Server.

## Tool Categories

The server provides 24 MCP tools organized into the following categories:
- **Paper Discovery**: Search and retrieve papers
- **Content Analysis**: Extract and analyze paper content
- **Google Scholar Integration**: Web scraping capabilities
- **User Preferences**: Configuration management
- **Citation Tools**: Citation generation and management

## Paper Discovery Tools

### `search_papers`

Search for academic papers across multiple sources with various filters.

**Parameters:**
```typescript
{
  query: string;                    // Required: Search query string
  maxResults?: number;              // Optional: Maximum results (default: 20)
  startDate?: string;               // Optional: Start date (YYYY/MM/DD format)
  endDate?: string;                 // Optional: End date (YYYY/MM/DD format)
  journal?: string;                 // Optional: Filter by specific journal
  author?: string;                  // Optional: Filter by specific author
}
```

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // Formatted search results
    }
  ];
}
```

**Implementation Details:**
- **Source**: PubMed (NCBI E-utilities API)
- **Rate Limiting**: 10 requests per second
- **Error Handling**: Comprehensive error catching with user-friendly messages
- **Data Processing**: Automatic normalization and deduplication

**Example Usage:**
```json
{
  "query": "machine learning",
  "maxResults": 10,
  "startDate": "2020/01/01",
  "journal": "Nature"
}
```

### `get_paper_by_id`

Fetch a specific paper by its PubMed ID (PMID).

**Parameters:**
```typescript
{
  pmid: string;                     // Required: PubMed ID of the paper
}
```

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // Paper details in formatted text
    }
  ];
}
```

**Implementation Details:**
- **Data Source**: PubMed Central (PMC) and PubMed
- **Content Extraction**: Full text when available
- **Metadata**: Title, authors, abstract, journal, publication date
- **URL Resolution**: Automatic PMCID/PMID fallback

### `get_paper_details`

Get detailed information about a paper including abstract and metadata.

**Parameters:**
```typescript
{
  pmid: string;                     // Required: PubMed ID of the paper
}
```

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // Detailed paper information
    }
  ];
}
```

**Implementation Details:**
- **Enhanced Metadata**: Rich paper information extraction
- **Abstract Processing**: Clean, formatted abstract text
- **Author Information**: Structured author data
- **Journal Details**: Publication venue information

## Content Analysis Tools

### `get_full_text`

Get the complete text content of a paper for detailed analysis.

**Parameters:**
```typescript
{
  pmid: string;                     // Required: PubMed ID of the paper
  maxLength?: number;               // Optional: Maximum text length (default: 50000)
}
```

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // Full paper text content
    }
  ];
}
```

**Implementation Details:**
- **Content Source**: PubMed Central full-text articles
- **Text Processing**: HTML cleaning and text extraction
- **Length Control**: Configurable maximum text length
- **Format Preservation**: Maintains paragraph structure and formatting

**Technical Notes:**
- **HTML Parsing**: Uses Cheerio for robust HTML processing
- **Text Cleaning**: Removes navigation elements, footers, and ads
- **Content Validation**: Ensures extracted text is meaningful
- **Fallback Logic**: Multiple extraction strategies for different formats

### `extract_paper_sections`

Extract and organize the main sections of a paper (Introduction, Methods, Results, etc.).

**Parameters:**
```typescript
{
  pmid: string;                     // Required: PubMed ID of the paper
  maxSectionLength?: number;        // Optional: Max section length (default: 1000)
}
```

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // Organized paper sections
    }
  ];
}
```

**Implementation Details:**
- **Section Detection**: Automatic identification of paper structure
- **Content Organization**: Hierarchical section organization
- **Length Control**: Configurable section length limits
- **Format Preservation**: Maintains section hierarchy and relationships

**Section Types Detected:**
- **Introduction**: Background and context
- **Methods**: Methodology and procedures
- **Results**: Findings and outcomes
- **Discussion**: Analysis and interpretation
- **Conclusion**: Summary and implications
- **References**: Bibliography and citations

### `search_within_paper`

Search for specific terms, quotes, or evidence within a paper.

**Parameters:**
```typescript
{
  pmid: string;                     // Required: PubMed ID of the paper
  searchTerm: string;               // Required: Term or phrase to search for
  maxResults?: number;              // Optional: Maximum results (default: 10)
}
```

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // Search results with context
    }
  ];
}
```

**Implementation Details:**
- **Text Search**: Full-text search within paper content
- **Context Extraction**: Provides surrounding context for matches
- **Result Ranking**: Relevance-based result ordering
- **Highlighting**: Emphasizes search terms in results

**Search Algorithm:**
- **Case Insensitive**: Ignores case differences
- **Word Boundaries**: Respects word boundaries for accuracy
- **Context Window**: Configurable context around matches
- **Result Limiting**: Prevents overwhelming result sets

### `get_evidence_quotes`

Extract specific quotes and evidence from a paper for use in essays or research.

**Parameters:**
```typescript
{
  pmid: string;                     // Required: PubMed ID of the paper
  evidenceType?: string;            // Optional: Type of evidence (default: 'all')
  maxQuotes?: number;               // Optional: Maximum quotes (default: 15)
}
```

**Evidence Types:**
- **quotes**: Direct quotes and parenthetical statements
- **statistics**: Numerical data and statistical findings
- **findings**: Research discoveries and conclusions
- **conclusions**: Summary statements and implications
- **all**: All types combined

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // Extracted evidence with context
    }
  ];
}
```

**Implementation Details:**
- **Pattern Recognition**: Identifies evidence patterns in text
- **Context Extraction**: Provides surrounding context for evidence
- **Type Classification**: Categorizes evidence by type
- **Quality Filtering**: Ensures evidence relevance and accuracy

## Google Scholar Integration Tools

### `search_google_scholar`

Search for academic papers on Google Scholar using web scraping.

**Parameters:**
```typescript
{
  query: string;                    // Required: Search query string
  maxResults?: number;              // Optional: Maximum results (default: 20)
  startYear?: number;               // Optional: Start year for publication range
  endYear?: number;                 // Optional: End year for publication range
  sortBy?: 'relevance' | 'date' | 'citations'; // Optional: Sort order (default: 'relevance')
}
```

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // Google Scholar search results
    }
  ];
}
```

**Implementation Details:**
- **Web Scraping**: Uses Puppeteer for reliable page rendering
- **Rate Limiting**: Built-in delays to respect terms of service
- **Content Extraction**: CSS selector-based information extraction
- **Error Handling**: Graceful fallbacks for scraping issues

**Technical Considerations:**
- **Browser Automation**: Headless Chrome/Chromium via Puppeteer
- **User Agent Spoofing**: Mimics real browser behavior
- **Page Rendering**: Waits for dynamic content to load
- **Content Parsing**: Robust extraction of paper metadata

### `search_all_sources`

Search for academic papers across both PubMed and Google Scholar with unified results.

**Parameters:**
```typescript
{
  query: string;                    // Required: Search query string
  maxResults?: number;              // Optional: Maximum results (default: 20)
  startDate?: string;               // Optional: Start date (YYYY/MM/DD format)
  endDate?: number;                 // Optional: End year for publication range
  journal?: string;                 // Optional: Filter by specific journal
  author?: string;                  // Optional: Filter by specific author
  sources?: ('pubmed' | 'google-scholar')[]; // Optional: Sources to search (default: both)
  sortBy?: 'relevance' | 'date' | 'citations'; // Optional: Sort order (default: 'relevance')
}
```

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // Unified search results
    }
  ];
}
```

**Implementation Details:**
- **Multi-Source Search**: Parallel queries across multiple sources
- **Result Deduplication**: Automatic removal of duplicate papers
- **Source Attribution**: Clear indication of data source
- **Unified Formatting**: Consistent result presentation

**Deduplication Algorithm:**
- **Title Normalization**: Case-insensitive title comparison
- **Author Matching**: Author list comparison
- **Date Validation**: Publication date verification
- **Source Priority**: Configurable source preference

### `get_google_scholar_citations`

Get citation count for a paper from Google Scholar.

**Parameters:**
```typescript
{
  title: string;                    // Required: Title of the paper to search for
}
```

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // Citation count information
    }
  ];
}
```

**Implementation Details:**
- **Title Search**: Searches Google Scholar for paper title
- **Citation Extraction**: Extracts citation count from search results
- **Result Validation**: Ensures citation count accuracy
- **Error Handling**: Graceful handling of missing citations

### `get_related_papers`

Get related papers from either PubMed or Google Scholar.

**Parameters:**
```typescript
{
  identifier: string;               // Required: Paper identifier (PMID for PubMed, URL for Google Scholar)
  source: 'pubmed' | 'google-scholar'; // Required: Source to search for related papers
  maxResults?: number;              // Optional: Maximum results (default: 10)
}
```

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // Related papers list
    }
  ];
}
```

**Implementation Details:**
- **Source-Specific Logic**: Different algorithms for each source
- **Relatedness Scoring**: Relevance-based result ordering
- **Metadata Extraction**: Comprehensive paper information
- **Result Filtering**: Quality-based result filtering

## Firecrawl Integration Tools

### `search_with_firecrawl`

Search for academic papers using Firecrawl MCP server for enhanced reliability.

**Parameters:**
```typescript
{
  query: string;                    // Required: Search query for papers
  maxResults?: number;              // Optional: Maximum results (default: 20)
  startDate?: string;               // Optional: Start date (YYYY/MM/DD format)
  endDate?: number;                 // Optional: End year for publication range
  journal?: string;                 // Optional: Filter by specific journal
  author?: string;                  // Optional: Filter by specific author
  sources?: ('pubmed' | 'google-scholar')[]; // Optional: Sources to search (default: both)
  sortBy?: 'relevance' | 'date' | 'citations'; // Optional: Sort order (default: 'relevance')
  preferFirecrawl?: boolean;        // Optional: Prefer Firecrawl over Puppeteer (default: true)
}
```

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // Firecrawl search results
    }
  ];
}
```

**Implementation Details:**
- **Professional Service**: Uses Firecrawl's web scraping infrastructure
- **Enhanced Reliability**: Higher success rates than local scraping
- **IP Rotation**: Automatic IP rotation for reliability
- **Rate Limiting**: Professional rate limiting and management

**Benefits:**
- **Better Success Rate**: More reliable than local Puppeteer
- **Professional Infrastructure**: Enterprise-grade web scraping
- **Automatic Fallback**: Seamless fallback to local methods
- **Enhanced Error Handling**: Robust error handling and recovery

### `set_firecrawl_preference`

Set whether to prefer Firecrawl over Puppeteer for Google Scholar searches.

**Parameters:**
```typescript
{
  preferFirecrawl: boolean;         // Required: Whether to prefer Firecrawl over Puppeteer
}
```

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // Preference update confirmation
    }
  ];
}
```

**Implementation Details:**
- **Runtime Configuration**: Changes take effect immediately
- **Preference Persistence**: Settings saved across sessions
- **Fallback Logic**: Automatic fallback when Firecrawl unavailable
- **Status Reporting**: Clear indication of current method

### `get_search_method_info`

Get information about the current search method and Firecrawl availability.

**Parameters:**
```typescript
{}                                 // No parameters required
```

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // Search method information
    }
  ];
}
```

**Response Content:**
- **Current Method**: Active search method (Firecrawl, Puppeteer, or Mixed)
- **Firecrawl Status**: Availability and configuration
- **Method Recommendations**: Best practices and suggestions
- **Configuration Options**: Available settings and options

## User Preference Tools

### `get_user_preferences`

Get current user preferences for search and display settings.

**Parameters:**
```typescript
{}                                 // No parameters required
```

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // Current preferences summary
    }
  ];
}
```

**Preference Categories:**
- **Search Settings**: Default results, sorting, deduplication
- **Source Preferences**: Enabled sources, priorities, limits
- **Display Settings**: Abstract display, citation visibility, URL display
- **Cache Settings**: Caching preferences and TTL

### `set_source_preference`

Set preferences for a specific source (pubmed, google-scholar, jstor).

**Parameters:**
```typescript
{
  sourceName: string;               // Required: Name of the source
  enabled?: boolean;                // Optional: Whether to enable this source
  priority?: number;                // Optional: Priority order (1 is highest)
  maxResults?: number;              // Optional: Maximum results from this source
}
```

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // Preference update confirmation
    }
  ];
}
```

**Implementation Details:**
- **Validation**: Ensures valid source names and parameters
- **Persistence**: Automatically saves to configuration file
- **Immediate Effect**: Changes take effect for next search
- **Error Handling**: Comprehensive error validation and reporting

### `set_search_preferences`

Set general search preferences.

**Parameters:**
```typescript
{
  defaultMaxResults?: number;       // Optional: Default maximum results
  defaultSortBy?: 'relevance' | 'date' | 'citations'; // Optional: Default sort order
  preferFirecrawl?: boolean;        // Optional: Prefer Firecrawl over Puppeteer
  enableDeduplication?: boolean;    // Optional: Enable deduplication
}
```

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // Preference update confirmation
    }
  ];
}
```

**Implementation Details:**
- **Parameter Validation**: Ensures valid parameter values
- **Default Handling**: Uses existing values for unspecified parameters
- **Configuration Persistence**: Automatically saves changes
- **Status Reporting**: Confirms updated preference values

### `set_display_preferences`

Set display preferences for search results.

**Parameters:**
```typescript
{
  showAbstracts?: boolean;          // Optional: Whether to show abstracts
  showCitations?: boolean;          // Optional: Whether to show citation counts
  showUrls?: boolean;               // Optional: Whether to show URLs
  maxAbstractLength?: number;       // Optional: Maximum abstract length
}
```

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // Preference update confirmation
    }
  ];
}
```

**Implementation Details:**
- **Display Control**: Controls what information is shown
- **Length Management**: Configurable abstract length limits
- **Format Consistency**: Ensures consistent result formatting
- **User Experience**: Improves readability and usability

### `search_with_preferences`

Search for papers using your saved preferences.

**Parameters:**
```typescript
{
  query: string;                    // Required: Search query for papers
  maxResults?: number;              // Optional: Override max results
  overrideSources?: string[];       // Optional: Override enabled sources
  respectUserPreferences?: boolean; // Optional: Whether to respect preferences (default: true)
}
```

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // Search results using preferences
    }
  ];
}
```

**Implementation Details:**
- **Preference Integration**: Automatically applies user settings
- **Source Selection**: Uses configured source priorities
- **Result Formatting**: Applies display preferences
- **Override Support**: Allows temporary preference overrides

### `reset_preferences`

Reset all preferences to default values.

**Parameters:**
```typescript
{}                                 // No parameters required
```

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // Reset confirmation
    }
  ];
}
```

**Default Values:**
- **Search**: 20 results, relevance sorting, deduplication enabled
- **Sources**: PubMed and Google Scholar enabled, JSTOR disabled
- **Display**: All display options enabled, 200 character abstracts
- **Cache**: Caching enabled, 60 minute TTL

### `export_preferences`

Export current preferences as JSON.

**Parameters:**
```typescript
{}                                 // No parameters required
```

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // JSON export of preferences
    }
  ];
}
```

**Export Format:**
```json
{
  "search": {
    "defaultMaxResults": 20,
    "defaultSortBy": "relevance",
    "preferFirecrawl": true,
    "enableDeduplication": true,
    "sources": [...]
  },
  "display": {...},
  "cache": {...}
}
```

### `import_preferences`

Import preferences from JSON.

**Parameters:**
```typescript
{
  preferencesJson: string;          // Required: JSON string containing preferences
}
```

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // Import confirmation
    }
  ];
}
```

**Implementation Details:**
- **JSON Validation**: Ensures valid JSON format
- **Schema Validation**: Validates preference structure
- **Merge Logic**: Combines with existing preferences
- **Error Handling**: Comprehensive error reporting

## Citation Tools

### `get_citation`

Get citation in various formats (BibTeX, EndNote, APA, MLA, RIS).

**Parameters:**
```typescript
{
  pmid: string;                     // Required: PubMed ID of the paper
  format: 'bibtex' | 'endnote' | 'apa' | 'mla' | 'ris'; // Required: Citation format
}
```

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // Formatted citation
    }
  ];
}
```

**Supported Formats:**
- **BibTeX**: LaTeX bibliography format
- **EndNote**: EndNote reference manager format
- **APA**: American Psychological Association style
- **MLA**: Modern Language Association style
- **RIS**: Research Information Systems format

**Implementation Details:**
- **Metadata Extraction**: Comprehensive paper metadata
- **Format Templates**: Standard citation format templates
- **Field Mapping**: Automatic field mapping and formatting
- **Validation**: Ensures citation completeness and accuracy

### `get_citation_count`

Get the number of times a paper has been cited.

**Parameters:**
```typescript
{
  pmid: string;                     // Required: PubMed ID of the paper
}
```

**Response Format:**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // Citation count information
    }
  ];
}
```

**Implementation Details:**
- **Source Integration**: Combines multiple citation sources
- **Data Validation**: Ensures citation count accuracy
- **Fallback Logic**: Multiple data source fallbacks
- **Format Consistency**: Consistent result presentation

## Error Handling

### **Error Response Format**
```typescript
{
  content: [
    {
      type: 'text';
      text: string;                 // User-friendly error message
    }
  ];
}
```

### **Error Categories**
1. **Validation Errors**: Invalid parameters or input data
2. **Network Errors**: Connection failures or timeouts
3. **API Errors**: External service failures or rate limiting
4. **Content Errors**: Malformed or missing content
5. **System Errors**: Internal system failures

### **Error Recovery**
- **Automatic Retry**: Built-in retry logic for transient failures
- **Fallback Methods**: Alternative approaches when primary methods fail
- **Graceful Degradation**: Reduced functionality rather than complete failure
- **User Guidance**: Clear instructions for resolving issues

## Rate Limiting

### **PubMed API**
- **Limit**: 10 requests per second
- **Implementation**: Token bucket algorithm
- **Error Handling**: Automatic retry with exponential backoff
- **Configuration**: Configurable via environment variables

### **Google Scholar**
- **Limit**: Built-in delays to respect terms of service
- **Implementation**: Request spacing and user agent rotation
- **Error Handling**: Graceful fallback to alternative methods
- **Configuration**: Automatic adjustment based on response patterns

### **Firecrawl**
- **Limit**: Professional rate limiting with IP rotation
- **Implementation**: Managed by Firecrawl service
- **Error Handling**: Automatic fallback to local methods
- **Configuration**: Transparent to end users

## Performance Characteristics

### **Response Times**
- **PubMed Search**: 100-500ms (depending on query complexity)
- **Google Scholar Search**: 2-10 seconds (web scraping overhead)
- **Content Extraction**: 1-5 seconds (depending on content size)
- **Preference Operations**: <100ms (local operations)

### **Throughput**
- **Concurrent Searches**: Up to 10 simultaneous PubMed searches
- **Parallel Processing**: Multiple sources queried simultaneously
- **Resource Usage**: Memory-efficient streaming for large content
- **Scalability**: Horizontal scaling support for high load

### **Resource Requirements**
- **Memory**: 512MB minimum, 1GB recommended
- **CPU**: Single core sufficient for most operations
- **Storage**: Minimal disk space for preferences and logs
- **Network**: Stable internet connection for external APIs

This API reference provides comprehensive technical details for developers and system administrators working with the Scholarly Research MCP Server.
