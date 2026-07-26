const prisma = require("../config/prisma");
const { startOfDay, addDays, endOfDay, subDays } = require("date-fns");

// --- Helpers ---
const sumBy = (arr, type) => arr.filter((t) => t.type === type).reduce((s, t) => s + Number(t.amount), 0);

// --- Challenge Logic ---

const getDashboard = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { points: true } });
  const challenges = await prisma.challenge.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  // Attach progress to active challenges
  for (const c of challenges) {
    if (c.status === "active") {
      const txs = await prisma.transaction.findMany({
        where: {
          userId,
          type: "expense",
          date: { gte: c.startDate, lte: c.endDate }
        },
        include: { category: true }
      });
      
      let spent = 0;
      if (c.type === "zero_spend") {
        spent = sumBy(txs, "expense");
      } else if (c.type === "category_limit" && c.targetCategory) {
        spent = sumBy(txs.filter(t => t.category?.name === c.targetCategory), "expense");
      }
      
      c.currentSpent = spent;
      c.progress = Math.min(100, c.targetAmount > 0 ? (spent / c.targetAmount) * 100 : 0);
    }
  }

  let badge = "Novice";
  if (user.points >= 500) badge = "Financial Guru 👑";
  else if (user.points >= 200) badge = "Saver 🥈";
  else if (user.points >= 50) badge = "Apprentice 🥉";

  return { points: user.points, badge, challenges };
};

const verifyChallenges = async (userId) => {
  const now = new Date();
  const activeChallenges = await prisma.challenge.findMany({
    where: { userId, status: "active" }
  });

  let totalPointsEarned = 0;
  const verified = [];

  for (const c of activeChallenges) {
    // Only verify if the challenge end date has passed, or if we want to allow early failure.
    // For simplicity, we verify regardless of date. If they failed early, mark failed.
    const txs = await prisma.transaction.findMany({
      where: {
        userId,
        type: "expense",
        date: { gte: c.startDate, lte: c.endDate }
      },
      include: { category: true }
    });

    let spent = 0;
    if (c.type === "zero_spend") {
      spent = sumBy(txs, "expense");
    } else if (c.type === "category_limit" && c.targetCategory) {
      spent = sumBy(txs.filter(t => t.category?.name === c.targetCategory), "expense");
    }

    let isFailed = false;
    let isCompleted = false;

    if (spent > c.targetAmount) {
      isFailed = true;
    } else if (now > new Date(c.endDate)) {
      isCompleted = true; // Stayed under limit and time is up
    }

    if (isFailed) {
      await prisma.challenge.update({ where: { id: c.id }, data: { status: "failed" } });
      verified.push({ id: c.id, status: "failed" });
    } else if (isCompleted) {
      await prisma.challenge.update({ where: { id: c.id }, data: { status: "completed" } });
      await prisma.user.update({ where: { id: userId }, data: { points: { increment: c.points } } });
      totalPointsEarned += c.points;
      verified.push({ id: c.id, status: "completed" });
    }
  }

  return { verified, totalPointsEarned };
};

const generateChallenges = async (userId) => {
  const now = new Date();
  
  // Clean up old active ones
  await verifyChallenges(userId);
  
  const activeCount = await prisma.challenge.count({ where: { userId, status: "active" } });
  if (activeCount >= 3) {
    return { message: "You already have active challenges. Complete them first!" };
  }

  const startLastWeek = subDays(now, 7);
  const txs = await prisma.transaction.findMany({
    where: { userId, type: "expense", date: { gte: startLastWeek } },
    include: { category: true }
  });

  const catSpend = {};
  txs.forEach(t => {
    const c = t.category?.name || "Uncategorized";
    catSpend[c] = (catSpend[c] || 0) + Number(t.amount);
  });

  const newChallenges = [];

  // Generate a category limit challenge
  let highestCat = null;
  let highestAmount = 0;
  for (const [k, v] of Object.entries(catSpend)) {
    if (v > highestAmount) { highestAmount = v; highestCat = k; }
  }

  if (highestCat && highestAmount > 500) {
    // Challenge: Spend less than 50% of last week's spend on this category in the next 3 days.
    const target = Math.round(highestAmount * 0.5);
    newChallenges.push({
      userId,
      title: `${highestCat} Freeze`,
      description: `You spent ₹${highestAmount.toLocaleString()} on ${highestCat} last week. Try to keep it under ₹${target.toLocaleString()} for the next 3 days!`,
      type: "category_limit",
      targetCategory: highestCat,
      targetAmount: target,
      startDate: startOfDay(now),
      endDate: endOfDay(addDays(now, 2)),
      points: 50
    });
  }

  // Generate a zero-spend day challenge
  if (newChallenges.length === 0) {
    newChallenges.push({
      userId,
      title: `Zero Spend Day`,
      description: `Try to spend absolutely nothing tomorrow. Are you up for it?`,
      type: "zero_spend",
      targetCategory: null,
      targetAmount: 0,
      startDate: startOfDay(addDays(now, 1)),
      endDate: endOfDay(addDays(now, 1)),
      points: 100
    });
  }

  // Create them
  for (const c of newChallenges) {
    await prisma.challenge.create({ data: c });
  }

  return { message: `Generated ${newChallenges.length} new challenges.`, newChallenges };
};

module.exports = {
  getDashboard,
  verifyChallenges,
  generateChallenges
};
