# Data Models and Schemas

This document provides comprehensive technical details about all data models, interfaces, and schemas used in the Scholarly Research MCP Server.

## Core Data Models

### **Paper Models**

#### **Base Paper Interface**
```typescript
interface BasePaper {
  title: string;                    // Paper title
  abstract: string;                 // Paper abstract
  authors: string[];                // List of author names
  url: string;                      // Paper URL or DOI
  publicationDate: Date | null;     // Publication date
  source: string;                   // Data source identifier
}
```

#### **PubMed Paper Model**
```typescript
interface PubMedPaper extends BasePaper {
  pmid: string;                     // PubMed ID
  pmcid?: string;                   // PubMed Central ID
  journal: string;                  // Journal name
  volume?: string;                  // Journal volume
  issue?: string;                   // Journal issue
  pages?: string;                   // Page numbers
  doi?: string;                     // Digital Object Identifier
  keywords: string[];               // Keywords/tags
  meshTerms: string[];              // MeSH terms
  publicationType: string[];        // Publication types
  language: string;                 // Language
  country?: string;                 // Country of publication
  grantNumbers?: string[];          // Grant/funding numbers
  references?: string[];            // Reference list
  citations?: number;               // Citation count
  relatedPapers?: string[];         // Related paper IDs
}
```

#### **Google Scholar Paper Model**
```typescript
interface GoogleScholarPaper extends BasePaper {
  gsId?: string;                    // Google Scholar ID
  journal?: string;                 // Journal name (if available)
  year?: number;                    // Publication year
  citations?: number;               // Citation count
  relatedPapers?: string[];         // Related paper URLs
  pdfUrl?: string;                  // PDF download URL
  htmlUrl?: string;                 // HTML version URL
  snippet?: string;                 // Search result snippet
  venue?: string;                   // Publication venue
  authorsFull?: string;             // Full author string
}
```

#### **Unified Paper Model**
```typescript
interface UnifiedPaper extends BasePaper {
  pmid?: string;                    // PubMed ID (if available)
  pmcid?: string;                   // PubMed Central ID (if available)
  gsId?: string;                    // Google Scholar ID (if available)
  doi?: string;                     // Digital Object Identifier
  journal?: string;                 // Journal name
  year?: number;                    // Publication year
  citations?: number;               // Citation count
  relatedPapers?: string[];         // Related paper identifiers
  pdfUrl?: string;                  // PDF download URL
  htmlUrl?: string;                 // HTML version URL
  snippet?: string;                 // Search result snippet
  venue?: string;                   // Publication venue
  keywords?: string[];              // Keywords/tags
  meshTerms?: string[];             // MeSH terms (PubMed only)
  publicationType?: string[];       // Publication types (PubMed only)
  language?: string;                // Language
  country?: string;                 // Country of publication
  grantNumbers?: string[];          // Grant/funding numbers
  references?: string[];            // Reference list
  sourcePriority: number;           // Source priority for deduplication
  confidence: number;               // Data quality confidence score
}
```

### **Search Parameter Models**

#### **PubMed Search Parameters**
```typescript
interface PubMedSearchParams {
  query: string;                    // Search query string
  maxResults?: number;              // Maximum results to return
  startDate?: string;               // Start date (YYYY/MM/DD format)
  endDate?: string;                 // End date (YYYY/MM/DD format)
  journal?: string;                 // Journal filter
  author?: string;                  // Author filter
  publicationType?: string[];       // Publication type filters
  language?: string;                // Language filter
  sortBy?: 'relevance' | 'date' | 'journal' | 'author' | 'title';
  retmax?: number;                  // NCBI API parameter
  retstart?: number;                // NCBI API parameter
  field?: string;                   // Search field specification
  datetype?: 'pdat' | 'mdat' | 'dp'; // Date type for filtering
  reldate?: number;                 // Relative date in days
  mindate?: string;                 // Minimum date (YYYY/MM/DD)
  maxdate?: string;                 // Maximum date (YYYY/MM/DD)
}
```

