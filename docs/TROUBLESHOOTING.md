# Troubleshooting and FAQ

This document provides solutions to common issues, frequently asked questions, and troubleshooting steps for the Scholarly Research MCP Server.

## Common Issues and Solutions

### **Search and API Issues**

#### **Issue: "No results found" for valid search queries**

**Symptoms:**
- Search returns empty results for common terms
- No error message, just empty result set
- Works for some queries but not others

**Possible Causes:**
1. **Rate Limiting**: API rate limits exceeded
2. **Network Issues**: Connection problems to external services
3. **API Key Issues**: Invalid or expired API keys
4. **Service Outages**: External services temporarily unavailable
5. **Query Format**: Search query format not supported

**Solutions:**
```bash
# Check API key validity
echo $PUBMED_API_KEY
echo $JSTOR_API_KEY

# Test network connectivity
curl -I https://eutils.ncbi.nlm.nih.gov/entrez/eutils/
curl -I https://scholar.google.com/

# Check rate limiting status
# Wait 1-2 minutes before retrying
```

**Prevention:**
- Implement proper rate limiting in your requests
- Use exponential backoff for retries
- Monitor API usage and quotas

#### **Issue: "API Error: Rate limit exceeded"**

**Symptoms:**
- Error message indicating rate limit exceeded
- Requests fail after successful initial requests
- Error occurs consistently after certain number of requests

**Solutions:**
```typescript
// Implement exponential backoff
async function searchWithRetry(query: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await searchAdapter.searchPapers({ query });
    } catch (error) {
      if (error.message.includes('rate limit') && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

**Rate Limiting Guidelines:**
- **PubMed**: Maximum 10 requests per second
- **Google Scholar**: Built-in delays (2-5 seconds between requests)
- **JSTOR**: Check API documentation for specific limits
- **Firecrawl**: Professional rate limiting included

#### **Issue: "Connection timeout" errors**

**Symptoms:**
- Requests hang for extended periods
- Timeout errors after 30+ seconds
- Intermittent connection failures

**Possible Causes:**
1. **Slow Network**: High latency or low bandwidth
2. **Firewall Issues**: Corporate or network firewalls blocking requests
3. **DNS Issues**: Domain resolution problems
4. **Proxy Configuration**: Incorrect proxy settings

**Solutions:**
```bash
# Test network connectivity
ping eutils.ncbi.nlm.nih.gov
nslookup scholar.google.com

# Check firewall settings
sudo ufw status
sudo iptables -L

# Test with different DNS servers
nslookup scholar.google.com 8.8.8.8
nslookup scholar.google.com 1.1.1.1
```

**Configuration Adjustments:**
```typescript
// Increase timeout values
const searchOptions = {
  query: 'machine learning',
  timeout: 60000, // 60 seconds
  retryAttempts: 3
};

// Use connection pooling
const adapter = new PubMedAdapter({
  timeout: 30000,
  keepAlive: true,
  maxSockets: 10
});
```

### **Content Extraction Issues**

#### **Issue: "Failed to extract full text" errors**

**Symptoms:**
- Paper metadata retrieved but full text extraction fails
- Error messages about content extraction
- Incomplete paper content

**Possible Causes:**
1. **Access Restrictions**: Paper requires subscription or institutional access
2. **Format Issues**: Unsupported document format
3. **Content Changes**: Website structure changed
4. **Anti-Scraping**: Website blocking automated access

**Solutions:**
```typescript
// Implement fallback extraction methods
async function extractContentWithFallback(pmid: string) {
  try {
    // Primary method
    return await extractPrimaryMethod(pmid);
  } catch (error) {
    console.warn('Primary extraction failed:', error.message);
    
    try {
      // Fallback method
      return await extractFallbackMethod(pmid);
    } catch (fallbackError) {
      console.error('All extraction methods failed:', fallbackError.message);
      throw new Error('Content extraction failed for all methods');
    }
  }
}

// Check access availability
async function checkPaperAccess(pmid: string) {
  const accessInfo = await getAccessInfo(pmid);
  
  if (accessInfo.requiresSubscription) {
    throw new Error('Paper requires institutional subscription');
  }
  
  if (accessInfo.format === 'pdf-only') {
    return await extractFromPDF(pmid);
  }
  
  return await extractFromHTML(pmid);
}
```

**Access Verification:**
```bash
# Check if paper is publicly accessible
curl -I "https://pubmed.ncbi.nlm.nih.gov/12345/"
curl -I "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12345/"

