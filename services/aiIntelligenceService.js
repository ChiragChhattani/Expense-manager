const prisma = require("../config/prisma");
const aiAdvisor = require("./aiAdvisorService");
const { startOfMonth, endOfMonth, subMonths, format, startOfWeek, subWeeks, endOfWeek, differenceInDays, getDay, getHours } = require("date-fns");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sumBy = (arr, type) => arr.filter((t) => t.type === type).reduce((s, t) => s + Number(t.amount), 0);

const getTransactionsInRange = async (userId, start, end) =>
  prisma.transaction.findMany({
    where: { userId, date: { gte: start, lte: end } },
    include: { category: { select: { name: true, color: true, icon: true } } },
    orderBy: { date: "asc" },
  });

// ─── 1. AI Financial Coach (Dashboard Panel) ──────────────────────────────────
const getCoachSummary = async (userId) => {
  const actions = await aiAdvisor.getActionCenter(userId);
  
  let summary = "Here is your personalized financial summary: ";
  if (actions.length > 0) {
    // Strip emojis for the text summary and join
    summary += actions.map(a => a.replace(/^[^\w]+/, '')).join(" ");
  } else {
    summary += "Everything looks great! Keep up the good work.";
  }
  
  return { summary };
};

// ─── 2. Natural Language Financial Search ─────────────────────────────────────
const searchFinancials = async (userId, query) => {
  const q = query.toLowerCase();
  
  // 1. Determine Date Range
  const now = new Date();
  let startDate = new Date(2000, 0, 1);
  let endDate = new Date(2100, 0, 1);
  let dateDesc = "All time";

  if (q.includes("last month")) {
    startDate = startOfMonth(subMonths(now, 1));
    endDate = endOfMonth(subMonths(now, 1));
    dateDesc = "Last month";
  } else if (q.includes("this month")) {
    startDate = startOfMonth(now);
    endDate = endOfMonth(now);
    dateDesc = "This month";
  } else if (q.includes("this year")) {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    dateDesc = "This year";
  } else if (q.includes("last year")) {
    startDate = new Date(now.getFullYear() - 1, 0, 1);
    endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
    dateDesc = "Last year";
  }

  // 2. Extract Amount Filters
  let minAmount = 0;
  let maxAmount = Number.MAX_SAFE_INTEGER;
  
  const aboveMatch = q.match(/(above|greater than|over|>)\s*₹?(\d+)/);
  if (aboveMatch) minAmount = parseInt(aboveMatch[2], 10);
  
  const belowMatch = q.match(/(below|less than|under|<)\s*₹?(\d+)/);
  if (belowMatch) maxAmount = parseInt(belowMatch[2], 10);

  // 3. Extract Type (Income/Expense)
  let type = undefined;
  if (q.includes("spent") || q.includes("expense") || q.includes("purchase")) type = "expense";
  if (q.includes("earned") || q.includes("income") || q.includes("salary")) type = "income";

  // Get user's categories to match
  const categories = await prisma.category.findMany({ where: { userId } });
  const categoryNames = categories.map(c => c.name.toLowerCase());
  
  let targetCategoryId = undefined;
  let targetCategoryName = undefined;
  for (const cat of categories) {
    if (q.includes(cat.name.toLowerCase())) {
      targetCategoryId = cat.id;
      targetCategoryName = cat.name;
      break;
    }
  }

  // Try to extract merchant if it's not a category
  let merchantQuery = null;
  const commonStopWords = ["how", "much", "did", "i", "spend", "on", "in", "show", "me", "purchases", "above", "below", "last", "this", "month", "year", "week", "all", "the", "a", "an", "at", "my"];
  
  if (!targetCategoryId) {
    // Basic heuristic: look for words after "on" or "at" that aren't stop words or dates
    const words = q.replace(/[^\w\s]/gi, '').split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      if ((words[i] === "on" || words[i] === "at") && i + 1 < words.length) {
        const candidate = words[i+1];
        if (!commonStopWords.includes(candidate) && isNaN(candidate)) {
          merchantQuery = candidate;
          break;
        }
      }
    }
    // If user said "show all amazon purchases"
    if (!merchantQuery && q.includes(" purchases")) {
      const parts = q.split(" purchases")[0].split(" ");
      const candidate = parts[parts.length - 1];
      if (!commonStopWords.includes(candidate)) merchantQuery = candidate;
    }
  }

  // 4. Query DB
  const whereClause = {
    userId,
    date: { gte: startDate, lte: endDate },
    amount: { gte: minAmount, lte: maxAmount },
  };
  
  if (type) whereClause.type = type;
  if (targetCategoryId) whereClause.categoryId = targetCategoryId;
  if (merchantQuery) {
    whereClause.description = { contains: merchantQuery, mode: "insensitive" };
  }

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    include: { category: true },
    orderBy: { date: "desc" }
  });

  // 5. Generate Natural Language Summary
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  let summary = `Found ${transactions.length} transactions`;
  
  if (dateDesc !== "All time") summary += ` in ${dateDesc.toLowerCase()}`;
  if (targetCategoryName) summary += ` for category '${targetCategoryName}'`;
  if (merchantQuery) summary += ` matching '${merchantQuery}'`;
  if (minAmount > 0) summary += ` over ₹${minAmount}`;
  
  summary += `. Total amount: ₹${totalAmount.toLocaleString()}.`;

  return {
    query: q,
    interpreted: { dateDesc, targetCategoryName, merchantQuery, minAmount, maxAmount, type },
    summary,
    transactions,
    totalAmount
  };
};

