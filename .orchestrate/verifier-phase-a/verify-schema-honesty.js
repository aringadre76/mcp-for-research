const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');

const distPath = path.join(__dirname, '..', '..', 'dist', 'index.js');
const REQUEST_TIMEOUT_MS = 30000;
const pending = new Map();

function send(proc, msg) {
  proc.stdin.write(JSON.stringify(msg) + '\n');
}

function setupReader(proc) {
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

function readNext(id) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`Timeout for id ${id}`));
      }
    }, REQUEST_TIMEOUT_MS);
    pending.set(id, { resolve, timeout });
  });
}

let idCounter = 1;
function call(proc, method, params) {
  const id = idCounter++;
  send(proc, { jsonrpc: '2.0', id, method, params });
  return readNext(id);
}

async function main() {
  const proc = spawn('node', [distPath], {
    cwd: path.join(__dirname, '..', '..'),
    stdio: ['pipe', 'pipe', 'pipe']
  });
  setupReader(proc);
  proc.stderr.on('data', (d) => process.stderr.write(d));

  await new Promise((r) => setTimeout(r, 600));

  const initRes = await call(proc, 'initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'verifier', version: '1.0.0' }
  });
  console.log('initialize: ', initRes.error ? 'FAIL ' + JSON.stringify(initRes.error) : 'ok, server=' + initRes.result.serverInfo.name + ' ' + initRes.result.serverInfo.version);
  send(proc, { jsonrpc: '2.0', method: 'notifications/initialized' });

  const list = await call(proc, 'tools/list', {});
  const tools = list.result.tools;
  console.log('tools/list count: ' + tools.length);
  for (const t of tools) {
    console.log('- ' + t.name);
  }

  const findTool = (name) => tools.find((t) => t.name === name);

  function summarizeSchemaEnum(tool, paramPath) {
    const schema = tool.inputSchema;
    let cur = schema;
    for (const seg of paramPath) {
      if (!cur) return undefined;
      cur = cur.properties ? cur.properties[seg] : cur[seg];
    }
    if (!cur) return undefined;
    if (cur.enum) return cur.enum;
    if (cur.items && cur.items.enum) return cur.items.enum;
    if (cur.anyOf) return cur.anyOf.map((b) => b.enum || b.const).flat();
    return undefined;
  }

  const checks = [];
  const rs = findTool('research_search');
  const pa = findTool('paper_analysis');
  const cm = findTool('citation_manager');
  const rp = findTool('research_preferences');
  const wr = findTool('web_research');

  checks.push({ name: 'research_search sources enum', value: summarizeSchemaEnum(rs, ['sources']) });
  checks.push({ name: 'research_search sortBy enum', value: summarizeSchemaEnum(rs, ['sortBy']) });
  checks.push({ name: 'paper_analysis analysisType enum', value: summarizeSchemaEnum(pa, ['analysisType']) });
  checks.push({ name: 'citation_manager action enum', value: summarizeSchemaEnum(cm, ['action']) });
  checks.push({ name: 'citation_manager format enum', value: summarizeSchemaEnum(cm, ['format']) });
  checks.push({ name: 'research_preferences action enum', value: summarizeSchemaEnum(rp, ['action']) });
  checks.push({ name: 'research_preferences category enum', value: summarizeSchemaEnum(rp, ['category']) });
  checks.push({ name: 'web_research action enum', value: summarizeSchemaEnum(wr, ['action']) });

  for (const c of checks) {
    console.log(c.name + ': ' + JSON.stringify(c.value));
  }

  console.log('\n--- live tool invocation checks ---');

  const r1 = await call(proc, 'tools/call', {
    name: 'research_search',
    arguments: { query: 'test', sources: ['jstor'] }
  });
  console.log('research_search sources=[jstor] -> ' + (r1.error ? 'rejected: ' + r1.error.message.slice(0, 120) : 'ACCEPTED (bad)') );

  const r2 = await call(proc, 'tools/call', {
    name: 'paper_analysis',
    arguments: { identifier: '99999999999', analysisType: 'full-text' }
  });
  console.log('paper_analysis full-text bad-id -> text starts: ' + (r2.result?.content?.[0]?.text || '').slice(0, 120));

  const r3 = await call(proc, 'tools/call', {
    name: 'paper_analysis',
    arguments: { identifier: '33844136', analysisType: 'evidence' }
  });
  console.log('paper_analysis analysisType=evidence -> ' + (r3.error ? 'rejected (good): ' + r3.error.message.slice(0, 120) : 'ACCEPTED (bad)') );

  const r4 = await call(proc, 'tools/call', {
    name: 'citation_manager',
    arguments: { identifier: '33844136', action: 'related' }
  });
  console.log('citation_manager action=related -> ' + (r4.error ? 'rejected (good): ' + r4.error.message.slice(0, 120) : 'ACCEPTED (bad)') );

  const r5 = await call(proc, 'tools/call', {
    name: 'citation_manager',
    arguments: { identifier: '33844136', action: 'generate' }
  });
  console.log('citation_manager generate without format -> text: ' + (r5.result?.content?.[0]?.text || '').slice(0, 160));

  const r6 = await call(proc, 'tools/call', {
    name: 'web_research',
    arguments: { action: 'extract', url: 'https://example.com' }
  });
  console.log('web_research action=extract -> ' + (r6.error ? 'rejected (good): ' + r6.error.message.slice(0, 120) : 'ACCEPTED (bad)') );

  const r7 = await call(proc, 'tools/call', {
    name: 'web_research',
    arguments: { action: 'scrape', url: 'https://example.com' }
  });
  console.log('web_research scrape (no FIRECRAWL_API_KEY) -> ' + (r7.result?.content?.[0]?.text || '').slice(0, 160));

  const r8 = await call(proc, 'tools/call', {
    name: 'research_preferences',
    arguments: { action: 'get', category: 'all' }
  });
  const t8 = r8.result?.content?.[0]?.text || '';
  console.log('preferences get all -> contains jstor? ' + /jstor/i.test(t8) + ' first200=' + t8.slice(0, 200).replace(/\n/g, ' | '));

  const r9 = await call(proc, 'tools/call', {
    name: 'research_preferences',
    arguments: { action: 'export' }
  });
  const t9 = r9.result?.content?.[0]?.text || '';
  console.log('preferences export -> json contains jstor? ' + /jstor/i.test(t9) + ' first200=' + t9.slice(0, 200).replace(/\n/g, ' | '));

  const r10 = await call(proc, 'tools/call', {
    name: 'research_preferences',
    arguments: {
      action: 'import',
      preferences: { search: { defaultSortBy: 'date', defaultMaxResults: 7 } }
    }
  });
  console.log('preferences import object -> ' + (r10.result?.content?.[0]?.text || ''));

  const r10b = await call(proc, 'tools/call', {
    name: 'research_preferences',
    arguments: { action: 'get', category: 'search' }
  });
  const t10b = r10b.result?.content?.[0]?.text || '';
  console.log('preferences after import -> ' + t10b.replace(/\n/g, ' | '));

  proc.kill('SIGTERM');
  await new Promise((r) => setTimeout(r, 200));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
