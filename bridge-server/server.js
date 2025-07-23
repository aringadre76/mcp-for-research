const WebSocket = require('ws');
const express = require('express');
const http = require('http');

// Create an Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Create a WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = {
  browser: null,
  cursor: null
};

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  console.log('Client connected');

  // Initial handshake to identify client type
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Handle client identification
      if (data.type === 'identify') {
        if (data.client === 'browser') {
          clients.browser = ws;
          console.log('Browser extension connected');
        } else if (data.client === 'cursor') {
          clients.cursor = ws;
          console.log('Cursor extension connected');
        }
        return;
      }
      
      // Handle capture data from browser extension
      if (data.type === 'capture') {
        console.log('Received capture data:');
        console.log('- Screenshot size:', data.screenshot ? 'Present' : 'None');
        console.log('- DOM size:', data.dom ? `${data.dom.length} chars` : 'None');
        
        // Relay to Cursor extension if connected
        if (clients.cursor) {
          clients.cursor.send(message);
          console.log('Data relayed to Cursor extension');
        } else {
          console.log('Cursor extension not connected, data stored only');
        }
      }
      
      // Handle comprehensive LLM extraction data from browser extension
      if (data.type === 'llm-extraction') {
        console.log('Received comprehensive LLM extraction data:');
        console.log('- Page title:', data.title || 'Untitled');
        console.log('- URL:', data.url || 'Unknown');
        console.log('- Trigger:', data.trigger || 'manual');
        console.log('- LLM data includes: screenshot, page structure, visible text, element tree');
        
        // Relay to Cursor extension if connected
        if (clients.cursor) {
          clients.cursor.send(message);
          console.log('LLM extraction data relayed to Cursor extension');
        } else {
          console.log('Cursor extension not connected, LLM data stored only');
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    if (clients.browser === ws) {
      clients.browser = null;
      console.log('Browser extension disconnected');
    } else if (clients.cursor === ws) {
      clients.cursor = null;
      console.log('Cursor extension disconnected');
    }
  });
});

// Add a simple status endpoint
app.get('/', (req, res) => {
  res.send('AI Visual Feedback Bridge Server is running');
});

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Bridge server running on port ${PORT}`);
  console.log(`WebSocket server available at ws://localhost:${PORT}`);
  console.log(`Status page available at http://localhost:${PORT}`);
}); 