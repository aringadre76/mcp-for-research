const { spawn } = require('child_process');
const readline = require('readline');

class SimpleMCPClient {
  constructor() {
    this.serverProcess = null;
    this.requestId = 1;
  }

  async start() {
    console.log('🚀 Starting MCP Server...');
    
    this.serverProcess = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.serverProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            this.handleResponse(response);
          } catch (e) {
            // Ignore non-JSON lines
          }
        }
      });
    });

    this.serverProcess.stderr.on('data', (data) => {
      console.error('Server stderr:', data.toString());
    });

    this.serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
    });

    // Wait a bit for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async sendRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method,
      params
    };

    console.log(`📤 Sending request: ${method}`);
    this.serverProcess.stdin.write(JSON.stringify(request) + '\n');
  }

  handleResponse(response) {
    console.log(`📥 Received response:`, JSON.stringify(response, null, 2));
  }

  async testTools() {
    console.log('\n🧪 Testing MCP Tools...\n');

    // Test search_papers tool
    console.log('1️⃣ Testing search_papers tool...');
    await this.sendRequest('tools/call', {
      name: 'search_papers',
      arguments: {
        query: 'artificial intelligence',
        maxResults: 2
      }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test get_paper_by_id tool (using a real PMID from the search results)
    console.log('\n2️⃣ Testing get_paper_by_id tool...');
    await this.sendRequest('tools/call', {
      name: 'get_paper_by_id',
      arguments: {
        pmid: '33844136'
      }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test get_paper_details tool
    console.log('\n3️⃣ Testing get_paper_details tool...');
    await this.sendRequest('tools/call', {
      name: 'get_paper_details',
      arguments: {
        pmid: '33844136'
      }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test get_citation tool (BibTeX format)
    console.log('\n4️⃣ Testing get_citation tool (BibTeX)...');
    await this.sendRequest('tools/call', {
      name: 'get_citation',
      arguments: {
        pmid: '33844136',
        format: 'bibtex'
      }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test get_citation tool (APA format)
    console.log('\n5️⃣ Testing get_citation tool (APA)...');
    await this.sendRequest('tools/call', {
      name: 'get_citation',
      arguments: {
        pmid: '33844136',
        format: 'apa'
      }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test get_citation_count tool
    console.log('\n6️⃣ Testing get_citation_count tool...');
    await this.sendRequest('tools/call', {
      name: 'get_citation_count',
      arguments: {
        pmid: '33844136'
      }
    });

    console.log('\n✅ Tool testing completed!');
  }

  async stop() {
    if (this.serverProcess) {
      this.serverProcess.kill();
      console.log('🛑 MCP Server stopped');
    }
  }
}

async function main() {
  const client = new SimpleMCPClient();
  
  try {
    await client.start();
    await client.testTools();
    
    // Keep running for a bit to see responses
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await client.stop();
  }
}

if (require.main === module) {
  main();
}
