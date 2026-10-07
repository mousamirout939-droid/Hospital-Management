const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeLabReportText } = require('../utils/labReportAnalyzer');

test('extracts CBC values and compares them with ranges in the report', () => {
  const parameters = analyzeLabReportText([
    'Hemoglobin 10.2 g/dL 12.0 - 16.0',
    'WBC 8,200 /uL 4,000 - 11,000',
    'RBC 4.1 x10^6/uL 4.0 - 5.5',
    'Platelet Count 2.4 lakh/uL 1.5 - 4.5 lakh/uL',
  ].join('\n'));

  assert.deepEqual(parameters, [
    { parameterName: 'Hemoglobin', result: '10.2', unit: 'g/dL', normalRange: '12.0 - 16.0', flag: 'low' },
    { parameterName: 'WBC', result: '8200', unit: '/uL', normalRange: '4,000 - 11,000', flag: 'normal' },
    { parameterName: 'RBC', result: '4.1', unit: 'x10^6/uL', normalRange: '4.0 - 5.5', flag: 'normal' },
    { parameterName: 'Platelets', result: '2.4', unit: 'lakh/uL', normalRange: '1.5 - 4.5', flag: 'normal' },
  ]);
});

test('does not infer a reference range when the uploaded report omits one', () => {
  assert.deepEqual(analyzeLabReportText('Hemoglobin: 10.2 g/dL'), [
    { parameterName: 'Hemoglobin', result: '10.2', unit: 'g/dL', normalRange: '', flag: '' },
  ]);
});

test('flags values above the report-provided upper limit', () => {
  assert.deepEqual(analyzeLabReportText('WBC 12,000 /uL 4,000 - 11,000'), [
    { parameterName: 'WBC', result: '12000', unit: '/uL', normalRange: '4,000 - 11,000', flag: 'high' },
  ]);
});

test('returns no values when there are no supported CBC results', () => {
  assert.deepEqual(analyzeLabReportText('Patient information\nNo results available'), []);
});
