# AI Visual Feedback Bridge: Architecture

## System Components

The AI Visual Feedback Bridge consists of three main components:

1. **Browser Extension**: Captures screenshots and DOM snapshots from the current web page.
2. **Bridge Server**: Acts as a communication relay between the browser extension and the Cursor extension.
3. **Cursor Extension**: Receives and displays the captured data in the Cursor IDE.

## Data Flow

```
Browser Extension --> Bridge Server --> Cursor Extension
```

1. The user clicks the "Capture Screenshot & DOM" button in the browser extension.
2. The browser extension captures the screenshot and DOM of the current page.
3. The browser extension sends this data to the bridge server via WebSocket.
4. The bridge server relays the data to the connected Cursor extension.
5. The Cursor extension saves the data and displays it to the user.

## Component Details

### Browser Extension

- **Purpose**: Capture visual and DOM data from the browser.
- **Technologies**: Chrome Extension API, WebSockets.
- **Files**:
  - `manifest.json`: Extension configuration.
  - `popup.html` & `popup.js`: UI for triggering captures.
  - `background.js`: Handles the capture logic and communication with the bridge server.
  - `content.js`: (Reserved for future use) Could be used for more advanced DOM manipulation.

### Bridge Server

- **Purpose**: Relay data between the browser extension and Cursor extension.
- **Technologies**: Node.js, WebSockets (ws), Express.
- **Files**:
  - `server.js`: WebSocket server that handles connections and message relay.
  - `package.json`: Dependencies and scripts.

### Cursor Extension

- **Purpose**: Receive and display captured data in the Cursor IDE.
- **Technologies**: Node.js, WebSockets (ws), File System.
- **Files**:
  - `extension.js`: Connects to the bridge server and handles received data.
  - `package.json`: Dependencies and scripts.

## Communication Protocol

All components communicate using a simple JSON-based protocol:

### Identification Message
```json
{
  "type": "identify",
  "client": "browser" | "cursor"
}
```

### Capture Message
```json
{
  "type": "capture",
  "screenshot": "data:image/png;base64,...",
  "dom": "<html>...</html>"
}
```

### Error Message
```json
{
  "type": "error",
  "error": "Error message"
}
```

## Security Considerations

- All communication is currently local (localhost).
- No authentication is implemented in this MVP version.
- Data is not encrypted during transmission (since it's local only).
- Future versions should implement proper authentication and encryption if remote connections are supported. 