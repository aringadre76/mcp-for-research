const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ArXivMCPTester {
  constructor() {
    this.results = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  log(message) {
    console.log(message);
  }

  async testMCPTool(toolName, args, description, expectedPattern = null) {
    this.totalTests++;
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      // Create a temporary test file
      const testFile = `test-${toolName}-${Date.now()}.js`;
      const testContent = `
        const { spawn } = require('child_process');
        
        const mcpServer = spawn('node', ['dist/index.js'], { stdio: ['pipe', 'pipe', 'pipe'] });
        
        let output = '';
        let errorOutput = '';
        
        mcpServer.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        mcpServer.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });
        
        mcpServer.on('close', (code) => {
          console.log('Output:', output);
          console.log('Error:', errorOutput);
          process.exit(code);
        });
        
        const toolCall = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: '${toolName}',
            arguments: ${JSON.stringify(args)}
          }
        };
        
        mcpServer.stdin.write(JSON.stringify(toolCall) + '\\n');
        
        setTimeout(() => {
          mcpServer.kill();
        }, 10000);
      `;
      
      fs.writeFileSync(testFile, testContent);
      
      const child = spawn('node', [testFile], { stdio: 'pipe' });
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
        
        // Clean up test file
        try {
          fs.unlinkSync(testFile);
        } catch (error) {
          // Ignore cleanup errors
        }
        
        let status = 'PASSED';
        let message = `Tool executed in ${duration}s`;
        
        if (code !== 0) {
          status = 'FAILED';
          message = `Tool failed with exit code ${code}`;
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
          message: `Tool execution error: ${error.message}`,
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

  async testArXivMCPTools() {
    this.log('\n=== Testing ArXiv MCP Tools ===');
    
    await this.testMCPTool(
      'search_arxiv',
      { query: 'machine learning', maxResults: 3 },
      'Search ArXiv Tool',
      'Found'
    );
    
    await this.testMCPTool(
      'get_arxiv_paper_by_id',
      { id: '2103.12345' },
      'Get ArXiv Paper by ID Tool',
      'ArXiv Paper'
    );
    
    await this.testMCPTool(
      'get_arxiv_related_papers',
      { id: '2103.12345', maxResults: 2 },
      'Get ArXiv Related Papers Tool',
      'related papers'
    );
    
    await this.testMCPTool(
      'search_all_sources',
      { query: 'artificial intelligence', sources: ['pubmed', 'google-scholar', 'arxiv'] },
      'Search All Sources with ArXiv Tool',
      'Found'
    );
    
    await this.testMCPTool(
      'get_related_papers',
      { identifier: '2103.12345', source: 'arxiv', maxResults: 2 },
      'Get Related Papers for ArXiv Tool',
      'related papers'
    );
    
    this.log('\n=== Test Summary ===');
    this.log(`Total Tests: ${this.totalTests}`);
    this.log(`Passed: ${this.passedTests}`);
    this.log(`Failed: ${this.failedTests}`);
    
    if (this.failedTests === 0) {
      this.log('\n✅ All ArXiv MCP tool tests passed!');
    } else {
      this.log('\n❌ Some ArXiv MCP tool tests failed!');
      this.results.filter(r => r.status === 'FAILED').forEach(result => {
        this.log(`\nFailed: ${result.name}`);
        this.log(`Message: ${result.message}`);
        this.log(`Output: ${result.output}`);
        this.log(`Error: ${result.error}`);
      });
    }
  }
}

async function main() {
  const tester = new ArXivMCPTester();
  await tester.testArXivMCPTools();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ArXivMCPTester };
