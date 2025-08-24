# Technical Architecture

This document provides a deep technical overview of the Scholarly Research MCP Server architecture, design patterns, and implementation details.

## System Overview

The Scholarly Research MCP Server is built as a Model Context Protocol (MCP) server that provides access to academic research papers across multiple data sources. The system follows a layered architecture pattern with clear separation of concerns.

## Core Architecture

### **1. MCP Protocol Layer**
```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Protocol Layer                       │
├─────────────────────────────────────────────────────────────┤
│  • StdioServerTransport (stdin/stdout communication)       │
│  • McpServer (protocol implementation)                     │
│  • Tool registration and validation                        │
│  • Request/response handling                               │
└─────────────────────────────────────────────────────────────┘
```

**Key Components:**
- **StdioServerTransport**: Handles communication between the MCP server and client via standard input/output streams
- **McpServer**: Implements the MCP protocol specification, manages tool registration and lifecycle
- **Tool Registry**: Maintains a registry of available tools with their schemas and implementations

### **2. Tool Implementation Layer**
```
┌─────────────────────────────────────────────────────────────┐
│                  Tool Implementation Layer                  │
├─────────────────────────────────────────────────────────────┤
│  • search_papers                                           │
│  • get_paper_by_id                                         │
│  • extract_paper_sections                                  │
│  • search_within_paper                                     │
│  • get_evidence_quotes                                     │
│  • search_google_scholar                                   │
│  • search_all_sources                                      │
│  • get_citation                                            │
│  • get_citation_count                                      │
│  • get_related_papers                                      │
│  • search_with_firecrawl                                   │
│  • set_firecrawl_preference                                │
│  • get_search_method_info                                  │
│  • get_user_preferences                                    │
│  • set_source_preference                                   │
│  • set_search_preferences                                  │
│  • set_display_preferences                                 │
│  • search_with_preferences                                 │
│  • reset_preferences                                       │
│  • export_preferences                                      │
│  • import_preferences                                      │
└─────────────────────────────────────────────────────────────┘
```

**Implementation Pattern:**
Each tool follows a consistent pattern:
1. **Parameter Validation**: Using Zod schemas for type safety
2. **Business Logic**: Delegating to appropriate adapters
3. **Error Handling**: Comprehensive error catching and user-friendly messages
4. **Response Formatting**: Consistent MCP response structure

### **3. Adapter Layer**
```
┌─────────────────────────────────────────────────────────────┐
│                      Adapter Layer                         │
├─────────────────────────────────────────────────────────────┤
│  • PubMedAdapter (NCBI E-utilities API)                   │
│  • GoogleScholarAdapter (Puppeteer web scraping)          │
│  • GoogleScholarFirecrawlAdapter (Firecrawl MCP)          │
│  • UnifiedSearchAdapter (basic multi-source)               │
│  • EnhancedUnifiedSearchAdapter (advanced multi-source)    │
│  • PreferenceAwareUnifiedSearchAdapter (user preferences)  │
└─────────────────────────────────────────────────────────────┘
```

**Adapter Pattern Benefits:**
- **Unified Interface**: All data sources implement the same interface
- **Easy Extension**: New sources can be added by implementing the adapter interface
- **Dependency Injection**: Adapters can be swapped or configured at runtime
- **Testability**: Each adapter can be tested independently

### **4. Data Source Layer**
```
┌─────────────────────────────────────────────────────────────┐
│                    Data Source Layer                       │
├─────────────────────────────────────────────────────────────┤
│  • PubMed (NCBI E-utilities API)                          │
│  • Google Scholar (Web scraping)                          │
│  • JSTOR (API integration)                                │
│  • Firecrawl (Professional web scraping service)          │
└─────────────────────────────────────────────────────────────┘
```

## Detailed Component Analysis

### **PubMed Adapter (`src/adapters/pubmed.ts`)**

**Architecture:**
```typescript
export class PubMedAdapter {
  private baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  private rateLimiter: RateLimiter;
  
  async searchPapers(params: PubMedSearchParams): Promise<PubMedPaper[]>
  async fetchPapersByIds(pmids: string[]): Promise<PubMedPaper[]>
  async getPaperDetails(pmid: string): Promise<PubMedPaper | null>
  async getFullText(pmid: string, maxLength?: number): Promise<string>
  async extractSections(pmid: string, maxSectionLength?: number): Promise<PaperSection[]>
  async searchWithinPaper(pmid: string, searchTerm: string, maxResults?: number): Promise<string[]>
  async getEvidenceQuotes(pmid: string, evidenceType?: string, maxQuotes?: number): Promise<string[]>
  async getCitation(pmid: string, format: string): Promise<string>
  async getCitationCount(pmid: string): Promise<number>
  async getRelatedPapers(pmid: string, maxResults?: number): Promise<PubMedPaper[]>
}
```