#### **Google Scholar Search Parameters**
```typescript
interface GoogleScholarSearchOptions {
  query: string;                    // Search query string
  maxResults?: number;              // Maximum results to return
  startYear?: number;               // Start year for publication range
  endYear?: number;                 // End year for publication range
  sortBy?: 'relevance' | 'date' | 'citations';
  includePatents?: boolean;         // Include patent results
  includeCitations?: boolean;       // Include citation information
  language?: string;                // Language preference
  country?: string;                 // Country preference
  userAgent?: string;               // Custom user agent
  delay?: number;                   // Delay between requests (ms)
  timeout?: number;                 // Request timeout (ms)
}
```

#### **Unified Search Parameters**
```typescript
interface UnifiedSearchOptions {
  query: string;                    // Search query string
  maxResults?: number;              // Maximum results to return
  startDate?: string;               // Start date (YYYY/MM/DD format)
  endDate?: number;                 // End year for publication range
  journal?: string;                 // Journal filter
  author?: string;                  // Author filter
  sources?: ('pubmed' | 'google-scholar')[]; // Sources to search
  sortBy?: 'relevance' | 'date' | 'citations';
  enableDeduplication?: boolean;    // Enable result deduplication
  sourcePriority?: Record<string, number>; // Source priority weights
  maxResultsPerSource?: number;     // Max results per source
}
```

#### **Enhanced Unified Search Parameters**
```typescript
interface EnhancedUnifiedSearchOptions extends UnifiedSearchOptions {
  preferFirecrawl?: boolean;        // Prefer Firecrawl over Puppeteer
  firecrawlTimeout?: number;        // Firecrawl request timeout
  puppeteerFallback?: boolean;      // Enable Puppeteer fallback
  parallelProcessing?: boolean;     // Enable parallel source processing
  resultAggregation?: 'merge' | 'append' | 'priority'; // Result combination strategy
  qualityThreshold?: number;        // Minimum quality score for results
  deduplicationStrategy?: 'strict' | 'fuzzy' | 'hybrid'; // Deduplication method
}
```

#### **Preference-Aware Search Parameters**
```typescript
interface PreferenceAwareSearchOptions extends Omit<EnhancedUnifiedSearchOptions, 'sources'> {
  sources?: string[];               // Override enabled sources
  overrideSources?: string[];       // Temporary source override
  respectUserPreferences?: boolean; // Whether to respect user preferences
  preferenceWeight?: number;        // Weight for preference-based decisions
  adaptiveSearch?: boolean;         // Enable adaptive search strategies
  userContext?: string;             // User context for personalization
}
```

### **Content Analysis Models**

#### **Paper Section Model**
```typescript
interface PaperSection {
  title: string;                    // Section title
  content: string;                  // Section content
  startIndex: number;               // Start position in full text
  endIndex: number;                 // End position in full text
  level: number;                    // Section hierarchy level
  type: SectionType;                // Section type classification
  subsections?: PaperSection[];     // Nested subsections
  metadata?: Record<string, any>;   // Additional metadata
}

enum SectionType {
  INTRODUCTION = 'introduction',
  METHODS = 'methods',
  RESULTS = 'results',
  DISCUSSION = 'discussion',
  CONCLUSION = 'conclusion',
  ABSTRACT = 'abstract',
  REFERENCES = 'references',
  ACKNOWLEDGMENTS = 'acknowledgments',
  APPENDIX = 'appendix',
  UNKNOWN = 'unknown'
}
```

#### **Evidence Quote Model**
```typescript
interface EvidenceQuote {
  text: string;                     // Quote text
  context: string;                  // Surrounding context
  type: EvidenceType;               // Type of evidence
  confidence: number;               // Confidence score (0-1)
  startIndex: number;               // Start position in text
  endIndex: number;                 // End position in text
  metadata?: Record<string, any>;   // Additional metadata
}

enum EvidenceType {
  QUOTE = 'quote',                  // Direct quote
  STATISTIC = 'statistic',          // Numerical data
  FINDING = 'finding',              // Research finding
  CONCLUSION = 'conclusion',        // Conclusion statement
  METHOD = 'method',                // Methodology description
  RESULT = 'result',                // Result description
  UNKNOWN = 'unknown'               // Unknown type
}
```