// ─── 3. Weekly AI Coach ───────────────────────────────────────────────────────
const getWeeklySummary = async (userId) => {
  const now = new Date();
  const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 });
  const startOfLastWeek = subWeeks(startOfThisWeek, 1);
  const endOfLastWeek = endOfWeek(startOfLastWeek, { weekStartsOn: 1 });

  const thisWeekTx = await getTransactionsInRange(userId, startOfThisWeek, now);
  const lastWeekTx = await getTransactionsInRange(userId, startOfLastWeek, endOfLastWeek);

  const thisExp = sumBy(thisWeekTx, "expense");
  const lastExp = sumBy(lastWeekTx, "expense");

  const diff = thisExp - lastExp;
  const pct = lastExp > 0 ? (diff / lastExp) * 100 : 0;

  let summaryLines = [];
  
  if (thisExp > 0) {
    summaryLines.push(`You've spent ₹${thisExp.toLocaleString()} so far this week.`);
    if (lastExp > 0) {
      if (diff > 0) {
        summaryLines.push(`Spending increased by ${Math.abs(pct).toFixed(1)}% compared to last week.`);
      } else {
        summaryLines.push(`Great job! Spending is down ${Math.abs(pct).toFixed(1)}% compared to last week.`);
      }
    }
  } else {
    summaryLines.push(`No expenses recorded yet this week.`);
  }

  // Find biggest category change
  const thisCats = {};
  thisWeekTx.filter(t => t.type === "expense").forEach(t => {
    const n = t.category?.name || "Uncategorized";
    thisCats[n] = (thisCats[n] || 0) + t.amount;
  });
  
  const lastCats = {};
  lastWeekTx.filter(t => t.type === "expense").forEach(t => {
    const n = t.category?.name || "Uncategorized";
    lastCats[n] = (lastCats[n] || 0) + t.amount;
  });

  let maxIncreaseCat = null, maxIncAmt = 0;
  let maxDecreaseCat = null, maxDecAmt = 0;

  for (const cat in thisCats) {
    const lastAmt = lastCats[cat] || 0;
    const diff = thisCats[cat] - lastAmt;
    if (diff > maxIncAmt) { maxIncAmt = diff; maxIncreaseCat = cat; }
  }
  for (const cat in lastCats) {
    const thisAmt = thisCats[cat] || 0;
    const diff = lastCats[cat] - thisAmt;
    if (diff > maxDecAmt) { maxDecAmt = diff; maxDecreaseCat = cat; }
  }

  if (maxDecreaseCat && maxDecAmt > 0) {
    summaryLines.push(`Your ${maxDecreaseCat} spending reduced by ₹${maxDecAmt.toLocaleString()}.`);
  }
  if (maxIncreaseCat && maxIncAmt > 0) {
    summaryLines.push(`Note: ${maxIncreaseCat} spending increased by ₹${maxIncAmt.toLocaleString()}.`);
  }

  return {
    thisWeekExpense: thisExp,
    lastWeekExpense: lastExp,
    percentChange: pct,
    summary: summaryLines
  };
};

