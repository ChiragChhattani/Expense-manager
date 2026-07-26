const { validationResult, body, param } = require("express-validator");
const { ApiError } = require("../utils/errorHandler");

/**
 * Run after express-validator rules — collects errors and throws ApiError
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    throw new ApiError(422, messages[0], errors.array());
  }
  next();
};

// ─── Auth Validators ─────────────────────────────────────────────────────────

const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required."),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required."),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters."),
];

const loginRules = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required."),
  body("password").notEmpty().withMessage("Password is required."),
];

// ─── Transaction Validators ───────────────────────────────────────────────────

const transactionRules = [
  body("type")
    .isIn(["income", "expense"])
    .withMessage("Type must be 'income' or 'expense'."),
  body("amount")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number."),
  body("category").trim().notEmpty().withMessage("Category is required."),
  body("description").optional().trim(),
  body("date").optional().isISO8601().withMessage("Date must be a valid ISO date."),
];

// ─── Budget Validators ────────────────────────────────────────────────────────

const budgetRules = [
  body("category").trim().notEmpty().withMessage("Category is required."),
  body("amount")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number."),
  body("month")
    .isInt({ min: 1, max: 12 })
    .withMessage("Month must be between 1 and 12."),
  body("year")
    .isInt({ min: 2000, max: 2100 })
    .withMessage("Year must be a valid four-digit year."),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  transactionRules,
  budgetRules,
};
