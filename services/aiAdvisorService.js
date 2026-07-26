/**
 * AI Financial Advisor Service
 * All recommendations are derived purely from the user's actual transaction,
 * budget, and goal data — no generic advice, no external APIs.
 */
const prisma = require("../config/prisma");
const {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  differenceInDays,
  addMonths,
} = require("date-fns");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTransactionsInRange = async (userId, start, end) =>
  prisma.transaction.findMany({
    where: { userId, date: { gte: start, lte: end } },
    include: { category: { select: { name: true, color: true, icon: true } } },
    orderBy: { date: "asc" },
  });

const sumBy = (arr, type) =>
  arr
    .filter((t) => t.type === type)
    .reduce((s, t) => s + Number(t.amount), 0);

/** Returns spending totals grouped by category name */
const groupByCategory = (transactions, type = "expense") => {
  const groups = {};
  transactions
    .filter((t) => t.type === type)
    .forEach((t) => {
      const key = t.category?.name || "Uncategorized";
      if (!groups[key]) {
        groups[key] = {
          total: 0,
          count: 0,
          color: t.category?.color || "#9e9e9e",
          icon: t.category?.icon || "📦",
        };
      }
      groups[key].total += Number(t.amount);
      groups[key].count++;
    });
  return groups;
};

/** Clamps a value between min and max */
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/** Generates the last N months of date ranges [{start, end, label}] */
const lastNMonths = (n) => {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = subMonths(now, i);
    return {
      start: startOfMonth(d),
      end: endOfMonth(d),
      label: format(d, "MMM yyyy"),
      monthIndex: d.getMonth(),
      year: d.getFullYear(),
    };
  }).reverse();
};

// ─── 1. Financial Health Score ─────────────────────────────────────────────────

const getActionCenter = async (userId) => {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const [thisTx, lastTx] = await Promise.all([
    getTransactionsInRange(userId, thisMonthStart, thisMonthEnd),
    getTransactionsInRange(userId, lastMonthStart, lastMonthEnd),
  ]);

  const budgets = await prisma.budget.findMany({
    where: { userId, month: now.getMonth() + 1, year: now.getFullYear() },
  });
  
  const goals = await prisma.goal.findMany({ where: { userId } });

  const thisCats = groupByCategory(thisTx, "expense");
  const lastCats = groupByCategory(lastTx, "expense");

  const insights = [];

  // 1. Budget Overages or Approaching
  for (const b of budgets) {
    const spent = thisCats[b.category]?.total || 0;
    const limit = Number(b.amount);
    if (spent > limit) {
      insights.push(`🚨 You exceeded your ${b.category} budget by ₹${(spent - limit).toFixed(0)} this month. Consider limiting this spending.`);
    } else if (spent > limit * 0.8) {
      insights.push(`⚠️ Your ${b.category} budget has only ${(((limit - spent) / limit) * 100).toFixed(0)}% remaining (₹${(limit - spent).toFixed(0)}).`);
    } else if (spent < limit * 0.5 && now.getDate() > 20) {
      insights.push(`✅ Your ${b.category} budget has over 50% remaining. Great job managing this!`);
    }
  }

  // 2. MoM Spending Anomalies
  for (const cat in thisCats) {
    const thisSpent = thisCats[cat].total;
    const lastSpent = lastCats[cat]?.total || 0;
    if (lastSpent > 0 && thisSpent > lastSpent) {
      const pct = ((thisSpent - lastSpent) / lastSpent) * 100;
      if (pct > 15 && thisSpent > 1000) {
        insights.push(`📈 ${cat} expenses have increased by ${pct.toFixed(0)}% compared to last month.`);
      }
    }
  }

  // 3. Goal Tracking
  for (const g of goals) {
    const current = Number(g.currentAmount);
    const target = Number(g.targetAmount);
    if (current < target) {
      const remaining = target - current;
      if (remaining <= target * 0.2) {
        insights.push(`🎯 You're only ₹${remaining.toFixed(0)} away from reaching your ${g.name} goal!`);
      } else if (g.deadline) {
        const deadlineDate = new Date(g.deadline);
        if (deadlineDate > now && current > target * 0.5) {
          insights.push(`⏳ You are on track to reach your ${g.name} savings goal before the deadline.`);
        }
      }
    }
  }

  // 4. Overall Savings
  const thisInc = sumBy(thisTx, "income");
  const thisExp = sumBy(thisTx, "expense");
  const lastInc = sumBy(lastTx, "income");
  const lastExp = sumBy(lastTx, "expense");
  const thisSavings = thisInc - thisExp;
  const lastSavings = lastInc - lastExp;
  if (thisSavings > lastSavings && thisSavings > 0) {
    insights.push(`💰 Your monthly savings increased by ₹${(thisSavings - lastSavings).toFixed(0)} compared to last month.`);
  } else if (thisSavings < lastSavings && thisSavings > 0) {
    insights.push(`⚠️ Your monthly savings decreased by ₹${(lastSavings - thisSavings).toFixed(0)} compared to last month.`);
  }

  // Sort or trim insights to 5 max, prioritize alerts
  const sorted = insights.sort((a, b) => {
    const scoreA = a.startsWith('🚨') ? 4 : a.startsWith('⚠️') ? 3 : a.startsWith('🎯') ? 2 : 1;
    const scoreB = b.startsWith('🚨') ? 4 : b.startsWith('⚠️') ? 3 : b.startsWith('🎯') ? 2 : 1;
    return scoreB - scoreA;
  });

  return sorted.slice(0, 5);
};

