import React, { useState, useEffect } from "react";
import { aiAPI, aiChallengeAPI } from "../services/api";
import { message } from "antd";

// ─── Small reusable components ────────────────────────────────────────────────
const Loader = () => (
  <div style={{ textAlign: "center", padding: "40px", color: "#7c3aed" }}>
    <div className="spinner-border" role="status" style={{ color: "#7c3aed" }} />
    <p style={{ marginTop: 12, color: "#6b7280" }}>Analyzing your data…</p>
  </div>
);

const BarProgress = ({ value, max, color = "#7c3aed" }) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ background: "#f3f4f6", borderRadius: 8, height: 8, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 8, transition: "width 0.8s ease" }} />
    </div>
  );
};

// ─── Explain Button & Popover ─────────────────────────────────────────────────
export const ExplainButton = ({ type }) => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleExplain = async () => {
    if (!data) {
      setLoading(true);
      try {
        const r = await aiAPI.explainMetric(type);
        setData(r.data.data);
      } catch (err) {
        message.error("Failed to load explanation");
      }
      setLoading(false);
    }
    setOpen(!open);
  };

  return (
    <div style={{ marginTop: 10 }}>
      <button onClick={handleExplain} style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", color: "#6d28d9", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
        {open ? "Hide Explanation" : "🤖 Explain this"}
      </button>
      {open && (
        <div style={{ marginTop: 8, padding: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
          {loading ? (
            <div style={{ fontSize: 13, color: "#64748b" }}>Generating explanation...</div>
          ) : data ? (
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: "#334155" }}>{data.title}</div>
              <div style={{ fontSize: 13, color: "#475569", whiteSpace: "pre-wrap" }}>{data.explanation}</div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

// ─── Overview Tab (Coach, Weekly, Alerts) ─────────────────────────────────────
export const OverviewTab = () => {
  const [coach, setCoach] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      aiAPI.getCoachSummary().catch(() => ({ data: { data: null } })),
      aiAPI.getWeeklySummary().catch(() => ({ data: { data: null } })),
      aiAPI.getSmartAlerts().catch(() => ({ data: { data: null } }))
    ]).then(([c, w, a]) => {
      setCoach(c.data.data);
      setWeekly(w.data.data);
      setAlerts(a.data.data?.alerts || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      {/* Smart Alerts */}
      {alerts && alerts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {alerts.map((alert, i) => (
            <div key={i} style={{ padding: "12px 16px", background: alert.type === "danger" ? "#fef2f2" : alert.type === "warning" ? "#fffbeb" : "#eff6ff", border: `1px solid ${alert.type === "danger" ? "#ef4444" : alert.type === "warning" ? "#f59e0b" : "#3b82f6"}`, borderRadius: 12, marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ fontSize: 20 }}>{alert.type === "danger" ? "🚨" : alert.type === "warning" ? "⚠️" : "ℹ️"}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: alert.type === "danger" ? "#991b1b" : alert.type === "warning" ? "#92400e" : "#1e40af" }}>{alert.title}</div>
                <div style={{ fontSize: 13, color: "#4b5563" }}>{alert.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="row g-4">
        <div className="col-md-7">
          {/* AI Coach */}
          <div style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", borderRadius: 16, padding: "24px", color: "#fff", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 28 }}>🤖</span>
              <h5 style={{ margin: 0, fontWeight: 800 }}>Your AI Financial Coach</h5>
            </div>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: "#cbd5e1" }}>
              {coach ? coach.summary : "No coach data available yet."}
            </p>
          </div>
        </div>

        <div className="col-md-5">
          {/* Weekly Summary */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px", height: "100%" }}>
            <h6 style={{ fontWeight: 700, marginBottom: 16, color: "#334155" }}>📅 Weekly Update</h6>
            {weekly ? (
              <ul style={{ paddingLeft: 20, margin: 0, color: "#475569", fontSize: 14 }}>
                {weekly.summary.map((line, i) => (
                  <li key={i} style={{ marginBottom: 8 }}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No weekly data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Smart Search Tab ──────────────────────────────────────────────────────────
export const SmartSearchTab = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const r = await aiAPI.searchFinancials(query);
      setResult(r.data.data);
    } catch (err) {
      message.error("Search failed.");
    }
    setLoading(false);
  };

  const suggestions = [
    "How much did I spend on food this month?",
    "Show my Amazon purchases",
    "Show expenses above ₹5000",
    "How much did I spend last month?"
  ];

  return (
    <div>
      <form onSubmit={handleSearch} style={{ marginBottom: 24 }}>
        <div className="input-group">
          <input type="text" className="form-control form-control-lg" placeholder="Ask anything about your finances..." value={query} onChange={e => setQuery(e.target.value)} style={{ fontSize: 15 }} />
          <button className="btn btn-primary px-4" type="submit" disabled={loading} style={{ background: "#7c3aed", borderColor: "#7c3aed" }}>
            {loading ? "Searching..." : "🔍 Search"}
          </button>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
          <span style={{ fontWeight: 600, marginRight: 8 }}>Try:</span>
          {suggestions.map((s, i) => (
            <span key={i} onClick={() => setQuery(s)} style={{ background: "#f3f4f6", padding: "4px 10px", borderRadius: 20, marginRight: 8, cursor: "pointer", display: "inline-block", marginBottom: 6 }}>{s}</span>
          ))}
        </div>
      </form>

      {result && (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 24 }}>✨</span>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#334155" }}>{result.summary}</div>
          </div>

          {result.transactions.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: 14 }}>
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th className="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {result.transactions.map(t => (
                    <tr key={t.id}>
                      <td>{new Date(t.date).toLocaleDateString()}</td>
                      <td>{t.category?.icon} {t.category?.name || 'Uncategorized'}</td>
                      <td>{t.description || '-'}</td>
                      <td className="text-end" style={{ color: t.type === 'income' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                        {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted mb-0">No matching transactions found.</p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Patterns Tab ─────────────────────────────────────────────────────────────
export const PatternsTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiAPI.detectPatterns().then(r => { setData(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!data || !data.patterns || data.patterns.length === 0 || typeof data.patterns[0] === 'string') {
    return <p className="text-muted">{data?.patterns?.[0] || "No patterns detected yet."}</p>;
  }

  return (
    <div className="row g-3">
      {data.patterns.map((p, i) => (
        <div className="col-md-6" key={i}>
          <div style={{ padding: "16px", background: p.type === "warning" ? "#fffbeb" : p.type === "insight" ? "#f5f3ff" : "#f0fdf4", border: `1px solid ${p.type === "warning" ? "#fcd34d" : p.type === "insight" ? "#ddd6fe" : "#bbf7d0"}`, borderRadius: 12, height: "100%" }}>
            <h6 style={{ fontWeight: 700, color: p.type === "warning" ? "#b45309" : p.type === "insight" ? "#6d28d9" : "#15803d", marginBottom: 8 }}>
              {p.type === "warning" ? "⚠️" : p.type === "insight" ? "💡" : "📈"} {p.title}
            </h6>
            <p style={{ margin: 0, fontSize: 14, color: "#334155" }}>{p.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Merchants Tab ────────────────────────────────────────────────────────────
export const MerchantsTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiAPI.getMerchantIntelligence().then(r => { setData(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!data || data.topMerchants.length === 0) return <p className="text-muted">Not enough data to analyze merchants.</p>;

  return (
    <div>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 16 }}>AI intelligently groups your transactions to show where you shop the most.</p>
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Merchant</th>
              <th>Purchases</th>
              <th>Avg/Purchase</th>
              <th>Total Spent</th>
            </tr>
          </thead>
          <tbody>
            {data.topMerchants.map((m, i) => (
              <tr key={i}>
                <td>
                  <div style={{ fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>Last seen: {new Date(m.latestDate).toLocaleDateString()}</div>
                </td>
                <td>{m.count}</td>
                <td>₹{m.average.toFixed(0)}</td>
                <td style={{ fontWeight: 700 }}>₹{m.totalAmount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Subscriptions Tab ────────────────────────────────────────────────────────
export const SubscriptionsTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiAPI.detectSubscriptions().then(r => { setData(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!data || data.subscriptions.length === 0) return <p className="text-muted">No recurring subscriptions detected.</p>;

  return (
    <div>
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, textAlign: "center", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>Monthly Fixed Cost</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#334155" }}>₹{data.totalMonthly.toLocaleString()}</div>
          </div>
        </div>
        <div className="col-md-6">
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, textAlign: "center", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>Annual Fixed Cost</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#334155" }}>₹{data.totalAnnual.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Service</th>
              <th>Detection</th>
              <th>Frequency</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.subscriptions.map((s, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{s.description}</td>
                <td>
                  <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 12, background: s.confidence === "Explicit" ? "#dcfce7" : "#fef3c7", color: s.confidence === "Explicit" ? "#166534" : "#92400e" }}>
                    {s.confidence}
                  </span>
                </td>
                <td style={{ textTransform: "capitalize" }}>{s.frequency}</td>
                <td style={{ fontWeight: 700, color: "#dc2626" }}>₹{s.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Gamification & Challenges Tab ────────────────────────────────────────────
export const ChallengesTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      const r = await aiChallengeAPI.getDashboard();
      setData(r.data.data);
    } catch (err) {
      message.error("Failed to load challenges");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleGenerate = async () => {
    setActionLoading(true);
    try {
      const r = await aiChallengeAPI.generateChallenges();
      message.success(r.data.data.message);
      await fetchDashboard();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to generate challenges");
    }
    setActionLoading(false);
  };

  const handleVerify = async () => {
    setActionLoading(true);
    try {
      const r = await aiChallengeAPI.verifyChallenges();
      if (r.data.data.verified.length === 0) {
        message.info("No active challenges were ready to be completed or failed yet.");
      } else {
        message.success(`Verified ${r.data.data.verified.length} challenge(s). You earned ${r.data.data.totalPointsEarned} points!`);
        await fetchDashboard();
      }
    } catch (err) {
      message.error("Failed to verify challenges");
    }
    setActionLoading(false);
  };

  if (loading) return <Loader />;
  if (!data) return null;

  return (
    <div>
      <div style={{ display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, background: "linear-gradient(135deg, #7c3aed, #4c1d95)", padding: 24, borderRadius: 16, color: "#fff", display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ fontSize: 48 }}>{data.badge.includes('👑') ? '👑' : data.badge.includes('🥈') ? '🥈' : data.badge.includes('🥉') ? '🥉' : '🌱'}</div>
          <div>
            <div style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, opacity: 0.8 }}>Your Rank</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{data.badge.replace(/[^\w\s]/g, '')}</div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>{data.points} Total Points</div>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, justifyContent: "center" }}>
          <button onClick={handleGenerate} disabled={actionLoading} style={{ padding: "12px 20px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, fontWeight: 600, color: "#334155", display: "flex", alignItems: "center", gap: 10 }}>
            {actionLoading ? <div className="spinner-border spinner-border-sm" /> : "🎯"} Generate New Challenges
          </button>
          <button onClick={handleVerify} disabled={actionLoading} style={{ padding: "12px 20px", background: "#10b981", border: "none", borderRadius: 12, fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
            {actionLoading ? <div className="spinner-border spinner-border-sm" /> : "✅"} Verify Progress & Claim Points
          </button>
        </div>
      </div>

      <h5 style={{ fontWeight: 800, color: "#1e293b", marginBottom: 16 }}>Active Challenges</h5>
      {data.challenges.filter(c => c.status === "active").length === 0 ? (
        <div style={{ padding: 20, background: "#f8fafc", borderRadius: 12, textAlign: "center", color: "#64748b" }}>
          You have no active challenges. Generate some to start earning points!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {data.challenges.filter(c => c.status === "active").map(c => (
            <div key={c.id} style={{ padding: 20, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h6 style={{ fontWeight: 700, color: "#334155", margin: 0 }}>{c.title}</h6>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{c.description}</div>
                </div>
                <div style={{ background: "#f5f3ff", color: "#6d28d9", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  +{c.points} pts
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                <span>Spent: ₹{c.currentSpent?.toLocaleString() || 0} / ₹{c.targetAmount?.toLocaleString() || 0}</span>
                <span>Ends: {new Date(c.endDate).toLocaleDateString()}</span>
              </div>
              <BarProgress value={c.currentSpent} max={c.targetAmount} color={c.currentSpent > c.targetAmount ? "#ef4444" : "#10b981"} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
