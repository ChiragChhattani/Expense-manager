const { asyncHandler } = require("../utils/errorHandler");
const challengeService = require("../services/aiChallengeService");

const getDashboard = asyncHandler(async (req, res) => {
  const data = await challengeService.getDashboard(req.user.id);
  res.json({ success: true, data });
});

const generateChallenges = asyncHandler(async (req, res) => {
  const data = await challengeService.generateChallenges(req.user.id);
  res.status(201).json({ success: true, data });
});

const verifyChallenges = asyncHandler(async (req, res) => {
  const data = await challengeService.verifyChallenges(req.user.id);
  res.json({ success: true, data });
});

module.exports = {
  getDashboard,
  generateChallenges,
  verifyChallenges
};
