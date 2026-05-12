<!-- orchestrate handoff
task: verify-phase-a
branch: `orch/scholarly-harden/phase-a-truth-contracts` (verifier harness committed at `935bbfa`)
agentId: bc-7f8ef2c9-e231-40c2-be03-0271308d8569
runId: run-f87ef7e0-39cb-4df8-a014-f0e88f7913da
resultStatus: finished
finishedAt: 2026-05-12T03:02:51.683Z
-->

## Verification
unit-test-verified

## Target
`phase-a-truth-contracts` on branch `orch/scholarly-harden/phase-a-truth-contracts`

## Branch
`orch/scholarly-harden/phase-a-truth-contracts` (verifier harness committed at `935bbfa`)

## Execution
- `npm run build` -> success, `tsc` clean, `dist/index.js` produced.
- `npm test` -> Jest: 18 suites, 22 passed, 0 failed. `test:tools` (run-tool-tests.js): 10 passed, 0 failed (research_search x2, paper_analysis x2, citation_manager x2, research_preferences x2, web_research x2).
- `npx jest tests/citation-format.test.js` -> 4 tests passed.
- Inline check `node -e "..."` on `formatCitationWork` -> APA, MLA, BibTeX, RIS, EndNote all produce visibly distinct, format-appropriate strings (e.g. `@article{...}`, `TY  - JOUR`/`ER  - `, `%0 Journal Article` tags) confirming the `citation_manager` description "Each format uses distinct punctuation and fields".
- `node .orchestrate/verifier-phase-a/verify-schema-honesty.js` against a live `dist/index.js` MCP server over stdio:
  - `initialize` -> `serverInfo` reports `scholarly-research-mcp 2.0.3` matching `package.json` (confirms `SERVER_VERSION = JSON.parse(... 'package.json')` wiring).
  - `tools/list` -> exactly 5 tools (`research_search`, `paper_analysis`, `citation_manager`, `research_preferences`, `web_research`).
  - Schema enums extracted from `tools/list` payload:
    - `research_search.sources`: `["pubmed","google-scholar","arxiv"]` (no `jstor`).
    - `research_search.sortBy`: `["relevance","date","citations"]`.
    - `paper_analysis.analysisType`: `["basic","full-text"]` (no `evidence`/`comprehensive`/etc).
    - `citation_manager.action`: `["generate","count","all"]` (no `related`).
    - `citation_manager.format`: `["apa","mla","bibtex","endnote","ris"]`.
    - `research_preferences.action`: `["get","set","reset","export","import"]`.
    - `research_preferences.category`: `["source","search","display","cache","all"]`.
    - `web_research.action`: `["scrape","search"]` (no `extract`/`map`/`crawl`).
  - `research_search` with `sources:["jstor"]` -> Zod -32602 `invalid_enum_value`.
  - `paper_analysis` with `analysisType:"evidence"` -> Zod -32602 rejection.
  - `paper_analysis` with bad id `99999999999` -> graceful `No paper found with identifier: ...`.
  - `citation_manager` with `action:"related"` -> Zod -32602 rejection (related discovery is documented as removed).
  - `citation_manager` with `action:"generate"` and no `format` -> tool returns documented text `Format is required for generate and all. Choose apa, mla, bibtex, endnote, or ris.`
  - `web_research` with `action:"extract"` -> Zod -32602 rejection.
  - `web_research` `scrape` without `FIRECRAWL_API_KEY` -> documented guidance `Firecrawl is not configured. Set FIRECRAWL_API_KEY ...`.
  - `research_preferences action:"get" category:"all"` returns the combined block (not the "specify category" fallback) and contains no `jstor` row (default ships pubmed/google-scholar/arxiv only).
  - `research_preferences action:"export"` returns a fenced JSON block; no `jstor` row; not double-encoded.
  - `research_preferences action:"import"` with `preferences` passed as a plain object -> `Preferences imported successfully.`; follow-up `get search` reflects `defaultSortBy=date`, `defaultMaxResults=7`. Confirms the union string-or-object input on the Zod schema and the manager-side string-or-object handling.

