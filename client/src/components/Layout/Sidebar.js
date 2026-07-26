import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { message } from "antd";
import { useAuth } from "../../contexts/AuthContext";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      message.success("Logged out successfully");
      navigate("/login");
    } catch {
      message.error("Logout failed");
    }
  };

  const menuItems = [
    { path: "/", label: "Dashboard", icon: "🏠" },
    { path: "/transactions", label: "Transactions", icon: "💳" },
    { path: "/scan-receipt", label: "Scan Receipt", icon: "📸" },
    { path: "/budgets-goals", label: "Budgets & Goals", icon: "🎯" },
    { path: "/categories", label: "Categories", icon: "📁" },
    { path: "/analytics", label: "Analytics", icon: "📊" },
    { path: "/ai-advisor", label: "AI Advisor", icon: "🤖" },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <NavLink to="/" className="sidebar-logo">
          <span style={{ fontSize: 24 }}>⚡</span> ExpenseManager
        </NavLink>
      </div>
      
      <div className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span> {item.label}
          </NavLink>
        ))}
      </div>

      <div className="sidebar-footer">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <NavLink to="/profile" className="user-profile-sm">
            {user?.avatar ? (
              <img src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:8080${user.avatar}`} alt="Avatar" />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--brand-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{user?.email}</div>
            </div>
          </NavLink>
          <button onClick={handleLogout} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 18 }} title="Logout">
            🚪
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
