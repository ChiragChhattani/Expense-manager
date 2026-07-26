const { asyncHandler } = require("../utils/errorHandler");
const transactionService = require("../services/transactionService");

/**
 * GET /api/v1/transactions
 * Supports query params: type, categoryId, startDate, endDate, search, page, limit, sortBy, order
 */
const getTransactions = asyncHandler(async (req, res) => {
  const result = await transactionService.getTransactions(req.user.id, req.query);
  res.status(200).json({ success: true, ...result });
});

/**
 * GET /api/v1/transactions/summary
 */
const getTransactionSummary = asyncHandler(async (req, res) => {
  const summary = await transactionService.getTransactionSummary(req.user.id);
  res.status(200).json({ success: true, summary });
});

/**
 * POST /api/v1/transactions
 */
const createTransaction = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    data.receiptUrl = `/uploads/${req.file.filename}`;
  }
  const transaction = await transactionService.createTransaction(req.user.id, data);
  res.status(201).json({ success: true, message: "Transaction created.", transaction });
});

/**
 * PUT /api/v1/transactions/:id
 */
const updateTransaction = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    data.receiptUrl = `/uploads/${req.file.filename}`;
  }
  const transaction = await transactionService.updateTransaction(
    req.user.id,
    req.params.id,
    data
  );
  res.status(200).json({ success: true, message: "Transaction updated.", transaction });
});

/**
 * DELETE /api/v1/transactions/:id
 */
const deleteTransaction = asyncHandler(async (req, res) => {
  await transactionService.deleteTransaction(req.user.id, req.params.id);
  res.status(200).json({ success: true, message: "Transaction deleted." });
});

module.exports = {
  getTransactions,
  getTransactionSummary,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