# Verify institutional access (if applicable)
# Check your institution's proxy settings
```

#### **Issue: "Invalid or corrupted content" in extracted text**

**Symptoms:**
- Extracted text contains HTML tags
- Text appears garbled or unreadable
- Missing or incomplete sections
- Duplicate content

**Solutions:**
```typescript
// Enhanced text cleaning
function cleanExtractedText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[a-zA-Z]+;/g, ' ') // Decode HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s\-.,;:!?()]/g, '') // Remove special characters
    .trim();
}

// Section validation
function validateSection(section: PaperSection): boolean {
  if (!section.content || section.content.length < 10) {
    return false; // Too short to be valid
  }
  
  if (section.content.includes('Loading...') || 
      section.content.includes('Access Denied')) {
    return false; // Invalid content markers
  }
  
  return true;
}

// Content quality scoring
function calculateContentQuality(text: string): number {
  let score = 0;
  
  // Check for meaningful content
  if (text.length > 100) score += 20;
  if (text.includes('Introduction')) score += 15;
  if (text.includes('Methods')) score += 15;
  if (text.includes('Results')) score += 15;
  if (text.includes('Discussion')) score += 15;
  if (text.includes('Conclusion')) score += 15;
  if (text.includes('References')) score += 5;
  
  // Penalize HTML artifacts
  if (text.includes('<')) score -= 10;
  if (text.includes('&')) score -= 5;
  
  return Math.max(0, Math.min(100, score));
}
```

### **Google Scholar Scraping Issues**

#### **Issue: "Browser automation failed" errors**

**Symptoms:**
- Puppeteer browser launch failures
- Headless Chrome/Chromium issues
- Browser crashes during scraping

**Possible Causes:**
1. **Missing Dependencies**: Chrome/Chromium not installed
2. **System Resources**: Insufficient memory or CPU
3. **Permission Issues**: System security restrictions
4. **Dependency Conflicts**: Version incompatibilities

**Solutions:**
```bash
# Install Chrome/Chromium dependencies
sudo apt-get update
sudo apt-get install -y \
  chromium-browser \
  libxss1 \
  libnss3 \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  libgbm1

# Check system resources
free -h
df -h
nproc

# Verify Puppeteer installation
npm list puppeteer
npx puppeteer --version
```

**Configuration Adjustments:**
```typescript
// Robust browser configuration
const browserOptions = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=TranslateUI',
    '--disable-ipc-flooding-protection'
  ],
  timeout: 30000,
  ignoreHTTPSErrors: true
};

// Memory management
const browser = await puppeteer.launch(browserOptions);
const page = await browser.newPage();

// Set memory limits
await page.setCacheEnabled(false);
await page.setRequestInterception(true);

page.on('request', (req) => {
  if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet') {
    req.abort();
  } else {
    req.continue();
  }
});
```

#### **Issue: "Google Scholar blocking requests"**

**Symptoms:**
- Consistent access denied errors
- CAPTCHA challenges
- IP address blocking
- Unusual traffic detection

**Solutions:**
```typescript
// Enhanced anti-detection measures
async function setupStealthPage(page: Page) {
  // Set realistic user agent
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
  
  // Set viewport
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Set extra headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  });
  
  // Disable webdriver detection
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
    
    // Remove webdriver properties
    delete (navigator as any).__proto__.webdriver;
  });
}

// Implement request delays
async function searchWithDelays(query: string) {
  const page = await browser.newPage();
  await setupStealthPage(page);
  
  // Random delays between actions
  const randomDelay = (min: number, max: number) => 
    Math.random() * (max - min) + min;
  
  await page.goto('https://scholar.google.com');
  await page.waitForTimeout(randomDelay(1000, 3000));
  
  await page.type('input[name="q"]', query);
  await page.waitForTimeout(randomDelay(500, 1500));
  
  await page.click('input[name="btnG"]');
  await page.waitForTimeout(randomDelay(2000, 5000));
  
  // Continue with result extraction...
}
```

**Alternative Solutions:**
- **Use Firecrawl**: Professional web scraping service with IP rotation
- **Implement Proxy Rotation**: Use multiple proxy servers
- **Reduce Request Frequency**: Increase delays between requests
- **Use Different User Agents**: Rotate through realistic browser configurations

### **User Preference Issues**

#### **Issue: "Preferences not saved" or "Settings reset"**

**Symptoms:**
- User preferences revert to defaults
- Configuration changes don't persist
- Settings lost after restart

**Possible Causes:**
1. **File Permissions**: Insufficient write permissions
2. **Directory Issues**: Preferences directory doesn't exist
3. **JSON Parsing Errors**: Corrupted preference file
4. **Disk Space**: Insufficient storage space

**Solutions:**
```bash
# Check file permissions
ls -la ~/.mcp-scholarly-research/
chmod 755 ~/.mcp-scholarly-research/
chmod 644 ~/.mcp-scholarly-research/preferences.json

