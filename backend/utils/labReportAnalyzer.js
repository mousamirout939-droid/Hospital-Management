const analyzableParameters = [
  { parameterName: 'Hemoglobin', aliases: [/\bhemoglobin\b/i, /\bhaemoglobin\b/i, /\bhgb\b/i, /\bhb\b/i] },
  { parameterName: 'WBC', aliases: [/\bwhite blood cells?\b/i, /\bleukocytes?\b/i, /\bwbc\b/i, /\btlc\b/i] },
  { parameterName: 'RBC', aliases: [/\bred blood cells?\b/i, /\berythrocytes?\b/i, /\brbc\b/i] },
  { parameterName: 'Platelets', aliases: [/\bplatelet(?:s| count)?\b/i, /\bplt\b/i] },
  { parameterName: 'Hematocrit', aliases: [/\bhematocrit\b/i, /\bhaematocrit\b/i, /\bhct\b/i, /\bpcv\b/i] },
  { parameterName: 'MCV', aliases: [/\bmean corpuscular volume\b/i, /\bmcv\b/i] },
  { parameterName: 'MCH', aliases: [/\bmean corpuscular hemoglobin\b/i, /\bmean corpuscular haemoglobin\b/i, /\bmch\b/i] },
  { parameterName: 'MCHC', aliases: [/\bmean corpuscular hemoglobin concentration\b/i, /\bmean corpuscular haemoglobin concentration\b/i, /\bmchc\b/i] },
  { parameterName: 'RDW', aliases: [/\bred cell distribution width\b/i, /\brdw\b/i] },
];

const numericValuePattern = /-?\d[\d,]*(?:\.\d+)?/;
const referenceRangePattern = /(-?\d[\d,]*(?:\.\d+)?)\s*(?:-|–|—|\bto\b)\s*(-?\d[\d,]*(?:\.\d+)?)/i;

const parseNumber = (value) => Number(value.replace(/,/g, ''));

const extractUnit = (text) => {
  const unitMatch = text.match(/^\s*((?:x\s*)?10\^?\d+\/[A-Za-zµμ]+|\/[A-Za-zµμ%]+|[A-Za-zµμ%]+(?:\/[A-Za-zµμ%]+)?)/i);
  return unitMatch ? unitMatch[1].replace(/\s+/g, '') : '';
};

const analyzeParameterLine = (line, parameter) => {
  const alias = parameter.aliases.find((candidate) => candidate.test(line));
  if (!alias) return null;

  const labelMatch = alias.exec(line);
  const remainder = line.slice(labelMatch.index + labelMatch[0].length);
  const valueMatch = numericValuePattern.exec(remainder);
  if (!valueMatch) return null;

  const result = parseNumber(valueMatch[0]);
  if (!Number.isFinite(result)) return null;

  const afterResult = remainder.slice(valueMatch.index + valueMatch[0].length);
  const rangeMatch = referenceRangePattern.exec(afterResult);
  const beforeRange = rangeMatch ? afterResult.slice(0, rangeMatch.index) : afterResult;
  const unit = extractUnit(beforeRange) || (rangeMatch ? extractUnit(afterResult.slice(rangeMatch.index + rangeMatch[0].length)) : '');

  let normalRange = '';
  let flag = '';
  if (rangeMatch) {
    const lower = parseNumber(rangeMatch[1]);
    const upper = parseNumber(rangeMatch[2]);
    if (Number.isFinite(lower) && Number.isFinite(upper) && lower <= upper) {
      normalRange = `${rangeMatch[1]} - ${rangeMatch[2]}`;
      flag = result < lower ? 'low' : result > upper ? 'high' : 'normal';
    }
  }

  return {
    parameterName: parameter.parameterName,
    result: valueMatch[0].replace(/,/g, ''),
    unit,
    normalRange,
    flag,
  };
};

const analyzeLabReportText = (text) => {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const parameters = [];

  for (const parameter of analyzableParameters) {
    for (const line of lines) {
      const extracted = analyzeParameterLine(line, parameter);
      if (extracted) {
        parameters.push(extracted);
        break;
      }
    }
  }

  return parameters;
};

module.exports = { analyzeLabReportText };
