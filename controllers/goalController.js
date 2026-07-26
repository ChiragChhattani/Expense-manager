const { asyncHandler } = require("../utils/errorHandler");
const goalService = require("../services/goalService");

const getGoals = asyncHandler(async (req, res) => {
  const goals = await goalService.getGoals(req.user.id);
  res.status(200).json({ success: true, count: goals.length, goals });
});

const createGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.createGoal(req.user.id, req.body);
  res.status(201).json({ success: true, message: "Goal created.", goal });
});

const updateGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.updateGoal(req.user.id, req.params.id, req.body);
  res.status(200).json({ success: true, message: "Goal updated.", goal });
});

const deleteGoal = asyncHandler(async (req, res) => {
  await goalService.deleteGoal(req.user.id, req.params.id);
  res.status(200).json({ success: true, message: "Goal deleted." });
});

module.exports = { getGoals, createGoal, updateGoal, deleteGoal };
