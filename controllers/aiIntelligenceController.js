const { asyncHandler } = require("../utils/errorHandler");
const intel = require("../services/aiIntelligenceService");

const getCoachSummary = asyncHandler(async (req, res) => {
  const data = await intel.getCoachSummary(req.user.id);
  res.json({ success: true, data });
});

const searchFinancials = asyncHandler(async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== "string") {
    res.status(400);
    throw new Error("Search query is required.");
  }
  const data = await intel.searchFinancials(req.user.id, query);
  res.json({ success: true, data });
});

const getWeeklySummary = asyncHandler(async (req, res) => {
  const data = await intel.getWeeklySummary(req.user.id);
  res.json({ success: true, data });
});

const detectPatterns = asyncHandler(async (req, res) => {
  const data = await intel.detectPatterns(req.user.id);
  res.json({ success: true, data });
});

const getMerchantIntelligence = asyncHandler(async (req, res) => {
  const data = await intel.getMerchantIntelligence(req.user.id);
  res.json({ success: true, data });
});

const detectSubscriptions = asyncHandler(async (req, res) => {
  const data = await intel.detectSubscriptions(req.user.id);
  res.json({ success: true, data });
});

const explainMetric = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const data = await intel.explainMetric(req.user.id, type);
  res.json({ success: true, data });
});

const getSmartAlerts = asyncHandler(async (req, res) => {
  const data = await intel.getSmartAlerts(req.user.id);
  res.json({ success: true, data });
});

module.exports = {
  getCoachSummary,
  searchFinancials,
  getWeeklySummary,
  detectPatterns,
  getMerchantIntelligence,
  detectSubscriptions,
  explainMetric,
  getSmartAlerts,
};