// ─── 2. Spending Insights ─────────────────────────────────────────────────────

const getSpendingInsights = async (userId) => {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const [thisTx, lastTx] = await Promise.all([
    getTransactionsInRange(userId, thisMonthStart, thisMonthEnd),
    getTransactionsInRange(userId, lastMonthStart, lastMonthEnd),
  ]);

  const budgets = await prisma.budget.findMany({
    where: { userId, month: now.getMonth() + 1, year: now.getFullYear() },
  });

  const thisExp = sumBy(thisTx, "expense");
  const lastExp = sumBy(lastTx, "expense");
  const thisInc = sumBy(thisTx, "income");
  const lastInc = sumBy(lastTx, "income");
  const thisCats = groupByCategory(thisTx, "expense");
  const lastCats = groupByCategory(lastTx, "expense");

  const insights = [];

  // Overall spending change
  if (lastExp > 0) {
    const pct = ((thisExp - lastExp) / lastExp) * 100;
    if (Math.abs(pct) >= 5) {
      insights.push({
        type: pct > 0 ? "warning" : "success",
        icon: pct > 0 ? "📈" : "📉",
        title: `Spending ${pct > 0 ? "increased" : "decreased"} ${Math.abs(pct).toFixed(0)}% vs last month`,
        detail: `₹${thisExp.toFixed(0)} this month vs ₹${lastExp.toFixed(0)} last month.`,
        category: null,
      });
    }
  } else if (thisExp > 0) {
    insights.push({
      type: "info",
      icon: "📊",
      title: "First month of spending tracked",
      detail: `Total expenses this month: ₹${thisExp.toFixed(0)}.`,
      category: null,
    });
  }

  // Income change
  if (lastInc > 0 && thisInc > 0) {
    const pct = ((thisInc - lastInc) / lastInc) * 100;
    if (Math.abs(pct) >= 10) {
      insights.push({
        type: pct > 0 ? "success" : "warning",
        icon: pct > 0 ? "💰" : "⚠️",
        title: `Income ${pct > 0 ? "increased" : "decreased"} ${Math.abs(pct).toFixed(0)}% vs last month`,
        detail: `₹${thisInc.toFixed(0)} this month vs ₹${lastInc.toFixed(0)} last month.`,
        category: null,
      });
    }
  }

  // Category-level insights
  const allCats = new Set([...Object.keys(thisCats), ...Object.keys(lastCats)]);
  allCats.forEach((cat) => {
    const thisAmt = thisCats[cat]?.total || 0;
    const lastAmt = lastCats[cat]?.total || 0;
    if (lastAmt > 0 && thisAmt > 0) {
      const pct = ((thisAmt - lastAmt) / lastAmt) * 100;
      if (pct > 30) {
        insights.push({
          type: "warning",
          icon: thisCats[cat]?.icon || "📦",
          title: `${cat} spending up ${pct.toFixed(0)}%`,
          detail: `₹${thisAmt.toFixed(0)} this month, ₹${lastAmt.toFixed(0)} last month.`,
          category: cat,
        });
      } else if (pct < -20) {
        insights.push({
          type: "success",
          icon: thisCats[cat]?.icon || "📦",
          title: `${cat} spending down ${Math.abs(pct).toFixed(0)}%`,
          detail: `Well done — saved ₹${(lastAmt - thisAmt).toFixed(0)} compared to last month.`,
          category: cat,
        });
      }
    }
  });

  // Budget alerts
  budgets.forEach((b) => {
    const spent = thisCats[b.category]?.total || 0;
    const limit = Number(b.amount);
    const pct = limit > 0 ? (spent / limit) * 100 : 0;
    if (pct >= 100) {
      insights.push({
        type: "danger",
        icon: "🚨",
        title: `${b.category} budget exceeded`,
        detail: `Spent ₹${spent.toFixed(0)} of ₹${limit.toFixed(0)} limit (${pct.toFixed(0)}%).`,
        category: b.category,
      });
    } else if (pct >= 80) {
      insights.push({
        type: "warning",
        icon: "⚠️",
        title: `${b.category} budget at ${pct.toFixed(0)}%`,
        detail: `₹${(limit - spent).toFixed(0)} remaining for this month.`,
        category: b.category,
      });
    }
  });

  // Savings insight
  const net = thisInc - thisExp;
  if (thisInc > 0) {
    const sr = (net / thisInc) * 100;
    insights.push({
      type: sr >= 20 ? "success" : sr >= 10 ? "info" : "warning",
      icon: "💼",
      title: `Savings rate: ${sr.toFixed(1)}% this month`,
      detail:
        sr >= 20
          ? "Excellent! You are saving more than the recommended 20%."
          : sr >= 10
          ? "Good progress. Try to push toward 20%."
          : net >= 0
          ? "Low savings rate. Review your biggest expense categories."
          : "Expenses exceeded income this month. Reduce discretionary spending.",
      category: null,
    });
  }

  // Top spending category
  const topCat = Object.entries(thisCats).sort(
    (a, b) => b[1].total - a[1].total
  )[0];
  if (topCat && thisExp > 0) {
    const pctOfTotal = ((topCat[1].total / thisExp) * 100).toFixed(0);
    insights.push({
      type: "info",
      icon: topCat[1].icon || "📦",
      title: `Biggest spend: ${topCat[0]} (${pctOfTotal}% of expenses)`,
      detail: `₹${topCat[1].total.toFixed(0)} spent on ${topCat[0]} this month.`,
      category: topCat[0],
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "info",
      icon: "📊",
      title: "No significant insights yet",
      detail: "Add more transactions to get personalized spending insights.",
      category: null,
    });
  }

  return {
    thisMonth: { income: thisInc, expenses: thisExp, net: thisInc - thisExp },
    lastMonth: { income: lastInc, expenses: lastExp },
    insights: insights.slice(0, 10),
    topCategories: Object.entries(thisCats)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data })),
  };
};

