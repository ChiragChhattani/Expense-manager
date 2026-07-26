import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // true during initial auth check

  // ── Hydrate from localStorage on mount ──────────────────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // ── Login ────────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    const { data } = await authAPI.login(credentials);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  // ── Register ─────────────────────────────────────────────────────────────────
  const register = useCallback(async (credentials) => {
    const { data } = await authAPI.register(credentials);
    return data;
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (_) {
      // ignore errors — clear client state regardless
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  // ── Update Profile ───────────────────────────────────────────────────────────
  const updateProfile = useCallback(async (data) => {
    const res = await authAPI.updateProfile(data);
    const updatedUser = res.data.user;
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    return res.data;
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{ user, token, loading, isAuthenticated, login, register, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook — use inside any component to access auth state & actions
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthContext;
