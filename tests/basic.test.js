describe('Basic Tests', () => {
  test('should pass basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  test('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  test('should handle strings', () => {
    const str = 'hello world';
    expect(str).toContain('hello');
    expect(str.length).toBeGreaterThan(0);
  });
});