// ─── 3. Smart Budget Recommendations ─────────────────────────────────────────

const getBudgetRecommendations = async (userId, months = 3) => {
  const now = new Date();
  const start = startOfMonth(subMonths(now, months));
  const transactions = await getTransactionsInRange(userId, start, now);

  // Build per-month category totals
  const monthRanges = lastNMonths(months);
  const catMonthly = {}; // catName -> [amounts per month]

  monthRanges.forEach((m) => {
    const mTx = transactions.filter(
      (t) =>
        t.date >= m.start && t.date <= m.end && t.type === "expense"
    );
    const cats = groupByCategory(mTx, "expense");
    Object.entries(cats).forEach(([cat, data]) => {
      if (!catMonthly[cat])
        catMonthly[cat] = {
          amounts: [],
          color: data.color,
          icon: data.icon,
        };
      catMonthly[cat].amounts.push(data.total);
    });
  });

  const recommendations = Object.entries(catMonthly)
    .map(([cat, data]) => {
      const { amounts } = data;
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const max = Math.max(...amounts);
      const min = Math.min(...amounts);
      // Buffer: 10% above average, capped at max spend seen
      const recommended = Math.round(avg * 1.1);
      const trend =
        amounts.length >= 2
          ? amounts[amounts.length - 1] > amounts[0]
            ? "increasing"
            : amounts[amounts.length - 1] < amounts[0]
            ? "decreasing"
            : "stable"
          : "stable";

      let reason = "";
      if (trend === "increasing")
        reason = `${cat} spending has been rising. Budget set 10% above average to account for this.`;
      else if (trend === "decreasing")
        reason = `${cat} spending has been falling — budget reflects your improving habits.`;
      else
        reason = `${cat} is stable. Budget set 10% above your ${months}-month average for flexibility.`;

      if (amounts.length < months)
        reason += ` (${amounts.length}/${months} months of data available)`;

      return {
        category: cat,
        color: data.color,
        icon: data.icon,
        recommended,
        average: Math.round(avg),
        min: Math.round(min),
        max: Math.round(max),
        trend,
        dataPoints: amounts.length,
        reason,
      };
    })
    .sort((a, b) => b.recommended - a.recommended);

  const totalRecommended = recommendations.reduce(
    (s, r) => s + r.recommended,
    0
  );

  const hasSufficientData = months >= 2 && recommendations.length >= 3;

  return {
    recommendations,
    totalRecommended,
    basedOnMonths: months,
    hasSufficientData,
    message: hasSufficientData
      ? `Based on your last ${months} months of spending (${recommendations.length} categories).`
      : "Add more transactions across multiple months for more accurate recommendations.",
  };
};

