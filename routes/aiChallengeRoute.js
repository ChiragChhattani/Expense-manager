const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getDashboard,
  generateChallenges,
  verifyChallenges
} = require("../controllers/aiChallengeController");

const router = express.Router();

router.use(protect);

router.get("/", getDashboard);
router.post("/generate", generateChallenges);
router.post("/verify", verifyChallenges);

module.exports = router;
