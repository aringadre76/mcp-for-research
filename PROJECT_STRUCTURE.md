# Project Structure

This document outlines the organization and structure of the Scholarly Research MCP Server project.

## Directory Structure

```
scholarly-research-mcp/
├── src/                          # Source code
│   ├── index.ts                  # Main server entry point
│   └── adapters/                 # Data source adapters
│       ├── pubmed.ts             # PubMed API integration
│       ├── google-scholar.ts     # Google Scholar web scraping
│       ├── google-scholar-firecrawl.ts # Firecrawl MCP integration
│       ├── unified-search.ts     # Basic unified search
│       └── enhanced-unified-search.ts # Enhanced unified search
├── tests/                        # Test suites
│   ├── README.md                 # Test documentation
│   ├── test-all-tools-simple.sh # Bash test runner (recommended)
│   ├── test_all_tools.py        # Python test runner
│   ├── test-all-tools.js        # Node.js test runner
│   ├── test-firecrawl-integration.js # Firecrawl tests
│   ├── test-google-scholar.js   # Google Scholar tests
│   ├── test-simple-google-scholar.js # Simple GS tests
│   ├── test-unified-search.js   # Unified search tests
│   ├── test-citations.js        # Citation tests
│   └── jest.setup.js            # Jest configuration
├── scripts/                      # Utility scripts
│   ├── test-mcp-tool.js         # MCP tool testing
│   ├── publish-both.js          # Dual registry publishing
│   └── version.js               # Release management
├── docs/                         # Documentation
│   ├── GITHUB_ACTIONS_SETUP.md  # GitHub Actions guide
│   └── CURSOR_SETUP.md          # Cursor IDE setup
├── .github/                      # GitHub configuration
│   └── workflows/                # GitHub Actions
│       └── publish.yml           # Automated publishing
├── dist/                         # Built output (generated)
├── package.json                  # Project configuration
├── package-lock.json             # Dependency lock file
├── tsconfig.json                 # TypeScript configuration
├── .npmignore                    # NPM package exclusions
├── .gitignore                    # Git exclusions
├── .npmrc                        # NPM configuration
├── README.md                     # Main documentation
└── PROJECT_STRUCTURE.md          # This file
```

## Architecture Overview

### **Core Components**

#### **1. MCP Server (`src/index.ts`)**
- Main entry point for the MCP server
- Registers all available tools
- Manages server lifecycle and connections
- Handles MCP protocol communication

#### **2. Adapters (`src/adapters/`)**
- **PubMed Adapter**: NCBI E-utilities API integration
- **Google Scholar Adapter**: Puppeteer-based web scraping
- **Firecrawl Adapter**: Professional web scraping service
- **Unified Search**: Combines multiple sources
- **Enhanced Unified Search**: Advanced unified search with fallback

#### **3. Test Suites (`tests/`)**
- **Bash Suite**: Shell-based testing (recommended)
- **Python Suite**: Python-based comprehensive testing
- **JavaScript Suite**: Node.js-based testing
- **Individual Tests**: Specific functionality testing

### **Data Flow**

```
User Request → MCP Server → Adapter Selection → Data Source → Response Processing → User Response
```

## Configuration Files

### **Package Configuration**
- `package.json`: Project metadata, dependencies, scripts
- `package-lock.json`: Exact dependency versions
- `.npmrc`: NPM registry configuration

### **TypeScript Configuration**
- `tsconfig.json`: TypeScript compiler options
- Build target: ES2020
- Module system: ES modules
- Strict type checking enabled

### **Git Configuration**
- `.gitignore`: Excludes build artifacts, dependencies
- `.github/`: GitHub-specific configuration
- Workflows for automated testing and publishing

## Build and Distribution

### **Build Process**
1. **TypeScript Compilation**: `src/` → `dist/`
2. **Bundle Generation**: ES modules for Node.js
3. **Type Definitions**: Generated `.d.ts` files
4. **Source Maps**: For debugging support

### **Package Contents**
- **Source**: Compiled JavaScript in `dist/`
- **Types**: TypeScript definitions
- **Excluded**: Tests, docs, scripts, source code

## Testing Strategy

### **Test Coverage**
- **Unit Tests**: Individual adapter functionality
- **Integration Tests**: Cross-adapter communication
- **MCP Tests**: Protocol compliance
- **Performance Tests**: Response time validation

### **Test Execution**
- **Bash**: `npm run test:all-tools-bash`
- **Python**: `npm run test:all-tools-python`
- **JavaScript**: `npm run test:all-tools-js`
- **Individual**: `npm run test:[component]`

## Deployment

### **NPM Publishing**
- **Registry**: npmjs.com (public)
- **Package**: `scholarly-research-mcp`
- **Release Management**: Automated release process
- **Automation**: GitHub Actions workflow

### **Installation Methods**
```bash
# Global installation
npm install -g scholarly-research-mcp

# Local installation
npm install scholarly-research-mcp

# Development installation
git clone https://github.com/aringadre76/mcp-for-research.git
cd mcp-for-research
npm install
npm run build
```

## 🔄 Development Workflow

### **Local Development**
1. Clone repository
2. Install dependencies: `npm install`
3. Build project: `npm run build`
4. Start development: `npm run dev`
5. Run tests: `npm run test:all-tools-bash`

### **Code Changes**
1. Make changes in `src/`
2. Update tests if needed
3. Run test suite
4. Build project
5. Commit and push changes

### **Release Process**
1. Update version in `package.json`
2. Run full test suite
3. Build project
4. Publish to npm: `npm publish`
5. Create GitHub release

## Documentation

### **User Documentation**
- `README.md`: Main project documentation
- Installation and usage instructions
- Feature descriptions and examples
- Troubleshooting guide

### **Developer Documentation**
- `PROJECT_STRUCTURE.md`: This file
- `tests/README.md`: Testing documentation
- `docs/`: Additional setup guides
- Code comments and JSDoc

## Project Goals

### **Current Status**
- PubMed integration complete
- Google Scholar integration complete
- Firecrawl MCP integration complete
- Unified search functionality
- Comprehensive testing suite
- NPM package published

### **Future Enhancements**
- 🔄 JSTOR integration
- 🔄 Enhanced analytics
- 🔄 Performance optimization
- 🔄 Additional data sources

## Contributing

### **Development Setup**
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Ensure CI passes

### **Code Standards**
- TypeScript strict mode
- Comprehensive testing
- Clear documentation
- Performance consideration
- Error handling

---

This structure ensures maintainability, testability, and scalability of the Scholarly Research MCP Server project.