// ─── 4. Monthly Financial Health Report ──────────────────────────────────────

const getMonthlyReport = async (userId, month, year) => {
  const targetDate = new Date(year, month - 1, 1);
  const start = startOfMonth(targetDate);
  const end = endOfMonth(targetDate);
  const prevStart = startOfMonth(subMonths(targetDate, 1));
  const prevEnd = endOfMonth(subMonths(targetDate, 1));

  const [transactions, prevTx, budgets, goals] = await Promise.all([
    getTransactionsInRange(userId, start, end),
    getTransactionsInRange(userId, prevStart, prevEnd),
    prisma.budget.findMany({ where: { userId, month, year } }),
    prisma.goal.findMany({ where: { userId } }),
  ]);

  const income = sumBy(transactions, "income");
  const expenses = sumBy(transactions, "expense");
  const savings = income - expenses;
  const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;
  const prevExpenses = sumBy(prevTx, "expense");
  const prevIncome = sumBy(prevTx, "income");

  const catSpend = groupByCategory(transactions, "expense");
  const prevCatSpend = groupByCategory(prevTx, "expense");

  // Category changes
  const categoryChanges = Object.entries(catSpend)
    .map(([cat, data]) => {
      const prev = prevCatSpend[cat]?.total || 0;
      const change = prev > 0 ? ((data.total - prev) / prev) * 100 : null;
      return { category: cat, amount: data.total, prev, change, icon: data.icon, color: data.color };
    })
    .sort((a, b) => b.amount - a.amount);

  const topCategory = categoryChanges[0];

  // Budget compliance
  const budgetCompliance = budgets.map((b) => {
    const spent = catSpend[b.category]?.total || 0;
    const limit = Number(b.amount);
    return {
      category: b.category,
      spent,
      limit,
      pct: limit > 0 ? Math.round((spent / limit) * 100) : 0,
      status: spent > limit ? "exceeded" : spent / limit >= 0.8 ? "near" : "ok",
    };
  });

  const exceededBudgets = budgetCompliance.filter((b) => b.status === "exceeded");
  const okBudgets = budgetCompliance.filter((b) => b.status === "ok");

  // Recommendations
  const recs = [];
  if (Number(savingsRate) < 10)
    recs.push(`Increase savings rate: target cutting ₹${Math.round((income * 0.1) - savings)} from discretionary spending next month.`);
  if (topCategory)
    recs.push(`Your biggest expense is ${topCategory.category} (₹${topCategory.amount.toFixed(0)}). Review this category for savings opportunities.`);
  if (exceededBudgets.length > 0)
    recs.push(`You exceeded ${exceededBudgets.length} budget${exceededBudgets.length > 1 ? "s" : ""}: ${exceededBudgets.map((b) => b.category).join(", ")}. Tighten limits or adjust budgets.`);
  const bigGrowth = categoryChanges.find((c) => c.change !== null && c.change > 30);
  if (bigGrowth)
    recs.push(`${bigGrowth.category} grew ${bigGrowth.change.toFixed(0)}% vs last month. Investigate what drove this increase.`);
  if (recs.length === 0)
    recs.push("Great month overall! Consider investing any surplus to accelerate goal progress.");

  // Positive habits
  const positives = [];
  if (Number(savingsRate) >= 20) positives.push("Saved more than 20% of income — excellent financial discipline.");
  if (okBudgets.length === budgets.length && budgets.length > 0)
    positives.push("Stayed within budget for all tracked categories.");
  const decreasingCats = categoryChanges.filter((c) => c.change !== null && c.change < -10);
  if (decreasingCats.length > 0)
    positives.push(`Reduced spending in ${decreasingCats.map((c) => c.category).join(", ")}.`);
  if (positives.length === 0 && income > 0) positives.push("Income recorded — keep tracking to build financial clarity.");

  return {
    period: format(targetDate, "MMMM yyyy"),
    summary: { income, expenses, savings, savingsRate: Number(savingsRate) },
    vs_last_month: {
      income_change: prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : null,
      expense_change: prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : null,
    },
    topCategory: topCategory || null,
    categoryBreakdown: categoryChanges,
    budgetCompliance,
    positiveHabits: positives,
    areasToImprove: exceededBudgets.map((b) => `${b.category}: spent ₹${b.spent.toFixed(0)} vs ₹${b.limit} limit`),
    recommendations: recs.slice(0, 3),
    hasData: income > 0 || expenses > 0,
  };
};