# Verify directory exists
mkdir -p ~/.mcp-scholarly-research/

# Check disk space
df -h ~/

# Validate JSON file
cat ~/.mcp-scholarly-research/preferences.json | jq .
```

**Debugging Code:**
```typescript
// Enhanced preference management with error handling
class RobustUserPreferencesManager {
  private preferencesPath: string;
  private preferences: UserPreferences;
  
  constructor() {
    this.preferencesPath = this.getPreferencesPath();
    this.ensureDirectoryExists();
    this.preferences = this.loadPreferences();
  }
  
  private getPreferencesPath(): string {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    if (!homeDir) {
      throw new Error('Cannot determine home directory');
    }
    return path.join(homeDir, '.mcp-scholarly-research', 'preferences.json');
  }
  
  private ensureDirectoryExists(): void {
    const dir = path.dirname(this.preferencesPath);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
      } catch (error) {
        console.error('Failed to create preferences directory:', error);
        throw new Error(`Cannot create preferences directory: ${dir}`);
      }
    }
  }
  
  private loadPreferences(): UserPreferences {
    try {
      if (!fs.existsSync(this.preferencesPath)) {
        return this.getDefaultPreferences();
      }
      
      const data = fs.readFileSync(this.preferencesPath, 'utf8');
      const parsed = JSON.parse(data);
      
      // Validate preferences structure
      if (!this.validatePreferences(parsed)) {
        console.warn('Invalid preferences file, using defaults');
        return this.getDefaultPreferences();
      }
      
      return parsed;
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return this.getDefaultPreferences();
    }
  }
  
  private savePreferences(): void {
    try {
      const data = JSON.stringify(this.preferences, null, 2);
      fs.writeFileSync(this.preferencesPath, data, { mode: 0o644 });
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw new Error(`Cannot save preferences: ${error.message}`);
    }
  }
  
  private validatePreferences(prefs: any): prefs is UserPreferences {
    // Implement comprehensive validation
    return (
      prefs &&
      typeof prefs === 'object' &&
      prefs.sources &&
      prefs.search &&
      prefs.display &&
      prefs.cache
    );
  }
}
```

#### **Issue: "Invalid preference values" errors**

**Symptoms:**
- Error messages about invalid preference values
- Preferences not applying correctly
- Validation failures

**Solutions:**
```typescript
// Comprehensive preference validation
function validateUserPreferences(prefs: any): UserPreferences {
  const schema = z.object({
    sources: z.record(z.string(), z.object({
      name: z.string(),
      enabled: z.boolean(),
      priority: z.number().int().min(1).max(100),
      maxResults: z.number().int().min(1).max(10000),
      timeout: z.number().int().min(1000).max(60000)
    })),
    search: z.object({
      defaultMaxResults: z.number().int().min(1).max(1000),
      defaultSortBy: z.enum(['relevance', 'date', 'citations']),
      preferFirecrawl: z.boolean(),
      enableDeduplication: z.boolean()
    }),
    display: z.object({
      showAbstracts: z.boolean(),
      showCitations: z.boolean(),
      maxAbstractLength: z.number().int().min(10).max(10000)
    })
  });
  
  try {
    return schema.parse(prefs);
  } catch (error) {
    console.error('Preference validation failed:', error);
    throw new Error('Invalid preference values detected');
  }
}

// Safe preference updates
function updatePreferencesSafely(
  current: UserPreferences,
  updates: Partial<UserPreferences>
): UserPreferences {
  const merged = { ...current, ...updates };
  
  try {
    return validateUserPreferences(merged);
  } catch (error) {
    console.error('Preference update validation failed:', error);
    return current; // Return current preferences unchanged
  }
}
```

### **Performance and Resource Issues**

#### **Issue: "High memory usage" or "Out of memory" errors**

**Symptoms:**
- Application consumes excessive RAM
- Memory usage grows over time
- Out of memory crashes
- Slow performance

**Solutions:**
```typescript
// Memory-efficient data processing
class MemoryEfficientProcessor {
  private maxMemoryUsage = 500 * 1024 * 1024; // 500MB
  