#### **Search Result Model**
```typescript
interface SearchResult {
  query: string;                    // Original search query
  results: UnifiedPaper[];          // Search results
  totalResults: number;             // Total available results
  sourcesUsed: string[];            // Sources that were queried
  searchTime: number;               // Search execution time (ms)
  deduplicationStats: {
    before: number;                 // Results before deduplication
    after: number;                  // Results after deduplication
    duplicates: number;             // Number of duplicates removed
  };
  sourceStats: Record<string, {
    results: number;                // Results from this source
    time: number;                   // Time taken by this source
    errors?: string[];              // Errors encountered
  }>;
  metadata?: Record<string, any>;   // Additional search metadata
}
```

### **User Preference Models**

#### **Source Preference Model**
```typescript
interface SourcePreference {
  name: string;                     // Source name (pubmed, google-scholar, jstor)
  enabled: boolean;                 // Whether source is enabled
  priority: number;                 // Priority order (1 is highest)
  maxResults: number;               // Maximum results from this source
  timeout: number;                  // Request timeout (ms)
  retryAttempts: number;            // Number of retry attempts
  fallbackEnabled: boolean;         // Enable fallback methods
  customHeaders?: Record<string, string>; // Custom request headers
  rateLimit?: {
    maxRequests: number;            // Maximum requests per period
    period: number;                 // Time period in seconds
  };
}
```

#### **Search Preference Model**
```typescript
interface SearchPreferences {
  defaultMaxResults: number;        // Default maximum results
  defaultSortBy: 'relevance' | 'date' | 'citations';
  preferFirecrawl: boolean;         // Prefer Firecrawl over Puppeteer
  enableDeduplication: boolean;     // Enable result deduplication
  deduplicationStrategy: 'strict' | 'fuzzy' | 'hybrid';
  parallelProcessing: boolean;      // Enable parallel source processing
  resultAggregation: 'merge' | 'append' | 'priority';
  qualityThreshold: number;         // Minimum quality score
  adaptiveSearch: boolean;          // Enable adaptive search
  searchHistory: boolean;           // Save search history
  maxSearchHistory: number;         // Maximum search history entries
}
```

#### **Display Preference Model**
```typescript
interface DisplayPreferences {
  showAbstracts: boolean;           // Show paper abstracts
  showCitations: boolean;           // Show citation counts
  showUrls: boolean;                // Show paper URLs
  maxAbstractLength: number;        // Maximum abstract length
  showKeywords: boolean;            // Show keywords/tags
  showMeshTerms: boolean;           // Show MeSH terms
  showPublicationType: boolean;     // Show publication types
  showLanguage: boolean;            // Show language information
  showCountry: boolean;             // Show country information
  showGrantNumbers: boolean;        // Show grant/funding numbers
  showReferences: boolean;          // Show reference lists
  showRelatedPapers: boolean;       // Show related papers
  formatOutput: 'text' | 'markdown' | 'html' | 'json';
  includeSource: boolean;           // Include source attribution
  includeTimestamp: boolean;        // Include search timestamp
  includeSearchStats: boolean;      // Include search statistics
}
```

#### **Cache Preference Model**
```typescript
interface CachePreferences {
  enabled: boolean;                 // Enable caching
  ttl: number;                      // Time to live (minutes)
  maxSize: number;                  // Maximum cache size (MB)
  storageType: 'memory' | 'file' | 'redis';
  compression: boolean;             // Enable compression
  encryption: boolean;              // Enable encryption
  cleanupInterval: number;          // Cleanup interval (minutes)
  persistOnShutdown: boolean;       // Persist cache on shutdown
  cacheKeys: string[];              // Cacheable operation keys
}
```

#### **Complete User Preferences Model**
```typescript
interface UserPreferences {
  sources: Record<string, SourcePreference>;
  search: SearchPreferences;
  display: DisplayPreferences;
  cache: CachePreferences;
  metadata: {
    version: string;                // Preferences schema version
    lastUpdated: Date;              // Last update timestamp
    created: Date;                  // Creation timestamp
    userAgent?: string;             // User agent string
    platform?: string;              // Platform information
    customSettings?: Record<string, any>; // Custom user settings
  };
}
```

### **Error and Response Models**