// ─── 5. Salary Split Planner ──────────────────────────────────────────────────

const getSalarySplit = async (userId, { salary, period, city, age, goals: userGoals }) => {
  const monthlySalary = period === "annual" ? salary / 12 : salary;
  const now = new Date();
  const threeMonthsAgo = startOfMonth(subMonths(now, 3));
  const transactions = await getTransactionsInRange(userId, threeMonthsAgo, now);

  const hasData = transactions.length >= 10;
  const catSpend = groupByCategory(transactions, "expense");

  // Default allocation percentages (base)
  let base = {
    "Housing / Rent":     { pct: 0.25, color: "#795548", icon: "🏠" },
    "Food & Dining":      { pct: 0.12, color: "#ff9800", icon: "🍔" },
    Transportation:       { pct: 0.08, color: "#03a9f4", icon: "🚌" },
    Utilities:            { pct: 0.06, color: "#607d8b", icon: "💡" },
    Healthcare:           { pct: 0.04, color: "#f44336", icon: "🏥" },
    Entertainment:        { pct: 0.05, color: "#9c27b0", icon: "🎬" },
    Shopping:             { pct: 0.06, color: "#e91e63", icon: "🛍️" },
    "Emergency Fund":     { pct: 0.05, color: "#ff5722", icon: "🛡️" },
    Investments:          { pct: 0.10, color: "#00bcd4", icon: "📈" },
    Savings:              { pct: 0.10, color: "#4caf50", icon: "💵" },
    Miscellaneous:        { pct: 0.05, color: "#9e9e9e", icon: "📦" },
  };

  // Adjust based on age
  if (age < 25) {
    base["Investments"].pct = 0.05;
    base["Savings"].pct = 0.15;
    base["Entertainment"].pct = 0.07;
  } else if (age > 45) {
    base["Investments"].pct = 0.15;
    base["Emergency Fund"].pct = 0.08;
    base["Entertainment"].pct = 0.03;
  }

  // Adjust based on city tier
  const highCostCities = ["mumbai", "delhi", "bangalore", "bengaluru", "hyderabad", "pune", "chennai", "kolkata", "gurugram", "noida"];
  const isHighCost = highCostCities.some((c) => city.toLowerCase().includes(c));
  if (isHighCost) {
    base["Housing / Rent"].pct = 0.32;
    base["Food & Dining"].pct = 0.14;
    base.Miscellaneous.pct = 0.03;
    base["Investments"].pct = 0.08;
  }

  // Adjust based on actual spending history
  if (hasData) {
    const totalHistoricalMonthly =
      Object.values(catSpend).reduce((s, c) => s + c.total, 0) / 3;

    if (totalHistoricalMonthly > 0) {
      const spendMap = {
        "Housing / Rent": catSpend["Rent"]?.total || catSpend["Housing"]?.total || 0,
        "Food & Dining":
          (catSpend["Food & Dining"]?.total || 0) +
          (catSpend["Groceries"]?.total || 0),
        Transportation:
          (catSpend["Transportation"]?.total || 0) +
          (catSpend["Travel"]?.total || 0) +
          (catSpend["Fuel"]?.total || 0),
        Utilities: catSpend["Utilities"]?.total || catSpend["Bills"]?.total || 0,
        Entertainment: catSpend["Entertainment"]?.total || catSpend["Subscriptions"]?.total || 0,
        Shopping: catSpend["Shopping"]?.total || 0,
      };

      Object.entries(spendMap).forEach(([key, historicalTotal]) => {
        if (historicalTotal > 0 && base[key]) {
          const historicalMonthly = historicalTotal / 3;
          const historicalPct = historicalMonthly / monthlySalary;
          // Blend: 60% historical, 40% formula
          base[key].pct = base[key].pct * 0.4 + historicalPct * 0.6;
        }
      });
    }
  }

  // Normalize to exactly 100%
  const total = Object.values(base).reduce((s, v) => s + v.pct, 0);
  Object.keys(base).forEach((k) => {
    base[k].pct = base[k].pct / total;
  });

  const allocations = Object.entries(base).map(([name, data]) => ({
    category: name,
    pct: Math.round(data.pct * 100),
    amount: Math.round(monthlySalary * data.pct),
    color: data.color,
    icon: data.icon,
  }));

  const goalNote =
    userGoals && userGoals.length > 0
      ? `To achieve your goal(s) (${userGoals.join(", ")}), prioritize Savings and Investments allocations.`
      : null;

  return {
    monthlySalary,
    allocations,
    basedOnHistory: hasData,
    city,
    age,
    goalNote,
    note: hasData
      ? "Allocation blended from your 3-month spending history and recommended ratios."
      : "Allocation based on standard ratios adjusted for your city and age. Add more transactions for personalized recommendations.",
  };
};

