# AI Visual Feedback Bridge Server

A local WebSocket server that acts as a bridge between the browser extension and the Cursor extension.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

The server will run on port 8080 by default. You can change this by setting the `PORT` environment variable.

## Usage

- The server provides a WebSocket endpoint at `ws://localhost:8080`
- A status page is available at `http://localhost:8080`
- The browser extension connects to the server and sends capture data
- The Cursor extension connects to the server and receives the data

## Protocol

### Client Identification
Clients must identify themselves when connecting:

```json
{
  "type": "identify",
  "client": "browser" // or "cursor"
}
```

### Capture Data
The browser extension sends capture data in this format:

```json
{
  "type": "capture",
  "screenshot": "data:image/png;base64,...", // Base64 encoded PNG
  "dom": "<html>...</html>" // HTML string
}
```

The server relays this data to the Cursor extension if connected. 