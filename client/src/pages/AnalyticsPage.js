import React, { useEffect } from "react";
import Layout from "../components/Layout/Layout";
import useAnalytics from "../hooks/useAnalytics";
import Spinner from "../components/Spinner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const AnalyticsPage = () => {
  const { 
    loading, 
    incomeExpenseData, 
    categorySpendingData, 
    cashFlowData,
    fetchIncomeExpense,
    fetchCategorySpending,
    fetchCashFlow
  } = useAnalytics();

  useEffect(() => {
    fetchIncomeExpense(6);
    fetchCategorySpending(new Date().getMonth() + 1, new Date().getFullYear());
    fetchCashFlow(new Date().getFullYear());
  }, [fetchIncomeExpense, fetchCategorySpending, fetchCashFlow]);

  const customTooltipStyle = {
    background: "#fff",
    border: "none",
    borderRadius: "12px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    padding: "12px 16px"
  };

  return (
    <Layout>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>Analytics & Reports</h1>
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>Visualize your financial data</p>
        </div>
        
        {loading && <Spinner />}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: 24, marginBottom: 24 }}>
          
          <div className="glass-card" style={{ padding: 24 }}>
            <h4 style={{ marginBottom: 24, fontSize: "1.1rem", fontWeight: 700 }}>Income vs Expense (Last 6 Months)</h4>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={incomeExpenseData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: "#64748b", fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: "#64748b", fontSize: 12}} dx={-10} />
                  <Tooltip contentStyle={customTooltipStyle} cursor={{fill: "#f8fafc"}} />
                  <Legend wrapperStyle={{ paddingTop: 20 }} iconType="circle" />
                  <Bar dataKey="income" fill="var(--success)" name="Income" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="expense" fill="var(--danger)" name="Expense" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 24 }}>
            <h4 style={{ marginBottom: 24, fontSize: "1.1rem", fontWeight: 700 }}>Category Spending (This Month)</h4>
            <div style={{ width: '100%', height: 300 }}>
              {categorySpendingData.length > 0 ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={categorySpendingData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {categorySpendingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Legend wrapperStyle={{ paddingTop: 20 }} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                  No spending data this month.
                </div>
              )}
            </div>
          </div>
          
        </div>

        <div className="glass-card" style={{ padding: 24, marginBottom: 32 }}>
          <h4 style={{ marginBottom: 24, fontSize: "1.1rem", fontWeight: 700 }}>Cash Flow ({new Date().getFullYear()})</h4>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: "#64748b", fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: "#64748b", fontSize: 12}} dx={-10} />
                <Tooltip contentStyle={customTooltipStyle} cursor={{fill: "#f8fafc"}} />
                <Legend wrapperStyle={{ paddingTop: 20 }} iconType="circle" />
                <Bar dataKey="income" fill="var(--success)" name="Income" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="expense" fill="var(--danger)" name="Expense" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default AnalyticsPage;