// ─── 6. Affordability Checker ─────────────────────────────────────────────────

const checkAffordability = async (userId, { amount, description }) => {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  const lastStart = startOfMonth(subMonths(now, 1));
  const lastEnd = endOfMonth(subMonths(now, 1));

  const [thisTx, lastTx, budgets, goals] = await Promise.all([
    getTransactionsInRange(userId, start, end),
    getTransactionsInRange(userId, lastStart, lastEnd),
    prisma.budget.findMany({ where: { userId, month: now.getMonth() + 1, year: now.getFullYear() } }),
    prisma.goal.findMany({ where: { userId } }),
  ]);

  const income = sumBy(thisTx, "income");
  const expenses = sumBy(thisTx, "expense");
  const lastIncome = sumBy(lastTx, "income");
  const lastExpenses = sumBy(lastTx, "expense");

  const estimatedMonthlyIncome = income || lastIncome || 0;
  const currentBalance = estimatedMonthlyIncome - expenses;
  const savingsRate = estimatedMonthlyIncome > 0 ? ((currentBalance) / estimatedMonthlyIncome) * 100 : 0;

  // Budget headroom
  const catSpend = groupByCategory(thisTx, "expense");
  const budgetHeadroom = budgets.reduce((s, b) => {
    const spent = catSpend[b.category]?.total || 0;
    return s + Math.max(0, Number(b.amount) - spent);
  }, 0);

  // Goal monthly requirement
  const totalGoalRequired = goals.reduce((s, g) => {
    const remaining = Number(g.targetAmount) - Number(g.currentAmount);
    if (remaining <= 0) return s;
    if (g.deadline) {
      const daysLeft = differenceInDays(new Date(g.deadline), now);
      const monthsLeft = Math.max(1, daysLeft / 30);
      return s + remaining / monthsLeft;
    }
    return s + remaining / 12;
  }, 0);

  const safeToSpend = Math.max(
    0,
    currentBalance - totalGoalRequired
  );

  const canAfford = amount <= safeToSpend;
  const percentOfBalance = currentBalance > 0 ? ((amount / currentBalance) * 100).toFixed(1) : 999;
  const percentOfIncome = estimatedMonthlyIncome > 0 ? ((amount / estimatedMonthlyIncome) * 100).toFixed(1) : 999;

  let verdict = "";
  let recommendation = "";
  let riskLevel = "";

  if (!estimatedMonthlyIncome) {
    verdict = "Insufficient Data";
    recommendation = "Add income transactions this month to get an accurate assessment.";
    riskLevel = "unknown";
  } else if (canAfford && amount <= safeToSpend * 0.5) {
    verdict = "Yes, you can afford this";
    recommendation = `This purchase (₹${amount}) represents ${percentOfBalance}% of your current remaining balance and ${percentOfIncome}% of your monthly income — well within safe limits.`;
    riskLevel = "low";
  } else if (canAfford) {
    verdict = "Affordable, but proceed with caution";
    recommendation = `This purchase uses ${percentOfBalance}% of your remaining balance. Ensure your goal contributions (≈₹${totalGoalRequired.toFixed(0)}/month) remain unaffected.`;
    riskLevel = "moderate";
  } else {
    verdict = "Not recommended right now";
    recommendation = `After accounting for goal savings (≈₹${totalGoalRequired.toFixed(0)}/month), you have ₹${safeToSpend.toFixed(0)} safe to spend. Consider waiting until next month or reducing a discretionary expense first.`;
    riskLevel = "high";
  }

  return {
    purchase: { amount, description },
    finances: {
      estimatedMonthlyIncome,
      currentMonthExpenses: expenses,
      remainingBalance: currentBalance,
      goalMonthlySavingsRequired: totalGoalRequired,
      safeToSpend,
      budgetHeadroom,
    },
    verdict,
    recommendation,
    riskLevel,
    factors: [
      { label: "Monthly Income", value: `₹${estimatedMonthlyIncome.toFixed(0)}` },
      { label: "Spent This Month", value: `₹${expenses.toFixed(0)}` },
      { label: "Remaining Balance", value: `₹${currentBalance.toFixed(0)}` },
      { label: "Goal Savings Needed", value: `₹${totalGoalRequired.toFixed(0)}/mo` },
      { label: "Safe to Spend", value: `₹${safeToSpend.toFixed(0)}` },
      { label: "Purchase Amount", value: `₹${amount}` },
    ],
  };
};

