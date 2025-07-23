# AI Visual Feedback Bridge: Setup Guide

This guide will help you set up the complete AI Visual Feedback Bridge system, which consists of three main components:

1. Browser Extension
2. Bridge Server
3. Cursor Extension

## Prerequisites

- Node.js (v14 or higher) and npm - [Installation Instructions](installation.md)
- Chrome/Edge/Firefox browser
- Cursor IDE

## Step 1: Bridge Server Setup

1. Navigate to the bridge-server directory:
   ```
   cd bridge-server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

The server will run on port 8080 by default. You should see output indicating that the server is running.

## Step 2: Cursor Extension Setup

1. Navigate to the cursor-extension directory:
   ```
   cd cursor-extension
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the extension:
   ```
   npm start
   ```

The extension will connect to the bridge server and wait for captures.

## Step 3: Browser Extension Setup

1. Navigate to the browser-extension directory:
   ```
   cd browser-extension
   ```

2. Load the extension in your browser:
   - Chrome/Edge: Go to `chrome://extensions/`, enable "Developer mode", click "Load unpacked", and select the browser-extension directory.
   - Firefox: Go to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", and select any file in the browser-extension directory.

3. Click the extension icon in your browser toolbar to open the popup.

## Step 4: Testing the System

1. Make sure all components are running:
   - Bridge Server: Running on port 8080
   - Cursor Extension: Connected to the bridge server
   - Browser Extension: Loaded in your browser

2. Navigate to any website in your browser.

3. Click the extension icon and then click the "Capture Screenshot & DOM" button.

4. Check the Cursor Extension console output to confirm that it received the capture.

5. Look in the `cursor-extension/captures` directory to see the saved screenshot and DOM snapshot.

## Troubleshooting

- **Connection Issues**: Make sure the bridge server is running before starting the other components.
- **Permission Errors**: The browser extension needs permission to capture screenshots and access the DOM.
- **Port Conflicts**: If port 8080 is already in use, change the port in `bridge-server/server.js` and update the WebSocket URLs in the browser and cursor extensions.
- **Node.js/npm Not Found**: If you get "command not found" errors, make sure Node.js and npm are installed correctly. See the [installation instructions](installation.md). 