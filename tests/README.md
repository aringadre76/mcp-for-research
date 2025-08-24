# Test Suites for Scholarly Research MCP Server

This directory contains comprehensive test suites to ensure the reliability and functionality of the MCP server.

## 🧪 Available Test Suites

### **Bash Test Suite** (Recommended)
```bash
# Run all tests
npm run test:all-tools-bash

# Run specific test suites
./tests/test-all-tools-simple.sh --basic
./tests/test-all-tools-simple.sh --adapters
./tests/test-all-tools-simple.sh --data
```

### **Python Test Suite**
```bash
# Run all tests
npm run test:all-tools-python

# Run specific test suites
python3 tests/test_all_tools.py --suite basic
python3 tests/test_all_tools.py --suite mcp
python3 tests/test_all_tools.py --suite integration
```

### **JavaScript Test Suite**
```bash
# Run all tests
npm run test:all-tools-js

# Run specific test suites
node tests/test-all-tools.js --basic
node tests/test-all-tools.js --adapters
```

### **Individual Tool Tests**
```bash
# Test specific functionality
npm run test:pubmed
npm run test:google-scholar
npm run test:unified
npm run test:firecrawl
```

## 📁 Test Files

### **Core Test Suites**
- `test-all-tools-simple.sh` - Bash test runner (recommended)
- `test_all_tools.py` - Python test runner
- `test-all-tools.js` - Node.js test runner

### **Specific Functionality Tests**
- `test-firecrawl-integration.js` - Firecrawl MCP integration
- `test-google-scholar.js` - Google Scholar adapter
- `test-simple-google-scholar.js` - Simple Google Scholar test
- `test-unified-search.js` - Unified search functionality
- `test-citations.js` - Citation handling
- `jest.setup.js` - Jest configuration

## 🎯 Test Coverage

- ✅ **13/13 tests passing**
- ✅ Basic functionality validation
- ✅ Adapter instantiation testing
- ✅ Data validation and file checks
- ✅ Google Scholar scraping verification
- ✅ Unified search functionality
- ✅ Firecrawl integration testing

## 🚀 Running Tests

### **Quick Start**
```bash
# Run all tests with bash suite
npm run test:all-tools-bash

# Run comprehensive Python tests
npm run test:all-tools-python

# Run Node.js tests
npm run test:all-tools-js
```

### **Individual Test Execution**
```bash
# Test specific components
npm run test:google-scholar
npm run test:unified
npm run test:firecrawl

# Run Jest tests
npm run test:pubmed
```

## 📊 Test Results

All test suites generate detailed reports:
- **Bash**: Console output with pass/fail counts
- **Python**: JSON reports with detailed results
- **JavaScript**: JSON reports with performance metrics

## 🔧 Configuration

### **Jest Configuration**
- Configured in `jest.setup.js`
- Supports TypeScript and ES modules
- Includes proper test environment setup

### **Test Environment**
- Node.js 18+ compatibility
- TypeScript compilation support
- MCP server integration testing

## 🐛 Troubleshooting

### **Common Issues**
1. **Node.js Version**: Ensure Node.js 18+ is installed
2. **Dependencies**: Run `npm install` before testing
3. **Build**: Ensure `npm run build` completes successfully
4. **Permissions**: Make test scripts executable with `chmod +x`

### **Debug Mode**
```bash
# Run tests with verbose output
./tests/test-all-tools-simple.sh --all --verbose

# Python tests with debug info
python3 tests/test_all_tools.py --suite all --debug
```

## 📈 Continuous Integration

The test suites are designed to work with CI/CD pipelines:
- **GitHub Actions**: Automated testing on push/PR
- **Exit Codes**: Proper exit codes for CI integration
- **Report Generation**: Structured output for CI tools

## 🤝 Contributing

When adding new features:
1. **Add Tests**: Include tests for new functionality
2. **Update Coverage**: Ensure new code is tested
3. **Maintain Compatibility**: Keep tests working across platforms
