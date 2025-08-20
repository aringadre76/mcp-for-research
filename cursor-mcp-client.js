#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');

class CursorMCPClient {
  constructor() {
    this.serverProcess = null;
    this.requestId = 1;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    console.log('🚀 Starting Scholarly Research MCP Server...');
    
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

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ MCP Server is running!');
    console.log('📚 Available tools:');
    console.log('  1. search_papers - Search for academic papers');
    console.log('  2. get_paper_by_id - Get paper by PMID');
    console.log('  3. get_paper_details - Get detailed paper info');
    console.log('  4. get_citation - Get citations in various formats');
    console.log('  5. get_citation_count - Get paper citation count');
    console.log('\n💡 Type "help" for usage examples or "quit" to exit\n');
    
    this.startInteractiveMode();
  }

  async sendRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method,
      params
    };

    this.serverProcess.stdin.write(JSON.stringify(request) + '\n');
  }

  handleResponse(response) {
    if (response.result && response.result.content) {
      const content = response.result.content[0];
      if (content.type === 'text') {
        console.log('\n📥 Response:');
        console.log(content.text);
        console.log('\n' + '─'.repeat(50) + '\n');
      }
    } else if (response.error) {
      console.error('❌ Error:', response.error);
    }
  }

  async startInteractiveMode() {
    this.rl.question('🔍 Enter command: ', async (input) => {
      const command = input.trim().toLowerCase();
      
      if (command === 'quit' || command === 'exit') {
        await this.stop();
        return;
      }
      
      if (command === 'help') {
        this.showHelp();
        this.startInteractiveMode();
        return;
      }
      
      if (command === 'search') {
        await this.handleSearch();
        return;
      }
      
      if (command === 'paper') {
        await this.handleGetPaper();
        return;
      }
      
      if (command === 'citation') {
        await this.handleCitation();
        return;
      }
      
      if (command === 'citations') {
        await this.handleCitationCount();
        return;
      }
      
      console.log('❌ Unknown command. Type "help" for available commands.');
      this.startInteractiveMode();
    });
  }

  showHelp() {
    console.log('\n📖 Available Commands:');
    console.log('  search     - Search for papers');
    console.log('  paper      - Get paper by PMID');
    console.log('  citation   - Get citation in various formats');
    console.log('  citations  - Get citation count');
    console.log('  help       - Show this help');
    console.log('  quit       - Exit the client\n');
  }

  async handleSearch() {
    this.rl.question('🔍 Enter search query: ', async (query) => {
      if (!query.trim()) {
        console.log('❌ Query cannot be empty');
        this.startInteractiveMode();
        return;
      }
      
      this.rl.question('📊 Max results (default 5): ', async (maxResults) => {
        const max = maxResults.trim() ? parseInt(maxResults) : 5;
        
        console.log(`\n🔍 Searching for: "${query}" (max ${max} results)...`);
        
        await this.sendRequest('tools/call', {
          name: 'search_papers',
          arguments: {
            query: query.trim(),
            maxResults: max
          }
        });
        
        setTimeout(() => this.startInteractiveMode(), 1000);
      });
    });
  }

  async handleGetPaper() {
    this.rl.question('🆔 Enter PMID: ', async (pmid) => {
      if (!pmid.trim()) {
        console.log('❌ PMID cannot be empty');
        this.startInteractiveMode();
        return;
      }
      
      console.log(`\n📄 Fetching paper with PMID: ${pmid}...`);
      
      await this.sendRequest('tools/call', {
        name: 'get_paper_details',
        arguments: {
          pmid: pmid.trim()
        }
      });
      
      setTimeout(() => this.startInteractiveMode(), 1000);
    });
  }

  async handleCitation() {
    this.rl.question('🆔 Enter PMID: ', async (pmid) => {
      if (!pmid.trim()) {
        console.log('❌ PMID cannot be empty');
        this.startInteractiveMode();
        return;
      }
      
      this.rl.question('📝 Citation format (bibtex/endnote/apa/mla/ris): ', async (format) => {
        const validFormats = ['bibtex', 'endnote', 'apa', 'mla', 'ris'];
        if (!validFormats.includes(format.toLowerCase())) {
          console.log('❌ Invalid format. Using BibTeX.');
          format = 'bibtex';
        }
        
        console.log(`\n📝 Generating ${format.toUpperCase()} citation for PMID: ${pmid}...`);
        
        await this.sendRequest('tools/call', {
          name: 'get_citation',
          arguments: {
            pmid: pmid.trim(),
            format: format.toLowerCase()
          }
        });
        
        setTimeout(() => this.startInteractiveMode(), 1000);
      });
    });
  }

  async handleCitationCount() {
    this.rl.question('🆔 Enter PMID: ', async (pmid) => {
      if (!pmid.trim()) {
        console.log('❌ PMID cannot be empty');
        this.startInteractiveMode();
        return;
      }
      
      console.log(`\n📊 Getting citation count for PMID: ${pmid}...`);
      
      await this.sendRequest('tools/call', {
        name: 'get_citation_count',
        arguments: {
          pmid: pmid.trim()
        }
      });
      
      setTimeout(() => this.startInteractiveMode(), 1000);
    });
  }

  async stop() {
    if (this.serverProcess) {
      this.serverProcess.kill();
      console.log('🛑 MCP Server stopped');
    }
    this.rl.close();
    process.exit(0);
  }
}

async function main() {
  const client = new CursorMCPClient();
  
  try {
    await client.start();
  } catch (error) {
    console.error('❌ Failed to start client:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
