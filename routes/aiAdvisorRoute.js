const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getActionCenter,
  getSpendingInsights,
  getBudgetRecommendations,
  getMonthlyReport,
  getSalarySplit,
  checkAffordability,
  getGoalPlanning,
  getDashboardCards,
} = require("../controllers/aiAdvisorController");

const {
  getCoachSummary,
  searchFinancials,
  getWeeklySummary,
  detectPatterns,
  getMerchantIntelligence,
  detectSubscriptions,
  explainMetric,
  getSmartAlerts,
} = require("../controllers/aiIntelligenceController");


router.use(protect);

router.get("/action-center",          getActionCenter);
router.get("/insights",               getSpendingInsights);
router.get("/budget-recommendations", getBudgetRecommendations);
router.get("/monthly-report",         getMonthlyReport);
router.post("/salary-split",          getSalarySplit);
router.post("/affordability",         checkAffordability);
router.get("/goal-planning",          getGoalPlanning);
router.get("/dashboard-cards",        getDashboardCards);

// ─── AI Intelligence Routes ───────────────────────────────────────────────────
router.get("/coach",                  getCoachSummary);
router.post("/search",                searchFinancials);
router.get("/weekly",                 getWeeklySummary);
router.get("/patterns",               detectPatterns);
router.get("/merchants",              getMerchantIntelligence);
router.get("/subscriptions",          detectSubscriptions);
router.get("/explain/:type",          explainMetric);
router.get("/alerts",                 getSmartAlerts);

module.exports = router;
