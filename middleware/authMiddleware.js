const prisma = require("../config/prisma");
const { verifyToken } = require("../utils/jwt");
const { ApiError, asyncHandler } = require("../utils/errorHandler");

/**
 * Protect routes — validates Bearer token and attaches req.user
 */
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Not authorized. No token provided.");
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token); // throws if invalid/expired

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  if (!user) {
    throw new ApiError(401, "Not authorized. User no longer exists.");
  }

  req.user = user;
  next();
});

module.exports = { protect };
