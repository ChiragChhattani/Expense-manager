import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { categoriesAPI } from "../services/api";
import { useAuth } from "./AuthContext";

const CategoryContext = createContext(null);

export const CategoryProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const { data } = await categoriesAPI.getAll();
      setCategories(data.categories || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch once when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    } else {
      // Clear on logout
      setCategories([]);
    }
  }, [isAuthenticated, fetchCategories]);

  const createCategory = useCallback(async (categoryData) => {
    const { data } = await categoriesAPI.create(categoryData);
    const newCat = data.category;
    // Optimistically add to state, then sort alphabetically
    setCategories((prev) =>
      [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name))
    );
    return newCat;
  }, []);

  const updateCategory = useCallback(async (id, categoryData) => {
    const { data } = await categoriesAPI.update(id, categoryData);
    const updated = data.category;
    setCategories((prev) =>
      prev
        .map((c) => (c.id === id ? updated : c))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    return updated;
  }, []);

  const deleteCategory = useCallback(async (id) => {
    await categoriesAPI.delete(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return (
    <CategoryContext.Provider
      value={{
        categories,
        loading,
        error,
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const ctx = useContext(CategoryContext);
  if (!ctx) throw new Error("useCategories must be used within CategoryProvider");
  return ctx;
};

export default CategoryContext;