// ─── 4. Spending Pattern Detection ────────────────────────────────────────────
const detectPatterns = async (userId) => {
  const now = new Date();
  const start = subMonths(now, 3); // Analyze last 3 months
  const txs = await prisma.transaction.findMany({
    where: { userId, type: "expense", date: { gte: start, lte: now } },
    include: { category: true }
  });

  if (txs.length < 10) {
    return { patterns: ["Not enough data to detect patterns yet. Add more transactions."] };
  }

  const patterns = [];
  
  // 1. Weekend vs Weekday
  let weekendSpent = 0, weekdaySpent = 0;
  let weekendCount = 0, weekdayCount = 0;
  
  // 2. Day of Week averages
  const dowTotals = [0,0,0,0,0,0,0]; // 0=Sun
  
  txs.forEach(t => {
    const d = new Date(t.date);
    const day = getDay(d);
    dowTotals[day] += t.amount;
    
    if (day === 0 || day === 6) {
      weekendSpent += t.amount;
      weekendCount++;
    } else {
      weekdaySpent += t.amount;
      weekdayCount++;
    }
  });

  const avgWeekend = weekendCount > 0 ? weekendSpent / weekendCount : 0;
  const avgWeekday = weekdayCount > 0 ? weekdaySpent / weekdayCount : 0;

  if (avgWeekend > avgWeekday * 1.5) {
    patterns.push({
      title: "Weekend Spender",
      description: `Your average transaction on weekends (₹${avgWeekend.toFixed(0)}) is significantly higher than weekdays (₹${avgWeekday.toFixed(0)}).`,
      type: "warning"
    });
  }

  // Find highest spending day
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  let maxDow = 0;
  for(let i=1; i<7; i++) {
    if(dowTotals[i] > dowTotals[maxDow]) maxDow = i;
  }
  if (dowTotals[maxDow] > 0) {
    patterns.push({
      title: "Highest Spending Day",
      description: `You spend the most overall on ${days[maxDow]}s.`,
      type: "info"
    });
  }

  // 3. Category Spikes (e.g., Dining on weekends)
  let weekendFood = 0;
  txs.forEach(t => {
    const cat = t.category?.name?.toLowerCase() || "";
    if (cat.includes("food") || cat.includes("dining") || cat.includes("restaurant")) {
      const d = getDay(new Date(t.date));
      if (d === 0 || d === 6) weekendFood += t.amount;
    }
  });
  if (weekendFood > 0) {
    patterns.push({
      title: "Weekend Dining",
      description: `A large portion of your food expenses (₹${weekendFood.toLocaleString()}) occur on weekends.`,
      type: "insight"
    });
  }

  return { patterns };
};

