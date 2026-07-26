import React, { useState, useEffect } from "react";
import { message } from "antd";
import { receiptsAPI, categoriesAPI, transactionsAPI } from "../services/api";
import Layout from "../components/Layout/Layout";

const ReceiptScannerPage = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [categories, setCategories] = useState([]);

  // Form states
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await categoriesAPI.getAll();
      if (data.success) {
        setCategories(data.categories.filter(c => c.type === "expense"));
      }
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      // Create local preview if image
      if (selected.type.startsWith("image/")) {
        setPreview(URL.createObjectURL(selected));
      } else if (selected.type === "application/pdf") {
        setPreview(null); // maybe show a PDF icon later
      }
    }
  };

  const handleScan = async () => {
    if (!file) return message.error("Please select a file first");
    
    setLoading(true);
    const formData = new FormData();
    formData.append("receipt", file);

    try {
      const { data } = await receiptsAPI.scanReceipt(formData);
      if (data.success) {
        message.success("Receipt scanned successfully!");
        setExtractedData(data.data);
        
        // Auto-fill form
        setAmount(data.data.amount || "");
        setMerchant(data.data.merchant || "");
        if (data.data.date) {
          setDate(data.data.date.split("T")[0]);
        }
        setNotes(data.data.notes || "");
        setReceiptUrl(data.data.receiptUrl || "");

        // Try to match category by name
        if (data.data.categoryName) {
          const match = categories.find(c => c.name.toLowerCase() === data.data.categoryName.toLowerCase());
          if (match) setCategoryId(match.id);
        }
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to scan receipt");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTransaction = async () => {
    if (!amount || !categoryId || !date) {
      return message.error("Amount, category, and date are required");
    }
    
    try {
      const payload = {
        type: "expense",
        amount: Number(amount),
        categoryId,
        date: new Date(date).toISOString(),
        description: merchant ? `${merchant} - ${notes}` : notes,
        receiptUrl // use the url from the OCR step
      };
      
      const { data } = await transactionsAPI.create(payload);
      if (data.success) {
        message.success("Transaction saved successfully!");
        // Reset
        setFile(null);
        setPreview(null);
        setExtractedData(null);
        setAmount("");
        setMerchant("");
        setDate("");
        setCategoryId("");
        setNotes("");
        setReceiptUrl("");
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to save transaction");
    }
  };

  return (
    <Layout>
      <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#1e293b" }}>Scan Receipt</h2>
          <p style={{ color: "#64748b", margin: "4px 0 0" }}>Upload a receipt and let AI extract the details for you.</p>
        </div>

        {!extractedData ? (
          <div style={{ background: "#fff", padding: 40, borderRadius: 16, border: "1px dashed #cbd5e1", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📸</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>Upload Receipt</h3>
            <p style={{ color: "#64748b", marginBottom: 24 }}>Supports JPG, PNG, and PDF up to 5MB.</p>
            
            <input 
              type="file" 
              id="receiptUpload" 
              accept="image/*,application/pdf"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <label 
              htmlFor="receiptUpload" 
              style={{
                display: "inline-block", padding: "10px 24px", background: "#f1f5f9", 
                color: "#0f172a", borderRadius: 8, fontWeight: 600, cursor: "pointer",
                marginBottom: 16
              }}
            >
              Choose File
            </label>
            
            {file && <div style={{ fontWeight: 500, color: "#3b82f6", marginBottom: 16 }}>{file.name}</div>}
            
            {file && (
              <button 
                onClick={handleScan}
                disabled={loading}
                style={{
                  display: "block", margin: "0 auto", padding: "12px 32px",
                  background: "var(--brand-primary)", color: "#fff", border: "none",
                  borderRadius: 8, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "Scanning & Extracting..." : "Scan Now"}
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            
            {/* Left: Preview */}
            <div style={{ flex: 1, background: "#fff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 16px", fontWeight: 600 }}>Receipt Preview</h4>
              {preview ? (
                <img src={preview} alt="Receipt" style={{ width: "100%", borderRadius: 8, border: "1px solid #e2e8f0" }} />
              ) : (
                <div style={{ padding: 40, background: "#f8fafc", textAlign: "center", borderRadius: 8 }}>
                  No preview available for PDF.
                </div>
              )}
            </div>

            {/* Right: Review Form */}
            <div style={{ flex: 1, background: "#fff", padding: 24, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
              <h4 style={{ margin: "0 0 20px", fontWeight: 600, fontSize: 18 }}>Review & Save</h4>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#64748b" }}>Merchant</label>
                <input 
                  type="text" 
                  value={merchant} 
                  onChange={e => setMerchant(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none" }}
                />
              </div>

              <div style={{ marginBottom: 16, display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#64748b" }}>Date</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#64748b" }}>Amount</label>
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#64748b" }}>Category</label>
                <select 
                  value={categoryId} 
                  onChange={e => setCategoryId(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none", background: "#fff" }}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#64748b" }}>Notes</label>
                <input 
                  type="text" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button 
                  onClick={() => setExtractedData(null)}
                  style={{ flex: 1, padding: "12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveTransaction}
                  style={{ flex: 2, padding: "12px", background: "var(--brand-primary)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
                >
                  Save Transaction
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReceiptScannerPage;
