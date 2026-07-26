const { PrismaClient } = require("@prisma/client");

// Prevent multiple PrismaClient instances in development (hot-reload)
const prisma = global.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

module.exports = prisma;
