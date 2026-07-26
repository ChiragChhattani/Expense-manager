import React, { useState, useEffect } from "react";
import Layout from "../components/Layout/Layout";
import useGoals from "../hooks/useGoals";
import useBudgets from "../hooks/useBudgets";
import useCategories from "../hooks/useCategories";
import Spinner from "../components/Spinner";
import { message } from "antd";

const BudgetsGoalsPage = () => {
  const { goals, loading: loadingGoals, createGoal, deleteGoal } = useGoals();
  const { budgets, loading: loadingBudgets, upsertBudget, deleteBudget, fetchBudgets } = useBudgets();
  const { categories } = useCategories();
  
  const [goalForm, setGoalForm] = useState({ name: "", targetAmount: "", deadline: "" });
  const [budgetForm, setBudgetForm] = useState({ category: "", amount: "", month: new Date().getMonth() + 1, year: new Date().getFullYear() });

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);


  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    try {
      await createGoal(goalForm);
      message.success("Goal created");
      setGoalForm({ name: "", targetAmount: "", deadline: "" });
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    try {
      await upsertBudget(budgetForm);
      message.success("Budget saved");
      setBudgetForm({ category: "", amount: "", month: new Date().getMonth() + 1, year: new Date().getFullYear() });
    } catch (error) {
      message.error(error.message);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>Budgets & Goals</h1>
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>Plan your financial future</p>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 32 }}>
          
          {/* ── Goals Column ─────────────────────────────────────────────────── */}
          <div>
            <h3 style={{ marginBottom: 20 }}>Savings Goals</h3>
            <div className="glass-card mb-4" style={{ marginBottom: 24 }}>
              <h5 style={{ marginBottom: 16 }}>New Goal</h5>
              <form onSubmit={handleGoalSubmit}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label className="form-label">Goal Name</label>
                    <input className="form-control" style={{ width: "100%" }} placeholder="e.g. New Car" value={goalForm.name} onChange={e => setGoalForm({...goalForm, name: e.target.value})} required />
                  </div>
                  <div>
                    <label className="form-label">Target Amount (₹)</label>
                    <input type="number" className="form-control" style={{ width: "100%" }} placeholder="100000" value={goalForm.targetAmount} onChange={e => setGoalForm({...goalForm, targetAmount: e.target.value})} required />
                  </div>
                  <div>
                    <label className="form-label">Deadline</label>
                    <input type="date" className="form-control" style={{ width: "100%" }} value={goalForm.deadline} onChange={e => setGoalForm({...goalForm, deadline: e.target.value})} />
                  </div>
                  <button type="submit" className="premium-btn mt-2">Add Goal</button>
                </div>
              </form>
            </div>

            {loadingGoals && <Spinner />}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {goals.map(goal => {
                const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                return (
                  <div key={goal.id} className="glass-card" style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <h6 style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{goal.name}</h6>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                          ₹{goal.currentAmount.toLocaleString()} / ₹{goal.targetAmount.toLocaleString()}
                        </div>
                      </div>
                      <button className="secondary-btn" style={{ padding: "4px 8px", fontSize: 12, color: "var(--danger)", borderColor: "var(--danger-bg)" }} onClick={() => deleteGoal(goal.id)}>Delete</button>
                    </div>
                    <div style={{ background: "var(--bg-primary)", borderRadius: 8, height: 8, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? "var(--success)" : "var(--brand-primary)", borderRadius: 8, transition: "width 0.5s" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
                      <span>{pct.toFixed(0)}%</span>
                      {goal.deadline && <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* ── Budgets Column ───────────────────────────────────────────────── */}
          <div>
            <h3 style={{ marginBottom: 20 }}>Monthly Budgets</h3>
            <div className="glass-card mb-4" style={{ marginBottom: 24 }}>
              <h5 style={{ marginBottom: 16 }}>Set Budget</h5>
              <form onSubmit={handleBudgetSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Category</label>
                    <select className="form-select" style={{ width: "100%" }} value={budgetForm.category} onChange={e => setBudgetForm({...budgetForm, category: e.target.value})} required>
                      <option value="">Select Category</option>
                      {categories.filter(c => c.type === 'expense').map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Limit Amount (₹)</label>
                    <input type="number" className="form-control" style={{ width: "100%" }} placeholder="5000" value={budgetForm.amount} onChange={e => setBudgetForm({...budgetForm, amount: e.target.value})} required />
                  </div>
                  <div>
                    <label className="form-label">Month</label>
                    <select className="form-select" style={{ width: "100%" }} value={budgetForm.month} onChange={e => setBudgetForm({...budgetForm, month: parseInt(e.target.value)})}>
                      {Array.from({length: 12}, (_, i) => (
                        <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Year</label>
                    <input type="number" className="form-control" style={{ width: "100%" }} value={budgetForm.year} onChange={e => setBudgetForm({...budgetForm, year: parseInt(e.target.value)})} required />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <button type="submit" className="premium-btn w-100 mt-2" style={{ width: "100%" }}>Save Budget</button>
                  </div>
                </div>
              </form>
            </div>

            {loadingBudgets && <Spinner />}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {budgets.map(budget => {
                const cat = categories.find(c => c.name === budget.category);
                return (
                  <div key={budget.id} className="glass-card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: cat ? `6px solid ${cat.color}` : "6px solid var(--border-color)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      {cat && (
                        <div style={{ width: 40, height: 40, borderRadius: "10px", background: `${cat.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: cat.color }}>
                          {cat.icon}
                        </div>
                      )}
                      <div>
                        <h6 style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>{budget.category}</h6>
                        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, fontWeight: 600 }}>
                          {new Date(budget.year, budget.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>₹{budget.amount}</div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 }}>Limit</div>
                      <button className="secondary-btn" style={{ padding: "2px 6px", fontSize: 10, color: "var(--danger)", borderColor: "var(--danger-bg)", marginTop: 8 }} onClick={() => deleteBudget(budget.id)}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default BudgetsGoalsPage;
