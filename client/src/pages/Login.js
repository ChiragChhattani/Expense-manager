import React, { useState, useEffect } from "react";
import { Form, Input, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Spinner from "../components/Spinner";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect already-authenticated users away from the login page
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const submitHandler = async (values) => {
    try {
      setLoading(true);
      await login(values);
      message.success("Login successful!");
      navigate("/", { replace: true });
    } catch (error) {
      const msg = error.response?.data?.message || "Invalid email or password.";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)" }}>
      <div className="glass-card animate-fade-in" style={{ width: "100%", maxWidth: "400px", padding: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
          <h2 style={{ fontWeight: 900, color: "#1e293b", margin: 0 }}>Welcome Back</h2>
          <p style={{ color: "#64748b", marginTop: 8 }}>Sign in to manage your finances</p>
        </div>

        <Form layout="vertical" onFinish={submitHandler} requiredMark={false}>
          <Form.Item
            label={<span style={{ fontWeight: 600, color: "#475569" }}>Email Address</span>}
            name="email"
            rules={[
              { required: true, message: "Email is required." },
              { type: "email", message: "Enter a valid email." },
            ]}
          >
            <Input size="large" type="email" autoComplete="email" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontWeight: 600, color: "#475569" }}>Password</span>}
            name="password"
            rules={[{ required: true, message: "Password is required." }]}
          >
            <Input.Password size="large" autoComplete="current-password" style={{ borderRadius: 8 }} />
          </Form.Item>

          <button className="premium-btn" type="submit" disabled={loading} style={{ width: "100%", marginTop: 8, padding: "12px", fontSize: 16 }}>
            {loading ? <div className="spinner-border spinner-border-sm" /> : "Sign In"}
          </button>
        </Form>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 14 }}>
          <span style={{ color: "#64748b" }}>Don't have an account? </span>
          <Link to="/register" style={{ color: "var(--brand-primary)", fontWeight: 700, textDecoration: "none" }}>Create one</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