// ─── 5. Merchant Intelligence ─────────────────────────────────────────────────
const getMerchantIntelligence = async (userId) => {
  const start = subMonths(new Date(), 6);
  const txs = await prisma.transaction.findMany({
    where: { userId, type: "expense", date: { gte: start } },
    select: { description: true, amount: true, date: true }
  });

  const normalize = (name) => {
    if (!name) return "Unknown";
    let n = name.toUpperCase();
    n = n.replace(/\b(LTD|PVT|PRIVATE|LIMITED|PAY|UPI|WALLET|MARKETPLACE|LLC|INC)\b/g, "");
    n = n.replace(/[^A-Z0-9\s]/g, ""); // remove special chars
    return n.trim().split(/\s+/)[0]; // take first word as primary heuristic
  };

  const merchants = {};
  
  txs.forEach(t => {
    if (!t.description) return;
    const n = normalize(t.description);
    if (n.length < 2) return; // skip too short
    
    if (!merchants[n]) {
      merchants[n] = { name: n, totalAmount: 0, count: 0, latestDate: t.date, originalNames: new Set() };
    }
    merchants[n].totalAmount += t.amount;
    merchants[n].count++;
    merchants[n].originalNames.add(t.description);
    if (new Date(t.date) > new Date(merchants[n].latestDate)) {
      merchants[n].latestDate = t.date;
    }
  });

  const sorted = Object.values(merchants)
    .filter(m => m.count > 1) // only show merchants with > 1 purchase
    .map(m => ({
      name: Array.from(m.originalNames)[0], // use the first seen un-normalized name for display
      normalizedName: m.name,
      totalAmount: m.totalAmount,
      count: m.count,
      average: m.totalAmount / m.count,
      latestDate: m.latestDate
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10); // top 10

  return { topMerchants: sorted };
};

// ─── 6. Subscription Detector ─────────────────────────────────────────────────
const detectSubscriptions = async (userId) => {
  const start = subMonths(new Date(), 6);
  const txs = await prisma.transaction.findMany({
    where: { userId, type: "expense", date: { gte: start } },
    select: { id: true, amount: true, description: true, date: true, isRecurring: true }
  });

  // Explicitly marked recurring
  const markedRecurring = txs.filter(t => t.isRecurring);

  // Auto-detect: same amount, similar description, >2 occurrences
  const groups = {};
  txs.forEach(t => {
    if (!t.description || t.isRecurring) return;
    const key = `${t.description.trim().toLowerCase()}_${t.amount}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  const autoDetected = [];
  for (const key in groups) {
    const group = groups[key];
    if (group.length >= 2) {
      // Check if dates are ~30 days apart (allow 25-35 days)
      group.sort((a,b) => new Date(a.date) - new Date(b.date));
      let isMonthly = true;
      for (let i = 1; i < group.length; i++) {
        const days = differenceInDays(new Date(group[i].date), new Date(group[i-1].date));
        if (days < 25 || days > 35) {
          isMonthly = false;
          break;
        }
      }
      if (isMonthly) {
        autoDetected.push({
          description: group[0].description,
          amount: group[0].amount,
          frequency: "monthly",
          lastPaid: group[group.length - 1].date,
          confidence: "High",
          occurrences: group.length
        });
      }
    }
  }

  const explicit = markedRecurring.map(t => ({
    description: t.description || "Unknown",
    amount: t.amount,
    frequency: "recurring",
    lastPaid: t.date,
    confidence: "Explicit",
    occurrences: 1
  }));

  const allSubs = [...explicit, ...autoDetected];
  const totalMonthly = allSubs.reduce((sum, s) => sum + s.amount, 0);

  return {
    subscriptions: allSubs,
    totalMonthly,
    totalAnnual: totalMonthly * 12
  };
};

// ─── 7. AI Explanations ───────────────────────────────────────────────────────
const explainMetric = async (userId, metricType) => {
  if (metricType === "budget_recs") {
    return {
      title: "How do we recommend budgets?",
      explanation: "We analyze your average spending across categories over the requested period. We ignore extreme one-off purchases (outliers) and apply a slight reduction buffer (5-10%) to encourage savings, ensuring the recommendation is realistic yet goal-oriented."
    };
  }

  return { title: "Unknown Metric", explanation: "Cannot explain this metric." };
};

// ─── 8. Smart Alerts ──────────────────────────────────────────────────────────
const getSmartAlerts = async (userId) => {
  const alerts = [];
  const now = new Date();
  
  // 1. Budget Alerts
  const budgets = await prisma.budget.findMany({
    where: { userId, month: now.getMonth() + 1, year: now.getFullYear() }
  });
  
  const thisMonthStart = startOfMonth(now);
  const txs = await prisma.transaction.findMany({
    where: { userId, type: "expense", date: { gte: thisMonthStart, lte: now } },
    include: { category: true }
  });

  const catSpent = {};
  txs.forEach(t => {
    const n = t.category?.name || "Uncategorized";
    catSpent[n] = (catSpent[n] || 0) + t.amount;
  });

  for (const b of budgets) {
    const spent = catSpent[b.category] || 0;
    const pct = (spent / b.amount) * 100;
    if (pct >= 100) {
      alerts.push({ type: "danger", title: "Budget Exceeded", message: `You have exceeded your ${b.category} budget by ₹${(spent - b.amount).toFixed(0)}.` });
    } else if (pct >= b.alertThreshold) {
      alerts.push({ type: "warning", title: "Budget Nearing Limit", message: `You have used ${pct.toFixed(0)}% of your ${b.category} budget.` });
    }
  }

  // 2. Large Transaction Alert
  const recentTxs = txs.filter(t => differenceInDays(now, new Date(t.date)) <= 7);
  for (const t of recentTxs) {
    // If a transaction is > ₹20000 (heuristic)
    if (t.amount > 20000) {
      alerts.push({ type: "info", title: "Large Expense Detected", message: `A large transaction of ₹${t.amount} was recorded on ${format(new Date(t.date), 'MMM do')} for ${t.category?.name || 'an item'}.` });
    }
  }

  return { alerts };
};

module.exports = {
  getCoachSummary,
  searchFinancials,
  getWeeklySummary,
  detectPatterns,
  getMerchantIntelligence,
  detectSubscriptions,
  explainMetric,
  getSmartAlerts,
};
