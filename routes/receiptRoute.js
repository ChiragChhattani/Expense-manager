const express = require("express");
const { scanReceipt } = require("../controllers/receiptController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../utils/upload");

const router = express.Router();

router.use(protect);
router.post("/scan", upload.single("receipt"), scanReceipt);

module.exports = router;