**Key Features:**
- **Rate Limiting**: Built-in rate limiting to respect NCBI's API constraints
- **Error Handling**: Comprehensive error handling with fallback mechanisms
- **Content Processing**: HTML cleaning and text extraction from PMC sources
- **URL Resolution**: Automatic fallback between PMCID and PMID formats

**Rate Limiting Implementation:**
```typescript
@rate_limiter(max_calls=10, period=1)
async makeRequest(endpoint: string, params: Record<string, string>): Promise<any>
```

### **Google Scholar Adapter (`src/adapters/google-scholar.ts`)**

**Architecture:**
```typescript
export class GoogleScholarAdapter {
  private browser: Browser | null = null;
  private rateLimiter: RateLimiter;
  
  async searchPapers(options: GoogleScholarSearchOptions): Promise<GoogleScholarPaper[]>
  async getPaperDetails(url: string): Promise<GoogleScholarPaper | null>
  async getCitationCount(title: string): Promise<number | null>
  async getRelatedPapers(title: string, maxResults?: number): Promise<GoogleScholarPaper[]>
  private async setupBrowser(): Promise<void>
  private async extractAuthors(text: string): string[]
  private async extractJournal(text: string): string
  private async extractPublicationDate(text: string): string
}
```

**Web Scraping Strategy:**
1. **Browser Setup**: Launches headless Chrome/Chromium using Puppeteer
2. **Page Navigation**: Navigates to Google Scholar search results
3. **Content Extraction**: Uses CSS selectors to extract paper information
4. **Rate Limiting**: Built-in delays to respect Google Scholar's terms of service
5. **Error Handling**: Graceful fallbacks when scraping encounters issues

**Puppeteer Configuration:**
```typescript
const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu'
  ]
});
```

### **Firecrawl Integration (`src/adapters/google-scholar-firecrawl.ts`)**

**Architecture:**
```typescript
export class GoogleScholarFirecrawlAdapter {
  private firecrawlClient: FirecrawlMCPClient | null = null;
  
  async searchWithFirecrawl(query: string, maxResults?: number): Promise<GoogleScholarPaper[]>
  setFirecrawlClient(client: FirecrawlMCPClient): void
  isFirecrawlAvailable(): boolean
}
```

**Benefits:**
- **Professional Service**: Uses Firecrawl's professional web scraping infrastructure
- **Better Reliability**: Higher success rates than local Puppeteer
- **Rate Limiting**: Built-in rate limiting and IP rotation
- **Error Handling**: Robust error handling and fallback mechanisms

### **Unified Search Architecture**

**Basic Unified Search (`src/adapters/unified-search.ts`):**
```typescript
export class UnifiedSearchAdapter {
  private pubmedAdapter: PubMedAdapter;
  private googleScholarAdapter: GoogleScholarAdapter;
  
  async searchPapers(options: UnifiedSearchOptions): Promise<UnifiedPaper[]>
}
```

**Enhanced Unified Search (`src/adapters/enhanced-unified-search.ts`):**
```typescript
export class EnhancedUnifiedSearchAdapter {
  private pubmedAdapter: PubMedAdapter;
  private googleScholarAdapter: GoogleScholarAdapter;
  private googleScholarFirecrawlAdapter: GoogleScholarFirecrawlAdapter;
  private useFirecrawl: boolean = false;
  
  async searchPapers(options: EnhancedUnifiedSearchOptions): Promise<UnifiedPaper[]>
  setPreferFirecrawl(prefer: boolean): void
  isFirecrawlAvailable(): boolean
  getSearchMethod(): 'firecrawl' | 'puppeteer' | 'mixed'
}
```

**Preference-Aware Search (`src/adapters/preference-aware-unified-search.ts`):**
```typescript
export class PreferenceAwareUnifiedSearchAdapter {
  private preferencesManager: UserPreferencesManager;
  
  async searchPapers(options: PreferenceAwareSearchOptions): Promise<UnifiedPaper[]>
  formatResults(papers: UnifiedPaper[]): string
}
```

## Data Flow Architecture

### **Search Request Flow**
```
User Request → MCP Server → Tool Implementation → Adapter Selection → Data Source → Response Processing → User Response
```

**Detailed Flow:**
1. **User Request**: MCP client sends search request with parameters
2. **Tool Validation**: Zod schema validates input parameters
3. **Adapter Selection**: Based on source preferences and availability
4. **Data Retrieval**: Adapter fetches data from source(s)
5. **Data Processing**: Raw data is normalized and structured
6. **Response Formatting**: Results are formatted according to user preferences
7. **Error Handling**: Any errors are caught and formatted for user

