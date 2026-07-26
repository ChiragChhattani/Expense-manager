const prisma = require("../config/prisma");
const { startOfMonth, endOfMonth, subMonths, format } = require("date-fns");

const getIncomeExpenseData = async (userId, months = 6) => {
  const endDate = new Date();
  const startDate = subMonths(startOfMonth(endDate), months - 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
    select: { amount: true, type: true, date: true },
  });

  const rawData = {};
  for (let i = 0; i < months; i++) {
    const d = subMonths(endDate, i);
    const key = format(d, "MMM yyyy");
    rawData[key] = { name: key, income: 0, expense: 0, monthSort: d.getTime() };
  }

  transactions.forEach((t) => {
    const key = format(t.date, "MMM yyyy");
    if (rawData[key]) {
      rawData[key][t.type] += t.amount;
    }
  });

  const sortedData = Object.values(rawData).sort((a, b) => a.monthSort - b.monthSort);
  sortedData.forEach((item) => delete item.monthSort);
  return sortedData;
};

const getCategorySpending = async (userId, month, year) => {
  const targetDate = new Date(year, month - 1);
  const start = startOfMonth(targetDate);
  const end = endOfMonth(targetDate);

  const transactions = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      type: "expense",
      date: { gte: start, lte: end },
    },
    _sum: { amount: true },
  });

  // Get category details
  const categoryIds = transactions.map(t => t.categoryId).filter(id => id !== null);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, color: true, icon: true }
  });

  return transactions.map((t) => {
    const cat = categories.find((c) => c.id === t.categoryId);
    return {
      name: cat ? `${cat.icon || ''} ${cat.name}`.trim() : "Uncategorized",
      value: t._sum.amount,
      color: cat ? cat.color : "#999999",
      icon: cat ? cat.icon : null,
    };
  });
};

const getCashFlow = async (userId, year) => {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: start, lte: end },
    },
    select: { amount: true, type: true, date: true },
  });

  const data = Array.from({ length: 12 }, (_, i) => ({
    name: format(new Date(year, i, 1), "MMM"),
    income: 0,
    expense: 0,
  }));

  transactions.forEach((t) => {
    const monthIndex = t.date.getMonth();
    data[monthIndex][t.type] += t.amount;
  });

  return data;
};

module.exports = { getIncomeExpenseData, getCategorySpending, getCashFlow };