#### **Error Model**
```typescript
interface MCPError {
  code: string;                     // Error code
  message: string;                  // User-friendly error message
  details?: string;                 // Technical error details
  source?: string;                  // Source of the error
  timestamp: Date;                  // Error timestamp
  requestId?: string;               // Request identifier
  retryable: boolean;               // Whether error is retryable
  suggestions?: string[];           // Suggested solutions
  fallbackAvailable?: boolean;      // Whether fallback is available
}
```

#### **MCP Response Model**
```typescript
interface MCPResponse {
  content: Array<{
    type: 'text' | 'image' | 'tool-call' | 'error';
    text?: string;                  // Text content
    imageUrl?: string;              // Image URL
    toolCalls?: any[];              // Tool call information
    error?: MCPError;               // Error information
  }>;
  metadata?: {
    searchTime?: number;             // Search execution time
    resultCount?: number;            // Number of results
    sourcesUsed?: string[];         // Sources that were queried
    deduplicationStats?: any;       // Deduplication statistics
    userPreferences?: any;          // Applied user preferences
  };
}
```

#### **Rate Limiting Models**
```typescript
interface RateLimitConfig {
  maxRequests: number;              // Maximum requests per period
  period: number;                   // Time period in seconds
  burstSize?: number;               // Burst allowance
  retryAfter?: number;              // Retry after delay
  strategy: 'token-bucket' | 'leaky-bucket' | 'fixed-window' | 'sliding-window';
}

interface RateLimitState {
  currentTokens: number;            // Current available tokens
  lastRefill: Date;                // Last token refill time
  requestCount: number;             // Current period request count
  blockedUntil?: Date;              // Blocked until timestamp
  retryCount: number;               // Number of retry attempts
}
```

### **Configuration Models**

#### **Environment Configuration**
```typescript
interface EnvironmentConfig {
  nodeEnv: 'development' | 'production' | 'test';
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  port?: number;                    // Server port (if applicable)
  host?: string;                    // Server host (if applicable)
  apiKeys: {
    pubmed?: string;                // PubMed API key
    jstor?: string;                 // JSTOR API key
    firecrawl?: string;             // Firecrawl API key
  };
  timeouts: {
    request: number;                // Request timeout (ms)
    search: number;                 // Search timeout (ms)
    content: number;                // Content extraction timeout (ms)
  };
  limits: {
    maxResults: number;             // Maximum results per search
    maxContentLength: number;       // Maximum content length
    maxConcurrentSearches: number; // Maximum concurrent searches
  };
}
```

#### **Build Configuration**
```typescript
interface BuildConfig {
  target: 'node' | 'browser' | 'universal';
  format: 'esm' | 'cjs' | 'umd';
  minify: boolean;                  // Enable minification
  sourcemap: boolean;               // Generate source maps
  external: string[];               // External dependencies
  output: {
    dir: string;                    // Output directory
    filename: string;               // Output filename pattern
    chunkFilename?: string;         // Chunk filename pattern
  };
  optimization: {
    splitChunks: boolean;           // Enable code splitting
    treeShaking: boolean;           // Enable tree shaking
    minify: boolean;                // Enable minification
  };
}
```

## Schema Validation

### **Zod Schemas**

#### **Paper Validation Schema**
```typescript
import { z } from 'zod';

const PaperSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  abstract: z.string().optional(),
  authors: z.array(z.string()).min(1, 'At least one author is required'),
  url: z.string().url('Valid URL is required'),
  publicationDate: z.date().nullable().optional(),
  source: z.string().min(1, 'Source is required'),
});

const PubMedPaperSchema = PaperSchema.extend({
  pmid: z.string().regex(/^\d+$/, 'PMID must be numeric'),
  pmcid: z.string().regex(/^PMC\d+$/, 'PMCID must start with PMC').optional(),
  journal: z.string().min(1, 'Journal is required'),
  volume: z.string().optional(),
  issue: z.string().optional(),
  pages: z.string().optional(),
  doi: z.string().url('Valid DOI URL is required').optional(),
  keywords: z.array(z.string()).optional(),
  meshTerms: z.array(z.string()).optional(),
  publicationType: z.array(z.string()).optional(),
  language: z.string().optional(),
  country: z.string().optional(),
  grantNumbers: z.array(z.string()).optional(),
  references: z.array(z.string()).optional(),
  citations: z.number().int().min(0).optional(),
  relatedPapers: z.array(z.string()).optional(),
});
```

