const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const colors = require("colors");
const { errorHandler } = require("./utils/errorHandler");

// Load environment variables first
dotenv.config();

const app = express();
const { startRecurringTransactionsCron } = require("./utils/cron");

// Initialize Cron Jobs
startRecurringTransactionsCron();

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// ─── Static Files (Uploads) ───────────────────────────────────────────────────
app.use("/uploads", express.static(require("path").join(__dirname, "public/uploads")));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/v1/auth", require("./routes/userRoute"));
app.use("/api/v1/categories", require("./routes/categoryRoute"));
app.use("/api/v1/goals", require("./routes/goalRoute"));
app.use("/api/v1/analytics", require("./routes/analyticsRoute"));
app.use("/api/v1/transactions", require("./routes/transactionRoute"));
app.use("/api/v1/budgets", require("./routes/budgetRoute"));
app.use("/api/v1/ai", require("./routes/aiAdvisorRoute"));
app.use("/api/v1/ai-challenges", require("./routes/aiChallengeRoute"));
app.use("/api/v1/receipts", require("./routes/receiptRoute"));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is healthy.", timestamp: new Date() });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ─── Centralized Error Handler ────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(
    `\n${"✓".green} Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`.cyan.bold
  );
  console.log(`${"✓".green} API base: http://localhost:${PORT}/api/v1`.cyan);
});
