# AI Visual Feedback Cursor Extension

A Cursor IDE extension that receives and displays visual feedback from the browser extension via the bridge server.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Start the extension:
   ```
   npm start
   ```

## Usage

- The extension connects to the bridge server at `ws://localhost:8080`
- When the browser extension sends a capture, the Cursor extension receives it via the bridge server
- Captures (screenshots and DOM snapshots) are saved in the `captures` directory
- Each capture is timestamped for easy reference

## Integration with Cursor IDE

This is a simplified version for the MVP. In a real implementation, this would be integrated with the Cursor IDE API to:

1. Display the captures in a panel
2. Provide context to the AI agent
3. Enable interaction with the captures

For now, this mock extension simply saves the captures to disk and logs information to the console. 