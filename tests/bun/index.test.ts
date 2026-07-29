import { describe, it, expect } from 'bun:test';

import { message } from 'example';

// Describe a group of tests
describe('Exports', () => {
  // A single test
  it('Equality', () => {
    // Assert
    expect(message).toBe('Hi');
  });
});
