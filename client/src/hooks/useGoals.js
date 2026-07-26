import { useState, useCallback, useEffect } from "react";
import { goalsAPI } from "../services/api";

const useGoals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await goalsAPI.getAll();
      setGoals(data.goals);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch goals");
    } finally {
      setLoading(false);
    }
  }, []);

  const createGoal = async (goalData) => {
    try {
      const { data } = await goalsAPI.create(goalData);
      setGoals((prev) => [data.goal, ...prev]);
      return data.goal;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to create goal");
    }
  };

  const updateGoal = async (id, goalData) => {
    try {
      const { data } = await goalsAPI.update(id, goalData);
      setGoals((prev) => prev.map((g) => (g.id === id ? data.goal : g)));
      return data.goal;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to update goal");
    }
  };

  const deleteGoal = async (id) => {
    try {
      await goalsAPI.delete(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to delete goal");
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return {
    goals,
    loading,
    error,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
  };
};

export default useGoals;
