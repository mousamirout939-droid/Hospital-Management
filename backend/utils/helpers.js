/**
 * Generates a unique-ish invoice number, e.g. INV-20260618-4821
 */
const generateInvoiceNumber = () => {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate()
  ).padStart(2, '0')}`;
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `INV-${datePart}-${randomPart}`;
};

/**
 * Builds pagination metadata + mongoose skip/limit values from query params.
 */
const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const buildPaginationMeta = (totalCount, page, limit) => ({
  totalCount,
  totalPages: Math.ceil(totalCount / limit) || 1,
  currentPage: page,
  pageSize: limit,
});

module.exports = { generateInvoiceNumber, getPagination, buildPaginationMeta };
