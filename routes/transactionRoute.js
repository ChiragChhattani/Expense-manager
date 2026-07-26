const express = require("express");
const {
  getTransactions,
  getTransactionSummary,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transactionController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../utils/upload");

const router = express.Router();

// All transaction routes are protected
router.use(protect);

router.get("/summary", getTransactionSummary);
router.get("/", getTransactions);
router.post("/", upload.single("receipt"), createTransaction);
router.put("/:id", upload.single("receipt"), updateTransaction);
router.delete("/:id", deleteTransaction);

module.exports = router;
