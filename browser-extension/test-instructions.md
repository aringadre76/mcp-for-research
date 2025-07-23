# Browser Extension Testing Instructions

Since we can't run npm and Node.js in this environment, here are manual testing instructions for the browser extension:

## Loading the Extension in Chrome/Edge

1. Open Chrome, Edge, or any Chromium-based browser
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked"
5. Select the `browser-extension` directory from this project

The extension should now be loaded and visible in your browser toolbar.

## Testing the Extension

1. Click on the extension icon in your toolbar to open the popup
2. Navigate to any website (e.g., `https://example.com`)
3. Click the "Capture Screenshot & DOM" button
4. You should see "Capturing..." in the popup
5. Open the browser's developer console (F12 or right-click > Inspect)
6. Look for logs indicating the capture was attempted
7. You'll see an error about not being able to connect to the WebSocket server (which is expected since we haven't set it up yet)

## Expected Console Output

```
Connected to bridge server  // This will fail since server isn't running
WebSocket error: [object Event]
Captured DOM and screenshot
Not connected to bridge server
```

## Next Steps

In a real environment with Node.js and npm installed, you would:

1. Install dependencies for the bridge server
2. Start the bridge server
3. Install dependencies for the Cursor extension
4. Start the Cursor extension
5. Then test the full flow from browser to Cursor

For now, you can verify that the browser extension loads correctly and attempts to capture when the button is clicked. 