const test = require('node:test');
const assert = require('node:assert/strict');
const { formatDateKey, parseLocalDate } = require('../utils/dateUtils');

test('formatDateKey keeps the local calendar day', () => {
  const date = new Date(2026, 8, 25, 12, 0, 0);
  assert.equal(formatDateKey(date), '2026-09-25');
});

test('parseLocalDate creates a local midnight date without timezone drift', () => {
  const date = parseLocalDate('2026-09-25');
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 8);
  assert.equal(date.getDate(), 25);
});
