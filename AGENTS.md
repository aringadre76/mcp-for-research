# AGENTS.md

## Cursor Cloud specific instructions

This is a **Node.js/TypeScript MCP (Model Context Protocol) server** for scholarly research. It communicates over stdio and has no databases, Docker, or external local services.

### Build and run

- `npm run build` compiles TypeScript to `dist/`. Must be run before `npm start` or `npm run test:tools`.
- `npm run dev` starts the server via `ts-node` (no build step needed).
- `npm start` runs the built server (`node dist/index.js`).
- The server reads from stdin and writes JSON-RPC to stdout. It is not an HTTP server; you interact with it by piping JSON-RPC messages.

### Testing

- `npm test` runs the Jest suite (18 suites, 19 tests).
- `npm run test:tools` runs the MCP subprocess tool tests (requires build first). One pre-existing failure on `paper_analysis` case 2 (`expected substring "No paper found" not found`) is a known issue.
- `npm run test:all-tools-bash` runs the bash-based integration tests.
- Type checking: `npx tsc --noEmit`.

### Environment variables (optional)

Copy `.env.example` to `.env` to configure optional API keys:
- `FIRECRAWL_API_KEY` -- enables `web_research` tool and Firecrawl-based Google Scholar.
- `PUBMED_API_KEY` -- raises PubMed rate limits.
- Chrome/Chromium is needed only for Google Scholar scraping and ArXiv full-text extraction. Set `PUPPETEER_EXECUTABLE_PATH` or `CHROME_PATH` if the binary is not auto-detected.

### Gotchas

- The server uses puppeteer-core (not puppeteer), so no Chromium is bundled. Google Scholar and ArXiv full-text features require a system Chrome/Chromium install.
- `npm run test:tools` exits non-zero due to the pre-existing `paper_analysis` case 2 failure. This is not a regression.
- Jest warns about a worker process failing to exit gracefully. This is a known teardown issue with the MCP server process and does not affect test results.
