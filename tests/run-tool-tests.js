const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');
const config = require('./tool-tests.config.js');

const REQUEST_TIMEOUT_MS = 60000;
const pending = new Map();

function send(proc, msg) {
  const line = JSON.stringify(msg) + '\n';
  proc.stdin.write(line);
}

function setupStdoutReader(proc) {
  const rl = readline.createInterface({ input: proc.stdout, crlfDelay: Infinity });
  rl.on('line', (line) => {
    if (!line.trim()) return;
    try {
      const msg = JSON.parse(line);
      if (msg.id != null && pending.has(msg.id)) {
        const { resolve, timeout } = pending.get(msg.id);
        pending.delete(msg.id);
        clearTimeout(timeout);
        resolve(msg);
      }
    } catch (_) {}
  });
}

function readNextResponse(proc, requestId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pending.has(requestId)) {
        pending.delete(requestId);
        reject(new Error(`Timeout waiting for response id ${requestId}`));
      }
    }, REQUEST_TIMEOUT_MS);
    pending.set(requestId, { resolve, timeout });
  });
}

async function runToolTests() {
  const distPath = path.join(__dirname, '..', 'dist', 'index.js');
  const fs = require('fs');
  if (!fs.existsSync(distPath)) {
    console.error('dist/index.js not found. Run npm run build first.');
    process.exit(1);
  }

  const proc = spawn('node', [distPath], {
    cwd: path.join(__dirname, '..'),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  setupStdoutReader(proc);
  proc.stderr.on('data', (d) => process.stderr.write(d));

  let requestId = 1;
  const results = { passed: 0, failed: 0, tests: [] };

  const sendAndWait = (method, params) => {
    const id = requestId++;
    send(proc, { jsonrpc: '2.0', id, method, params });
    return readNextResponse(proc, id);
  };

  await new Promise((resolve) => setTimeout(resolve, 800));

  try {
    const initRes = await sendAndWait('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'tool-tests', version: '1.0.0' }
    });
    if (initRes.error) {
      console.error('Initialize failed:', initRes.error);
      proc.kill();
      process.exit(1);
    }
  } catch (e) {
    console.error('Initialize error:', e.message);
    proc.kill();
    process.exit(1);
  }

  send(proc, { jsonrpc: '2.0', method: 'notifications/initialized' });

  for (const tool of config.tools) {
    for (let i = 0; i < tool.cases.length; i++) {
      const tc = tool.cases[i];
      const label = `${tool.name} case ${i + 1}`;
      try {
        const res = await sendAndWait('tools/call', {
          name: tool.name,
          arguments: tc.args
        });

        if (res.error) {
          const text = res.error.message || JSON.stringify(res.error);
          if (tc.expectErrorSubstring && text.indexOf(tc.expectErrorSubstring) !== -1) {
            results.passed++;
            results.tests.push({ name: label, status: 'PASSED' });
            console.log(`  PASS: ${label} (error as expected)`);
          } else {
            results.failed++;
            results.tests.push({ name: label, status: 'FAILED', error: text });
            console.log(`  FAIL: ${label} - ${text}`);
          }
          continue;
        }

        const content = res.result && res.result.content;
        if (tc.expectContent && (!Array.isArray(content) || content.length === 0)) {
          results.failed++;
          results.tests.push({ name: label, status: 'FAILED', error: 'Missing content' });
          console.log(`  FAIL: ${label} - missing content`);
          continue;
        }

        const text = Array.isArray(content) && content[0] && content[0].text ? content[0].text : '';
        if (tc.expectSubstring && text.indexOf(tc.expectSubstring) === -1) {
          results.failed++;
          results.tests.push({ name: label, status: 'FAILED', error: `Expected substring "${tc.expectSubstring}" not found` });
          console.log(`  FAIL: ${label} - expected substring "${tc.expectSubstring}" not found`);
          continue;
        }

        if (tc.expectErrorSubstring && text.indexOf(tc.expectErrorSubstring) === -1) {
          results.failed++;
          results.tests.push({ name: label, status: 'FAILED', error: `Expected error substring "${tc.expectErrorSubstring}" not found` });
          console.log(`  FAIL: ${label} - expected error substring not found`);
          continue;
        }

        results.passed++;
        results.tests.push({ name: label, status: 'PASSED' });
        console.log(`  PASS: ${label}`);
      } catch (e) {
        results.failed++;
        results.tests.push({ name: label, status: 'FAILED', error: e.message });
        console.log(`  FAIL: ${label} - ${e.message}`);
      }
    }
  }

  proc.kill('SIGTERM');
  await new Promise((r) => setTimeout(r, 200));

  console.log('\n--- Tool test summary ---');
  console.log(`Passed: ${results.passed}, Failed: ${results.failed}`);
  process.exit(results.failed > 0 ? 1 : 0);
}

runToolTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