  async processLargeDataset<T>(
    data: T[],
    processor: (item: T) => Promise<any>
  ): Promise<any[]> {
    const results: any[] = [];
    const batchSize = 1000;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      // Process batch
      const batchResults = await Promise.all(
        batch.map(item => processor(item))
      );
      
      results.push(...batchResults);
      
      // Check memory usage
      if (this.shouldGarbageCollect()) {
        this.forceGarbageCollection();
      }
      
      // Yield control to event loop
      await new Promise(resolve => setImmediate(resolve));
    }
    
    return results;
  }
  
  private shouldGarbageCollect(): boolean {
    const usage = process.memoryUsage();
    return usage.heapUsed > this.maxMemoryUsage;
  }
  
  private forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
    }
  }
}

// Resource cleanup
class ResourceManager {
  private resources: Set<{ close?: () => void; destroy?: () => void }> = new Set();
  
  addResource(resource: any): void {
    this.resources.add(resource);
  }
  
  cleanup(): void {
    for (const resource of this.resources) {
      try {
        if (resource.close) resource.close();
        if (resource.destroy) resource.destroy();
      } catch (error) {
        console.error('Resource cleanup failed:', error);
      }
    }
    this.resources.clear();
  }
}
```

#### **Issue: "Slow search performance"**

**Symptoms:**
- Search requests take too long
- UI becomes unresponsive
- Timeout errors on complex queries

**Solutions:**
```typescript
// Performance optimization
class OptimizedSearchAdapter {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes
  
  async searchPapers(options: SearchOptions): Promise<SearchResult> {
    const cacheKey = this.generateCacheKey(options);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    
    // Perform search with timeout
    const searchPromise = this.performSearch(options);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Search timeout')), 30000)
    );
    
    try {
      const result = await Promise.race([searchPromise, timeoutPromise]);
      
      // Cache result
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      return result;
    } catch (error) {
      if (error.message === 'Search timeout') {
        throw new Error('Search took too long, please try a more specific query');
      }
      throw error;
    }
  }
  
  private generateCacheKey(options: SearchOptions): string {
    return JSON.stringify(options);
  }
  
  // Implement search result streaming for large datasets
  async *streamSearchResults(options: SearchOptions): AsyncGenerator<SearchResult> {
    const batchSize = 100;
    let offset = 0;
    
    while (true) {
      const batch = await this.searchBatch(options, offset, batchSize);
      
      if (batch.length === 0) break;
      
      yield batch;
      offset += batchSize;
      
      // Yield control to prevent blocking
      await new Promise(resolve => setImmediate(resolve));
    }
  }
}
```

## Frequently Asked Questions

### **General Usage**

#### **Q: How do I get started with the tool?**

**A:** The easiest way is to use the online version at [tool URL]. For local installation:

```bash
# Install Node.js 18+
# Clone the repository
git clone https://github.com/your-username/mcp-for-research.git
cd mcp-for-research

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start the server
npm run dev
```

#### **Q: What data sources are supported?**

**A:** Currently supported sources:
- **PubMed**: NCBI E-utilities API (requires API key)
- **Google Scholar**: Web scraping via Puppeteer or Firecrawl
- **JSTOR**: API integration (requires API key)

#### **Q: How do I get API keys?**

**A:** 
- **PubMed**: Request from [NCBI](https://ncbiinsights.ncbi.nlm.nih.gov/2017/11/02/new-api-keys-for-the-e-utilities/)
- **JSTOR**: Contact JSTOR for Data for Research access
- **Firecrawl**: Sign up at [Firecrawl](https://firecrawl.dev)

### **Technical Questions**

#### **Q: What are the system requirements?**

**A:** 
- **Node.js**: 18.0.0 or higher
- **Memory**: Minimum 512MB RAM (1GB recommended)
- **Storage**: 2GB free disk space
- **Network**: Stable internet connection
- **OS**: Linux, macOS, or Windows (WSL2 recommended)

#### **Q: How do I handle rate limiting?**

**A:** The tool includes built-in rate limiting:
- **PubMed**: 10 requests per second
- **Google Scholar**: Built-in delays (2-5 seconds)
- **Automatic retry**: Exponential backoff for failed requests
- **Configurable**: Adjust limits in environment variables

#### **Q: Can I use this in production?**

**A:** Yes, but consider:
- **API Quotas**: Monitor usage and implement proper rate limiting
- **Error Handling**: Implement comprehensive error handling
- **Monitoring**: Add logging and performance monitoring
- **Scaling**: Consider horizontal scaling for high load
- **Security**: Review and secure API keys and configurations

### **Troubleshooting Questions**

#### **Q: Why am I getting "No results found"?**

**A:** Common causes and solutions:
1. **Check API keys**: Verify they're valid and not expired
2. **Rate limiting**: Wait before retrying
3. **Network issues**: Check internet connectivity
4. **Query format**: Try simpler, more specific terms
5. **Service status**: Check if external services are down

#### **Q: How do I fix "Browser automation failed"?**

**A:** 
1. **Install dependencies**: Ensure Chrome/Chromium is installed
2. **Check permissions**: Verify system access rights
3. **Use Firecrawl**: Switch to professional web scraping service
4. **System resources**: Ensure sufficient RAM and CPU
5. **Update Puppeteer**: Use latest version

#### **Q: Preferences not saving - what should I do?**

**A:** 
1. **Check permissions**: Verify write access to home directory
2. **Directory creation**: Ensure `.mcp-scholarly-research` exists
3. **File validation**: Check if preferences.json is valid JSON
4. **Disk space**: Verify sufficient storage space
5. **Restart application**: Restart after configuration changes

## Getting Help

### **Self-Service Resources**

#### **Documentation**
- **README.md**: Quick start and basic usage
- **API_REFERENCE.md**: Complete API documentation
- **DEVELOPMENT.md**: Development setup and workflow
- **ARCHITECTURE.md**: System architecture details

#### **Logs and Debugging**
```bash
# Enable debug logging
export LOG_LEVEL=debug
npm run dev

