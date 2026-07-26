import { useState, useCallback } from "react";
import { budgetsAPI } from "../services/api";

/**
 * Custom hook for budget CRUD operations and state
 */
const useBudgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBudgets = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await budgetsAPI.getAll(filters);
      setBudgets(res.data.budgets);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch budgets.");
    } finally {
      setLoading(false);
    }
  }, []);

  const upsertBudget = useCallback(async (data) => {
    const res = await budgetsAPI.upsert(data);
    const saved = res.data.budget;
    setBudgets((prev) => {
      const idx = prev.findIndex((b) => b.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });
    return saved;
  }, []);

  const deleteBudget = useCallback(async (id) => {
    await budgetsAPI.delete(id);
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return { budgets, loading, error, fetchBudgets, upsertBudget, deleteBudget };
};

export default useBudgets;
