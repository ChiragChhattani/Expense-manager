import React, { useState } from "react";
import Layout from "../components/Layout/Layout";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../services/api";
import { message } from "antd";

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    currency: user?.currency || "USD",
    monthlyLimit: user?.monthlyLimit || "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", profileForm.name);
      formData.append("currency", profileForm.currency);
      if (profileForm.monthlyLimit) formData.append("monthlyLimit", profileForm.monthlyLimit);
      if (avatarFile) formData.append("avatar", avatarFile);
      
      await updateProfile(formData);
      message.success("Profile updated successfully!");
    } catch (error) {
      message.error(error.message || "Failed to update profile");
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return message.error("New passwords do not match.");
    }
    try {
      await authAPI.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      message.success("Password changed successfully!");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to change password");
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>My Profile</h1>
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>Manage your account settings and preferences</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 32 }}>
          <div className="glass-card" style={{ padding: 32 }}>
            <h4 style={{ marginBottom: 24, fontSize: "1.25rem", fontWeight: 700 }}>Personal Information</h4>
            <form onSubmit={handleProfileUpdate}>
              <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 24 }}>
                {user?.avatar ? (
                  <img src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:8080${user.avatar}`} alt="Avatar" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border-color)" }} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--brand-light)", color: "var(--brand-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 700 }}>
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <label className="form-label">Profile Photo</label>
                  <input type="file" className="form-control" accept="image/*" onChange={e => setAvatarFile(e.target.files[0])} style={{ padding: "8px 14px" }} />
                </div>
              </div>

              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-control" style={{ width: "100%" }} value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} required />
                </div>
                <div>
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-control" style={{ width: "100%", background: "var(--bg-primary)", color: "var(--text-muted)" }} value={user?.email || ""} disabled />
                </div>
                <div>
                  <label className="form-label">Preferred Currency</label>
                  <select className="form-select" style={{ width: "100%" }} value={profileForm.currency} onChange={e => setProfileForm({...profileForm, currency: e.target.value})}>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Global Monthly Limit</label>
                  <input type="number" className="form-control" style={{ width: "100%" }} placeholder="Optional overall budget" value={profileForm.monthlyLimit} onChange={e => setProfileForm({...profileForm, monthlyLimit: e.target.value})} />
                </div>
                <button type="submit" className="premium-btn w-100 mt-2" style={{ width: "100%" }}>Save Changes</button>
              </div>
            </form>
          </div>

          <div className="glass-card" style={{ padding: 32, alignSelf: "start" }}>
            <h4 style={{ marginBottom: 24, fontSize: "1.25rem", fontWeight: 700 }}>Security</h4>
            <form onSubmit={handlePasswordUpdate}>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <label className="form-label">Current Password</label>
                  <input type="password" className="form-control" style={{ width: "100%" }} value={passwordForm.oldPassword} onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})} required />
                </div>
                <div>
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-control" style={{ width: "100%" }} value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} required minLength={6} />
                </div>
                <div>
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" className="form-control" style={{ width: "100%" }} value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} required minLength={6} />
                </div>
                <button type="submit" className="secondary-btn w-100 mt-2" style={{ width: "100%", color: "var(--danger)", borderColor: "var(--danger-bg)" }}>Change Password</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