#### **Search Parameter Validation Schema**
```typescript
const PubMedSearchParamsSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  maxResults: z.number().int().min(1).max(1000).optional(),
  startDate: z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/, 'Date must be YYYY/MM/DD format').optional(),
  endDate: z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/, 'Date must be YYYY/MM/DD format').optional(),
  journal: z.string().optional(),
  author: z.string().optional(),
  publicationType: z.array(z.string()).optional(),
  language: z.string().optional(),
  sortBy: z.enum(['relevance', 'date', 'journal', 'author', 'title']).optional(),
  retmax: z.number().int().min(1).max(100000).optional(),
  retstart: z.number().int().min(0).optional(),
  field: z.string().optional(),
  datetype: z.enum(['pdat', 'mdat', 'dp']).optional(),
  reldate: z.number().int().min(1).optional(),
  mindate: z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/, 'Date must be YYYY/MM/DD format').optional(),
  maxdate: z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/, 'Date must be YYYY/MM/DD format').optional(),
});
```

#### **User Preference Validation Schema**
```typescript
const SourcePreferenceSchema = z.object({
  name: z.string().min(1, 'Source name is required'),
  enabled: z.boolean(),
  priority: z.number().int().min(1, 'Priority must be at least 1'),
  maxResults: z.number().int().min(1).max(10000),
  timeout: z.number().int().min(1000).max(60000),
  retryAttempts: z.number().int().min(0).max(10),
  fallbackEnabled: z.boolean(),
  customHeaders: z.record(z.string()).optional(),
  rateLimit: z.object({
    maxRequests: z.number().int().min(1),
    period: z.number().int().min(1),
  }).optional(),
});

const UserPreferencesSchema = z.object({
  sources: z.record(z.string(), SourcePreferenceSchema),
  search: z.object({
    defaultMaxResults: z.number().int().min(1).max(1000),
    defaultSortBy: z.enum(['relevance', 'date', 'citations']),
    preferFirecrawl: z.boolean(),
    enableDeduplication: z.boolean(),
    deduplicationStrategy: z.enum(['strict', 'fuzzy', 'hybrid']),
    parallelProcessing: z.boolean(),
    resultAggregation: z.enum(['merge', 'append', 'priority']),
    qualityThreshold: z.number().min(0).max(1),
    adaptiveSearch: z.boolean(),
    searchHistory: z.boolean(),
    maxSearchHistory: z.number().int().min(1).max(10000),
  }),
  display: z.object({
    showAbstracts: z.boolean(),
    showCitations: z.boolean(),
    showUrls: z.boolean(),
    maxAbstractLength: z.number().int().min(10).max(10000),
    showKeywords: z.boolean(),
    showMeshTerms: z.boolean(),
    showPublicationType: z.boolean(),
    showLanguage: z.boolean(),
    showCountry: z.boolean(),
    showGrantNumbers: z.boolean(),
    showReferences: z.boolean(),
    showRelatedPapers: z.boolean(),
    formatOutput: z.enum(['text', 'markdown', 'html', 'json']),
    includeSource: z.boolean(),
    includeTimestamp: z.boolean(),
    includeSearchStats: z.boolean(),
  }),
  cache: z.object({
    enabled: z.boolean(),
    ttl: z.number().int().min(1).max(1440),
    maxSize: z.number().int().min(1).max(10000),
    storageType: z.enum(['memory', 'file', 'redis']),
    compression: z.boolean(),
    encryption: z.boolean(),
    cleanupInterval: z.number().int().min(1).max(1440),
    persistOnShutdown: z.boolean(),
    cacheKeys: z.array(z.string()),
  }),
  metadata: z.object({
    version: z.string(),
    lastUpdated: z.date(),
    created: z.date(),
    userAgent: z.string().optional(),
    platform: z.string().optional(),
    customSettings: z.record(z.any()).optional(),
  }),
});
```

## Data Transformation

### **Model Mapping Functions**

