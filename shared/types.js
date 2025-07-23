/**
 * Message Types for AI Visual Feedback Bridge
 * 
 * This file defines the message formats used between:
 * - Browser Extension
 * - Bridge Server
 * - Cursor Extension
 */

// Message Types
const MessageTypes = {
  IDENTIFY: 'identify',
  CAPTURE: 'capture',
  ERROR: 'error'
};

// Client Types
const ClientTypes = {
  BROWSER: 'browser',
  CURSOR: 'cursor'
};

// Example Messages:

/**
 * Identification Message
 * {
 *   type: 'identify',
 *   client: 'browser' | 'cursor'
 * }
 */

/**
 * Capture Message
 * {
 *   type: 'capture',
 *   screenshot: 'data:image/png;base64,...', // Base64 encoded PNG
 *   dom: '<html>...</html>' // HTML string
 * }
 */

/**
 * Error Message
 * {
 *   type: 'error',
 *   error: 'Error message'
 * }
 */

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MessageTypes,
    ClientTypes
  };
} 