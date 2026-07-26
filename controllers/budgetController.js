const { asyncHandler } = require("../utils/errorHandler");
const budgetService = require("../services/budgetService");

/**
 * GET /api/v1/budgets
 * Supports query params: month, year
 */
const getBudgets = asyncHandler(async (req, res) => {
  const budgets = await budgetService.getBudgets(req.user.id, req.query);
  res.status(200).json({ success: true, count: budgets.length, budgets });
});

/**
 * POST /api/v1/budgets  — creates or updates (upsert)
 */
const upsertBudget = asyncHandler(async (req, res) => {
  const budget = await budgetService.upsertBudget(req.user.id, req.body);
  res.status(200).json({ success: true, message: "Budget saved.", budget });
});

/**
 * DELETE /api/v1/budgets/:id
 */
const deleteBudget = asyncHandler(async (req, res) => {
  await budgetService.deleteBudget(req.user.id, req.params.id);
  res.status(200).json({ success: true, message: "Budget deleted." });
});

module.exports = { getBudgets, upsertBudget, deleteBudget };
