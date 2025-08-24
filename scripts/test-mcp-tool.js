#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');

class MCPToolTester {
  constructor() {
    this.serverProcess = null;
    this.requestId = 1;
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('node', ['dist/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let serverReady = false;
      const timeout = setTimeout(() => {
        if (!serverReady) {
          reject(new Error('Server startup timeout'));
        }
      }, 10000);

      this.serverProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
          if (line.trim() && line.includes('"jsonrpc"')) {
            try {
              const response = JSON.parse(line);
              if (response.result) {
                serverReady = true;
                clearTimeout(timeout);
                resolve();
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        });
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error('Server stderr:', data.toString());
      });

      this.serverProcess.on('error', (error) => {
        reject(error);
      });

      // Send a simple request to check if server is ready
      setTimeout(() => {
        if (!serverReady) {
          this.sendRequest('get_search_method_info', {});
        }
      }, 1000);
    });
  }

  sendRequest(method, params) {
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method: 'tools/call',
      params: {
        name: method,
        arguments: params
      }
    };

    if (this.serverProcess && this.serverProcess.stdin) {
      this.serverProcess.stdin.write(JSON.stringify(request) + '\n');
    }
  }

  async testTool(method, params) {
    return new Promise((resolve, reject) => {
      let responseReceived = false;
      const timeout = setTimeout(() => {
        if (!responseReceived) {
          reject(new Error('Response timeout'));
        }
      }, 15000);

      const responseHandler = (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
          if (line.trim() && line.includes('"jsonrpc"')) {
            try {
              const response = JSON.parse(line);
              if (response.id === this.requestId - 1) {
                responseReceived = true;
                clearTimeout(timeout);
                this.serverProcess.stdout.removeListener('data', responseHandler);
                
                if (response.result) {
                  resolve(response.result);
                } else if (response.error) {
                  reject(new Error(response.error.message));
                } else {
                  resolve(response);
                }
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        });
      };

      this.serverProcess.stdout.on('data', responseHandler);
      this.sendRequest(method, params);
    });
  }

  async close() {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Usage: node test-mcp-tool.js <tool_name> [json_params]');
    process.exit(1);
  }

  const toolName = args[0];
  let params = {};
  
  if (args.length > 1) {
    try {
      params = JSON.parse(args[1]);
    } catch (e) {
      console.error('Invalid JSON parameters:', args[1]);
      process.exit(1);
    }
  }

  const tester = new MCPToolTester();
  
  try {
    console.log(`Starting MCP server to test tool: ${toolName}`);
    await tester.startServer();
    
    console.log(`Testing tool: ${toolName}`);
    console.log(`Parameters: ${JSON.stringify(params)}`);
    
    const result = await tester.testTool(toolName, params);
    
    if (result.content && result.content.length > 0) {
      const textContent = result.content.find(c => c.type === 'text');
      if (textContent) {
        console.log(textContent.text);
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error(`Error testing tool ${toolName}:`, error.message);
    process.exit(1);
  } finally {
    await tester.close();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { MCPToolTester };