## Findings
Acceptance criteria from the verification plan:
- [x] `build+test green`: `npm run build` and `npm test` both succeed; Jest 22/22, tool-tests 10/10. Met.
- [x] `schemas and descriptions match implementation for touched tools`:
  - research_search: source enum, sortBy enum, override behavior, and source-warnings string all match the adapter (`searchPapersWithNotes` returns notes that the tool appends as "Source warnings:"). overrideSources path verified in `preference-aware-unified-search.ts` lines 94 to 114 (the `honorEnabledSources` guard short-circuits the disabled-source filter exactly when `overrideSources` is supplied). Met.
  - paper_analysis: enum is `basic | full-text`; description claims PMC sections / `textContains` / abstract fallback; code in `src/index.ts` lines 184 to 240 implements those branches (sections via `extractPaperSections`, then `getFullTextContent` fallback, then ArXiv abstract fallback). Met.
  - citation_manager: action `generate | count | all`; format `apa | mla | bibtex | ris | endnote`; `related` removed; live tests show distinct output per format and graceful error path for missing format. Met.
  - research_preferences: category `source | search | display | cache | all`; `get all` block contains all four sections including cache block referencing `~/.mcp-scholarly-research/preferences.json`-backed manager; export/import roundtrip works with object input. Met.
  - web_research: action `scrape | search` only; description states `FIRECRAWL_API_KEY` required and only those two actions implemented; live behavior matches. Met.

Other findings:
- (low) Documentation outside the touched tools still mentions JSTOR (`OVERVIEW.md` line 10/40, `docs/ARCHITECTURE.md` line 91, `docs/DATA_MODELS.md` lines 249/403, legacy body of `docs/API_REFERENCE.md` line 542/691). The worker explicitly scoped the docs-rewrite to Phase D, and the API_REFERENCE header (line 3) already states "JSTOR is not a query source". Not a Phase A failure but the planner should route a Phase D task to clean these up.
- (low) `tests/test-preferences.js` still calls `setSourcePreference('jstor', ...)` against the singleton-backed manager, which writes a JSTOR row into `~/.mcp-scholarly-research/preferences.json` on disk when the suite runs. This was pre-existing and the manager intentionally accepts arbitrary source names; the public tool schema no longer exposes JSTOR. Worth noting because a user running the suite locally will see a stale `jstor` row in their on-disk prefs file. Suggest gating this test on a temp `HOME` or removing the jstor case in a later phase.
- (low) Unused adapter constructions in `src/index.ts` (`unifiedSearchAdapter`, `enhancedUnifiedSearchAdapter`, `googleScholarAdapter`) remain wired but unreferenced after Phase A. The worker called this out as out of scope; no behavioral impact.
- (low) Existing 2.0.0 CHANGELOG section still claims JSTOR was a source. Acceptable as historical entry, but a Phase D pass should add a corrective note.

## Notes & suggestions
- Phase A is approvable. Schemas, tool descriptions, and live runtime behavior agree across all five tools, and the build + full test matrix is green. The handoff's claims are accurate.
- Recommend the planner schedule Phase D (docs rewrite) next so OVERVIEW.md, ARCHITECTURE.md, DATA_MODELS.md, and the legacy body of API_REFERENCE.md no longer reference JSTOR or 24-tool history.
- For Phase F or a follow-up: prune the `jstor` write in `tests/test-preferences.js` and clean up the dead adapter constructions in `src/index.ts`.
- Verifier repro is at `.orchestrate/verifier-phase-a/verify-schema-honesty.js` on `orch/scholarly-harden/phase-a-truth-contracts` (commit `935bbfa`); run `npm run build && node .orchestrate/verifier-phase-a/verify-schema-honesty.js` to reproduce the live-server matrix.