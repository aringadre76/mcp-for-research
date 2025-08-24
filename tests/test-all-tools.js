#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  log(message) {
    console.log(message);
  }

  async runCommand(command, description, expectedPattern = null) {
    this.totalTests++;
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const child = spawn(command, { shell: true, stdio: 'pipe' });
      let output = '';
      let errorOutput = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      child.on('close', (code) => {
        const duration = (Date.now() - startTime) / 1000;
        
        let status = 'PASSED';
        let message = `Command executed in ${duration}s`;
        
        if (code !== 0) {
          status = 'FAILED';
          message = `Command failed with exit code ${code}`;
        } else if (expectedPattern && !output.includes(expectedPattern)) {
          status = 'FAILED';
          message = `Output did not contain expected pattern: ${expectedPattern}`;
        }
        
        const result = {
          name: description,
          status,
          duration,
          message,
          output: output.trim(),
          error: errorOutput.trim()
        };
        
        this.results.push(result);
        
        if (status === 'PASSED') {
          this.passedTests++;
          this.log(`  ✓ ${description}: ${message}`);
        } else {
          this.failedTests++;
          this.log(`  ✗ ${description}: ${message}`);
        }
        
        resolve(result);
      });
      
      child.on('error', (error) => {
        const duration = (Date.now() - startTime) / 1000;
        const result = {
          name: description,
          status: 'FAILED',
          duration,
          message: `Command execution error: ${error.message}`,
          output: '',
          error: error.message
        };
        
        this.results.push(result);
        this.failedTests++;
        this.log(`  ✗ ${description}: ${result.message}`);
        resolve(result);
      });
    });
  }

  async testBasicFunctionality() {
    this.log('\n=== Testing Basic Functionality ===');
    
    await this.runCommand('npm run build', 'Build Server');
    await this.runCommand('npm run test:build', 'Build Test', 'Build test completed successfully');
    await this.runCommand('npm run test:google-scholar-simple', 'Google Scholar Tests', 'All basic tests passed');
    await this.runCommand('npm run test:unified', 'Unified Search Tests', 'Test completed');
    await this.runCommand('npm run test:firecrawl', 'Firecrawl Tests', 'All Firecrawl integration tests passed');
    await this.runCommand('npm run test:firecrawl-arxiv', 'Firecrawl with ArXiv Tests', 'All Firecrawl with ArXiv tests completed');
    await this.runCommand('npm run test:arxiv', 'ArXiv Adapter Tests', 'All ArXiv adapter tests completed');
    await this.runCommand('npm run test:unified-arxiv', 'Unified Search with ArXiv Tests', 'All unified search with ArXiv tests completed');
    await this.runCommand('npm run test:arxiv-comprehensive', 'ArXiv Comprehensive Tests', 'All ArXiv comprehensive tests completed');
  }

  async testAdapters() {
    this.log('\n=== Testing Adapters ===');
    
    const adapterTests = [
      {
        name: 'PubMed Adapter',
        code: 'const {PubMedAdapter} = require("./dist/adapters/pubmed"); new PubMedAdapter(); console.log("✓ PubMed adapter created");'
      },
      {
        name: 'Google Scholar Adapter',
        code: 'const {GoogleScholarAdapter} = require("./dist/adapters/google-scholar"); new GoogleScholarAdapter(); console.log("✓ Google Scholar adapter created");'
      },
      {
        name: 'Unified Search Adapter',
        code: 'const {UnifiedSearchAdapter} = require("./dist/adapters/unified-search"); new UnifiedSearchAdapter(); console.log("✓ Unified search adapter created");'
      },
      {
        name: 'Enhanced Unified Search Adapter',
        code: 'const {EnhancedUnifiedSearchAdapter} = require("./dist/adapters/enhanced-unified-search"); new EnhancedUnifiedSearchAdapter(); console.log("✓ Enhanced unified search adapter created");'
      }
    ];

    for (const test of adapterTests) {
      const command = `node -e "${test.code}"`;
      await this.runCommand(command, test.name, '✓');
    }
  }

  async testMCPTools() {
    this.log('\n=== Testing MCP Tools ===');
    
    // Note: This would require the MCP server to be running
    // For now, we'll just test that the tools are defined
    this.log('  ℹ MCP tool testing requires server to be running');
    this.log('  ℹ Use the bash or Python test suites for full MCP testing');
  }

  async testDataValidation() {
    this.log('\n=== Testing Data Validation ===');
    
    // Test that the built files exist
    const requiredFiles = [
      'dist/index.js',
      'dist/adapters/pubmed.js',
      'dist/adapters/google-scholar.js',
      'dist/adapters/unified-search.js',
      'dist/adapters/enhanced-unified-search.js'
    ];

    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        this.totalTests++;
        this.passedTests++;
        this.log(`  ✓ ${file}: File exists`);
      } else {
        this.totalTests++;
        this.failedTests++;
        this.log(`  ✗ ${file}: File missing`);
      }
    }
  }

  async testPerformance() {
    this.log('\n=== Testing Performance ===');
    
    // Test build time
    const startTime = Date.now();
    await this.runCommand('npm run build', 'Build Performance');
    const buildTime = (Date.now() - startTime) / 1000;
    
    if (buildTime < 30) {
      this.log(`  ✓ Build completed in ${buildTime}s (acceptable)`);
    } else {
      this.log(`  ⚠ Build completed in ${buildTime}s (slow, but acceptable)`);
    }
  }

  async runAllTests() {
    this.log('==========================================');
    this.log('  Scholarly Research MCP Server Tests');
    this.log('==========================================');
    
    await this.testBasicFunctionality();
    await this.testAdapters();
    await this.testMCPTools();
    await this.testDataValidation();
    await this.testPerformance();
    
    this.generateReport();
  }

  generateReport() {
    this.log('\n==========================================');
    this.log('  Test Summary');
    this.log('==========================================');
    this.log(`Total Tests: ${this.totalTests}`);
    this.log(`Passed: ${this.passedTests}`);
    this.log(`Failed: ${this.failedTests}`);
    
    if (this.failedTests > 0) {
      this.log('\nFailed Tests:');
      this.results
        .filter(r => r.status === 'FAILED')
        .forEach(r => {
          this.log(`  - ${r.name}: ${r.message}`);
        });
    }
    
    // Save detailed report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const reportFile = `test-report-js-${timestamp}.json`;
    
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.totalTests,
        passed: this.passedTests,
        failed: this.failedTests
      },
      results: this.results
    };
    
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
    this.log(`\nDetailed report saved to: ${reportFile}`);
    
    if (this.failedTests === 0) {
      this.log('\n🎉 All tests passed! 🎉');
      process.exit(0);
    } else {
      this.log(`\n❌ ${this.failedTests} tests failed. Check the report for details.`);
      process.exit(1);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node test-all-tools.js [OPTIONS]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h     Show this help message');
    console.log('  --basic        Run only basic functionality tests');
    console.log('  --adapters     Run only adapter tests');
    console.log('  --mcp          Run only MCP tool tests');
    console.log('  --data         Run only data validation tests');
    console.log('  --perf         Run only performance tests');
    console.log('  --all          Run all tests (default)');
    console.log('');
    console.log('Examples:');
    console.log('  node test-all-tools.js                    # Run all tests');
    console.log('  node test-all-tools.js --basic           # Run only basic tests');
    console.log('  node test-all-tools.js --adapters --data # Run adapter and data tests');
    return;
  }
  
  const testRunner = new TestRunner();
  
  try {
    if (args.includes('--basic')) {
      await testRunner.testBasicFunctionality();
    } else if (args.includes('--adapters')) {
      await testRunner.testAdapters();
    } else if (args.includes('--mcp')) {
      await testRunner.testMCPTools();
    } else if (args.includes('--data')) {
      await testRunner.testDataValidation();
    } else if (args.includes('--perf')) {
      await testRunner.testPerformance();
    } else {
      // Default: run all tests
      await testRunner.runAllTests();
    }
    
    // Generate report for partial test runs
    if (args.length > 0) {
      testRunner.generateReport();
    }
    
  } catch (error) {
    console.error('Test execution failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { TestRunner };
