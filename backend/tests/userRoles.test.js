const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');

test('user schema accepts all supported staff and patient roles', () => {
  assert.deepEqual(User.schema.path('role').enumValues, [
    'admin',
    'doctor',
    'patient',
    'receptionist',
    'pharmacist',
    'lab-technician',
  ]);
});

test('user schema rejects an unrecognized role', () => {
  const user = new User({
    name: 'Test User',
    email: 'test@example.com',
    password: 'valid-password',
    role: 'superuser',
  });

  assert.equal(user.validateSync().errors.role.kind, 'enum');
});