### **Multi-Source Search Flow**
```
Query → Source Selection → Parallel Processing → Result Aggregation → Deduplication → Sorting → Response
```

**Parallel Processing:**
- Multiple sources are queried simultaneously for performance
- Each source has its own rate limiting and error handling
- Results are aggregated and deduplicated across sources

## Performance Considerations

### **Rate Limiting Strategy**
- **PubMed**: 10 requests per second (configurable)
- **Google Scholar**: Built-in delays to respect terms of service
- **Firecrawl**: Professional rate limiting with IP rotation

### **Caching Strategy**
- **User Preferences**: Persistent storage in `~/.mcp-scholarly-research/preferences.json`
- **Search Results**: No caching (always fresh data)
- **Paper Content**: No caching (always fresh content)

### **Concurrency Management**
- **Parallel Processing**: Multiple sources queried simultaneously
- **Resource Management**: Browser instances are reused when possible
- **Memory Management**: Large responses are streamed to avoid memory issues

## Error Handling Architecture

### **Error Categories**
1. **Network Errors**: Connection timeouts, DNS failures
2. **API Errors**: Rate limiting, authentication failures
3. **Content Errors**: Malformed responses, missing data
4. **System Errors**: Memory issues, browser crashes

### **Error Handling Strategy**
```typescript
try {
  // Attempt primary method
  return await primaryMethod();
} catch (primaryError) {
  // Log primary error
  console.warn('Primary method failed:', primaryError);
  
  try {
    // Attempt fallback method
    return await fallbackMethod();
  } catch (fallbackError) {
    // Both methods failed, throw user-friendly error
    throw new Error(`Search failed: ${fallbackError.message}`);
  }
}
```

### **Fallback Mechanisms**
- **PubMed**: Automatic retry with exponential backoff
- **Google Scholar**: Fallback from Firecrawl to Puppeteer
- **Content Extraction**: Multiple parsing strategies for different formats

## Security Considerations

### **Input Validation**
- **Parameter Validation**: All inputs validated using Zod schemas
- **SQL Injection**: Not applicable (no database queries)
- **XSS Protection**: Content is sanitized before processing

### **API Security**
- **Rate Limiting**: Prevents abuse of external APIs
- **Error Information**: Limited error details to prevent information leakage
- **Authentication**: API keys stored in environment variables

### **Web Scraping Security**
- **User Agent Spoofing**: Mimics real browser behavior
- **Request Headers**: Proper headers to avoid detection
- **IP Rotation**: Firecrawl provides IP rotation for reliability

## Testing Architecture

### **Test Strategy**
- **Unit Tests**: Individual component testing
- **Integration Tests**: Cross-component communication testing
- **End-to-End Tests**: Full workflow testing
- **Performance Tests**: Rate limiting and concurrency testing

### **Test Coverage**
- **Code Coverage**: Aim for 90%+ coverage
- **Error Scenarios**: Comprehensive error condition testing
- **Edge Cases**: Boundary condition testing
- **Mocking**: External dependencies are mocked for reliable testing

## Deployment Architecture

### **Build Process**
1. **TypeScript Compilation**: Source code compiled to JavaScript
2. **Bundle Generation**: ES modules for Node.js compatibility
3. **Type Definitions**: Generated `.d.ts` files for TypeScript support
4. **Source Maps**: Generated for debugging support

### **Package Structure**
```
dist/
├── index.js              # Main server entry point
├── adapters/             # Compiled adapter modules
├── preferences/          # Compiled preference modules
├── utils/                # Compiled utility modules
└── *.d.ts               # TypeScript definitions
```

### **Runtime Requirements**
- **Node.js**: 18+ for modern JavaScript features
- **Memory**: Minimum 512MB RAM for browser automation
- **Storage**: Minimal disk space for preferences and logs
- **Network**: Internet access for external APIs

## Future Architecture Considerations

### **Scalability Improvements**
- **Horizontal Scaling**: Multiple server instances behind load balancer
- **Database Integration**: Persistent storage for search history and user data
- **Message Queue**: Asynchronous processing for long-running searches
- **Microservices**: Split into separate services for different data sources

### **Performance Enhancements**
- **Result Caching**: Cache frequently requested papers
- **Search Index**: Build local search index for faster queries
- **CDN Integration**: Distribute content globally
- **Background Processing**: Pre-fetch and process popular papers

### **Monitoring and Observability**
- **Metrics Collection**: Request rates, response times, error rates
- **Logging**: Structured logging for debugging and analysis
- **Health Checks**: Endpoint health monitoring
- **Alerting**: Automatic alerts for system issues

This architecture provides a solid foundation for a scholarly research tool while maintaining flexibility for future enhancements and improvements.
