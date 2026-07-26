import { useState, useCallback } from "react";
import { transactionsAPI } from "../services/api";

const useTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const [txRes, summaryRes] = await Promise.all([
        transactionsAPI.getAll(params),
        transactionsAPI.getSummary(),
      ]);

      setTransactions(txRes.data.transactions);
      setTotal(txRes.data.total);
      setPage(txRes.data.page);
      setPages(txRes.data.pages);
      setSummary(summaryRes.data.summary);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  const createTransaction = async (txData) => {
    try {
      const { data } = await transactionsAPI.create(txData);
      return data.transaction;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to create transaction");
    }
  };

  const updateTransaction = async (id, txData) => {
    try {
      const { data } = await transactionsAPI.update(id, txData);
      return data.transaction;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to update transaction");
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await transactionsAPI.delete(id);
      // Remove from local state immediately to avoid refetch if not necessary
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      // Re-fetch summary to update totals
      const summaryRes = await transactionsAPI.getSummary();
      setSummary(summaryRes.data.summary);
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to delete transaction");
    }
  };

  return {
    transactions,
    total,
    page,
    pages,
    summary,
    loading,
    error,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
};

export default useTransactions;
