# Development and Deployment Guide

This document provides comprehensive technical details for developers working on the Scholarly Research MCP Server, including setup, development workflow, testing, and deployment.

## Development Environment Setup

### **Prerequisites**

#### **System Requirements**
- **Operating System**: Linux, macOS, or Windows (WSL2 recommended for Windows)
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Git**: Version 2.20.0 or higher
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: Minimum 2GB free disk space

#### **Node.js Installation**
```bash
# Using Node Version Manager (nvm) - Recommended
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Using package manager (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Using package manager (macOS)
brew install node@18
```

#### **Development Tools**
```bash
# Install development dependencies
npm install -g typescript ts-node nodemon eslint prettier

# Install Git hooks (optional)
npm install -g husky lint-staged
```

### **Repository Setup**

#### **Clone and Install**
```bash
# Clone the repository
git clone https://github.com/your-username/mcp-for-research.git
cd mcp-for-research

# Install dependencies
npm install

# Install development dependencies
npm install --save-dev @types/node @types/jest @types/puppeteer
```

#### **Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**
```bash
# API Keys
PUBMED_API_KEY=your_pubmed_api_key_here
JSTOR_API_KEY=your_jstor_api_key_here
FIRECRAWL_API_KEY=your_firecrawl_api_key_here

# Development Settings
NODE_ENV=development
LOG_LEVEL=debug
PORT=3000

# Timeouts (milliseconds)
REQUEST_TIMEOUT=30000
SEARCH_TIMEOUT=60000
CONTENT_TIMEOUT=120000

# Rate Limiting
PUBMED_RATE_LIMIT=10
PUBMED_RATE_PERIOD=1
```

#### **IDE Configuration**

**VS Code Extensions (Recommended):**
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "ms-vscode.vscode-markdown"
  ]
}
```

**VS Code Settings:**
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always"
}
```

## Development Workflow

### **Code Structure**

#### **Source Organization**
```
src/
├── index.ts                        # Main server entry point
├── adapters/                       # Data source adapters
│   ├── pubmed.ts                   # PubMed API adapter
│   ├── google-scholar.ts           # Google Scholar adapter
│   ├── google-scholar-firecrawl.ts # Firecrawl integration
│   ├── unified-search.ts           # Basic unified search
│   ├── enhanced-unified-search.ts  # Enhanced unified search
│   └── preference-aware-unified-search.ts # Preference-aware search
├── preferences/                     # User preference management
│   └── user-preferences.ts         # Preferences manager
├── models/                         # Data models and interfaces
│   ├── paper.ts                    # Paper data models
│   ├── search.ts                   # Search parameter models
│   └── preferences.ts              # Preference models
├── utils/                          # Utility functions
│   ├── rate-limiter.ts             # Rate limiting utilities
│   ├── text-processor.ts           # Text processing utilities
│   └── validation.ts               # Validation utilities
└── types/                          # TypeScript type definitions
    ├── mcp.ts                      # MCP protocol types
    ├── api.ts                      # API response types
    └── common.ts                   # Common types
```

#### **Import Organization**
```typescript
// External dependencies
import { z } from 'zod';
import { McpServer, StdioServerTransport } from '@modelcontextprotocol/sdk/server';

// Internal modules
import { PubMedAdapter } from './adapters/pubmed';
import { GoogleScholarAdapter } from './adapters/google-scholar';
import { UserPreferencesManager } from './preferences/user-preferences';

// Types and interfaces
import type { PubMedPaper, UnifiedPaper } from './models/paper';
import type { PubMedSearchParams } from './models/search';
```

### **Development Commands**

#### **Build and Development**
```bash
# Build the project
npm run build

# Watch mode for development
npm run dev

# Clean build artifacts
npm run clean

# Type checking only
npm run type-check

# Lint code
npm run lint

# Format code
npm run format
```

#### **Testing Commands**
```bash
# Run all tests
npm run test:all-tools-bash

# Run specific test suites
npm run test:unit                    # Unit tests only
npm run test:integration             # Integration tests only
npm run test:preferences             # Preference tests only

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests with specific patterns
npm run test -- --grep "PubMed"
npm run test -- --grep "Google Scholar"
```

