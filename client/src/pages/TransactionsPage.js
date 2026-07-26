import React, { useEffect, useState } from "react";
import { message, Pagination } from "antd";
import Layout from "../components/Layout/Layout";
import useTransactions from "../hooks/useTransactions";
import useCategories from "../hooks/useCategories";
import Spinner from "../components/Spinner";

const TransactionsPage = () => {
  const {
    transactions,
    total,
    loading,
    error,
    fetchTransactions,
    createTransaction,
    deleteTransaction,
  } = useTransactions();
  
  const { categories } = useCategories();

  const [filters, setFilters] = useState({
    search: "",
    type: "",
    categoryId: "",
    sortBy: "date",
    order: "desc",
    page: 1,
    limit: 10
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [txForm, setTxForm] = useState({
    type: "expense",
    amount: "",
    categoryId: "",
    date: "",
    description: "",
    isRecurring: false,
    recurringInterval: "monthly"
  });
  const [receiptFile, setReceiptFile] = useState(null);

  useEffect(() => {
    fetchTransactions(filters);
  }, [filters, fetchTransactions]);

  useEffect(() => {
    if (error) message.error(error);
  }, [error]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(txForm).forEach(key => formData.append(key, txForm[key]));
      if (receiptFile) formData.append("receipt", receiptFile);
      
      await createTransaction(formData);
      message.success("Transaction added");
      setShowAddForm(false);
      fetchTransactions(filters); // Refresh
      setTxForm({ type: "expense", amount: "", categoryId: "", date: "", description: "", isRecurring: false, recurringInterval: "monthly" });
      setReceiptFile(null);
    } catch (err) {
      message.error(err.message);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>Transactions</h1>
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>Manage your income and expenses</p>
          </div>
          <button className={showAddForm ? "secondary-btn" : "premium-btn"} onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "Cancel" : "+ Add Transaction"}
          </button>
        </div>

        {showAddForm && (
          <div className="glass-card animate-fade-in" style={{ marginBottom: 32 }}>
            <h4 style={{ marginBottom: 20 }}>New Transaction</h4>
            <form onSubmit={handleAddSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 20 }}>
                <div>
                  <label className="form-label">Type</label>
                  <select className="form-select" style={{ width: "100%" }} value={txForm.type} onChange={e => setTxForm({...txForm, type: e.target.value})}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Amount (₹)</label>
                  <input type="number" className="form-control" style={{ width: "100%" }} required value={txForm.amount} onChange={e => setTxForm({...txForm, amount: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <select className="form-select" style={{ width: "100%" }} value={txForm.categoryId} onChange={e => setTxForm({...txForm, categoryId: e.target.value})}>
                    <option value="">-- Select --</option>
                    {categories.filter(c => c.type === txForm.type).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Date</label>
                  <input type="date" className="form-control" style={{ width: "100%" }} required value={txForm.date} onChange={e => setTxForm({...txForm, date: e.target.value})} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Description (Optional)</label>
                  <input type="text" className="form-control" style={{ width: "100%" }} value={txForm.description} onChange={e => setTxForm({...txForm, description: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Recurring?</label>
                  <div style={{ display: "flex", alignItems: "center", height: 42 }}>
                    <input type="checkbox" style={{ width: 18, height: 18 }} checked={txForm.isRecurring} onChange={e => setTxForm({...txForm, isRecurring: e.target.checked})} />
                  </div>
                </div>
                {txForm.isRecurring && (
                  <div>
                    <label className="form-label">Interval</label>
                    <select className="form-select" style={{ width: "100%" }} value={txForm.recurringInterval} onChange={e => setTxForm({...txForm, recurringInterval: e.target.value})}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="form-label">Receipt Image (Optional)</label>
                  <input type="file" className="form-control" accept="image/*" onChange={e => setReceiptFile(e.target.files[0])} style={{ padding: "7px 14px" }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" className="premium-btn">Save Transaction</button>
              </div>
            </form>
          </div>
        )}

        <div className="glass-card" style={{ marginBottom: 32, padding: "16px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
            <input type="text" className="form-control" placeholder="Search description..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value, page: 1})} />
            <select className="form-select" value={filters.type} onChange={e => setFilters({...filters, type: e.target.value, page: 1})}>
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select className="form-select" value={filters.categoryId} onChange={e => setFilters({...filters, categoryId: e.target.value, page: 1})}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="form-select" value={filters.sortBy} onChange={e => setFilters({...filters, sortBy: e.target.value})}>
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
            </select>
          </div>
        </div>

        {loading ? <Spinner /> : (
          <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No transactions found.</td>
                    </tr>
                  ) : transactions.map(t => (
                    <tr key={t.id}>
                      <td>{new Date(t.date).toLocaleDateString()}</td>
                      <td>
                        {t.category ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: t.category.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14 }}>
                              {t.category.icon}
                            </div>
                            <span style={{ fontWeight: 600 }}>{t.category.name}</span>
                          </div>
                        ) : "-"}
                      </td>
                      <td>
                        <div>{t.description || "-"}</div>
                        {t.isRecurring && <span className="badge-soft badge-neutral mt-1" style={{ fontSize: 10 }}>↺ {t.recurringInterval}</span>}
                      </td>
                      <td>
                        <span className={`badge-soft ${t.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                          {t.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: t.type === 'income' ? 'var(--success)' : 'var(--text-primary)' }}>
                        {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      <td>
                        <button className="secondary-btn" style={{ padding: "4px 8px", fontSize: 12, color: "var(--danger)", borderColor: "var(--danger-bg)" }} onClick={() => {
                          if (window.confirm("Are you sure?")) deleteTransaction(t.id).then(() => fetchTransactions(filters));
                        }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "16px 24px", display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-color)" }}>
              <Pagination current={filters.page} total={total} pageSize={filters.limit} onChange={(p) => setFilters({...filters, page: p})} />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TransactionsPage;
