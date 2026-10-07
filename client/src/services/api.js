import axios from "axios";

/**
 * Centralized Axios instance pointing to the Express backend.
 * The proxy in client/package.json routes /api/v1/* to http://localhost:8080
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api/v1",
});

// ─── Request Interceptor — attach JWT from localStorage ───────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor — handle 401 globally ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/auth/profile", data, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  changePassword: (data) => api.put("/auth/password", data),
};

// ─── Transactions API ─────────────────────────────────────────────────────────
export const transactionsAPI = {
  getAll: (params) => api.get("/transactions", { params }),
  getSummary: () => api.get("/transactions/summary"),
  create: (data) => api.post("/transactions", data, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  update: (id, data) => api.put(`/transactions/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  delete: (id) => api.delete(`/transactions/${id}`),
};

// ─── Budgets API ──────────────────────────────────────────────────────────────
export const budgetsAPI = {
  getAll: (params) => api.get("/budgets", { params }),
  upsert: (data) => api.post("/budgets", data),
  delete: (id) => api.delete(`/budgets/${id}`),
};

// ─── Categories API ───────────────────────────────────────────────────────────
export const categoriesAPI = {
  getAll: () => api.get("/categories"),
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// ─── Goals API ────────────────────────────────────────────────────────────────
export const goalsAPI = {
  getAll: () => api.get("/goals"),
  create: (data) => api.post("/goals", data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
};

// ─── Analytics API ────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getIncomeExpense: (params) => api.get("/analytics/income-expense", { params }),
  getCategorySpending: (params) => api.get("/analytics/category-spending", { params }),
  getCashFlow: (params) => api.get("/analytics/cash-flow", { params }),
};

// ─── AI Advisor API ───────────────────────────────────────────────────────────
export const aiAPI = {
  getActionCenter:          ()       => api.get("/ai/action-center"),
  getInsights:              ()       => api.get("/ai/insights"),
  getBudgetRecommendations: (months) => api.get("/ai/budget-recommendations", { params: { months } }),
  getMonthlyReport:         (month, year) => api.get("/ai/monthly-report", { params: { month, year } }),
  getSalarySplit:           (data)   => api.post("/ai/salary-split", data),
  checkAffordability:       (data)   => api.post("/ai/affordability", data),
  getGoalPlanning:          ()       => api.get("/ai/goal-planning"),
  getDashboardCards:        ()       => api.get("/ai/dashboard-cards"),
  // --- Intelligence ---
  getCoachSummary:          ()       => api.get("/ai/coach"),
  searchFinancials:         (query)  => api.post("/ai/search", { query }),
  getWeeklySummary:         ()       => api.get("/ai/weekly"),
  detectPatterns:           ()       => api.get("/ai/patterns"),
  getMerchantIntelligence:  ()       => api.get("/ai/merchants"),
  detectSubscriptions:      ()       => api.get("/ai/subscriptions"),
  explainMetric:            (type)   => api.get(`/ai/explain/${type}`),
  getSmartAlerts:           ()       => api.get("/ai/alerts"),
};

export const aiChallengeAPI = {
  getDashboard: () => api.get("/ai-challenges"),
  generateChallenges: () => api.post("/ai-challenges/generate"),
  verifyChallenges: () => api.post("/ai-challenges/verify")
};

// ─── Receipts API ─────────────────────────────────────────────────────────────
export const receiptsAPI = {
  scanReceipt: (data) => api.post("/receipts/scan", data, {
    headers: { "Content-Type": "multipart/form-data" }
  })
};

export default api;
