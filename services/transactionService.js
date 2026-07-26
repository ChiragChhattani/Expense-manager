const prisma = require("../config/prisma");
const { ApiError } = require("../utils/errorHandler");

/**
 * Get all transactions for a user with optional filters, pagination, search, sorting
 */
const getTransactions = async (userId, { type, categoryId, startDate, endDate, search, page = 1, limit = 10, sortBy = "date", order = "desc" } = {}) => {
  const where = { userId };

  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  if (search) {
    where.description = { contains: search, mode: "insensitive" };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true }, // Include populated category
      orderBy: { [sortBy]: order },
      skip,
      take,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, total, page: parseInt(page), pages: Math.ceil(total / take) };
};

/**
 * Create a transaction for a user
 */
const createTransaction = async (userId, data) => {
  return prisma.transaction.create({
    data: {
      userId,
      type: data.type,
      amount: parseFloat(data.amount),
      categoryId: data.categoryId || null,
      description: data.description || null,
      date: data.date ? new Date(data.date) : new Date(),
      receiptUrl: data.receiptUrl || null,
      isRecurring: data.isRecurring === "true" || data.isRecurring === true,
      recurringInterval: data.recurringInterval || null,
      nextRecurringDate: (data.isRecurring === "true" || data.isRecurring === true) && data.date ? new Date(data.date) : null, // Set initial next date
    },
    include: { category: true },
  });
};

/**
 * Update a transaction — only owner can update
 */
const updateTransaction = async (userId, transactionId, data) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) throw new ApiError(404, "Transaction not found.");
  if (transaction.userId !== userId)
    throw new ApiError(403, "Not authorized to update this transaction.");

  return prisma.transaction.update({
    where: { id: transactionId },
    data: {
      ...(data.type && { type: data.type }),
      ...(data.amount !== undefined && { amount: parseFloat(data.amount) }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.date && { date: new Date(data.date) }),
      ...(data.receiptUrl !== undefined && { receiptUrl: data.receiptUrl }),
      ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring === "true" || data.isRecurring === true }),
      ...(data.recurringInterval !== undefined && { recurringInterval: data.recurringInterval }),
    },
    include: { category: true },
  });
};

/**
 * Delete a transaction — only owner can delete
 */
const deleteTransaction = async (userId, transactionId) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) throw new ApiError(404, "Transaction not found.");
  if (transaction.userId !== userId)
    throw new ApiError(403, "Not authorized to delete this transaction.");

  return prisma.transaction.delete({ where: { id: transactionId } });
};

/**
 * Get a summary (total income, expense, balance) for a user
 */
const getTransactionSummary = async (userId) => {
  const totals = await prisma.transaction.groupBy({
    by: ["type"],
    where: { userId },
    _sum: { amount: true },
  });

  const income = totals.find((t) => t.type === "income")?._sum.amount || 0;
  const expense = totals.find((t) => t.type === "expense")?._sum.amount || 0;

  return { income, expense, balance: income - expense };
};

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
};
