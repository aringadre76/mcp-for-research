# AI Frontend Visual Feedback Bridge

## Project Overview
A system that allows AI coding assistants (via Cursor IDE) to "see" the live state of a developer's frontend running in the browser. Enables real-time, visual feedback and debugging by bridging the browser and IDE.

## Directory Structure

- `browser-extension/` — Chrome/Firefox extension for capturing screenshots and DOM snapshots
- `cursor-extension/` — Cursor IDE extension for receiving and displaying visual/DOM data
- `bridge-server/` — Local WebSocket server for secure, real-time communication
- `shared/` — Shared code, types, and utilities
- `docs/` — Documentation and onboarding guides

## Phase 1 MVP: Completed ✓

The Phase 1 MVP has been implemented with the following features:

- ✓ Browser extension with screenshot and DOM capture
- ✓ Bridge server for communication between components
- ✓ Cursor extension for receiving and displaying data
- ✓ Manual trigger flow: browser capture → bridge server → cursor extension

## Getting Started

See the [Setup Guide](docs/setup.md) for instructions on how to install and run the system.

For more information about the architecture, see the [Architecture Document](docs/architecture.md).

## Milestones
- [x] Browser extension: screenshot + DOM capture
- [x] Cursor extension: receive and display data
- [x] Local communication bridge
- [x] Manual trigger integration
- [ ] AI integration
- [ ] Security and privacy features
- [ ] Polished UI/UX
- [ ] Documentation and onboarding

---

See `ai-frontend-bridge-plan.md` for the full project plan.