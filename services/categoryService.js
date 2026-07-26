const prisma = require("../config/prisma");
const { ApiError } = require("../utils/errorHandler");

const getCategories = async (userId) => {
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
};

const createCategory = async (userId, data) => {
  const existing = await prisma.category.findFirst({
    where: { userId, name: data.name, type: data.type },
  });
  if (existing) {
    throw new ApiError(400, "Category with this name and type already exists.");
  }

  return prisma.category.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      color: data.color || "#607d8b",
      icon: data.icon || "",
    },
  });
};

const updateCategory = async (userId, id, data) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new ApiError(404, "Category not found.");
  if (category.userId !== userId) throw new ApiError(403, "Not authorized.");

  return prisma.category.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.type && { type: data.type }),
      ...(data.color && { color: data.color }),
      ...(data.icon && { icon: data.icon }),
    },
  });
};

const deleteCategory = async (userId, id) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new ApiError(404, "Category not found.");
  if (category.userId !== userId) throw new ApiError(403, "Not authorized.");

  // Check if category is used in any transactions
  const inUse = await prisma.transaction.findFirst({ where: { categoryId: id } });
  if (inUse) {
    throw new ApiError(400, "Cannot delete category because it is currently assigned to one or more transactions.");
  }

  return prisma.category.delete({ where: { id } });
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
