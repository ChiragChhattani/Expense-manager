const { asyncHandler } = require("../utils/errorHandler");
const analyticsService = require("../services/analyticsService");

const getIncomeExpense = asyncHandler(async (req, res) => {
  const months = req.query.months ? parseInt(req.query.months) : 6;
  const data = await analyticsService.getIncomeExpenseData(req.user.id, months);
  res.status(200).json({ success: true, data });
});

const getCategorySpending = asyncHandler(async (req, res) => {
  const month = req.query.month ? parseInt(req.query.month) : new Date().getMonth() + 1;
  const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
  const data = await analyticsService.getCategorySpending(req.user.id, month, year);
  res.status(200).json({ success: true, data });
});

const getCashFlow = asyncHandler(async (req, res) => {
  const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
  const data = await analyticsService.getCashFlow(req.user.id, year);
  res.status(200).json({ success: true, data });
});

module.exports = { getIncomeExpense, getCategorySpending, getCashFlow };
