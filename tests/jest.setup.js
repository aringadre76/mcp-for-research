// Jest setup file for MCP tests
jest.setTimeout(30000);

// Mock console methods to avoid "Cannot log after tests are done" warnings
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress console output during tests to avoid Jest warnings
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
global.testUtils = {
  // Helper to create a simple test wrapper
  createTestWrapper: (testFunction) => {
    return async () => {
      try {
        await testFunction();
      } catch (error) {
        // Don't fail the test for API rate limiting or network issues
        if (error.message && error.message.includes('429')) {
          console.log('Skipping test due to PubMed API rate limiting');
          return;
        }
        throw error;
      }
    };
  }
};
