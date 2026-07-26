import { useState, useCallback } from "react";
import { analyticsAPI } from "../services/api";

const useAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [incomeExpenseData, setIncomeExpenseData] = useState([]);
  const [categorySpendingData, setCategorySpendingData] = useState([]);
  const [cashFlowData, setCashFlowData] = useState([]);

  const fetchIncomeExpense = useCallback(async (months = 6) => {
    setLoading(true);
    try {
      const { data } = await analyticsAPI.getIncomeExpense({ months });
      setIncomeExpenseData(data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch income/expense data");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategorySpending = useCallback(async (month, year) => {
    setLoading(true);
    try {
      const { data } = await analyticsAPI.getCategorySpending({ month, year });
      setCategorySpendingData(data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch category spending data");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCashFlow = useCallback(async (year) => {
    setLoading(true);
    try {
      const { data } = await analyticsAPI.getCashFlow({ year });
      setCashFlowData(data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch cash flow data");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    incomeExpenseData,
    categorySpendingData,
    cashFlowData,
    fetchIncomeExpense,
    fetchCategorySpending,
    fetchCashFlow,
  };
};

export default useAnalytics;