#### **Quality Assurance**
```bash
# Run all quality checks
npm run quality

# Security audit
npm audit

# Dependency updates
npm outdated
npm update

# Bundle analysis
npm run analyze
```

### **Code Quality Standards**

#### **TypeScript Configuration**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "removeComments": false,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

#### **ESLint Configuration**
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/prefer-const": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

#### **Prettier Configuration**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

## Testing Strategy

### **Test Organization**

#### **Test Structure**
```
tests/
├── unit/                           # Unit tests
│   ├── adapters/                   # Adapter unit tests
│   ├── preferences/                # Preference unit tests
│   └── utils/                      # Utility unit tests
├── integration/                    # Integration tests
│   ├── api/                        # API integration tests
│   ├── adapters/                   # Adapter integration tests
│   └── end-to-end/                 # End-to-end tests
├── fixtures/                       # Test data and fixtures
│   ├── papers/                     # Sample paper data
│   ├── responses/                  # Sample API responses
│   └── preferences/                # Sample preference data
├── mocks/                          # Mock implementations
│   ├── api-mocks.ts                # API response mocks
│   ├── browser-mocks.ts            # Browser automation mocks
│   └── preference-mocks.ts         # Preference system mocks
└── helpers/                        # Test helper functions
    ├── test-utils.ts               # Common test utilities
    ├── assertion-helpers.ts        # Custom assertions
    └── setup-helpers.ts            # Test setup helpers
```

#### **Test Configuration**
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  verbose: true,
};
```

### **Testing Patterns**

#### **Unit Test Example**
```typescript
import { PubMedAdapter } from '../../src/adapters/pubmed';
import { mockPubMedResponse } from '../fixtures/responses/pubmed';

describe('PubMedAdapter', () => {
  let adapter: PubMedAdapter;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    adapter = new PubMedAdapter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchPapers', () => {
    it('should return papers for valid search query', async () => {
      // Arrange
      const searchParams = { query: 'machine learning', maxResults: 5 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPubMedResponse,
      } as Response);

      // Act
      const result = await adapter.searchPapers(searchParams);

      // Assert
      expect(result).toHaveLength(5);
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('pmid');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('esearch.fcgi'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const searchParams = { query: 'invalid query' };
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      // Act & Assert
      await expect(adapter.searchPapers(searchParams)).rejects.toThrow(
        'Search failed: API Error'
      );
    });
  });
});
```

#### **Integration Test Example**
```typescript
import { UnifiedSearchAdapter } from '../../src/adapters/enhanced-unified-search';
import { UserPreferencesManager } from '../../src/preferences/user-preferences';

describe('UnifiedSearch Integration', () => {
  let searchAdapter: UnifiedSearchAdapter;
  let preferencesManager: UserPreferencesManager;

  beforeAll(async () => {
    preferencesManager = UserPreferencesManager.getInstance();
    searchAdapter = new UnifiedSearchAdapter(
      new PubMedAdapter(),
      new GoogleScholarAdapter(),
      null // No Firecrawl for integration tests
    );
  });

  it('should search multiple sources and deduplicate results', async () => {
    // Arrange
    const searchOptions = {
      query: 'artificial intelligence',
      maxResults: 10,
      sources: ['pubmed', 'google-scholar'],
      enableDeduplication: true,
    };

    // Act
    const results = await searchAdapter.searchPapers(searchOptions);

    // Assert
    expect(results).toHaveLength(expect.any(Number));
    expect(results.length).toBeLessThanOrEqual(10);
    
    // Check for deduplication
    const titles = results.map(r => r.title.toLowerCase());
    const uniqueTitles = new Set(titles);
    expect(titles.length).toBe(uniqueTitles.size);
  }, 30000);
});
```

#### **Mock Implementation Example**
```typescript
// tests/mocks/api-mocks.ts
export const mockPubMedResponse = {
  esearchresult: {
    idlist: ['12345', '67890', '11111'],
    count: '3',
    retmax: '3',
    retstart: '0',
  },
};

