const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (value) => {
  if (!value || typeof value !== 'string') return null;
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day || [year, month, day].some(Number.isNaN)) {
    return null;
  }

  return new Date(year, month - 1, day);
};

module.exports = {
  formatDateKey,
  parseLocalDate,
};
