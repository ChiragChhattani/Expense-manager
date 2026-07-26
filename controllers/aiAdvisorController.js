const { asyncHandler } = require("../utils/errorHandler");
const ai = require("../services/aiAdvisorService");

const getActionCenter = asyncHandler(async (req, res) => {
  const data = await ai.getActionCenter(req.user.id);
  res.json({ success: true, data });
});

const getSpendingInsights = asyncHandler(async (req, res) => {
  const data = await ai.getSpendingInsights(req.user.id);
  res.json({ success: true, data });
});

const getBudgetRecommendations = asyncHandler(async (req, res) => {
  const months = parseInt(req.query.months) || 3;
  const data = await ai.getBudgetRecommendations(req.user.id, Math.min(12, Math.max(1, months)));
  res.json({ success: true, data });
});

const getMonthlyReport = asyncHandler(async (req, res) => {
  const now = new Date();
  const month = parseInt(req.query.month) || now.getMonth() + 1;
  const year = parseInt(req.query.year) || now.getFullYear();
  const data = await ai.getMonthlyReport(req.user.id, month, year);
  res.json({ success: true, data });
});

const getSalarySplit = asyncHandler(async (req, res) => {
  const { salary, period = "monthly", city = "", age = 30, goals = [] } = req.body;
  if (!salary || isNaN(salary) || salary <= 0) {
    res.status(400);
    throw new Error("A valid salary amount is required.");
  }
  const data = await ai.getSalarySplit(req.user.id, {
    salary: parseFloat(salary),
    period,
    city: String(city),
    age: parseInt(age),
    goals: Array.isArray(goals) ? goals : [],
  });
  res.json({ success: true, data });
});

const checkAffordability = asyncHandler(async (req, res) => {
  const { amount, description = "Purchase" } = req.body;
  if (!amount || isNaN(amount) || amount <= 0) {
    res.status(400);
    throw new Error("A valid purchase amount is required.");
  }
  const data = await ai.checkAffordability(req.user.id, {
    amount: parseFloat(amount),
    description: String(description),
  });
  res.json({ success: true, data });
});

const getGoalPlanning = asyncHandler(async (req, res) => {
  const data = await ai.getGoalPlanning(req.user.id);
  res.json({ success: true, data });
});

const getDashboardCards = asyncHandler(async (req, res) => {
  const data = await ai.getDashboardCards(req.user.id);
  res.json({ success: true, data });
});

module.exports = {
  getActionCenter,
  getSpendingInsights,
  getBudgetRecommendations,
  getMonthlyReport,
  getSalarySplit,
  checkAffordability,
  getGoalPlanning,
  getDashboardCards,
};