// ─── 7. Goal Planning ─────────────────────────────────────────────────────────

const getGoalPlanning = async (userId) => {
  const now = new Date();
  const goals = await prisma.goal.findMany({ where: { userId } });
  if (goals.length === 0) return { goals: [], message: "No savings goals found. Create a goal to get planning advice." };

  const threeMonthsAgo = startOfMonth(subMonths(now, 3));
  const transactions = await getTransactionsInRange(userId, threeMonthsAgo, now);
  const monthlyIncome = sumBy(transactions, "income") / 3;
  const monthlyExpenses = sumBy(transactions, "expense") / 3;
  const monthlySurplus = monthlyIncome - monthlyExpenses;
  const catSpend = groupByCategory(transactions, "expense");

  const planned = goals.map((g) => {
    const remaining = Number(g.targetAmount) - Number(g.currentAmount);
    const progressPct =
      g.targetAmount > 0
        ? clamp((Number(g.currentAmount) / Number(g.targetAmount)) * 100, 0, 100)
        : 0;

    let monthsRequired = null;
    let completionDate = null;
    let monthlyRequired = null;

    if (g.deadline) {
      const daysLeft = differenceInDays(new Date(g.deadline), now);
      const monthsLeft = Math.max(1, Math.round(daysLeft / 30));
      monthlyRequired = remaining > 0 ? Math.ceil(remaining / monthsLeft) : 0;
      completionDate = format(new Date(g.deadline), "MMM yyyy");
    } else if (monthlySurplus > 0) {
      monthlyRequired = Math.ceil(remaining / 12); // suggest 1-year target
      monthsRequired = remaining > 0 ? Math.ceil(remaining / Math.max(1, monthlySurplus * 0.5)) : 0;
      if (monthsRequired > 0) {
        completionDate = format(addMonths(now, monthsRequired), "MMM yyyy");
      }
    }

    // Find categories where spending could be reduced to fund the goal
    const reductions = Object.entries(catSpend)
      .filter(([cat]) => !["Salary", "Bonus", "Freelance"].includes(cat))
      .map(([cat, data]) => ({
        category: cat,
        monthlyAvg: Math.round(data.total / 3),
        potentialSaving: Math.round((data.total / 3) * 0.15), // suggest 15% cut
        icon: data.icon,
        color: data.color,
      }))
      .sort((a, b) => b.potentialSaving - a.potentialSaving)
      .slice(0, 3);

    const feasible = monthlyRequired
      ? monthlySurplus >= monthlyRequired
      : null;

    return {
      id: g.id,
      name: g.name,
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount),
      remaining,
      progressPct,
      deadline: g.deadline ? format(new Date(g.deadline), "dd MMM yyyy") : null,
      monthlyRequired,
      estimatedCompletion: completionDate,
      feasible,
      reductions,
      advice:
        feasible === false
          ? `To hit this goal, you need ₹${monthlyRequired}/month but current surplus is only ₹${monthlySurplus.toFixed(0)}. Consider the spending reductions below.`
          : feasible
          ? `On track! Save ₹${monthlyRequired}/month to reach your goal.`
          : "Add income data to get a personalized savings plan.",
    };
  });

  return {
    goals: planned,
    monthlySurplus,
    monthlyIncome,
    monthlyExpenses,
    message: `Based on your last 3 months of financial data.`,
  };
};

