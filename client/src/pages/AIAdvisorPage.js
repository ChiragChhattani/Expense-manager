import React, { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout/Layout";
import { aiAPI } from "../services/api";
import { message } from "antd";
import { ExplainButton, OverviewTab, SmartSearchTab, PatternsTab, MerchantsTab, SubscriptionsTab, ChallengesTab } from "./AIIntelligenceTabs";

// ─── Small reusable components ────────────────────────────────────────────────

const BarProgress = ({ value, max, color = "#7c3aed" }) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ background: "#f3f4f6", borderRadius: 8, height: 8, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 8, transition: "width 0.8s ease" }} />
    </div>
  );
};

const InsightCard = ({ item }) => {
  const bg = {
    success: "#f0fdf4", warning: "#fffbeb", danger: "#fef2f2", info: "#eff6ff"
  }[item.type] || "#f9fafb";
  const border = {
    success: "#22c55e", warning: "#f59e0b", danger: "#ef4444", info: "#3b82f6"
  }[item.type] || "#d1d5db";
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 16px", marginBottom: 10 }}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
        <span style={{ marginRight: 6 }}>{item.icon}</span>{item.title}
      </div>
      <div style={{ fontSize: 13, color: "#4b5563" }}>{item.detail}</div>
    </div>
  );
};

