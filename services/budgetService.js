const prisma = require("../config/prisma");
const { ApiError } = require("../utils/errorHandler");

/**
 * Get all budgets for a user (optionally filter by month/year)
 */
const getBudgets = async (userId, { month, year } = {}) => {
  const where = { userId };
  if (month) where.month = parseInt(month, 10);
  if (year) where.year = parseInt(year, 10);

  return prisma.budget.findMany({
    where,
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
};

/**
 * Create or update (upsert) a budget — unique per user/category/month/year
 */
const upsertBudget = async (userId, { category, amount, month, year }) => {
  return prisma.budget.upsert({
    where: { userId_category_month_year: { userId, category, month, year } },
    update: { amount: parseFloat(amount) },
    create: { userId, category, amount: parseFloat(amount), month, year },
  });
};

/**
 * Delete a budget — only owner can delete
 */
const deleteBudget = async (userId, budgetId) => {
  const budget = await prisma.budget.findUnique({ where: { id: budgetId } });

  if (!budget) throw new ApiError(404, "Budget not found.");
  if (budget.userId !== userId)
    throw new ApiError(403, "Not authorized to delete this budget.");

  return prisma.budget.delete({ where: { id: budgetId } });
};

module.exports = { getBudgets, upsertBudget, deleteBudget };
