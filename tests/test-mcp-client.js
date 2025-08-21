describe('MCP Server Integration', () => {
  test('should export main index', () => {
    // Simple test to verify the main module can be loaded
    expect(() => {
      require('../dist/index.js');
    }).not.toThrow();
  });

  test('should have PubMedAdapter available', () => {
    const { PubMedAdapter } = require('../dist/adapters/pubmed.js');
    expect(PubMedAdapter).toBeDefined();
    expect(typeof PubMedAdapter).toBe('function');
  });
});