# Check application logs
tail -f logs/combined.log
tail -f logs/error.log

# Monitor system resources
htop
iotop
```

#### **Testing and Validation**
```bash
# Run test suite
npm run test:all-tools-bash

# Check specific functionality
npm run test:unit
npm run test:integration

# Validate configuration
npm run type-check
npm run lint
```

### **Community Support**

#### **GitHub Issues**
- **Bug Reports**: Include error messages, logs, and reproduction steps
- **Feature Requests**: Describe use case and expected behavior
- **Documentation**: Report unclear or missing documentation

#### **Issue Template**
```markdown
## Issue Description
Brief description of the problem

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., Ubuntu 20.04]
- Node.js: [e.g., 18.17.0]
- npm: [e.g., 9.6.7]
- Tool version: [e.g., latest]

## Error Messages
Include any error messages or logs

## Additional Information
Any other relevant details
```

### **Professional Support**

#### **When to Seek Professional Help**
- **Critical Production Issues**: System down or major functionality broken
- **Complex Integration**: Custom deployments or enterprise integrations
- **Performance Problems**: Significant performance degradation
- **Security Concerns**: Potential security vulnerabilities

#### **Support Channels**
- **GitHub Issues**: For bug reports and feature requests
- **Discussions**: For questions and community support
- **Email**: For professional support inquiries
- **Documentation**: Comprehensive guides and references

## Prevention and Best Practices

### **Regular Maintenance**

#### **System Health Checks**
```bash
# Daily checks
npm audit
npm outdated
df -h
free -h

# Weekly checks
npm run test:all-tools-bash
npm run quality
npm run build:all
```

#### **Monitoring and Alerting**
```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  };
  
  res.json(health);
});

// Performance monitoring
const performanceMonitor = new PerformanceMonitor();
performanceMonitor.startTimer('search-operation');
// ... perform operation
performanceMonitor.endTimer('search-operation');
```

### **Configuration Management**

#### **Environment-Specific Configs**
```bash
# Development
NODE_ENV=development
LOG_LEVEL=debug
DEBUG=true

# Production
NODE_ENV=production
LOG_LEVEL=warn
DEBUG=false

# Testing
NODE_ENV=test
LOG_LEVEL=error
TESTING=true
```

#### **Configuration Validation**
```typescript
// Validate environment configuration
function validateEnvironment(): void {
  const required = ['PUBMED_API_KEY', 'NODE_ENV'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate API keys
  if (process.env.PUBMED_API_KEY && process.env.PUBMED_API_KEY.length < 10) {
    throw new Error('Invalid PubMed API key format');
  }
}
```

This comprehensive troubleshooting guide provides solutions to common issues and best practices for maintaining a healthy Scholarly Research MCP Server installation.
