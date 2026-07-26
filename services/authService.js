const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { generateToken } = require("../utils/jwt");
const { ApiError } = require("../utils/errorHandler");

// ─── Full default category list (30 total) ────────────────────────────────────
const DEFAULT_CATEGORIES = [
  // Expense (20)
  { name: "Bills",          type: "expense", color: "#f44336", icon: "📄" },
  { name: "Business",       type: "expense", color: "#795548", icon: "💼" },
  { name: "Education",      type: "expense", color: "#3f51b5", icon: "📚" },
  { name: "Entertainment",  type: "expense", color: "#9c27b0", icon: "🎬" },
  { name: "Fitness",        type: "expense", color: "#e91e63", icon: "🏋️" },
  { name: "Food & Dining",  type: "expense", color: "#ff9800", icon: "🍔" },
  { name: "Fuel",           type: "expense", color: "#ff5722", icon: "⛽" },
  { name: "Gifts",          type: "expense", color: "#ec407a", icon: "🎁" },
  { name: "Groceries",      type: "expense", color: "#8bc34a", icon: "🛒" },
  { name: "Healthcare",     type: "expense", color: "#f44336", icon: "🏥" },
  { name: "Insurance",      type: "expense", color: "#607d8b", icon: "🛡️" },
  { name: "Investments",    type: "expense", color: "#00bcd4", icon: "📊" },
  { name: "Miscellaneous",  type: "expense", color: "#9e9e9e", icon: "📦" },
  { name: "Personal Care",  type: "expense", color: "#ab47bc", icon: "💆" },
  { name: "Rent",           type: "expense", color: "#795548", icon: "🏠" },
  { name: "Shopping",       type: "expense", color: "#e91e63", icon: "🛍️" },
  { name: "Subscriptions",  type: "expense", color: "#5c6bc0", icon: "📺" },
  { name: "Transportation", type: "expense", color: "#03a9f4", icon: "🚌" },
  { name: "Travel",         type: "expense", color: "#26a69a", icon: "✈️" },
  { name: "Utilities",      type: "expense", color: "#607d8b", icon: "💡" },
  // Income (10)
  { name: "Bonus",          type: "income",  color: "#8bc34a", icon: "🎉" },
  { name: "Business Income",type: "income",  color: "#ff9800", icon: "💼" },
  { name: "Dividends",      type: "income",  color: "#cddc39", icon: "💹" },
  { name: "Freelance",      type: "income",  color: "#009688", icon: "💻" },
  { name: "Interest",       type: "income",  color: "#26c6da", icon: "🏦" },
  { name: "Investments",    type: "income",  color: "#cddc39", icon: "📈" },
  { name: "Other Income",   type: "income",  color: "#78909c", icon: "💰" },
  { name: "Refunds",        type: "income",  color: "#66bb6a", icon: "↩️" },
  { name: "Rental Income",  type: "income",  color: "#ffa726", icon: "🏘️" },
  { name: "Salary",         type: "income",  color: "#4caf50", icon: "💵" },
];

/**
 * Seeds DEFAULT_CATEGORIES for a user if they currently have zero categories.
 * Safe to call on every login — it's a no-op if categories already exist.
 */
const seedDefaultCategoriesIfEmpty = async (userId) => {
  const count = await prisma.category.count({ where: { userId } });
  if (count > 0) return; // already has categories — do nothing

  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((cat) => ({ ...cat, userId })),
  });
};

// ─── Register ─────────────────────────────────────────────────────────────────
const registerUser = async ({ name, email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "An account with this email already exists.");

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
    select: { id: true, name: true, email: true, avatar: true, currency: true, monthlyLimit: true, createdAt: true },
  });

  // Always seed the full default set for new users
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((cat) => ({ ...cat, userId: user.id })),
  });

  const token = generateToken(user.id);
  return { user, token };
};

// ─── Login ────────────────────────────────────────────────────────────────────
const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(401, "Invalid email or password.");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ApiError(401, "Invalid email or password.");

  // Backfill defaults for legacy users who have no categories yet
  await seedDefaultCategoriesIfEmpty(user.id);

  const safeUser = {
    id: user.id, name: user.name, email: user.email,
    avatar: user.avatar, currency: user.currency,
    monthlyLimit: user.monthlyLimit, createdAt: user.createdAt,
  };
  const token = generateToken(user.id);
  return { user: safeUser, token };
};

// ─── Get Profile ──────────────────────────────────────────────────────────────
const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, avatar: true, currency: true, monthlyLimit: true, createdAt: true },
  });
  if (!user) throw new ApiError(404, "User not found.");
  return user;
};

// ─── Update Profile ───────────────────────────────────────────────────────────
const updateProfile = async (userId, data) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.currency && { currency: data.currency }),
      ...(data.monthlyLimit !== undefined && {
        monthlyLimit: data.monthlyLimit ? parseFloat(data.monthlyLimit) : null,
      }),
      ...(data.avatar && { avatar: data.avatar }),
    },
    select: { id: true, name: true, email: true, avatar: true, currency: true, monthlyLimit: true, createdAt: true },
  });
  return user;
};

// ─── Change Password ──────────────────────────────────────────────────────────
const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found.");

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new ApiError(400, "Incorrect old password.");

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
};

module.exports = {
  registerUser, loginUser, getProfile, updateProfile, changePassword,
  seedDefaultCategoriesIfEmpty,
};