export const mockPubMedSummaryResponse = {
  result: {
    '12345': {
      uid: '12345',
      title: 'Sample Research Paper',
      abstract: 'This is a sample abstract for testing purposes.',
      authors: ['Smith, J', 'Doe, A'],
      journal: 'Test Journal',
      pubdate: '2023 Jan',
      doi: '10.1234/test.2023.001',
    },
    // ... more papers
  },
};

export class MockPubMedAPI {
  static async search(query: string, maxResults: number = 10) {
    return mockPubMedResponse;
  }

  static async fetchSummary(pmids: string[]) {
    return mockPubMedSummaryResponse;
  }
}
```

### **Test Data Management**

#### **Fixture Organization**
```typescript
// tests/fixtures/papers/sample-papers.ts
export const samplePubMedPapers = [
  {
    pmid: '12345',
    title: 'Machine Learning in Healthcare',
    abstract: 'A comprehensive review of ML applications in healthcare...',
    authors: ['Smith, J', 'Johnson, A', 'Williams, B'],
    journal: 'Journal of Medical AI',
    publicationDate: new Date('2023-01-15'),
    source: 'PubMed',
  },
  // ... more papers
];

export const sampleGoogleScholarPapers = [
  {
    title: 'Deep Learning for Medical Imaging',
    abstract: 'Recent advances in deep learning for medical image analysis...',
    authors: ['Brown, C', 'Davis, D'],
    url: 'https://example.com/paper1',
    publicationDate: new Date('2023-02-20'),
    source: 'Google Scholar',
  },
  // ... more papers
];
```

## Build and Deployment

### **Build Configuration**

#### **TypeScript Build**
```json
// tsconfig.build.json
{
  "extends": "./tsconfig.json",
  "exclude": [
    "tests",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/*.mock.ts"
  ],
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": false,
    "outDir": "./dist"
  }
}
```

#### **Webpack Configuration**
```javascript
// webpack.config.js
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './src/index.ts',
  target: 'node',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs2',
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: process.env.NODE_ENV === 'production',
          },
        },
      }),
    ],
  },
  externals: {
    '@modelcontextprotocol/sdk': 'commonjs @modelcontextprotocol/sdk',
    'puppeteer': 'commonjs puppeteer',
    'cheerio': 'commonjs cheerio',
  },
};
```

### **Package Configuration**

#### **Package.json Scripts**
```json
{
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "build:webpack": "webpack --config webpack.config.js",
    "build:all": "npm run clean && npm run build && npm run build:webpack",
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "start": "node dist/index.js",
    "clean": "rimraf dist coverage",
    "type-check": "tsc --noEmit",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write src/**/*.ts",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:preferences": "node tests/test-preferences.js",
    "test:all-tools-bash": "./tests/run-all-tests.sh",
    "quality": "npm run lint && npm run type-check && npm run test:coverage",
    "prepublishOnly": "npm run build:all && npm run test:all-tools-bash",
    "analyze": "webpack-bundle-analyzer dist/stats.json"
  }
}
```

#### **Package.json Dependencies**
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.4.0",
    "puppeteer": "^19.11.1",
    "cheerio": "^1.0.0-rc.12",
    "axios": "^1.6.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/jest": "^29.5.0",
    "@types/puppeteer": "^7.0.4",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "jest": "^29.5.0",
    "prettier": "^3.0.0",
    "ts-jest": "^29.1.0",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.0.0",
    "webpack": "^5.0.0",
    "webpack-cli": "^5.0.0",
    "ts-loader": "^9.0.0",
    "terser-webpack-plugin": "^5.0.0"
  },
  "peerDependencies": {
    "node": ">=18.0.0"
  }
}
```

### **Deployment Process**

#### **Local Development Deployment**
```bash
# Development mode
npm run dev

# Production build and start
npm run build
npm start

# Docker development
docker-compose up --build
```

#### **Production Deployment**
```bash
# Build for production
npm run build:all

# Test production build
npm run test:all-tools-bash

# Package for distribution
npm pack

# Publish to npm
npm publish
```

#### **Docker Deployment**
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY dist/ ./dist/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "process.exit(0)"

