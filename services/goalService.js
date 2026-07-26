const prisma = require("../config/prisma");
const { ApiError } = require("../utils/errorHandler");

const getGoals = async (userId) => {
  return prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

const createGoal = async (userId, data) => {
  return prisma.goal.create({
    data: {
      userId,
      name: data.name,
      targetAmount: parseFloat(data.targetAmount),
      currentAmount: data.currentAmount ? parseFloat(data.currentAmount) : 0,
      deadline: data.deadline ? new Date(data.deadline) : null,
      color: data.color || "#000000",
      icon: data.icon || "target",
    },
  });
};

const updateGoal = async (userId, id, data) => {
  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) throw new ApiError(404, "Goal not found.");
  if (goal.userId !== userId) throw new ApiError(403, "Not authorized.");

  return prisma.goal.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.targetAmount !== undefined && { targetAmount: parseFloat(data.targetAmount) }),
      ...(data.currentAmount !== undefined && { currentAmount: parseFloat(data.currentAmount) }),
      ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline) : null }),
      ...(data.color && { color: data.color }),
      ...(data.icon && { icon: data.icon }),
    },
  });
};

const deleteGoal = async (userId, id) => {
  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) throw new ApiError(404, "Goal not found.");
  if (goal.userId !== userId) throw new ApiError(403, "Not authorized.");

  return prisma.goal.delete({ where: { id } });
};

module.exports = { getGoals, createGoal, updateGoal, deleteGoal };
