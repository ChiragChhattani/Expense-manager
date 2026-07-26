import React, { useEffect, useState } from "react";
import { message } from "antd";
import { Link } from "react-router-dom";
import Layout from "./../components/Layout/Layout";
import useTransactions from "../hooks/useTransactions";
import useAnalytics from "../hooks/useAnalytics";
import { aiAPI } from "../services/api";
import Spinner from "../components/Spinner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const HomePage = () => {
  const { transactions, summary, loading: txLoading, error, fetchTransactions } = useTransactions();
  const { categorySpendingData, fetchCategorySpending, loading: anLoading } = useAnalytics();
  const [actionCenter, setActionCenter] = useState([]);
  const [actionLoading, setActionLoading] = useState(true);

  useEffect(() => {
    fetchTransactions({ limit: 6 });
    fetchCategorySpending(new Date().getMonth() + 1, new Date().getFullYear());
    
    aiAPI.getActionCenter()
      .then(res => setActionCenter(res.data.data))
      .catch(() => setActionCenter([]))
      .finally(() => setActionLoading(false));
  }, [fetchTransactions, fetchCategorySpending]);

  useEffect(() => {
    if (error) message.error(error);
  }, [error]);

  const loading = txLoading || anLoading || actionLoading;

  return (
    <Layout>
      {loading && <Spinner />}

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>Dashboard</h1>
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>Here's your financial overview for this month</p>
          </div>
          <Link to="/transactions" className="premium-btn" style={{ textDecoration: "none" }}>+ New Transaction</Link>
        </div>
        
        {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginBottom: 32 }}>
          <div className="glass-card">
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Total Income</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--success)" }}>₹{summary.income.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          </div>
          <div className="glass-card">
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Total Expenses</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--danger)" }}>₹{summary.expense.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          </div>
          <div className="glass-card">
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Net Balance</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: summary.balance >= 0 ? "var(--text-primary)" : "var(--danger)" }}>
              {summary.balance < 0 ? "-" : ""}₹{Math.abs(summary.balance).toLocaleString(undefined, {minimumFractionDigits: 2})}
            </div>
          </div>
          <div className="glass-card" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)", borderColor: "var(--brand-light)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-primary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Top Action</div>
            {actionCenter && actionCenter.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--brand-primary)", lineHeight: 1.4 }}>{actionCenter[0]}</div>
                <Link to="/ai-advisor" style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-primary)", textDecoration: "none" }}>View All Actions →</Link>
              </div>
            ) : (
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-secondary)" }}>Looking good! No urgent actions.</div>
            )}
          </div>
        </div>

        {/* ── Main Content Grid ─────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          
          {/* Recent Transactions */}
          <div className="glass-card" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h5 style={{ margin: 0, fontSize: "1.1rem" }}>Recent Transactions</h5>
              <Link to="/transactions" style={{ fontSize: 14, color: "var(--brand-primary)", textDecoration: "none", fontWeight: 600 }}>View All →</Link>
            </div>
            
            {transactions.length === 0 && !txLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>No transactions yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {transactions.map((t) => (
                  <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#fff", border: "1px solid var(--border-color)", borderRadius: 12, transition: "background 0.2s" }} className="hover-bg-slate">
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: t.category ? t.category.color : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18 }}>
                        {t.category ? t.category.icon : "•"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{t.category ? t.category.name : "Uncategorized"}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{new Date(t.date).toLocaleDateString()} {t.description && `• ${t.description}`}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: t.type === 'income' ? "var(--success)" : "var(--text-primary)" }}>
                      {t.type === "income" ? "+" : "-"}₹{Number(t.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Expenses Chart */}
          <div className="glass-card" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
               <h5 style={{ margin: 0, fontSize: "1.1rem" }}>Expenses by Category</h5>
               <Link to="/analytics" style={{ fontSize: 14, color: "var(--brand-primary)", textDecoration: "none", fontWeight: 600 }}>Analytics →</Link>
            </div>
            <div style={{ flex: 1, minHeight: 250, position: "relative" }}>
              {categorySpendingData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categorySpendingData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} stroke="none">
                      {categorySpendingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "var(--shadow-md)" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                  No expense data for this month.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