# Start application
CMD ["node", "dist/index.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  mcp-server:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "process.exit(0)"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Performance Optimization

### **Code Optimization**

#### **Memory Management**
```typescript
// Efficient data processing
function processLargeDataset(data: any[]) {
  // Use streaming for large datasets
  const stream = new Readable({
    objectMode: true,
    read() {
      // Process data in chunks
    }
  });
  
  // Process in batches to avoid memory issues
  const batchSize = 1000;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    // Process batch
  }
}

// Proper cleanup
class ResourceManager {
  private resources: Set<any> = new Set();
  
  addResource(resource: any) {
    this.resources.add(resource);
  }
  
  cleanup() {
    for (const resource of this.resources) {
      if (resource.close) resource.close();
      if (resource.destroy) resource.destroy();
    }
    this.resources.clear();
  }
}
```

#### **Async Optimization**
```typescript
// Parallel processing
async function parallelSearch(queries: string[]) {
  const searchPromises = queries.map(query => 
    searchAdapter.searchPapers({ query, maxResults: 10 })
  );
  
  const results = await Promise.allSettled(searchPromises);
  
  return results
    .filter(result => result.status === 'fulfilled')
    .map(result => (result as PromiseFulfilledResult<any>).value)
    .flat();
}

// Connection pooling
class ConnectionPool {
  private pool: Set<any> = new Set();
  private maxConnections = 10;
  
  async getConnection() {
    if (this.pool.size < this.maxConnections) {
      const connection = await this.createConnection();
      this.pool.add(connection);
      return connection;
    }
    
    // Wait for available connection
    return new Promise(resolve => {
      const checkPool = () => {
        if (this.pool.size < this.maxConnections) {
          this.getConnection().then(resolve);
        } else {
          setTimeout(checkPool, 100);
        }
      };
      checkPool();
    });
  }
}
```

### **Monitoring and Profiling**

#### **Performance Monitoring**
```typescript
import { performance } from 'perf_hooks';

class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  startTimer(operation: string) {
    return performance.now();
  }
  
  endTimer(operation: string, startTime: number) {
    const duration = performance.now() - startTime;
    
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    this.metrics.get(operation)!.push(duration);
  }
  
  getStats(operation: string) {
    const times = this.metrics.get(operation) || [];
    if (times.length === 0) return null;
    
    const sorted = times.sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    
    return {
      count: times.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }
}
```

#### **Memory Profiling**
```typescript
import { performance, PerformanceObserver } from 'perf_hooks';

class MemoryProfiler {
  private observer: PerformanceObserver;
  
  constructor() {
    this.observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          console.log(`${entry.name}: ${entry.duration}ms`);
        }
      });
    });
    
    this.observer.observe({ entryTypes: ['measure'] });
  }
  
  startMeasure(name: string) {
    performance.mark(`${name}-start`);
  }
  
  endMeasure(name: string) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  }
  
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: `${Math.round(usage.rss / 1024 / 1024 * 100) / 100} MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100} MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100} MB`,
      external: `${Math.round(usage.external / 1024 / 1024 * 100) / 100} MB`,
    };
  }
}
```

## Troubleshooting

### **Common Issues**

#### **TypeScript Compilation Errors**
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache/typescript/

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript version compatibility
npx tsc --version
npm list typescript
```

#### **Test Failures**
```bash
# Clear Jest cache
npm run test -- --clearCache

# Run tests with verbose output
npm run test -- --verbose

# Run specific failing test
npm run test -- --grep "failing test name"

# Check test environment
node --version
npm --version
```

#### **Build Failures**
```bash
# Clean build artifacts
npm run clean

# Check for syntax errors
npm run type-check

# Verify dependencies
npm ls

# Check Node.js version compatibility
node --version
```

### **Debugging**

#### **VS Code Debugging**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug MCP Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.ts",
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development",
        "LOG_LEVEL": "debug"
      },
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

#### **Logging and Debugging**
```typescript
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Usage in code
logger.debug('Debug information', { 
  operation: 'search', 
  query: 'machine learning',
  timestamp: new Date() 
});

logger.error('Error occurred', { 
  error: error.message, 
  stack: error.stack,
  context: 'PubMed search' 
});
```

This comprehensive development guide provides developers with all the technical details needed to set up, develop, test, and deploy the Scholarly Research MCP Server effectively.
