import { describe, it, expect } from '@jest/globals';

describe('Smoke Test', () => {
  it('should pass basic sanity check', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have required environment variables', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
});