const SectionCard = ({ children, title, icon, accent = "#7c3aed" }) => (
  <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 24, overflow: "hidden" }}>
    <div style={{ background: accent, padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <h5 style={{ margin: 0, color: "#fff", fontWeight: 700 }}>{title}</h5>
    </div>
    <div style={{ padding: "20px" }}>{children}</div>
  </div>
);

const Loader = () => (
  <div style={{ textAlign: "center", padding: "40px", color: "#7c3aed" }}>
    <div className="spinner-border" role="status" style={{ color: "#7c3aed" }} />
    <p style={{ marginTop: 12, color: "#6b7280" }}>Analyzing your financial data…</p>
  </div>
);

// ─── Tab: Action Center ────────────────────────────────────────────────────────
const ActionCenterTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiAPI.getActionCenter().then(r => { setData(r.data.data); setLoading(false); })
      .catch(() => { message.error("Failed to load action center"); setLoading(false); });
  }, []);

  if (loading) return <Loader />;
  if (!data || data.length === 0) return (
    <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
      <h6 style={{ fontWeight: 600, color: "var(--text-primary)" }}>Looking good!</h6>
      <p>You have no urgent actions at this time. Keep up the good work!</p>
    </div>
  );

  return (
    <div>
      <h6 style={{ fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>Your Top Priorities</h6>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {data.map((item, i) => {
          let bgColor = "#f8fafc";
          let borderColor = "#e2e8f0";
          if (item.startsWith("🚨")) {
            bgColor = "#fef2f2";
            borderColor = "#fecaca";
          } else if (item.startsWith("⚠️")) {
            bgColor = "#fffbeb";
            borderColor = "#fde68a";
          } else if (item.startsWith("🎯") || item.startsWith("✅") || item.startsWith("⏳")) {
            bgColor = "#f0fdf4";
            borderColor = "#bbf7d0";
          }
          
          return (
            <div key={i} style={{ 
              background: bgColor, 
              border: `1px solid ${borderColor}`, 
              borderRadius: 12, 
              padding: "16px 20px", 
              fontSize: 15, 
              fontWeight: 500, 
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              gap: 12
            }}>
              <span style={{ fontSize: 24 }}>{item.charAt(0)}</span>
              <span>{item.substring(2)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Tab: Spending Insights ────────────────────────────────────────────────────
const InsightsTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiAPI.getInsights().then(r => { setData(r.data.data); setLoading(false); })
      .catch(() => { message.error("Failed to load insights"); setLoading(false); });
  }, []);

  if (loading) return <Loader />;
  if (!data) return <p className="text-muted">No insights available.</p>;

  const { thisMonth, lastMonth, insights, topCategories } = data;

  return (
    <div>
      <div className="row g-3 mb-4">
        {[
          { label: "Income", value: thisMonth.income, prev: lastMonth.income, icon: "💰", color: "#22c55e" },
          { label: "Expenses", value: thisMonth.expenses, prev: lastMonth.expenses, icon: "💸", color: "#ef4444" },
          { label: "Net", value: thisMonth.net, prev: lastMonth.income - lastMonth.expenses, icon: "📊", color: thisMonth.net >= 0 ? "#22c55e" : "#ef4444" },
        ].map(({ label, value, prev, icon, color }) => {
          const change = prev > 0 ? ((value - prev) / prev * 100) : null;
          return (
            <div className="col-md-4" key={label}>
              <div style={{ background: "#f9fafb", borderRadius: 14, padding: "18px", border: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>{icon} {label}</span>
                  {change !== null && (
                    <span style={{ fontSize: 11, color: change > 0 ? "#ef4444" : "#22c55e", background: change > 0 ? "#fef2f2" : "#f0fdf4", padding: "2px 8px", borderRadius: 20 }}>
                      {change > 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color }}>₹{Math.abs(value).toFixed(0)}</div>
                {prev > 0 && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>vs ₹{prev.toFixed(0)} last month</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="row g-3">
        <div className="col-md-7">
          <h6 style={{ fontWeight: 700, marginBottom: 12 }}>🔍 AI Insights</h6>
          {insights.map((item, i) => <InsightCard key={i} item={item} />)}
        </div>
        <div className="col-md-5">
          <h6 style={{ fontWeight: 700, marginBottom: 12 }}>📦 Top Spending Categories</h6>
          {topCategories.length === 0 && <p className="text-muted">No expense data this month.</p>}
          {topCategories.map((cat, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span>{cat.icon} <strong>{cat.name}</strong></span>
                <span style={{ color: cat.color, fontWeight: 700 }}>₹{cat.total.toFixed(0)}</span>
              </div>
              <BarProgress value={cat.total} max={topCategories[0]?.total || 1} color={cat.color} />
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{cat.count} transaction{cat.count !== 1 ? "s" : ""}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Tab: Budget Recommendations ──────────────────────────────────────────────
const BudgetRecsTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(3);

  const load = useCallback((m) => {
    setLoading(true);
    aiAPI.getBudgetRecommendations(m)
      .then(r => { setData(r.data.data); setLoading(false); })
      .catch(() => { message.error("Failed to load recommendations"); setLoading(false); });
  }, []);

  useEffect(() => { load(months); }, [load, months]);

  if (loading) return <Loader />;
  if (!data) return <p className="text-muted">No data available.</p>;

  const trendIcon = { increasing: "📈", decreasing: "📉", stable: "➡️" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>{data.message}</p>
          {!data.hasSufficientData && (
            <span style={{ background: "#fffbeb", border: "1px solid #f59e0b", color: "#92400e", fontSize: 12, padding: "3px 10px", borderRadius: 20 }}>⚠️ More data needed for accurate recommendations</span>
          )}
        </div>
        <div>
          <select className="form-select form-select-sm" style={{ width: 160 }} value={months} onChange={e => setMonths(parseInt(e.target.value))}>
            <option value={1}>Last 1 month</option>
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "#f5f3ff", borderRadius: 12, marginBottom: 16, fontWeight: 600 }}>
        <span>Total Recommended Budget</span>
        <span style={{ color: "#7c3aed", fontSize: 18 }}>₹{data.totalRecommended.toLocaleString()}/month</span>
      </div>

      {data.recommendations.map((rec, i) => (
        <div key={i} style={{ border: `1px solid #e5e7eb`, borderLeft: `5px solid ${rec.color}`, borderRadius: 12, padding: "14px 16px", marginBottom: 10, background: "#fafafa" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                <span style={{ marginRight: 6 }}>{rec.icon}</span>
                <span style={{ color: rec.color }}>{rec.category}</span>
                <span style={{ marginLeft: 8, fontSize: 12, color: "#9ca3af" }}>{trendIcon[rec.trend]} {rec.trend}</span>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{rec.reason}</div>
            </div>
            <div style={{ textAlign: "right", minWidth: 120 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#374151" }}>₹{rec.recommended.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>avg ₹{rec.average.toLocaleString()} · min ₹{rec.min.toLocaleString()} · max ₹{rec.max.toLocaleString()}</div>
            </div>
          </div>
          <BarProgress value={rec.recommended} max={data.totalRecommended} color={rec.color} />
        </div>
      ))}

      {data.recommendations.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
          <p style={{ fontSize: 40 }}>📊</p>
          <p>No expense data found. Add transactions to get recommendations.</p>
        </div>
      )}

      <ExplainButton type="budget_recs" />
    </div>
  );
};

// ─── Tab: Monthly Report ───────────────────────────────────────────────────────
const MonthlyReportTab = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback((m, y) => {
    setLoading(true);
    aiAPI.getMonthlyReport(m, y)
      .then(r => { setData(r.data.data); setLoading(false); })
      .catch(() => { message.error("Failed to load report"); setLoading(false); });
  }, []);

  useEffect(() => { load(month, year); }, [load, month, year]);

  if (loading) return <Loader />;
  if (!data) return <p className="text-muted">No data.</p>;

  const changeLabel = (pct) => {
    if (pct === null) return null;
    return (
      <span style={{ fontSize: 12, color: pct > 0 ? "#ef4444" : "#22c55e", marginLeft: 6 }}>
        {pct > 0 ? "▲" : "▼"}{Math.abs(pct).toFixed(1)}%
      </span>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <select className="form-select" style={{ width: 160 }} value={month} onChange={e => setMonth(parseInt(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString("default", { month: "long" })}</option>
          ))}
        </select>
        <input type="number" className="form-control" style={{ width: 100 }} value={year} min={2020} max={2030} onChange={e => setYear(parseInt(e.target.value))} />
      </div>

      {!data.hasData ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
          <p style={{ fontSize: 40 }}>📄</p>
          <p>No transactions found for {data.period}.</p>
        </div>
      ) : (
        <>
          <h6 style={{ fontWeight: 700 }}>📅 {data.period} Summary</h6>
          <div className="row g-3 mb-4">
            {[
              { label: "Income", v: data.summary.income, c: "#22c55e", ch: data.vs_last_month.income_change },
              { label: "Expenses", v: data.summary.expenses, c: "#ef4444", ch: data.vs_last_month.expense_change },
              { label: "Savings", v: data.summary.savings, c: data.summary.savings >= 0 ? "#7c3aed" : "#ef4444", ch: null },
              { label: "Savings Rate", v: null, rate: data.summary.savingsRate, c: data.summary.savingsRate >= 20 ? "#22c55e" : "#f59e0b", ch: null },
            ].map(({ label, v, rate, c, ch }, i) => (
              <div className="col-md-3" key={i}>
                <div style={{ background: "#f9fafb", borderRadius: 14, padding: 16, border: "1px solid #f3f4f6", textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: c }}>
                    {rate !== undefined ? `${rate}%` : `₹${Math.abs(v).toFixed(0)}`}
                    {ch !== null && changeLabel(ch)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {data.categoryBreakdown.length > 0 && (
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <h6 style={{ fontWeight: 700 }}>📊 Category Breakdown</h6>
                {data.categoryBreakdown.slice(0, 6).map((cat, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                      <span>{cat.icon} <strong>{cat.category}</strong></span>
                      <span style={{ color: cat.color, fontWeight: 700 }}>
                        ₹{cat.amount.toFixed(0)}
                        {cat.change !== null && (
                          <span style={{ marginLeft: 6, fontSize: 11, color: cat.change > 0 ? "#ef4444" : "#22c55e" }}>
                            {cat.change > 0 ? "▲" : "▼"}{Math.abs(cat.change).toFixed(0)}%
                          </span>
                        )}
                      </span>
                    </div>
                    <BarProgress value={cat.amount} max={data.categoryBreakdown[0]?.amount || 1} color={cat.color} />
                  </div>
                ))}
              </div>
              <div className="col-md-6">
                {data.budgetCompliance.length > 0 && (
                  <>
                    <h6 style={{ fontWeight: 700 }}>🎯 Budget Compliance</h6>
                    {data.budgetCompliance.map((b, i) => (
                      <div key={i} style={{
                        padding: "8px 12px", borderRadius: 10, marginBottom: 8,
                        background: b.status === "exceeded" ? "#fef2f2" : b.status === "near" ? "#fffbeb" : "#f0fdf4",
                        border: `1px solid ${b.status === "exceeded" ? "#ef4444" : b.status === "near" ? "#f59e0b" : "#22c55e"}`
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                          <span><strong>{b.category}</strong></span>
                          <span style={{ fontWeight: 700 }}>₹{b.spent.toFixed(0)} / ₹{b.limit}</span>
                        </div>
                        <BarProgress value={b.spent} max={b.limit}
                          color={b.status === "exceeded" ? "#ef4444" : b.status === "near" ? "#f59e0b" : "#22c55e"} />
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {data.positiveHabits.length > 0 && (
            <div className="mb-3">
              <h6 style={{ fontWeight: 700, color: "#16a34a" }}>✅ Positive Habits</h6>
              {data.positiveHabits.map((p, i) => (
                <div key={i} style={{ padding: "8px 14px", background: "#f0fdf4", borderRadius: 8, marginBottom: 6, fontSize: 14, color: "#166534" }}>
                  ✓ {p}
                </div>
              ))}
            </div>
          )}

          {data.recommendations.length > 0 && (
            <div>
              <h6 style={{ fontWeight: 700 }}>💡 Next Month's Action Plan</h6>
              {data.recommendations.map((r, i) => (
                <div key={i} style={{ padding: "10px 14px", background: "#f5f3ff", borderRadius: 10, marginBottom: 8, display: "flex", gap: 10 }}>
                  <span style={{ color: "#7c3aed", fontWeight: 700 }}>{i + 1}.</span>
                  <span style={{ fontSize: 14, color: "#374151" }}>{r}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Tab: Salary Split Planner ─────────────────────────────────────────────────
const SalarySplitTab = () => {
  const [form, setForm] = useState({ salary: "", period: "monthly", city: "", age: 28, goals: "" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const goals = form.goals ? form.goals.split(",").map(g => g.trim()).filter(Boolean) : [];
      const r = await aiAPI.getSalarySplit({ ...form, salary: parseFloat(form.salary), goals });
      setData(r.data.data);
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to generate plan");
    }
    setLoading(false);
  };

  return (
    <div>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 16 }}>
        Enter your salary details and get a personalized monthly spending plan based on your actual spending history.
      </p>
      <form onSubmit={handleSubmit} className="row g-3 mb-4">
        <div className="col-md-3">
          <label className="form-label fw-semibold">Monthly / Annual Salary (₹)</label>
          <input type="number" className="form-control" required value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} placeholder="e.g. 80000" />
        </div>
        <div className="col-md-2">
          <label className="form-label fw-semibold">Period</label>
          <select className="form-select" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })}>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label fw-semibold">City</label>
          <input type="text" className="form-control" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Mumbai, Delhi, …" />
        </div>
        <div className="col-md-1">
          <label className="form-label fw-semibold">Age</label>
          <input type="number" className="form-control" value={form.age} min={18} max={70} onChange={e => setForm({ ...form, age: parseInt(e.target.value) })} />
        </div>
        <div className="col-md-3">
          <label className="form-label fw-semibold">Financial Goals (optional)</label>
          <input type="text" className="form-control" value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} placeholder="House, Retirement, Car" />
        </div>
        <div className="col-md-12">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Generating…" : "Generate My Plan"}
          </button>
        </div>
      </form>

      {data && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h6 style={{ fontWeight: 700, margin: 0 }}>Your Monthly Budget Plan</h6>
              <small style={{ color: "#6b7280" }}>
                Monthly salary: ₹{data.monthlySalary.toLocaleString()} · {data.basedOnHistory ? "Personalized from your history" : "Standard ratios applied"}
                {data.city && ` · ${data.city}`}
              </small>
            </div>
            <span style={{ background: data.basedOnHistory ? "#f0fdf4" : "#fffbeb", color: data.basedOnHistory ? "#166534" : "#92400e", padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
              {data.basedOnHistory ? "✓ Personalized" : "⚡ Standard"}
            </span>
          </div>

          <div className="row g-3">
            {data.allocations.map((alloc, i) => (
              <div className="col-md-4 col-sm-6" key={i}>
                <div style={{ border: `2px solid ${alloc.color}20`, borderRadius: 14, padding: "14px", background: `${alloc.color}08` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>{alloc.icon} {alloc.category}</span>
                    <span style={{ background: alloc.color, color: "#fff", fontSize: 12, padding: "2px 10px", borderRadius: 20, fontWeight: 700 }}>{alloc.pct}%</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: alloc.color }}>₹{alloc.amount.toLocaleString()}</div>
                  <BarProgress value={alloc.pct} max={100} color={alloc.color} />
                </div>
              </div>
            ))}
          </div>

          {data.goalNote && (
            <div style={{ marginTop: 16, padding: "12px 16px", background: "#f5f3ff", borderRadius: 12, fontSize: 14, color: "#4c1d95" }}>
              🎯 {data.goalNote}
            </div>
          )}
          <div style={{ marginTop: 12, fontSize: 13, color: "#9ca3af" }}>ℹ️ {data.note}</div>
        </div>
      )}
    </div>
  );
};

// ─── Tab: Affordability Checker ────────────────────────────────────────────────
const AffordabilityTab = () => {
  const [form, setForm] = useState({ amount: "", description: "" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await aiAPI.checkAffordability({ amount: parseFloat(form.amount), description: form.description || "Purchase" });
      setData(r.data.data);
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to check affordability");
    }
    setLoading(false);
  };

  const riskStyle = {
    low:     { bg: "#f0fdf4", border: "#22c55e", text: "#166534", icon: "✅" },
    moderate:{ bg: "#fffbeb", border: "#f59e0b", text: "#92400e", icon: "⚠️" },
    high:    { bg: "#fef2f2", border: "#ef4444", text: "#991b1b", icon: "🚫" },
    unknown: { bg: "#f9fafb", border: "#d1d5db", text: "#374151", icon: "❓" },
  };

  return (
    <div>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 16 }}>
        Ask AI whether a purchase fits your current financial situation. Your actual income, expenses, and goals are factored in.
      </p>
      <form onSubmit={handleSubmit} className="row g-3 mb-4">
        <div className="col-md-4">
          <label className="form-label fw-semibold">Purchase Amount (₹)</label>
          <input type="number" className="form-control" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 15000" />
        </div>
        <div className="col-md-5">
          <label className="form-label fw-semibold">What are you buying?</label>
          <input type="text" className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. New laptop, Vacation, Phone" />
        </div>
        <div className="col-md-3 d-flex align-items-end">
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Analyzing…" : "Can I afford this?"}
          </button>
        </div>
      </form>

      {data && (() => {
        const s = riskStyle[data.riskLevel] || riskStyle.unknown;
        return (
          <div>
            <div style={{ background: s.bg, border: `2px solid ${s.border}`, borderRadius: 16, padding: "20px 24px", marginBottom: 20 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <h5 style={{ color: s.text, fontWeight: 800 }}>{data.verdict}</h5>
              <p style={{ color: s.text, fontSize: 15, margin: 0 }}>{data.recommendation}</p>
            </div>
            <h6 style={{ fontWeight: 700, marginBottom: 12 }}>📋 Financial Snapshot</h6>
            <div className="row g-3">
              {data.factors.map((f, i) => (
                <div className="col-md-4" key={i}>
                  <div style={{ background: "#f9fafb", borderRadius: 12, padding: "12px 16px", border: "1px solid #f3f4f6" }}>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>{f.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#374151" }}>{f.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

// ─── Tab: Goal Planning ────────────────────────────────────────────────────────
const GoalPlanningTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiAPI.getGoalPlanning().then(r => { setData(r.data.data); setLoading(false); })
      .catch(() => { message.error("Failed to load goal planning"); setLoading(false); });
  }, []);

  if (loading) return <Loader />;
  if (!data) return null;

  if (data.goals.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
        <p style={{ fontSize: 40 }}>🎯</p>
        <p>No savings goals yet. Create a goal in Budgets & Goals to get planning advice.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div style={{ background: "#f0fdf4", borderRadius: 14, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Monthly Income</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#22c55e" }}>₹{data.monthlyIncome.toFixed(0)}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div style={{ background: "#fef2f2", borderRadius: 14, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Monthly Expenses</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#ef4444" }}>₹{data.monthlyExpenses.toFixed(0)}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div style={{ background: "#f5f3ff", borderRadius: 14, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Monthly Surplus</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#7c3aed" }}>₹{data.monthlySurplus.toFixed(0)}</div>
          </div>
        </div>
      </div>

      {data.goals.map((goal, i) => (
        <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: "20px", marginBottom: 20, background: "#fafafa" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <h6 style={{ fontWeight: 800, margin: 0 }}>{goal.name}</h6>
              {goal.deadline && <small style={{ color: "#6b7280" }}>Deadline: {goal.deadline}</small>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>₹{goal.currentAmount.toFixed(0)} / ₹{goal.targetAmount.toFixed(0)}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{goal.progressPct.toFixed(0)}% complete</div>
            </div>
          </div>
          <BarProgress value={goal.progressPct} max={100} color={goal.feasible === false ? "#ef4444" : "#7c3aed"} />

          <div style={{ marginTop: 12 }} className="row g-2">
            {goal.monthlyRequired !== null && (
              <div className="col-md-4">
                <div style={{ background: "#f5f3ff", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>Monthly Savings Needed</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#7c3aed" }}>₹{goal.monthlyRequired}/mo</div>
                </div>
              </div>
            )}
            {goal.estimatedCompletion && (
              <div className="col-md-4">
                <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>Estimated Completion</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#16a34a" }}>{goal.estimatedCompletion}</div>
                </div>
              </div>
            )}
            <div className="col-md-4">
              <div style={{ background: goal.feasible === false ? "#fef2f2" : goal.feasible ? "#f0fdf4" : "#f9fafb", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: 11, color: "#6b7280" }}>Feasibility</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: goal.feasible === false ? "#ef4444" : goal.feasible ? "#22c55e" : "#6b7280" }}>
                  {goal.feasible === false ? "⚠️ Tight" : goal.feasible ? "✅ On Track" : "❓ Unknown"}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, padding: "10px 14px", background: "#eff6ff", borderRadius: 10, fontSize: 14, color: "#1e40af" }}>
            💡 {goal.advice}
          </div>

          {goal.reductions.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>Categories to trim:</div>
              <div className="row g-2">
                {goal.reductions.map((r, j) => (
                  <div className="col-md-4" key={j}>
                    <div style={{ padding: "8px 12px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13 }}>
                      <span>{r.icon} {r.category}</span>
                      <div style={{ color: "#22c55e", fontWeight: 700, marginTop: 2 }}>Save ≈ ₹{r.potentialSaving}/mo</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>avg ₹{r.monthlyAvg}/mo → cut 15%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Dashboard Cards ───────────────────────────────────────────────────────────
const DashboardCards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiAPI.getDashboardCards().then(r => { setCards(r.data.data.cards || []); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, []);

  if (loading) return <div style={{ height: 60 }} />;

  const typeStyle = {
    snapshot: { bg: "#f5f3ff", border: "#7c3aed" },
    score:    { bg: "#f0fdf4", border: "#22c55e" },
    opportunity: { bg: "#fffbeb", border: "#f59e0b" },
    alert:    { bg: "#fef2f2", border: "#ef4444" },
    warning:  { bg: "#fffbeb", border: "#f59e0b" },
    success:  { bg: "#f0fdf4", border: "#22c55e" },
    goal:     { bg: "#f0f9ff", border: "#0ea5e9" },
  };

  return (
    <div className="row g-3 mb-4">
      {cards.map((card, i) => {
        const s = typeStyle[card.type] || { bg: "#f9fafb", border: "#d1d5db" };
        return (
          <div className="col-md-4 col-sm-6" key={i}>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: "16px", height: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 22 }}>{card.icon}</span>
                {card.progress !== undefined && (
                  <span style={{ fontSize: 11, background: card.color, color: "#fff", padding: "2px 10px", borderRadius: 20 }}>{card.progress}%</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>{card.title}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: card.color }}>{card.value}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{card.subtitle}</div>
              {card.detail && <div style={{ fontSize: 12, marginTop: 8, color: "#374151" }}>💡 {card.detail}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "🏠 Overview", icon: "🏠" },
  { id: "search", label: "🔍 Smart Search", icon: "🔍" },
  { id: "patterns", label: "📈 Patterns", icon: "📈" },
  { id: "merchants", label: "🏪 Merchants", icon: "🏪" },
  { id: "subs", label: "🔁 Subscriptions", icon: "🔁" },
  { id: "challenges", label: "🏆 Challenges", icon: "🏆" },
  { id: "insights", label: "💡 Insights", icon: "💡" },
  { id: "action_center", label: "⚡ Action Center", icon: "⚡" },
  { id: "budgets", label: "📊 Budget Recs", icon: "📊" },
  { id: "report", label: "📄 Monthly Report", icon: "📄" },
  { id: "salary", label: "💼 Salary Planner", icon: "💼" },
  { id: "afford", label: "🛒 Can I Afford?", icon: "🛒" },
  { id: "goals", label: "🎯 Goal Planning", icon: "🎯" },
];

const AIAdvisorPage = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <Layout>
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)" }}>
        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", padding: "40px 0 0", color: "#fff" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontWeight: 800, fontSize: "2rem", margin: 0, color: "#fff" }}>🤖 AI Intelligence</h1>
              <p style={{ color: "#94a3b8", fontSize: "1rem", margin: "8px 0 0" }}>
                Personalized financial guidance based on your actual spending, budgets, and goals
              </p>
            </div>
            {/* Dashboard cards inline */}
            <DashboardCards />
            {/* Tab bar */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 0, marginTop: 24 }}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    border: "none", outline: "none", cursor: "pointer",
                    padding: "12px 20px", borderRadius: "12px 12px 0 0", fontSize: 14, fontWeight: 600,
                    background: activeTab === tab.id ? "#f8fafc" : "transparent",
                    color: activeTab === tab.id ? "var(--brand-primary)" : "#94a3b8",
                    transition: "all 0.2s", whiteSpace: "nowrap",
                  }}
                >{tab.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
          {activeTab === "overview" && (
            <OverviewTab />
          )}
          {activeTab === "search" && (
            <SectionCard title="Smart Financial Search" icon="🔍" accent="#0f172a">
              <SmartSearchTab />
            </SectionCard>
          )}
          {activeTab === "patterns" && (
            <SectionCard title="Spending Patterns" icon="📈" accent="#2563eb">
              <PatternsTab />
            </SectionCard>
          )}
          {activeTab === "merchants" && (
            <SectionCard title="Merchant Intelligence" icon="🏪" accent="#ea580c">
              <MerchantsTab />
            </SectionCard>
          )}
          {activeTab === "subs" && (
            <SectionCard title="Subscriptions & Recurring" icon="🔁" accent="#db2777">
              <SubscriptionsTab />
            </SectionCard>
          )}
          {activeTab === "challenges" && (
            <SectionCard title="Gamification & Challenges" icon="🏆" accent="#10b981">
              <ChallengesTab />
            </SectionCard>
          )}
          {activeTab === "insights" && (
            <SectionCard title="Spending Insights" icon="💡" accent="#7c3aed">
              <InsightsTab />
            </SectionCard>
          )}
          {activeTab === "action_center" && (
            <SectionCard title="Action Center" icon="⚡" accent="#4f46e5">
              <ActionCenterTab />
            </SectionCard>
          )}
          {activeTab === "budgets" && (
            <SectionCard title="Smart Budget Recommendations" icon="📊" accent="#0ea5e9">
              <BudgetRecsTab />
            </SectionCard>
          )}
          {activeTab === "report" && (
            <SectionCard title="Monthly Financial Report" icon="📄" accent="#059669">
              <MonthlyReportTab />
            </SectionCard>
          )}
          {activeTab === "salary" && (
            <SectionCard title="AI Salary Split Planner" icon="💼" accent="#7c3aed">
              <SalarySplitTab />
            </SectionCard>
          )}
          {activeTab === "afford" && (
            <SectionCard title="Affordability Checker" icon="🛒" accent="#dc2626">
              <AffordabilityTab />
            </SectionCard>
          )}
          {activeTab === "goals" && (
            <SectionCard title="Goal Planning" icon="🎯" accent="#0891b2">
              <GoalPlanningTab />
            </SectionCard>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AIAdvisorPage;