#### **PubMed to Unified Paper Mapping**
```typescript
function mapPubMedToUnified(paper: PubMedPaper): UnifiedPaper {
  return {
    title: paper.title,
    abstract: paper.abstract,
    authors: paper.authors,
    url: paper.url,
    publicationDate: paper.publicationDate,
    source: paper.source,
    pmid: paper.pmid,
    pmcid: paper.pmcid,
    doi: paper.doi,
    journal: paper.journal,
    year: paper.publicationDate?.getFullYear(),
    citations: paper.citations,
    relatedPapers: paper.relatedPapers,
    keywords: paper.keywords,
    meshTerms: paper.meshTerms,
    publicationType: paper.publicationType,
    language: paper.language,
    country: paper.country,
    grantNumbers: paper.grantNumbers,
    references: paper.references,
    sourcePriority: 1,
    confidence: 0.95,
  };
}
```

#### **Google Scholar to Unified Paper Mapping**
```typescript
function mapGoogleScholarToUnified(paper: GoogleScholarPaper): UnifiedPaper {
  return {
    title: paper.title,
    abstract: paper.abstract,
    authors: paper.authors,
    url: paper.url,
    publicationDate: paper.publicationDate,
    source: paper.source,
    gsId: paper.gsId,
    journal: paper.journal,
    year: paper.year,
    citations: paper.citations,
    relatedPapers: paper.relatedPapers,
    pdfUrl: paper.pdfUrl,
    htmlUrl: paper.htmlUrl,
    snippet: paper.snippet,
    venue: paper.venue,
    sourcePriority: 2,
    confidence: 0.85,
  };
}
```

### **Data Normalization**

#### **Text Normalization**
```typescript
function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .replace(/[^\w\s\-.,;:!?()]/g, '') // Remove special characters
    .trim();                        // Remove leading/trailing whitespace
}
```

#### **Author Normalization**
```typescript
function normalizeAuthors(authors: string[]): string[] {
  return authors.map(author => 
    author
      .replace(/\s+/g, ' ')         // Normalize whitespace
      .replace(/[^\w\s\-.,]/g, '')  // Remove special characters
      .trim()                        // Remove leading/trailing whitespace
  ).filter(author => author.length > 0); // Remove empty authors
}
```

#### **Date Normalization**
```typescript
function normalizeDate(date: Date | string | null): Date | null {
  if (!date) return null;
  
  if (date instanceof Date) return date;
  
  if (typeof date === 'string') {
    // Handle various date formats
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) return parsed;
    
    // Handle YYYY/MM/DD format
    const match = date.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
    if (match) {
      return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
    }
  }
  
  return null;
}
```

## Data Persistence

### **File Storage Schema**
```typescript
interface FileStorageSchema {
  version: string;                  // Schema version
  timestamp: Date;                  // Last update timestamp
  data: {
    preferences: UserPreferences;   // User preferences
    cache: Record<string, any>;     // Cached data
    searchHistory: SearchHistory[]; // Search history
    userStats: UserStats;           // User statistics
  };
  metadata: {
    checksum: string;               // Data integrity checksum
    compression: boolean;           // Whether data is compressed
    encryption: boolean;            // Whether data is encrypted
  };
}
```

### **Database Schema (Future)**
```typescript
interface DatabaseSchema {
  users: {
    id: string;                     // User identifier
    preferences: UserPreferences;   // User preferences
    created: Date;                  // Account creation date
    lastActive: Date;               // Last activity date
  };
  searches: {
    id: string;                     // Search identifier
    userId: string;                 // User identifier
    query: string;                  // Search query
    results: UnifiedPaper[];        // Search results
    timestamp: Date;                // Search timestamp
    sources: string[];              // Sources used
    executionTime: number;          // Execution time (ms)
  };
  papers: {
    id: string;                     // Paper identifier
    data: UnifiedPaper;             // Paper data
    lastAccessed: Date;             // Last access date
    accessCount: number;            // Number of accesses
    source: string;                 // Data source
  };
  cache: {
    key: string;                    // Cache key
    value: any;                     // Cached value
    ttl: Date;                      // Time to live
    created: Date;                  // Creation timestamp
    accessCount: number;            // Access count
  };
}
```

This comprehensive data model documentation provides developers with all the technical details needed to understand, extend, and maintain the Scholarly Research MCP Server's data structures and schemas.