// ─── 8. Dashboard AI Cards ────────────────────────────────────────────────────

const getDashboardCards = async (userId) => {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  const lastStart = startOfMonth(subMonths(now, 1));
  const lastEnd = endOfMonth(subMonths(now, 1));

  const [thisTx, lastTx, budgets, goals] = await Promise.all([
    getTransactionsInRange(userId, start, end),
    getTransactionsInRange(userId, lastStart, lastEnd),
    prisma.budget.findMany({ where: { userId, month: now.getMonth() + 1, year: now.getFullYear() } }),
    prisma.goal.findMany({ where: { userId } })
  ]);

  const income = sumBy(thisTx, "income");
  const expenses = sumBy(thisTx, "expense");
  const lastExp = sumBy(lastTx, "expense");
  const catSpend = groupByCategory(thisTx, "expense");
  const lastCatSpend = groupByCategory(lastTx, "expense");

  const cards = [];

  // Card 1: Monthly snapshot
  cards.push({
    type: "snapshot",
    icon: "📊",
    title: "This Month's Summary",
    value: `₹${(income - expenses).toFixed(0)}`,
    subtitle: `net (₹${income.toFixed(0)} in, ₹${expenses.toFixed(0)} out)`,
    color: income >= expenses ? "#4caf50" : "#f44336",
  });

  // Card 3: Best savings opportunity
  const sortedBySpend = Object.entries(catSpend)
    .sort((a, b) => b[1].total - a[1].total);
  if (sortedBySpend.length > 0) {
    const [topCat, topData] = sortedBySpend[0];
    const prevAmount = lastCatSpend[topCat]?.total || topData.total;
    const saving = Math.round(topData.total * 0.1);
    cards.push({
      type: "opportunity",
      icon: topData.icon || "💡",
      title: "Biggest Save Opportunity",
      value: `Save ₹${saving}`,
      subtitle: `Reduce ${topCat} by 10% (currently ₹${topData.total.toFixed(0)})`,
      color: "#ff9800",
    });
  }

  // Card 4: Budget alert
  const exceeded = budgets.filter(
    (b) => (catSpend[b.category]?.total || 0) > Number(b.amount)
  );
  const nearLimit = budgets.filter((b) => {
    const pct = (catSpend[b.category]?.total || 0) / Number(b.amount);
    return pct >= 0.8 && pct < 1;
  });
  if (exceeded.length > 0) {
    cards.push({
      type: "alert",
      icon: "🚨",
      title: "Budget Alert",
      value: `${exceeded.length} exceeded`,
      subtitle: exceeded.map((b) => b.category).join(", "),
      color: "#f44336",
    });
  } else if (nearLimit.length > 0) {
    cards.push({
      type: "warning",
      icon: "⚠️",
      title: "Budget Warning",
      value: `${nearLimit.length} near limit`,
      subtitle: nearLimit.map((b) => b.category).join(", "),
      color: "#ff9800",
    });
  } else {
    cards.push({
      type: "success",
      icon: "✅",
      title: "Budget Status",
      value: budgets.length > 0 ? "All on track" : "No budgets set",
      subtitle: budgets.length > 0 ? `${budgets.length} budgets within limits` : "Set budgets to track spending",
      color: "#4caf50",
    });
  }

  // Card 5: Goal progress
  if (goals.length > 0) {
    const activeGoals = goals.filter(
      (g) => Number(g.currentAmount) < Number(g.targetAmount)
    );
    const topGoal = activeGoals[0];
    if (topGoal) {
      const pct = Math.round(
        (Number(topGoal.currentAmount) / Number(topGoal.targetAmount)) * 100
      );
      cards.push({
        type: "goal",
        icon: "🎯",
        title: `Goal: ${topGoal.name}`,
        value: `${pct}%`,
        subtitle: `₹${Number(topGoal.currentAmount).toFixed(0)} of ₹${Number(topGoal.targetAmount).toFixed(0)}`,
        color: "#009688",
        progress: pct,
      });
    }
  }

  return { cards, generatedAt: now };
};

module.exports = {
  getActionCenter,
  getSpendingInsights,
  getBudgetRecommendations,
  getMonthlyReport,
  getSalarySplit,
  checkAffordability,
  getGoalPlanning,
  getDashboardCards,
};
