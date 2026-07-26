import React, { useState } from "react";
import Layout from "../components/Layout/Layout";
import useCategories from "../hooks/useCategories";
import Spinner from "../components/Spinner";
import { message } from "antd";

const DEFAULT_FORM = { name: "", type: "expense", color: "#ff9800", icon: "🍔" };

const CategoriesPage = () => {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateCategory(editingId, form);
        message.success("Category updated");
      } else {
        await createCategory(form);
        message.success("Category created");
      }
      setForm(DEFAULT_FORM);
      setEditingId(null);
    } catch (err) {
      message.error(err.response?.data?.message || err.message || "Failed to save category");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
  };

  const CategoryCard = ({ cat }) => (
    <div className="glass-card" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: `6px solid ${cat.color}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: "12px", background: `${cat.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: cat.color }}>
          {cat.icon}
        </div>
        <div>
          <h6 style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>{cat.name}</h6>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "capitalize", marginTop: 4, fontWeight: 600 }}>
            {cat.type}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button className="secondary-btn" style={{ padding: "4px 12px", fontSize: 12 }} onClick={() => {
            setEditingId(cat.id);
            setForm({ name: cat.name, type: cat.type, color: cat.color, icon: cat.icon || "🏷️" });
          }}>Edit</button>
        <button className="secondary-btn" style={{ padding: "4px 12px", fontSize: 12, color: "var(--danger)", borderColor: "var(--danger-bg)" }} onClick={async () => {
            try {
              if (window.confirm("Delete this category?")) {
                await deleteCategory(cat.id);
                message.success("Category deleted");
              }
            } catch (err) {
              message.error(err.response?.data?.message || err.message || "Cannot delete category");
            }
          }}>Delete</button>
      </div>
    </div>
  );

  return (
    <Layout>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>Categories</h1>
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>Manage your transaction categories</p>
        </div>

        <div className="glass-card animate-fade-in" style={{ marginBottom: 32 }}>
          <h4 style={{ marginBottom: 20 }}>{editingId ? "Edit Category" : "Add New Category"}</h4>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 20 }}>
              <div>
                <label className="form-label">Name</label>
                <input className="form-control" style={{ width: "100%" }} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Groceries" required />
              </div>
              <div>
                <label className="form-label">Type</label>
                <select className="form-select" style={{ width: "100%" }} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div>
                <label className="form-label">Color Hex</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="color" className="form-control" style={{ width: "48px", padding: 0 }} value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
                  <input type="text" className="form-control" style={{ flex: 1 }} value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="form-label">Emoji Icon</label>
                <input className="form-control" style={{ width: "100%" }} value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} maxLength={5} required />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              {editingId && (
                <button type="button" className="secondary-btn" onClick={handleCancelEdit}>Cancel</button>
              )}
              <button type="submit" className="premium-btn">{editingId ? "Update Category" : "Save Category"}</button>
            </div>
          </form>
        </div>

        {loading ? <Spinner /> : (
          <>
            <h4 style={{ marginBottom: 16, marginTop: 32 }}>Income Categories</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 32 }}>
              {categories.filter(c => c.type === "income").map(c => <CategoryCard key={c.id} cat={c} />)}
              {categories.filter(c => c.type === "income").length === 0 && (
                <p style={{ color: "var(--text-muted)", margin: 0 }}>No income categories yet.</p>
              )}
            </div>

            <h4 style={{ marginBottom: 16 }}>Expense Categories</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {categories.filter(c => c.type === "expense").map(c => <CategoryCard key={c.id} cat={c} />)}
              {categories.filter(c => c.type === "expense").length === 0 && (
                <p style={{ color: "var(--text-muted)", margin: 0 }}>No expense categories yet.</p>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default CategoriesPage;
