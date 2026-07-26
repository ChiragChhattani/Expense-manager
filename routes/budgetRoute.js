const express = require("express");
const {
  getBudgets,
  upsertBudget,
  deleteBudget,
} = require("../controllers/budgetController");
const { protect } = require("../middleware/authMiddleware");
const { validate, budgetRules } = require("../middleware/validateMiddleware");

const router = express.Router();

// All budget routes are protected
router.use(protect);

router.get("/", getBudgets);
router.post("/", budgetRules, validate, upsertBudget);
router.delete("/:id", deleteBudget);

module.exports = router;
