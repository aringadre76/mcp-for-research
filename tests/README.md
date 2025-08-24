# Test Suites for Scholarly Research MCP Server

This directory contains comprehensive test suites for testing all available tools and functionality in the Scholarly Research MCP Server.

## 🧪 Available Test Suites

### 1. **Bash Test Suite** (Recommended)
- **File**: `test-all-tools.sh`
- **Language**: Bash
- **Features**: Full MCP tool testing, performance testing, error handling
- **Best for**: Comprehensive testing, CI/CD integration

### 2. **Python Test Suite**
- **File**: `test_all_tools.py`
- **Language**: Python 3
- **Features**: Full MCP tool testing, detailed reporting, JSON output
- **Best for**: Detailed analysis, automated testing

### 3. **JavaScript Test Suite**
- **File**: `test-all-tools.js`
- **Language**: Node.js
- **Features**: Basic functionality testing, adapter testing
- **Best for**: Quick validation, development testing

## 🚀 Quick Start

### Run All Tests (Bash - Recommended)
```bash
# Run all tests
npm run test:all-tools-bash

# Run specific test suites
./tests/test-all-tools.sh --basic
./tests/test-all-tools.sh --mcp
./tests/test-all-tools.sh --error
./tests/test-all-tools.sh --perf
./tests/test-all-tools.sh --data
./tests/test-all-tools.sh --integration
```

### Run All Tests (Python)
```bash
# Run all tests
npm run test:all-tools-python

# Run specific test suites
python3 tests/test_all_tools.py --suite basic
python3 tests/test_all_tools.py --suite mcp
python3 tests/test_all_tools.py --suite error
python3 tests/test_all_tools.py --suite perf
python3 tests/test_all_tools.py --suite integration
python3 tests/test_all_tools.py --suite all
```

### Run All Tests (JavaScript)
```bash
# Run all tests
npm run test:all-tools-js

# Run specific test suites
node tests/test-all-tools.js --basic
node tests/test-all-tools.js --adapters
node tests/test-all-tools.js --data
node tests/test-all-tools.js --perf
```

## 📋 Test Coverage

### **Basic Functionality Tests**
- ✅ Server build process
- ✅ PubMed adapter tests
- ✅ Google Scholar adapter tests
- ✅ Unified search tests
- ✅ Firecrawl integration tests

### **MCP Tool Tests**
- ✅ `search_papers` - Search across multiple sources
- ✅ `get_paper_by_id` - Get paper by PMID
- ✅ `get_paper_details` - Get detailed paper information
- ✅ `get_full_text` - Extract full text content
- ✅ `extract_paper_sections` - Extract paper sections
- ✅ `search_within_paper` - Search within paper content
- ✅ `get_evidence_quotes` - Extract evidence and quotes
- ✅ `get_citation` - Generate citations in various formats
- ✅ `get_citation_count` - Get citation counts
- ✅ `search_google_scholar` - Google Scholar specific search
- ✅ `search_all_sources` - Unified search across sources
- ✅ `get_google_scholar_citations` - Google Scholar citations
- ✅ `get_related_papers` - Find related papers
- ✅ `search_with_firecrawl` - Enhanced search with Firecrawl
- ✅ `set_firecrawl_preference` - Configure scraping method
- ✅ `get_search_method_info` - Get method information

### **Error Handling Tests**
- ✅ Invalid PMID handling
- ✅ Empty search query handling
- ✅ Invalid citation format handling
- ✅ Network error handling
- ✅ Timeout handling

### **Performance Tests**
- ✅ Response time validation
- ✅ Build time monitoring
- ✅ Memory usage tracking
- ✅ Concurrent request handling

### **Data Validation Tests**
- ✅ Required field validation
- ✅ Data type validation
- ✅ Response structure validation
- ✅ Content quality validation

### **Integration Tests**
- ✅ Adapter instantiation
- ✅ Cross-adapter communication
- ✅ MCP protocol compliance
- ✅ Error propagation

## 🔧 Test Configuration

### **Environment Variables**
```bash
# Set test timeout (default: 15 seconds)
export MCP_TEST_TIMEOUT=30000

# Enable verbose logging
export MCP_TEST_VERBOSE=true

# Set test data directory
export MCP_TEST_DATA_DIR=./test-data
```

### **Test Data**
The test suites use real PubMed data for testing. Test PMIDs include:
- `33844136` - Machine learning paper
- `12345678` - Invalid PMID for error testing

## 📊 Test Reports

### **Bash Test Suite**
- Generates timestamped log files
- Color-coded output
- Detailed error messages
- Exit codes for CI/CD integration

### **Python Test Suite**
- JSON report files
- Performance metrics
- Detailed error analysis
- HTML report generation (optional)

### **JavaScript Test Suite**
- JSON report files
- Command execution logs
- File existence validation
- Build performance tracking

## 🚨 Troubleshooting

### **Common Issues**

#### **Server Won't Start**
```bash
# Check if dist/index.js exists
ls -la dist/

# Rebuild the project
npm run build

# Check Node.js version
node --version  # Should be 18+
```

#### **Tests Time Out**
```bash
# Increase timeout
export MCP_TEST_TIMEOUT=60000

# Check network connectivity
ping pubmed.ncbi.nlm.nih.gov
```

#### **Permission Denied**
```bash
# Make scripts executable
chmod +x tests/*.sh
chmod +x tests/*.py
chmod +x tests/*.js
```

#### **Python Dependencies**
```bash
# Install required packages
pip3 install subprocess32  # For Python < 3.8
```

### **Debug Mode**
```bash
# Enable debug output
export MCP_TEST_DEBUG=true

# Run with verbose logging
./tests/test-all-tools.sh --verbose
```

## 🔄 Continuous Integration

### **GitHub Actions Example**
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run test:all-tools-bash
```

### **Travis CI Example**
```yaml
language: node_js
node_js:
  - 18
script:
  - npm install
  - npm run build
  - npm run test:all-tools-bash
```

## 📈 Performance Benchmarks

### **Expected Performance**
- **Build Time**: < 30 seconds
- **Test Execution**: < 5 minutes
- **MCP Response**: < 5 seconds
- **Memory Usage**: < 500MB

### **Performance Monitoring**
```bash
# Monitor test performance
time npm run test:all-tools-bash

# Profile specific tests
./tests/test-all-tools.sh --perf --verbose
```

## 🤝 Contributing

### **Adding New Tests**
1. Create test file in appropriate language
2. Add test to package.json scripts
3. Update this README
4. Ensure tests pass locally
5. Submit pull request

### **Test Naming Convention**
- **Bash**: `test-*.sh`
- **Python**: `test_*.py`
- **JavaScript**: `test-*.js`
- **Test files**: `test-*.js` (individual tool tests)

### **Test Standards**
- ✅ Clear test descriptions
- ✅ Proper error handling
- ✅ Performance validation
- ✅ Comprehensive coverage
- ✅ Clear output formatting

## 📚 Additional Resources

- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [PubMed E-utilities Guide](https://ncbiinsights.ncbi.nlm.nih.gov/2017/11/02/new-api-keys-for-the-e-utilities/)
- [Google Scholar Scraping Best Practices](https://scholar.google.com/robots.txt)
- [Firecrawl MCP Server Documentation](https://firecrawl.dev/)

## 🆘 Support

If you encounter issues with the test suites:

1. Check the troubleshooting section above
2. Review test logs and reports
3. Verify environment setup
4. Check GitHub issues
5. Create a new issue with detailed information

---

**Happy Testing! 🧪✨**
