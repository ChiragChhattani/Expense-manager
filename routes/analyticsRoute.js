const express = require("express");
const {
  getIncomeExpense,
  getCategorySpending,
  getCashFlow,
} = require("../controllers/analyticsController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/income-expense", getIncomeExpense);
router.get("/category-spending", getCategorySpending);
router.get("/cash-flow", getCashFlow);

module.exports = router;
