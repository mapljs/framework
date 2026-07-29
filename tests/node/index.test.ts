import { describe, it } from 'node:test';
import assert from 'node:assert';

import { message } from 'example';

// Describe a group of tests
describe('Exports', () => {
  // A single test
  it('Equality', () => {
    // Assert
    assert.strictEqual(message, 'Hi');
  });
});
