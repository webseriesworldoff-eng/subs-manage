import { useState, useEffect, useCallback, useMemo } from "react";
import React from "react";

// ─── Storage Helpers ──────────────────────────────────────────────────────────
const STORAGE_KEY = "aawsw_data";
const PIN_KEY = "aawsw_pin";
const SESSION_KEY = "aawsw_session";

const defaultData = {
  customers: [],
  subscriptions: [
    { id: "s1", name: "Netflix", accountCost: 1500, sellingPrice: 700, totalSeats: 4, description: "Netflix Premium" },
    { id: "s2", name: "Spotify Premium", accountCost: 400, sellingPrice: 200, totalSeats: 6, description: "Spotify Family" },
    { id: "s3", name: "YouTube Premium", accountCost: 600, sellingPrice: 250, totalSeats: 5, description: "YouTube Family" },
    { id: "s4", name: "Amazon Prime", accountCost: 300, sellingPrice: 180, totalSeats: 3, description: "Prime Video" },
    { id: "s5", name: "Canva Pro", accountCost: 500, sellingPrice: 300, totalSeats: 5, description: "Canva Team" },
    { id: "s6", name: "ChatGPT Plus", accountCost: 2000, sellingPrice: 1000, totalSeats: 1, description: "OpenAI GPT-4" },
  ],
  accounts: [],
  expenses: [],
  payments: [],
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultData, ...JSON.parse(raw) };
  } catch {}
  return defaultData;
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getPin() { return localStorage.getItem(PIN_KEY) || "1234"; }
function setPin(p) { localStorage.setItem(PIN_KEY, p); }

// ─── Date Helpers ─────────────────────────────────────────────────────────────
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
  return Math.round((target - today) / 86400000);
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PK", { day:"2-digit", month:"short", year:"numeric" });
}

function todayStr() { return new Date().toISOString().split("T")[0]; }

const DURATIONS = [
  { label: "30 Days", days: 30 },
  { label: "60 Days", days: 60 },
  { label: "90 Days", days: 90 },
  { label: "6 Months", days: 183 },
  { label: "12 Months", days: 365 },
  { label: "Custom", days: 0 },
];

function genId() { return Math.random().toString(36).slice(2, 10); }

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function statusInfo(expiryDate) {
  const days = daysUntil(expiryDate);
  if (days < 0) return { label: "Expired", color: "#ff4d6d", bg: "rgba(255,77,109,0.15)" };
  if (days <= 3) return { label: "Expiring Today", color: "#ffd60a", bg: "rgba(255,214,10,0.15)" };
  if (days <= 7) return { label: "Expiring Soon", color: "#f4a261", bg: "rgba(244,162,97,0.15)" };
  return { label: "Active", color: "#00f5d4", bg: "rgba(0,245,212,0.15)" };
}

// ─── NEON THEME ───────────────────────────────────────────────────────────────
const S = {
  page: { background: "#050a12", minHeight: "100vh", fontFamily: "'Orbitron', 'Rajdhani', monospace", color: "#e0e8ff" },
  sidebar: {
    width: 220, background: "rgba(6,14,30,0.97)",
    borderRight: "1px solid rgba(0,200,255,0.15)",
    height: "100vh", position: "fixed", top: 0, left: 0, zIndex: 100,
    display: "flex", flexDirection: "column",
  },
  content: { marginLeft: 220, padding: "24px 28px", minHeight: "100vh" },
  card: {
    background: "rgba(10,22,45,0.85)",
    border: "1px solid rgba(0,200,255,0.18)",
    borderRadius: 14,
    backdropFilter: "blur(12px)",
    padding: "20px 22px",
  },
  glowCard: {
    background: "linear-gradient(135deg,rgba(0,200,255,0.07) 0%,rgba(120,50,255,0.07) 100%)",
    border: "1px solid rgba(0,200,255,0.25)",
    borderRadius: 14,
    padding: "18px 20px",
    boxShadow: "0 0 20px rgba(0,200,255,0.06)",
  },
  input: {
    background: "rgba(10,22,45,0.9)",
    border: "1px solid rgba(0,200,255,0.25)",
    borderRadius: 8,
    color: "#e0e8ff",
    padding: "9px 14px",
    fontSize: 13,
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
  },
  btn: {
    background: "linear-gradient(135deg,#0096c7,#7b2ff7)",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    padding: "9px 20px",
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "inherit",
    fontWeight: 600,
    letterSpacing: 1,
  },
  btnDanger: {
    background: "rgba(255,77,109,0.15)",
    border: "1px solid rgba(255,77,109,0.4)",
    borderRadius: 8,
    color: "#ff4d6d",
    padding: "7px 14px",
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "inherit",
  },
  btnSecondary: {
    background: "rgba(0,200,255,0.08)",
    border: "1px solid rgba(0,200,255,0.3)",
    borderRadius: 8,
    color: "#00c8ff",
    padding: "7px 14px",
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "inherit",
  },
  label: { fontSize: 11, color: "#6080b0", letterSpacing: 1, marginBottom: 5, display: "block", textTransform: "uppercase" },
  h1: { fontSize: 22, fontWeight: 700, color: "#00c8ff", letterSpacing: 2, margin: 0 },
  h2: { fontSize: 16, fontWeight: 600, color: "#a0c8ff", letterSpacing: 1, margin: "0 0 16px" },
  tag: (color) => ({
    fontSize: 10, fontWeight: 600, letterSpacing: 1,
    padding: "2px 8px", borderRadius: 4,
    background: color + "22", color, border: `1px solid ${color}55`,
  }),
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
  th: { padding: "10px 12px", textAlign: "left", color: "#4080a0", fontSize: 11, letterSpacing: 1, borderBottom: "1px solid rgba(0,200,255,0.1)", background: "rgba(0,200,255,0.04)" },
  td: { padding: "10px 12px", borderBottom: "1px solid rgba(0,200,255,0.06)", verticalAlign: "middle" },
};

// ─── MODAL WRAPPER ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, width = 560 }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,5,15,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ ...S.card, width, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#00c8ff", letterSpacing: 1 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#ff4d6d", fontSize: 20, cursor: "pointer", padding: 0 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── FORM FIELD ───────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  );
}

function Input({ ...props }) {
  return <input style={S.input} {...props} />;
}

function Select({ children, ...props }) {
  return (
    <select style={{ ...S.input, cursor: "pointer" }} {...props}>
      {children}
    </select>
  );
}

function Textarea({ ...props }) {
  return <textarea style={{ ...S.input, minHeight: 70, resize: "vertical" }} {...props} />;
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color = "#00c8ff", sub, icon }) {
  return (
    <div style={{ ...S.glowCard, borderColor: color + "33" }}>
      <div style={{ fontSize: 11, color: "#6080b0", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>{icon && <span style={{ marginRight: 6 }}>{icon}</span>}{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#4060a0", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── LOCK SCREEN ─────────────────────────────────────────────────────────────
function LockScreen({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [digits, setDigits] = useState(4);

  function handleKey(d) {
    if (pin.length >= digits) return;
    const next = pin + d;
    setPin(next);
    setError("");
    if (next.length === digits) {
      setTimeout(() => {
        if (next === getPin().slice(0, digits)) {
          onUnlock();
        } else {
          setError("Wrong PIN");
          setPin("");
        }
      }, 100);
    }
  }

  function handleDel() { setPin(p => p.slice(0, -1)); setError(""); }

  return (
    <div style={{ ...S.page, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 42, fontWeight: 900, background: "linear-gradient(135deg,#00c8ff,#7b2ff7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 4 }}>AA WSW</div>
        <div style={{ fontSize: 13, color: "#4080a0", letterSpacing: 3, marginTop: 6 }}>SUBSCRIPTION MANAGER</div>
      </div>
      <div style={{ ...S.card, width: 320, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "#6080b0", letterSpacing: 2, marginBottom: 20 }}>ENTER PIN</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 28 }}>
          {Array.from({ length: digits }).map((_, i) => (
            <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", background: i < pin.length ? "#00c8ff" : "transparent", border: "2px solid " + (i < pin.length ? "#00c8ff" : "#2040608") , boxShadow: i < pin.length ? "0 0 8px #00c8ff" : "none", transition: "all 0.15s" }} />
          ))}
        </div>
        {error && <div style={{ color: "#ff4d6d", fontSize: 12, marginBottom: 14 }}>{error}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 10 }}>
          {[1,2,3,4,5,6,7,8,9].map(d => (
            <button key={d} onClick={() => handleKey(String(d))} style={{ ...S.btn, background: "rgba(0,200,255,0.08)", border: "1px solid rgba(0,200,255,0.2)", color: "#e0e8ff", padding: "14px 0", fontSize: 18, fontWeight: 700 }}>{d}</button>
          ))}
          <button onClick={() => setDigits(d => d === 4 ? 6 : 4)} style={{ ...S.btn, background: "transparent", border: "1px solid rgba(120,50,255,0.3)", color: "#7b2ff7", fontSize: 10, padding: "8px 0" }}>{digits === 4 ? "6-PIN" : "4-PIN"}</button>
          <button onClick={() => handleKey("0")} style={{ ...S.btn, background: "rgba(0,200,255,0.08)", border: "1px solid rgba(0,200,255,0.2)", color: "#e0e8ff", padding: "14px 0", fontSize: 18, fontWeight: 700 }}>0</button>
          <button onClick={handleDel} style={{ ...S.btn, background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.2)", color: "#ff4d6d", padding: "14px 0", fontSize: 18 }}>⌫</button>
        </div>
      </div>
    </div>
  );
}

// ─── NAV ITEMS ────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "⬡" },
  { id: "customers", label: "Customers", icon: "👥" },
  { id: "subscriptions", label: "Subscriptions", icon: "📦" },
  { id: "accounts", label: "Accounts", icon: "🔑" },
  { id: "renewals", label: "Renewals", icon: "🔄" },
  { id: "payments", label: "Payments", icon: "💳" },
  { id: "expenses", label: "Expenses", icon: "📉" },
  { id: "revenue", label: "Revenue", icon: "📈" },
  { id: "reports", label: "Reports", icon: "📊" },
  { id: "reminders", label: "Reminders", icon: "🔔" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ active, setActive, onLock }) {
  return (
    <div style={S.sidebar}>
      <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid rgba(0,200,255,0.1)" }}>
        <div style={{ fontSize: 22, fontWeight: 900, background: "linear-gradient(135deg,#00c8ff,#7b2ff7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 3 }}>AA WSW</div>
        <div style={{ fontSize: 9, color: "#3060a0", letterSpacing: 2, marginTop: 2 }}>SUBSCRIPTION MANAGER</div>
      </div>
      <nav style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
        {NAV.map(n => (
          <div key={n.id} onClick={() => setActive(n.id)} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 18px", cursor: "pointer",
            background: active === n.id ? "rgba(0,200,255,0.1)" : "transparent",
            borderLeft: active === n.id ? "3px solid #00c8ff" : "3px solid transparent",
            color: active === n.id ? "#00c8ff" : "#6080a0",
            fontSize: 13, fontWeight: active === n.id ? 700 : 400,
            transition: "all 0.15s", letterSpacing: 0.5,
          }}>
            <span style={{ fontSize: 15 }}>{n.icon}</span>
            <span>{n.label}</span>
          </div>
        ))}
      </nav>
      <div style={{ padding: "12px 18px", borderTop: "1px solid rgba(0,200,255,0.1)" }}>
        <button onClick={onLock} style={{ ...S.btnSecondary, width: "100%", textAlign: "center" }}>🔒 Lock</button>
      </div>
    </div>
  );
}

// ─── BOTTOM NAV (mobile) ──────────────────────────────────────────────────────
function BottomNav({ active, setActive }) {
  const items = [
    { id: "dashboard", label: "Home", icon: "⬡" },
    { id: "customers", label: "Customers", icon: "👥" },
    { id: "accounts", label: "Accounts", icon: "🔑" },
    { id: "revenue", label: "Revenue", icon: "📈" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200, background: "rgba(6,14,30,0.97)", borderTop: "1px solid rgba(0,200,255,0.15)", display: "flex" }}>
      {items.map(n => (
        <div key={n.id} onClick={() => setActive(n.id)} style={{ flex: 1, textAlign: "center", padding: "10px 0", cursor: "pointer", color: active === n.id ? "#00c8ff" : "#4060a0", fontSize: n.id === active ? 11 : 10, fontWeight: active === n.id ? 700 : 400 }}>
          <div style={{ fontSize: 20 }}>{n.icon}</div>
          <div>{n.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── QUICK ADD SUBSCRIPTION (inline mini-form) ────────────────────────────────
function QuickAddSub({ onAdd, onCancel }) {
  const [f, setF] = useState({ name: "", icon: "📱", accountCost: "", sellingPrice: "", totalSeats: 1, description: "" });
  function set(k, v) { setF(p => ({ ...p, [k]: v })); }
  function submit() {
    if (!f.name.trim()) { alert("Service name required"); return; }
    onAdd({ ...f, id: genId(), totalSeats: parseInt(f.totalSeats) || 1, category: "Custom" });
  }
  return (
    <div style={{ background: "rgba(0,200,255,0.04)", border: "1px dashed rgba(0,200,255,0.3)", borderRadius: 10, padding: 14, marginTop: 8 }}>
      <div style={{ fontSize: 11, color: "#00c8ff", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>✨ New Custom Subscription</div>
      <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 1fr 1fr 1fr", gap: 8, alignItems: "end", marginBottom: 10 }}>
        <div>
          <label style={S.label}>Icon</label>
          <Input value={f.icon} onChange={e => set("icon", e.target.value)} style={{ ...S.input, padding: "7px 4px", textAlign: "center", fontSize: 20 }} maxLength={2} />
        </div>
        <div>
          <label style={S.label}>Name *</label>
          <Input value={f.name} onChange={e => set("name", e.target.value)} placeholder="e.g. IPTV" />
        </div>
        <div>
          <label style={S.label}>Account Cost</label>
          <Input type="number" value={f.accountCost} onChange={e => set("accountCost", e.target.value)} placeholder="₨" />
        </div>
        <div>
          <label style={S.label}>Sell Price/Seat</label>
          <Input type="number" value={f.sellingPrice} onChange={e => set("sellingPrice", e.target.value)} placeholder="₨" />
        </div>
        <div>
          <label style={S.label}>Seats</label>
          <Input type="number" value={f.totalSeats} onChange={e => set("totalSeats", e.target.value)} placeholder="1" min="1" />
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={S.label}>Description (optional)</label>
        <Input value={f.description} onChange={e => set("description", e.target.value)} placeholder="Short note about this service" />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={submit} style={{ ...S.btn, padding: "7px 18px", fontSize: 12 }}>✓ Add & Select</button>
        <button onClick={onCancel} style={S.btnSecondary}>Cancel</button>
      </div>
    </div>
  );
}

// ─── CUSTOMER FORM ────────────────────────────────────────────────────────────
function CustomerForm({ data, subscriptions: initSubs, accounts, onSave, onClose, onAddSubscription }) {
  const [form, setForm] = useState(data || {
    id: genId(), name: "", whatsapp: "", subscriptionId: "", accountId: "", screen: "",
    issueDate: todayStr(), duration: 30, customDays: 30, expiryDate: addDays(todayStr(), 30),
    sellingPrice: "", amountPaid: "", paymentStatus: "Pending", notes: "", status: "Active",
    tags: [], renewalHistory: [],
  });
  const [showQuickSub, setShowQuickSub] = useState(false);
  // local copy of subs so newly added ones appear immediately
  const [localSubs, setLocalSubs] = useState(initSubs);

  function set(k, v) {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === "issueDate" || k === "duration" || k === "customDays") {
        const days = k === "duration" ? (v === 0 ? f.customDays : v) : (k === "customDays" ? v : (f.duration === 0 ? v : f.duration));
        const issue = k === "issueDate" ? v : f.issueDate;
        next.expiryDate = addDays(issue, days);
      }
      if (k === "amountPaid") {
        const paid = parseFloat(v) || 0;
        const total = parseFloat(next.sellingPrice) || 0;
        next.paymentStatus = paid >= total ? "Paid" : paid > 0 ? "Partial" : "Pending";
      }
      return next;
    });
  }

  function handleSubChange(id) {
    set("subscriptionId", id);
    set("accountId", "");
    set("screen", "");
    const s = localSubs.find(x => x.id === id);
    if (s && s.sellingPrice) set("sellingPrice", s.sellingPrice);
  }

  function handleQuickAdd(newSub) {
    setLocalSubs(prev => [...prev, newSub]);
    onAddSubscription(newSub); // persist to global data
    setShowQuickSub(false);
    handleSubChange(newSub.id);
  }

  const sub = localSubs.find(s => s.id === form.subscriptionId);

  // Smart screen suggestion: find used screens for this account, suggest next free one
  const accountCustomers = data.customers.filter(c => c.accountId === form.accountId && c.id !== form.id);
  const usedScreens = new Set(accountCustomers.map(c => c.screen).filter(Boolean));
  const totalSeats = parseInt(sub?.totalSeats) || 0;
  const suggestedScreens = totalSeats > 0
    ? Array.from({ length: totalSeats }, (_, i) => `Screen ${i+1}`).filter(s => !usedScreens.has(s))
    : [];
  const freeCount = suggestedScreens.length;

  const TAGS = ["VIP","Trusted","Monthly","Late Payer"];
  function toggleTag(t) { set("tags", form.tags.includes(t) ? form.tags.filter(x => x !== t) : [...form.tags, t]); }

  const remaining = (parseFloat(form.sellingPrice)||0) - (parseFloat(form.amountPaid)||0);

  return (
    <div>
      {/* ── Basic Info ── */}
      <div style={{ fontSize: 10, color: "#4080a0", letterSpacing: 2, marginBottom: 10, textTransform: "uppercase", borderBottom: "1px solid rgba(0,200,255,0.08)", paddingBottom: 8 }}>👤 Customer Info</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 4 }}>
        <Field label="Customer Name *"><Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Full Name" /></Field>
        <Field label="WhatsApp Number"><Input value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} placeholder="+92300..." /></Field>
      </div>

      {/* ── Subscription Selection ── */}
      <div style={{ fontSize: 10, color: "#4080a0", letterSpacing: 2, margin: "14px 0 10px", textTransform: "uppercase", borderBottom: "1px solid rgba(0,200,255,0.08)", paddingBottom: 8 }}>📦 Subscription</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "end", marginBottom: 4 }}>
        <Field label="Select Service">
          <Select value={form.subscriptionId} onChange={e => handleSubChange(e.target.value)}>
            <option value="">— Choose a subscription —</option>
            {localSubs.map(s => <option key={s.id} value={s.id}>{s.icon ? s.icon + " " : ""}{s.name}{s.sellingPrice ? ` — ₨${s.sellingPrice}/seat` : ""}</option>)}
          </Select>
        </Field>
        <div style={{ paddingBottom: 0 }}>
          <button onClick={() => setShowQuickSub(v => !v)} style={{ ...S.btnSecondary, color: showQuickSub ? "#ff4d6d" : "#7b2ff7", borderColor: showQuickSub ? "rgba(255,77,109,0.3)" : "rgba(123,47,247,0.4)", whiteSpace: "nowrap", padding: "9px 14px" }}>
            {showQuickSub ? "✕ Cancel" : "✨ New Service"}
          </button>
        </div>
      </div>

      {/* Selected sub info strip */}
      {sub && (
        <div style={{ display: "flex", gap: 12, background: "rgba(0,200,255,0.05)", border: "1px solid rgba(0,200,255,0.12)", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 11, flexWrap: "wrap" }}>
          <span style={{ color: "#a0c8ff" }}>{sub.icon} <strong>{sub.name}</strong></span>
          <span style={{ color: "#4080a0" }}>·</span>
          <span style={{ color: "#6080a0" }}>Cost/seat: <span style={{ color: "#ff4d6d" }}>₨{sub.totalSeats > 0 ? ((parseFloat(sub.accountCost)||0)/parseInt(sub.totalSeats)).toFixed(0) : "—"}</span></span>
          <span style={{ color: "#4080a0" }}>·</span>
          <span style={{ color: "#6080a0" }}>Sell price: <span style={{ color: "#00f5d4" }}>₨{sub.sellingPrice}</span></span>
          <span style={{ color: "#4080a0" }}>·</span>
          <span style={{ color: "#6080a0" }}>Seats: <span style={{ color: "#a0c8ff" }}>{totalSeats > 0 ? `${totalSeats} total, ${freeCount} free` : "Unlimited"}</span></span>
          {sub.description && <><span style={{ color: "#4080a0" }}>·</span><span style={{ color: "#4060a0" }}>{sub.description}</span></>}
        </div>
      )}

      {showQuickSub && <QuickAddSub onAdd={handleQuickAdd} onCancel={() => setShowQuickSub(false)} />}

      {/* ── Account & Screen ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
        <Field label="Account (Optional)">
          <Select value={form.accountId} onChange={e => { set("accountId", e.target.value); set("screen", ""); }}>
            <option value="">— No account —</option>
            {accounts.filter(a => !form.subscriptionId || a.serviceId === form.subscriptionId).map(a => <option key={a.id} value={a.id}>{a.email}</option>)}
          </Select>
        </Field>
        <div>
          <label style={S.label}>
            Screen / Profile
            {freeCount > 0 && <span style={{ color: "#00f5d4", marginLeft: 6, fontWeight: 700 }}>({freeCount} free)</span>}
          </label>
          {suggestedScreens.length > 0 ? (
            <Select value={form.screen} onChange={e => set("screen", e.target.value)}>
              <option value="">— Select screen —</option>
              {suggestedScreens.map(s => <option key={s} value={s}>{s} ✓ Free</option>)}
              {Array.from({ length: totalSeats }, (_, i) => `Screen ${i+1}`).filter(s => usedScreens.has(s)).map(s => {
                const c = accountCustomers.find(x => x.screen === s);
                return <option key={s} value={s} disabled>{s} — {c?.name || "Taken"}</option>;
              })}
            </Select>
          ) : (
            <Input value={form.screen} onChange={e => set("screen", e.target.value)} placeholder="e.g. Screen 1, Profile A" />
          )}
        </div>
      </div>

      {/* ── Duration & Dates ── */}
      <div style={{ fontSize: 10, color: "#4080a0", letterSpacing: 2, margin: "14px 0 10px", textTransform: "uppercase", borderBottom: "1px solid rgba(0,200,255,0.08)", paddingBottom: 8 }}>📅 Duration & Dates</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Issue Date"><Input type="date" value={form.issueDate} onChange={e => set("issueDate", e.target.value)} /></Field>
        <Field label="Duration">
          <Select value={form.duration} onChange={e => set("duration", parseInt(e.target.value))}>
            {DURATIONS.map(d => <option key={d.days} value={d.days}>{d.label}</option>)}
          </Select>
        </Field>
        {form.duration === 0
          ? <Field label="Custom Days"><Input type="number" value={form.customDays} onChange={e => set("customDays", parseInt(e.target.value))} /></Field>
          : <Field label="Expiry Date"><Input type="date" value={form.expiryDate} readOnly style={{ ...S.input, opacity: 0.7 }} /></Field>
        }
        {form.duration === 0 && <Field label="Expiry Date"><Input type="date" value={form.expiryDate} readOnly style={{ ...S.input, opacity: 0.7 }} /></Field>}
      </div>

      {/* ── Payment ── */}
      <div style={{ fontSize: 10, color: "#4080a0", letterSpacing: 2, margin: "14px 0 10px", textTransform: "uppercase", borderBottom: "1px solid rgba(0,200,255,0.08)", paddingBottom: 8 }}>💳 Payment</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Selling Price (PKR)"><Input type="number" value={form.sellingPrice} onChange={e => set("sellingPrice", e.target.value)} placeholder="0" /></Field>
        <Field label="Amount Paid (PKR)"><Input type="number" value={form.amountPaid} onChange={e => set("amountPaid", e.target.value)} placeholder="0" /></Field>
        <Field label="Payment Status">
          <Select value={form.paymentStatus} onChange={e => set("paymentStatus", e.target.value)}>
            <option>Pending</option><option>Partial</option><option>Paid</option>
          </Select>
        </Field>
      </div>
      {(parseFloat(form.sellingPrice) > 0) && (
        <div style={{ display: "flex", gap: 10, background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "8px 12px", marginBottom: 4, fontSize: 12 }}>
          <span style={{ color: "#6080a0" }}>Total: <span style={{ color: "#a0c8ff" }}>₨{form.sellingPrice}</span></span>
          <span style={{ color: "#4080a0" }}>·</span>
          <span style={{ color: "#6080a0" }}>Paid: <span style={{ color: "#00f5d4" }}>₨{form.amountPaid||0}</span></span>
          <span style={{ color: "#4080a0" }}>·</span>
          <span style={{ color: "#6080a0" }}>Remaining: <span style={{ color: remaining > 0 ? "#ff4d6d" : "#00f5d4", fontWeight: 700 }}>₨{remaining}</span></span>
        </div>
      )}

      {/* ── Tags & Notes ── */}
      <Field label="Tags" ><div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
        {TAGS.map(t => (
          <button key={t} onClick={() => toggleTag(t)} style={{ ...S.tag(form.tags.includes(t) ? "#00c8ff" : "#4060a0"), cursor: "pointer", border: form.tags.includes(t) ? "1px solid #00c8ff55" : "1px solid #30507055", padding: "4px 10px" }}>
            {form.tags.includes(t) ? "✓ " : ""}{t}
          </button>
        ))}
      </div></Field>
      <Field label="Notes"><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any notes..." /></Field>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button onClick={() => { if (!form.name.trim()) { alert("Customer name is required"); return; } onSave(form); }} style={S.btn}>💾 Save Customer</button>
        <button onClick={onClose} style={S.btnSecondary}>Cancel</button>
      </div>
    </div>
  );
}

// ─── CUSTOMERS PAGE ───────────────────────────────────────────────────────────
function CustomersPage({ data, setData }) {
  const [modal, setModal] = useState(null); // null | "add" | {customer}
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterSub, setFilterSub] = useState("All");

  function saveCustomer(c) {
    setData(d => {
      const exists = d.customers.find(x => x.id === c.id);
      const customers = exists ? d.customers.map(x => x.id === c.id ? c : x) : [...d.customers, c];
      return { ...d, customers };
    });
    setModal(null);
  }

  function deleteCustomer(id) {
    if (!confirm("Delete this customer?")) return;
    setData(d => ({ ...d, customers: d.customers.filter(c => c.id !== id) }));
  }

  function renewCustomer(c) {
    const duration = c.duration || 30;
    const newExpiry = addDays(todayStr(), duration);
    const renewed = {
      ...c,
      issueDate: todayStr(),
      expiryDate: newExpiry,
      renewalHistory: [...(c.renewalHistory || []), { date: todayStr(), expiry: newExpiry }],
    };
    saveCustomer(renewed);
  }

  const filtered = data.customers.filter(c => {
    const si = statusInfo(c.expiryDate);
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.whatsapp.includes(search);
    const matchStatus = filterStatus === "All" || si.label === filterStatus || (filterStatus === "Active" && si.label === "Active") || (filterStatus === "Expired" && si.label === "Expired");
    const matchSub = filterSub === "All" || c.subscriptionId === filterSub;
    return matchSearch && matchStatus && matchSub;
  });

  function whatsappReminder(c) {
    const sub = data.subscriptions.find(s => s.id === c.subscriptionId);
    const msg = encodeURIComponent(`Dear ${c.name},\n\nYour *${sub?.name || "subscription"}* expires on *${formatDate(c.expiryDate)}*.\n\nRenewal Price: PKR ${c.sellingPrice}\n\nPlease renew to continue service.\n\n_AA WSW_`);
    window.open(`https://wa.me/${c.whatsapp.replace(/\D/g,"")}?text=${msg}`);
  }

  const TAG_COLORS = { VIP: "#ffd60a", Trusted: "#00f5d4", Monthly: "#7b2ff7", "Late Payer": "#ff4d6d" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={S.h1}>Customers</h1>
        <button onClick={() => setModal("add")} style={S.btn}>+ Add Customer</button>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search..." style={{ ...S.input, width: 200 }} />
        <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...S.input, width: 140 }}>
          <option>All</option><option>Active</option><option>Expired</option><option>Expiring Soon</option>
        </Select>
        <Select value={filterSub} onChange={e => setFilterSub(e.target.value)} style={{ ...S.input, width: 160 }}>
          <option value="All">All Services</option>
          {data.subscriptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>
      <div style={S.card}>
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>{["Name","WhatsApp","Service","Screen","Issue","Expiry","Price","Paid","Status","Tags","Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={11} style={{ ...S.td, textAlign: "center", color: "#3060a0" }}>No customers found</td></tr>}
              {filtered.map(c => {
                const si = statusInfo(c.expiryDate);
                const sub = data.subscriptions.find(s => s.id === c.subscriptionId);
                const remaining = (parseFloat(c.sellingPrice) || 0) - (parseFloat(c.amountPaid) || 0);
                return (
                  <tr key={c.id}>
                    <td style={S.td}><div style={{ fontWeight: 600, color: "#c0e0ff" }}>{c.name}</div></td>
                    <td style={S.td}><span style={{ color: "#00c8ff", fontSize: 11 }}>{c.whatsapp}</span></td>
                    <td style={S.td}><span style={{ color: "#a0c8ff" }}>{sub?.name || "—"}</span></td>
                    <td style={S.td}><span style={{ color: "#7b9fc0" }}>{c.screen || "—"}</span></td>
                    <td style={S.td}><span style={{ fontSize: 11, color: "#6080a0" }}>{formatDate(c.issueDate)}</span></td>
                    <td style={S.td}><span style={{ fontSize: 11, color: si.color }}>{formatDate(c.expiryDate)}</span></td>
                    <td style={S.td}><span style={{ color: "#00f5d4" }}>₨{c.sellingPrice || 0}</span></td>
                    <td style={S.td}>
                      <span style={{ color: remaining > 0 ? "#ff4d6d" : "#00f5d4", fontSize: 11 }}>
                        ₨{c.amountPaid || 0}{remaining > 0 && <span style={{ color: "#ff4d6d" }}> (-{remaining})</span>}
                      </span>
                    </td>
                    <td style={S.td}><span style={{ ...S.tag(si.color) }}>{si.label}</span></td>
                    <td style={S.td}><div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{(c.tags || []).map(t => <span key={t} style={{ ...S.tag(TAG_COLORS[t] || "#6080a0") }}>{t}</span>)}</div></td>
                    <td style={S.td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setModal(c)} style={S.btnSecondary}>Edit</button>
                        <button onClick={() => renewCustomer(c)} style={{ ...S.btnSecondary, color: "#00f5d4", borderColor: "rgba(0,245,212,0.3)" }}>Renew</button>
                        <button onClick={() => whatsappReminder(c)} style={{ ...S.btnSecondary, color: "#25d366", borderColor: "rgba(37,211,102,0.3)" }}>WA</button>
                        <button onClick={() => deleteCustomer(c.id)} style={S.btnDanger}>✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {(modal === "add" || (modal && modal.id)) && (
        <Modal title={modal === "add" ? "Add Customer" : "Edit Customer"} onClose={() => setModal(null)} width={680}>
          <CustomerForm data={modal !== "add" ? modal : null} subscriptions={data.subscriptions} accounts={data.accounts} onSave={saveCustomer} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

// ─── SUBSCRIPTIONS PAGE ───────────────────────────────────────────────────────
const PRESET_SERVICES = [
  { name: "Netflix", icon: "🎬", accountCost: 1500, sellingPrice: 700, totalSeats: 4, description: "Netflix Premium" },
  { name: "Spotify Premium", icon: "🎵", accountCost: 400, sellingPrice: 200, totalSeats: 6, description: "Spotify Family Plan" },
  { name: "YouTube Premium", icon: "▶️", accountCost: 600, sellingPrice: 250, totalSeats: 5, description: "YouTube Family" },
  { name: "Amazon Prime", icon: "📦", accountCost: 300, sellingPrice: 180, totalSeats: 3, description: "Amazon Prime Video" },
  { name: "Canva Pro", icon: "🎨", accountCost: 500, sellingPrice: 300, totalSeats: 5, description: "Canva Team Plan" },
  { name: "ChatGPT Plus", icon: "🤖", accountCost: 2000, sellingPrice: 1000, totalSeats: 1, description: "OpenAI GPT-4" },
  { name: "CapCut Pro", icon: "🎞️", accountCost: 800, sellingPrice: 400, totalSeats: 4, description: "CapCut Pro Plan" },
  { name: "Microsoft 365", icon: "💻", accountCost: 1200, sellingPrice: 600, totalSeats: 6, description: "Microsoft 365 Family" },
  { name: "Adobe Creative Cloud", icon: "🅰️", accountCost: 3000, sellingPrice: 1500, totalSeats: 2, description: "Adobe CC All Apps" },
  { name: "Disney+", icon: "🏰", accountCost: 800, sellingPrice: 400, totalSeats: 4, description: "Disney+ Premium" },
  { name: "HBO Max", icon: "🎭", accountCost: 1000, sellingPrice: 500, totalSeats: 3, description: "HBO Max Premium" },
  { name: "Apple TV+", icon: "🍎", accountCost: 700, sellingPrice: 350, totalSeats: 6, description: "Apple TV+ Family" },
  { name: "LinkedIn Premium", icon: "💼", accountCost: 2500, sellingPrice: 1200, totalSeats: 1, description: "LinkedIn Career" },
  { name: "Duolingo Plus", icon: "🦜", accountCost: 600, sellingPrice: 300, totalSeats: 1, description: "Duolingo Super" },
  { name: "Grammarly Premium", icon: "✍️", accountCost: 1000, sellingPrice: 500, totalSeats: 1, description: "Grammarly Premium" },
  { name: "VPN Premium", icon: "🔒", accountCost: 400, sellingPrice: 200, totalSeats: 5, description: "VPN Service" },
];

const EMOJI_OPTIONS = ["📱","🎬","🎵","▶️","📦","🎨","🤖","🎞️","💻","🅰️","🏰","🎭","🍎","💼","🦜","✍️","🔒","🌐","📺","🎮","📸","🎓","💡","⚡","🔥","💎","🚀","🌟","🎯","🏆","🛡️","📊","🔑","💰","🌈","🎪","🧩","🎲","🎸","🎙️"];

function SubForm({ initial, onSave, onClose }) {
  const blank = { id: genId(), name: "", icon: "📱", accountCost: "", sellingPrice: "", totalSeats: "", description: "", category: "Entertainment" };
  const [form, setForm] = useState(initial || blank);
  const [showEmoji, setShowEmoji] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  const costPerSeat = form.totalSeats > 0 ? (parseFloat(form.accountCost) || 0) / parseInt(form.totalSeats) : 0;
  const profitPerSeat = (parseFloat(form.sellingPrice) || 0) - costPerSeat;
  const totalProfit = profitPerSeat * parseInt(form.totalSeats || 0);
  const margin = form.sellingPrice > 0 ? ((profitPerSeat / parseFloat(form.sellingPrice)) * 100) : 0;

  const CATEGORIES = ["Entertainment","Productivity","Music","Education","Security","Social","Design","AI Tools","Other"];

  return (
    <div>
      {/* Icon + Name row */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 16 }}>
        <div style={{ position: "relative" }}>
          <label style={S.label}>Icon</label>
          <button onClick={() => setShowEmoji(v => !v)} style={{ ...S.input, width: 60, fontSize: 26, textAlign: "center", cursor: "pointer", padding: "6px 0" }}>{form.icon || "📱"}</button>
          {showEmoji && (
            <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 50, background: "#08152a", border: "1px solid rgba(0,200,255,0.25)", borderRadius: 10, padding: 10, display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 4, width: 280 }}>
              {EMOJI_OPTIONS.map(e => (
                <button key={e} onClick={() => { set("icon", e); setShowEmoji(false); }} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: 4, borderRadius: 6, transition: "background 0.1s" }}
                  onMouseEnter={ev => ev.target.style.background = "rgba(0,200,255,0.15)"}
                  onMouseLeave={ev => ev.target.style.background = "none"}
                >{e}</button>
              ))}
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Service Name">
            <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. My Custom Service" />
          </Field>
        </div>
        <div style={{ width: 140 }}>
          <Field label="Category">
            <Select value={form.category} onChange={e => set("category", e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </Select>
          </Field>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Field label="Account Cost (PKR)">
          <Input type="number" value={form.accountCost} onChange={e => set("accountCost", e.target.value)} placeholder="Total you pay" />
        </Field>
        <Field label="Selling Price / Seat (PKR)">
          <Input type="number" value={form.sellingPrice} onChange={e => set("sellingPrice", e.target.value)} placeholder="Price per customer" />
        </Field>
        <Field label="Total Seats / Screens">
          <Input type="number" value={form.totalSeats} onChange={e => set("totalSeats", e.target.value)} placeholder="How many slots?" />
        </Field>
      </div>

      <Field label="Description">
        <Input value={form.description} onChange={e => set("description", e.target.value)} placeholder="Short description (optional)" />
      </Field>

      {/* Live Profit Calculator */}
      {(form.accountCost || form.sellingPrice || form.totalSeats) && (
        <div style={{ background: "rgba(0,200,255,0.04)", border: "1px solid rgba(0,200,255,0.15)", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#4080a0", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>📊 Live Profit Calculator</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {[
              { label: "Cost / Seat", val: `₨${costPerSeat.toFixed(0)}`, color: "#ff4d6d" },
              { label: "Profit / Seat", val: `₨${profitPerSeat.toFixed(0)}`, color: profitPerSeat >= 0 ? "#00f5d4" : "#ff4d6d" },
              { label: "Total Profit", val: `₨${totalProfit.toFixed(0)}`, color: totalProfit >= 0 ? "#00f5d4" : "#ff4d6d" },
              { label: "Margin", val: `${margin.toFixed(0)}%`, color: margin >= 30 ? "#00f5d4" : margin >= 0 ? "#ffd60a" : "#ff4d6d" },
            ].map(x => (
              <div key={x.label} style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#4080a0", marginBottom: 4 }}>{x.label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: x.color }}>{x.val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => { if (!form.name.trim()) { alert("Service name is required"); return; } onSave(form); }} style={S.btn}>💾 Save Service</button>
        <button onClick={onClose} style={S.btnSecondary}>Cancel</button>
      </div>
    </div>
  );
}

function SubscriptionsPage({ data, setData }) {
  const [modal, setModal] = useState(null); // null | "add" | "custom" | service-obj
  const [search, setSearch] = useState("");

  function save(form) {
    setData(d => {
      const exists = d.subscriptions.find(x => x.id === form.id);
      const subscriptions = exists ? d.subscriptions.map(x => x.id === form.id ? form : x) : [...d.subscriptions, form];
      return { ...d, subscriptions };
    });
    setModal(null);
  }

  function addPreset(p) {
    if (data.subscriptions.find(s => s.name === p.name)) { alert(`${p.name} already exists!`); return; }
    save({ ...p, id: genId() });
  }

  function del(id) {
    if (!confirm("Delete this subscription service?")) return;
    setData(d => ({ ...d, subscriptions: d.subscriptions.filter(s => s.id !== id) }));
  }

  const existingNames = new Set(data.subscriptions.map(s => s.name));
  const filteredSubs = data.subscriptions.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.category || "").toLowerCase().includes(search.toLowerCase())
  );
  const availablePresets = PRESET_SERVICES.filter(p => !existingNames.has(p.name));

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h1 style={S.h1}>Subscriptions</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search..." style={{ ...S.input, width: 180 }} />
          <button onClick={() => setModal("custom")} style={{ ...S.btn, background: "linear-gradient(135deg,#7b2ff7,#0096c7)" }}>✨ Add Custom</button>
        </div>
      </div>

      {/* Quick-add presets (only show if not all added) */}
      {availablePresets.length > 0 && !search && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#4080a0", letterSpacing: 1, textTransform: "uppercase" }}>⚡ Quick Add Popular Services</div>
            <div style={{ flex: 1, height: 1, background: "rgba(0,200,255,0.1)" }} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {availablePresets.map(p => (
              <button key={p.name} onClick={() => addPreset(p)} title={`Add ${p.name} — ₨${p.accountCost} cost, ₨${p.sellingPrice}/seat, ${p.totalSeats} seats`}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(10,22,45,0.8)", border: "1px dashed rgba(0,200,255,0.25)", borderRadius: 20, padding: "6px 14px", cursor: "pointer", color: "#a0c8ff", fontSize: 12, transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,200,255,0.6)"; e.currentTarget.style.color = "#00c8ff"; e.currentTarget.style.background = "rgba(0,200,255,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,200,255,0.25)"; e.currentTarget.style.color = "#a0c8ff"; e.currentTarget.style.background = "rgba(10,22,45,0.8)"; }}
              >
                <span>{p.icon}</span><span>{p.name}</span><span style={{ color: "#3060a0", fontSize: 10 }}>+</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active services grid */}
      {filteredSubs.length === 0 && (
        <div style={{ ...S.card, textAlign: "center", padding: 48, color: "#3060a0" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div style={{ marginBottom: 8 }}>{search ? "No services match your search" : "No subscription services yet"}</div>
          <div style={{ fontSize: 12 }}>Use Quick Add above or click <strong style={{ color: "#00c8ff" }}>✨ Add Custom</strong></div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 14 }}>
        {filteredSubs.map(s => {
          const customers = data.customers.filter(c => c.subscriptionId === s.id);
          const seats = parseInt(s.totalSeats) || 0;
          const costPerSeat = seats > 0 ? (parseFloat(s.accountCost) || 0) / seats : 0;
          const profit = (parseFloat(s.sellingPrice) || 0) - costPerSeat;
          const fillPct = seats > 0 ? Math.min(100, (customers.length / seats) * 100) : 0;
          return (
            <div key={s.id} style={{ ...S.glowCard, position: "relative", overflow: "hidden" }}>
              {/* Capacity bar bg */}
              <div style={{ position: "absolute", bottom: 0, left: 0, height: 3, width: "100%", background: "rgba(0,200,255,0.08)" }}>
                <div style={{ height: "100%", width: `${fillPct}%`, background: fillPct >= 90 ? "linear-gradient(90deg,#ff4d6d,#f4a261)" : "linear-gradient(90deg,#00c8ff,#7b2ff7)", transition: "width 0.4s" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 28, lineHeight: 1 }}>{s.icon || "📦"}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#a0d4ff" }}>{s.name}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                      {s.category && <span style={{ ...S.tag("#7b2ff7"), fontSize: 9 }}>{s.category}</span>}
                      <span style={{ fontSize: 11, color: "#4060a0" }}>{s.description}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  <button onClick={() => setModal(s)} style={S.btnSecondary}>Edit</button>
                  <button onClick={() => del(s.id)} style={S.btnDanger}>✕</button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, fontSize: 12, marginBottom: 10 }}>
                {[
                  { label: "COST", val: `₨${s.accountCost || 0}`, color: "#ff4d6d" },
                  { label: "PRICE/SEAT", val: `₨${s.sellingPrice || 0}`, color: "#00f5d4" },
                  { label: "SEATS", val: `${customers.length}/${seats}`, color: "#a0c8ff" },
                  { label: "COST/SEAT", val: `₨${costPerSeat.toFixed(0)}`, color: "#c0a0ff" },
                  { label: "PROFIT/SEAT", val: `₨${profit.toFixed(0)}`, color: profit >= 0 ? "#00f5d4" : "#ff4d6d" },
                  { label: "CUSTOMERS", val: customers.length, color: "#00c8ff" },
                ].map(x => (
                  <div key={x.label} style={{ background: "rgba(0,200,255,0.05)", borderRadius: 6, padding: "6px 8px" }}>
                    <div style={{ color: "#3060a0", fontSize: 9, marginBottom: 2 }}>{x.label}</div>
                    <div style={{ color: x.color, fontWeight: 700 }}>{x.val}</div>
                  </div>
                ))}
              </div>

              {/* Seat dots */}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {Array.from({ length: seats }).map((_, i) => {
                  const cust = customers.find(c => c.screen === `Screen ${i+1}`);
                  return (
                    <div key={i} title={cust ? cust.name : `Screen ${i+1} — Available`}
                      style={{ width: 20, height: 20, borderRadius: 4, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
                        background: cust ? "rgba(255,77,109,0.2)" : "rgba(0,245,212,0.15)",
                        border: `1px solid ${cust ? "#ff4d6d55" : "#00f5d455"}`,
                        color: cust ? "#ff4d6d" : "#00f5d4",
                      }}>{i+1}</div>
                  );
                })}
                {seats === 0 && <span style={{ fontSize: 11, color: "#3060a0" }}>No seats configured</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Add / Edit Modal */}
      {(modal === "custom" || (modal && modal.id)) && (
        <Modal title={modal === "custom" ? "✨ Add Custom Subscription" : `Edit — ${modal.name}`} onClose={() => setModal(null)} width={640}>
          <SubForm initial={modal !== "custom" ? modal : null} onSave={save} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

// ─── ACCOUNTS PAGE ────────────────────────────────────────────────────────────
function AccountsPage({ data, setData }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ id: genId(), serviceId: "", email: "", password: "", purchaseDate: todayStr(), renewalDate: "", notes: "" });
  const [showPass, setShowPass] = useState({});

  function openAdd() { setForm({ id: genId(), serviceId: "", email: "", password: "", purchaseDate: todayStr(), renewalDate: "", notes: "" }); setModal("add"); }
  function openEdit(a) { setForm(a); setModal("edit"); }
  function save() {
    setData(d => {
      const exists = d.accounts.find(x => x.id === form.id);
      const accounts = exists ? d.accounts.map(x => x.id === form.id ? form : x) : [...d.accounts, form];
      return { ...d, accounts };
    });
    setModal(null);
  }
  function del(id) { if (!confirm("Delete?")) return; setData(d => ({ ...d, accounts: d.accounts.filter(a => a.id !== id) })); }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={S.h1}>Accounts</h1>
        <button onClick={openAdd} style={S.btn}>+ Add Account</button>
      </div>
      <div style={S.card}>
        <table style={S.table}>
          <thead><tr>{["Service","Email","Password","Purchase","Renewal","Customers","Screens","Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {data.accounts.length === 0 && <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: "#3060a0" }}>No accounts added</td></tr>}
            {data.accounts.map(a => {
              const sub = data.subscriptions.find(s => s.id === a.serviceId);
              const customers = data.customers.filter(c => c.accountId === a.id);
              const totalSeats = parseInt(sub?.totalSeats) || 0;
              const used = customers.length;
              return (
                <tr key={a.id}>
                  <td style={S.td}><span style={{ color: "#a0d4ff", fontWeight: 600 }}>{sub?.name || "Unknown"}</span></td>
                  <td style={S.td}><span style={{ color: "#00c8ff", fontSize: 11 }}>{a.email}</span></td>
                  <td style={S.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 12, color: "#c0a0ff" }}>{showPass[a.id] ? a.password : "••••••••"}</span>
                      <button onClick={() => setShowPass(p => ({ ...p, [a.id]: !p[a.id] }))} style={{ background: "none", border: "none", color: "#4080a0", cursor: "pointer", fontSize: 12 }}>{showPass[a.id] ? "🙈" : "👁"}</button>
                    </div>
                  </td>
                  <td style={S.td}><span style={{ fontSize: 11, color: "#6080a0" }}>{formatDate(a.purchaseDate)}</span></td>
                  <td style={S.td}><span style={{ fontSize: 11, color: daysUntil(a.renewalDate) < 7 ? "#ffd60a" : "#6080a0" }}>{formatDate(a.renewalDate)}</span></td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {customers.map(c => <span key={c.id} style={{ fontSize: 10, background: "rgba(0,200,255,0.1)", color: "#00c8ff", padding: "2px 6px", borderRadius: 4 }}>{c.name} ({c.screen})</span>)}
                    </div>
                  </td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {Array.from({ length: totalSeats }).map((_, i) => {
                        const sc = customers.find(c => c.screen === `Screen ${i+1}`);
                        return <div key={i} title={sc ? sc.name : `Screen ${i+1} - Free`} style={{ width: 22, height: 22, borderRadius: 4, background: sc ? "rgba(255,77,109,0.2)" : "rgba(0,245,212,0.2)", border: `1px solid ${sc ? "#ff4d6d55" : "#00f5d455"}`, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", color: sc ? "#ff4d6d" : "#00f5d4" }}>{i+1}</div>;
                      })}
                      {totalSeats > 0 && <span style={{ fontSize: 10, color: "#6080a0", marginLeft: 6, alignSelf: "center" }}>{used}/{totalSeats}</span>}
                    </div>
                  </td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openEdit(a)} style={S.btnSecondary}>Edit</button>
                      <button onClick={() => del(a.id)} style={S.btnDanger}>✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={modal === "add" ? "Add Account" : "Edit Account"} onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Service">
              <Select value={form.serviceId} onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}>
                <option value="">Select...</option>
                {data.subscriptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
            <Field label="Email"><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Field>
            <Field label="Password"><Input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></Field>
            <Field label="Purchase Date"><Input type="date" value={form.purchaseDate} onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} /></Field>
            <Field label="Renewal Date"><Input type="date" value={form.renewalDate} onChange={e => setForm(f => ({ ...f, renewalDate: e.target.value }))} /></Field>
          </div>
          <Field label="Notes"><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></Field>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button onClick={save} style={S.btn}>Save</button>
            <button onClick={() => setModal(null)} style={S.btnSecondary}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── RENEWALS PAGE ────────────────────────────────────────────────────────────
function RenewalsPage({ data, setData }) {
  function renewCustomer(c) {
    const duration = c.duration || 30;
    const newExpiry = addDays(todayStr(), duration);
    const renewed = { ...c, issueDate: todayStr(), expiryDate: newExpiry, renewalHistory: [...(c.renewalHistory || []), { date: todayStr(), expiry: newExpiry }] };
    setData(d => ({ ...d, customers: d.customers.map(x => x.id === c.id ? renewed : x) }));
  }

  function bucket(days) {
    return data.customers.filter(c => {
      const d = daysUntil(c.expiryDate);
      if (days === "expired") return d < 0;
      if (days === 0) return d === 0;
      if (days === 1) return d === 1;
      if (days === 3) return d > 0 && d <= 3;
      if (days === 7) return d > 0 && d <= 7;
      return false;
    });
  }

  function whatsappReminder(c) {
    const sub = data.subscriptions.find(s => s.id === c.subscriptionId);
    const msg = encodeURIComponent(`Dear ${c.name},\n\nYour *${sub?.name || "subscription"}* expires on *${formatDate(c.expiryDate)}*.\n\nRenewal: PKR ${c.sellingPrice}\n\n_AA WSW_`);
    window.open(`https://wa.me/${c.whatsapp.replace(/\D/g,"")}?text=${msg}`);
  }

  const sections = [
    { label: "Expired", list: bucket("expired"), color: "#ff4d6d" },
    { label: "Expiring Today", list: bucket(0), color: "#ffd60a" },
    { label: "Expiring Tomorrow", list: bucket(1), color: "#f4a261" },
    { label: "Expiring in 3 Days", list: bucket(3), color: "#f4a261" },
    { label: "Expiring This Week", list: bucket(7), color: "#a0c8ff" },
  ];

  return (
    <div>
      <h1 style={{ ...S.h1, marginBottom: 20 }}>Renewal Center</h1>
      {sections.map(sec => sec.list.length > 0 && (
        <div key={sec.label} style={{ marginBottom: 24 }}>
          <h2 style={{ ...S.h2, color: sec.color }}>{sec.label} ({sec.list.length})</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {sec.list.map(c => {
              const sub = data.subscriptions.find(s => s.id === c.subscriptionId);
              const days = daysUntil(c.expiryDate);
              return (
                <div key={c.id} style={{ ...S.glowCard, borderColor: sec.color + "33", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "#c0e0ff" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#6080a0" }}>{sub?.name} · {c.whatsapp}</div>
                    <div style={{ fontSize: 11, color: sec.color, marginTop: 4 }}>{days < 0 ? `Expired ${Math.abs(days)} days ago` : days === 0 ? "Expires today!" : `Expires in ${days} day${days > 1 ? "s" : ""}`}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#00f5d4", fontWeight: 700 }}>₨{c.sellingPrice}</div>
                    <div style={{ fontSize: 11, color: "#6080a0" }}>{formatDate(c.expiryDate)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => renewCustomer(c)} style={{ ...S.btn, padding: "7px 14px", fontSize: 12 }}>Renew</button>
                    <button onClick={() => whatsappReminder(c)} style={{ ...S.btnSecondary, color: "#25d366", borderColor: "rgba(37,211,102,0.3)" }}>WA</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {sections.every(s => s.list.length === 0) && (
        <div style={{ ...S.card, textAlign: "center", padding: 48, color: "#3060a0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div>No renewals needed right now!</div>
        </div>
      )}
    </div>
  );
}

// ─── PAYMENTS PAGE ────────────────────────────────────────────────────────────
function PaymentsPage({ data, setData }) {
  const [modal, setModal] = useState(null);

  const customers = data.customers;
  const totalRevenue = customers.reduce((s, c) => s + (parseFloat(c.sellingPrice) || 0), 0);
  const totalCollected = customers.reduce((s, c) => s + (parseFloat(c.amountPaid) || 0), 0);
  const totalPending = totalRevenue - totalCollected;

  return (
    <div>
      <h1 style={{ ...S.h1, marginBottom: 20 }}>Payments</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Invoiced" value={`₨${totalRevenue.toLocaleString()}`} color="#00c8ff" />
        <StatCard label="Collected" value={`₨${totalCollected.toLocaleString()}`} color="#00f5d4" />
        <StatCard label="Pending" value={`₨${totalPending.toLocaleString()}`} color="#ff4d6d" />
        <StatCard label="Paid Customers" value={customers.filter(c => c.paymentStatus === "Paid").length} color="#7b2ff7" />
      </div>
      <div style={S.card}>
        <h2 style={S.h2}>Payment Records</h2>
        <table style={S.table}>
          <thead><tr>{["Customer","Service","Total","Paid","Remaining","Status"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {customers.length === 0 && <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "#3060a0" }}>No records</td></tr>}
            {customers.map(c => {
              const sub = data.subscriptions.find(s => s.id === c.subscriptionId);
              const remaining = (parseFloat(c.sellingPrice) || 0) - (parseFloat(c.amountPaid) || 0);
              const statusColor = c.paymentStatus === "Paid" ? "#00f5d4" : c.paymentStatus === "Partial" ? "#ffd60a" : "#ff4d6d";
              return (
                <tr key={c.id}>
                  <td style={S.td}><span style={{ color: "#c0e0ff", fontWeight: 600 }}>{c.name}</span></td>
                  <td style={S.td}><span style={{ color: "#a0c8ff" }}>{sub?.name || "—"}</span></td>
                  <td style={S.td}><span style={{ color: "#00c8ff" }}>₨{c.sellingPrice || 0}</span></td>
                  <td style={S.td}><span style={{ color: "#00f5d4" }}>₨{c.amountPaid || 0}</span></td>
                  <td style={S.td}><span style={{ color: remaining > 0 ? "#ff4d6d" : "#00f5d4" }}>₨{remaining}</span></td>
                  <td style={S.td}><span style={{ ...S.tag(statusColor) }}>{c.paymentStatus}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── EXPENSES PAGE ────────────────────────────────────────────────────────────
function ExpensesPage({ data, setData }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ id: genId(), category: "Netflix Purchase", amount: "", date: todayStr(), notes: "" });

  function save() {
    setData(d => ({ ...d, expenses: [...d.expenses, form] }));
    setModal(false);
    setForm({ id: genId(), category: "Netflix Purchase", amount: "", date: todayStr(), notes: "" });
  }
  function del(id) { setData(d => ({ ...d, expenses: d.expenses.filter(e => e.id !== id) })); }

  const total = data.expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const thisMonth = data.expenses.filter(e => e.date?.startsWith(todayStr().slice(0,7))).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={S.h1}>Expenses</h1>
        <button onClick={() => setModal(true)} style={S.btn}>+ Add Expense</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Expenses" value={`₨${total.toLocaleString()}`} color="#ff4d6d" />
        <StatCard label="This Month" value={`₨${thisMonth.toLocaleString()}`} color="#f4a261" />
        <StatCard label="Expense Records" value={data.expenses.length} color="#7b2ff7" />
      </div>
      <div style={S.card}>
        <table style={S.table}>
          <thead><tr>{["Category","Amount","Date","Notes","Action"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {data.expenses.length === 0 && <tr><td colSpan={5} style={{ ...S.td, textAlign: "center", color: "#3060a0" }}>No expenses</td></tr>}
            {[...data.expenses].reverse().map(e => (
              <tr key={e.id}>
                <td style={S.td}><span style={{ color: "#f4a261" }}>{e.category}</span></td>
                <td style={S.td}><span style={{ color: "#ff4d6d", fontWeight: 700 }}>₨{e.amount}</span></td>
                <td style={S.td}><span style={{ fontSize: 11, color: "#6080a0" }}>{formatDate(e.date)}</span></td>
                <td style={S.td}><span style={{ color: "#6080a0", fontSize: 11 }}>{e.notes}</span></td>
                <td style={S.td}><button onClick={() => del(e.id)} style={S.btnDanger}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title="Add Expense" onClose={() => setModal(false)}>
          <Field label="Category">
            <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {["Netflix Purchase","Spotify Purchase","YouTube Purchase","Amazon Prime Purchase","VPN","Internet","ChatGPT Purchase","Other"].map(c => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Amount (PKR)"><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></Field>
          <Field label="Date"><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></Field>
          <Field label="Notes"><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></Field>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button onClick={save} style={S.btn}>Save</button>
            <button onClick={() => setModal(false)} style={S.btnSecondary}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── REVENUE PAGE ─────────────────────────────────────────────────────────────
function RevenuePage({ data }) {
  const month = todayStr().slice(0, 7);
  const year = todayStr().slice(0, 4);

  function monthlyRevenue(m) {
    return data.customers.filter(c => c.issueDate?.startsWith(m)).reduce((s, c) => s + (parseFloat(c.sellingPrice) || 0), 0);
  }
  function monthlyExpenses(m) {
    return data.expenses.filter(e => e.date?.startsWith(m)).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  }

  const rev = monthlyRevenue(month);
  const exp = monthlyExpenses(month);
  const profit = rev - exp;

  const yearlyRev = Array.from({ length: 12 }, (_, i) => {
    const m = `${year}-${String(i+1).padStart(2,"0")}`;
    return { month: m, rev: monthlyRevenue(m), exp: monthlyExpenses(m) };
  });

  const subRevenue = data.subscriptions.map(s => ({
    name: s.name,
    rev: data.customers.filter(c => c.subscriptionId === s.id).reduce((sum, c) => sum + (parseFloat(c.sellingPrice) || 0), 0),
    customers: data.customers.filter(c => c.subscriptionId === s.id).length,
  })).filter(x => x.rev > 0);

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div>
      <h1 style={{ ...S.h1, marginBottom: 20 }}>Revenue & Profit</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14, marginBottom: 28 }}>
        <StatCard label="Monthly Revenue" value={`₨${rev.toLocaleString()}`} color="#00c8ff" />
        <StatCard label="Monthly Expenses" value={`₨${exp.toLocaleString()}`} color="#ff4d6d" />
        <StatCard label="Monthly Profit" value={`₨${profit.toLocaleString()}`} color={profit >= 0 ? "#00f5d4" : "#ff4d6d"} />
        <StatCard label="Annual Revenue" value={`₨${yearlyRev.reduce((s,m) => s+m.rev,0).toLocaleString()}`} color="#7b2ff7" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div style={S.card}>
          <h2 style={S.h2}>Monthly Overview ({year})</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead><tr>{["Month","Revenue","Expenses","Profit"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {yearlyRev.map((row, i) => {
                  const p = row.rev - row.exp;
                  return (
                    <tr key={i}>
                      <td style={S.td}>{months[i]}</td>
                      <td style={S.td}><span style={{ color: "#00c8ff" }}>₨{row.rev.toLocaleString()}</span></td>
                      <td style={S.td}><span style={{ color: "#ff4d6d" }}>₨{row.exp.toLocaleString()}</span></td>
                      <td style={S.td}><span style={{ color: p >= 0 ? "#00f5d4" : "#ff4d6d", fontWeight: 700 }}>₨{p.toLocaleString()}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div style={S.card}>
          <h2 style={S.h2}>By Service</h2>
          {subRevenue.length === 0 ? <div style={{ color: "#3060a0", textAlign: "center", padding: 20 }}>No data</div> : subRevenue.map(s => (
            <div key={s.name} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                <span style={{ color: "#a0c8ff" }}>{s.name}</span>
                <span style={{ color: "#00f5d4" }}>₨{s.rev.toLocaleString()}</span>
              </div>
              <div style={{ background: "rgba(0,200,255,0.1)", borderRadius: 4, height: 6, overflow: "hidden" }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg,#00c8ff,#7b2ff7)", width: `${Math.min(100, (s.rev / Math.max(...subRevenue.map(x=>x.rev))) * 100)}%`, borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 10, color: "#4060a0", marginTop: 2 }}>{s.customers} customers</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── REPORTS PAGE ─────────────────────────────────────────────────────────────
function ReportsPage({ data }) {
  const [range, setRange] = useState("monthly");
  const [from, setFrom] = useState(todayStr().slice(0,7) + "-01");
  const [to, setTo] = useState(todayStr());

  const filtered = data.customers.filter(c => {
    const d = c.issueDate;
    if (range === "daily") return d === todayStr();
    if (range === "monthly") return d?.startsWith(todayStr().slice(0,7));
    if (range === "yearly") return d?.startsWith(todayStr().slice(0,4));
    if (range === "custom") return d >= from && d <= to;
    return true;
  });

  const revenue = filtered.reduce((s,c) => s + (parseFloat(c.sellingPrice)||0), 0);
  const collected = filtered.reduce((s,c) => s + (parseFloat(c.amountPaid)||0), 0);

  return (
    <div>
      <h1 style={{ ...S.h1, marginBottom: 20 }}>Reports</h1>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {["daily","weekly","monthly","yearly","custom"].map(r => (
          <button key={r} onClick={() => setRange(r)} style={{ ...S.btnSecondary, background: range === r ? "rgba(0,200,255,0.2)" : undefined, color: range === r ? "#00c8ff" : "#4080a0", fontWeight: range === r ? 700 : 400, textTransform: "capitalize" }}>{r}</button>
        ))}
        {range === "custom" && <>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ ...S.input, width: 150 }} />
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ ...S.input, width: 150 }} />
        </>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="Customers" value={filtered.length} color="#00c8ff" />
        <StatCard label="Revenue" value={`₨${revenue.toLocaleString()}`} color="#7b2ff7" />
        <StatCard label="Collected" value={`₨${collected.toLocaleString()}`} color="#00f5d4" />
        <StatCard label="Pending" value={`₨${(revenue-collected).toLocaleString()}`} color="#ff4d6d" />
      </div>
      <div style={S.card}>
        <h2 style={S.h2}>Customer Report</h2>
        <table style={S.table}>
          <thead><tr>{["Name","Service","Issue","Expiry","Price","Paid","Status"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", color: "#3060a0" }}>No data</td></tr>}
            {filtered.map(c => {
              const sub = data.subscriptions.find(s => s.id === c.subscriptionId);
              const si = statusInfo(c.expiryDate);
              return (
                <tr key={c.id}>
                  <td style={S.td}>{c.name}</td>
                  <td style={S.td}><span style={{ color: "#a0c8ff" }}>{sub?.name||"—"}</span></td>
                  <td style={S.td}><span style={{ fontSize: 11, color: "#6080a0" }}>{formatDate(c.issueDate)}</span></td>
                  <td style={S.td}><span style={{ fontSize: 11, color: si.color }}>{formatDate(c.expiryDate)}</span></td>
                  <td style={S.td}>₨{c.sellingPrice}</td>
                  <td style={S.td}>₨{c.amountPaid||0}</td>
                  <td style={S.td}><span style={{ ...S.tag(si.color) }}>{si.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── REMINDERS PAGE ───────────────────────────────────────────────────────────
function RemindersPage({ data }) {
  const expiring = data.customers.filter(c => { const d = daysUntil(c.expiryDate); return d >= 0 && d <= 7; });
  const pending = data.customers.filter(c => c.paymentStatus !== "Paid");

  function whatsappReminder(c, type) {
    const sub = data.subscriptions.find(s => s.id === c.subscriptionId);
    let msg = "";
    if (type === "expiry") msg = `Dear ${c.name},\n\nYour *${sub?.name || "subscription"}* expires on *${formatDate(c.expiryDate)}*.\n\nPlease renew to continue.\n\nPrice: PKR ${c.sellingPrice}\n\n_AA WSW_`;
    if (type === "payment") msg = `Dear ${c.name},\n\nYour payment of PKR *${(parseFloat(c.sellingPrice)||0) - (parseFloat(c.amountPaid)||0)}* is pending for *${sub?.name || "subscription"}*.\n\nPlease pay soon.\n\n_AA WSW_`;
    window.open(`https://wa.me/${c.whatsapp.replace(/\D/g,"")}?text=${encodeURIComponent(msg)}`);
  }

  return (
    <div>
      <h1 style={{ ...S.h1, marginBottom: 20 }}>Reminder Center</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <h2 style={{ ...S.h2, color: "#ffd60a" }}>⏰ Expiring This Week ({expiring.length})</h2>
          {expiring.map(c => {
            const sub = data.subscriptions.find(s => s.id === c.subscriptionId);
            const days = daysUntil(c.expiryDate);
            return (
              <div key={c.id} style={{ ...S.glowCard, borderColor: "#ffd60a33", marginBottom: 10 }}>
                <div style={{ fontWeight: 700, color: "#c0e0ff" }}>{c.name}</div>
                <div style={{ fontSize: 11, color: "#6080a0", marginBottom: 6 }}>{sub?.name} · Expires in {days} day{days !== 1 ? "s" : ""}</div>
                <button onClick={() => whatsappReminder(c, "expiry")} style={{ ...S.btnSecondary, color: "#25d366", borderColor: "rgba(37,211,102,0.3)", fontSize: 11 }}>📱 Send WhatsApp Reminder</button>
              </div>
            );
          })}
          {expiring.length === 0 && <div style={{ color: "#3060a0", fontSize: 13 }}>No customers expiring this week</div>}
        </div>
        <div>
          <h2 style={{ ...S.h2, color: "#ff4d6d" }}>💳 Pending Payments ({pending.length})</h2>
          {pending.map(c => {
            const sub = data.subscriptions.find(s => s.id === c.subscriptionId);
            const remaining = (parseFloat(c.sellingPrice)||0) - (parseFloat(c.amountPaid)||0);
            return (
              <div key={c.id} style={{ ...S.glowCard, borderColor: "#ff4d6d33", marginBottom: 10 }}>
                <div style={{ fontWeight: 700, color: "#c0e0ff" }}>{c.name}</div>
                <div style={{ fontSize: 11, color: "#6080a0", marginBottom: 4 }}>{sub?.name} · {c.paymentStatus}</div>
                <div style={{ color: "#ff4d6d", fontWeight: 700, marginBottom: 6 }}>PKR {remaining} pending</div>
                <button onClick={() => whatsappReminder(c, "payment")} style={{ ...S.btnSecondary, color: "#25d366", borderColor: "rgba(37,211,102,0.3)", fontSize: 11 }}>📱 Send Payment Reminder</button>
              </div>
            );
          })}
          {pending.length === 0 && <div style={{ color: "#3060a0", fontSize: 13 }}>No pending payments</div>}
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
function SettingsPage({ data, setData, onLock }) {
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinMsg, setPinMsg] = useState("");

  function changePin() {
    if (newPin.length < 4) { setPinMsg("PIN must be at least 4 digits"); return; }
    if (newPin !== confirmPin) { setPinMsg("PINs do not match"); return; }
    setPin(newPin);
    setPinMsg("PIN changed successfully!");
    setNewPin(""); setConfirmPin("");
    setTimeout(() => setPinMsg(""), 3000);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `aawsw_backup_${todayStr()}.json`;
    a.click();
  }

  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        setData({ ...defaultData, ...imported });
        alert("Data restored successfully!");
      } catch { alert("Invalid backup file"); }
    };
    reader.readAsText(file);
  }

  function clearAllData() {
    if (!confirm("⚠️ This will delete ALL data. Are you sure?")) return;
    if (!confirm("Are you REALLY sure? This cannot be undone!")) return;
    setData(defaultData);
  }

  return (
    <div>
      <h1 style={{ ...S.h1, marginBottom: 24 }}>Settings</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 800 }}>
        <div style={S.card}>
          <h2 style={S.h2}>🔒 Change PIN</h2>
          <Field label="New PIN"><Input type="password" value={newPin} onChange={e => setNewPin(e.target.value)} maxLength={6} placeholder="4 or 6 digits" /></Field>
          <Field label="Confirm PIN"><Input type="password" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} maxLength={6} placeholder="Repeat PIN" /></Field>
          {pinMsg && <div style={{ color: pinMsg.includes("success") ? "#00f5d4" : "#ff4d6d", fontSize: 12, marginBottom: 12 }}>{pinMsg}</div>}
          <button onClick={changePin} style={S.btn}>Change PIN</button>
        </div>
        <div style={S.card}>
          <h2 style={S.h2}>💾 Backup & Restore</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button onClick={exportData} style={S.btn}>⬇ Export Backup (JSON)</button>
            <label style={{ ...S.btnSecondary, textAlign: "center", cursor: "pointer", display: "block" }}>
              ⬆ Import Backup
              <input type="file" accept=".json" onChange={importData} style={{ display: "none" }} />
            </label>
            <button onClick={clearAllData} style={S.btnDanger}>🗑 Clear All Data</button>
          </div>
        </div>
        <div style={S.card}>
          <h2 style={S.h2}>📊 Data Summary</h2>
          {[
            ["Customers", data.customers.length],
            ["Subscriptions", data.subscriptions.length],
            ["Accounts", data.accounts.length],
            ["Expenses", data.expenses.length],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(0,200,255,0.08)", fontSize: 13 }}>
              <span style={{ color: "#6080a0" }}>{k}</span>
              <span style={{ color: "#00c8ff", fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <h2 style={S.h2}>ℹ About</h2>
          <div style={{ fontSize: 13, color: "#6080a0", lineHeight: 2 }}>
            <div><span style={{ color: "#00c8ff" }}>AA WSW</span> Subscription Manager</div>
            <div>Version 1.0</div>
            <div>All data stored locally</div>
            <div>No internet required</div>
          </div>
          <button onClick={onLock} style={{ ...S.btnSecondary, marginTop: 16, width: "100%" }}>🔒 Lock Screen</button>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ data, setActive }) {
  const customers = data.customers;
  const today = todayStr();
  const month = today.slice(0, 7);

  const active = customers.filter(c => daysUntil(c.expiryDate) >= 0);
  const expired = customers.filter(c => daysUntil(c.expiryDate) < 0);
  const expiringToday = customers.filter(c => daysUntil(c.expiryDate) === 0);
  const expiringTomorrow = customers.filter(c => daysUntil(c.expiryDate) === 1);
  const expiringWeek = customers.filter(c => { const d = daysUntil(c.expiryDate); return d > 0 && d <= 7; });
  const pendingPayments = customers.filter(c => c.paymentStatus !== "Paid");

  const monthlyRevenue = customers.filter(c => c.issueDate?.startsWith(month)).reduce((s, c) => s + (parseFloat(c.sellingPrice) || 0), 0);
  const monthlyExpenses = data.expenses.filter(e => e.date?.startsWith(month)).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const monthlyProfit = monthlyRevenue - monthlyExpenses;

  const subStats = data.subscriptions.map(s => {
    const subs = customers.filter(c => c.subscriptionId === s.id);
    const totalSeats = parseInt(s.totalSeats) || 0;
    const used = subs.length;
    return { ...s, used, available: Math.max(0, totalSeats - used) };
  });

  const totalAvailableScreens = subStats.reduce((s, x) => s + x.available, 0);
  const totalActiveScreens = subStats.reduce((s, x) => s + x.used, 0);

  const recentCustomers = [...customers].sort((a, b) => (b.issueDate || "").localeCompare(a.issueDate || "")).slice(0, 5);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={S.h1}>Dashboard</h1>
        <div style={{ fontSize: 12, color: "#3060a0", marginTop: 4 }}>{new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Customers" value={customers.length} color="#00c8ff" icon="👥" />
        <StatCard label="Active" value={active.length} color="#00f5d4" icon="✅" />
        <StatCard label="Expired" value={expired.length} color="#ff4d6d" icon="❌" />
        <StatCard label="Expiring Today" value={expiringToday.length} color="#ffd60a" icon="⚡" />
        <StatCard label="Expiring Tomorrow" value={expiringTomorrow.length} color="#f4a261" icon="⏰" />
        <StatCard label="Expiring This Week" value={expiringWeek.length} color="#a0c8ff" icon="📅" />
        <StatCard label="Active Screens" value={totalActiveScreens} color="#7b2ff7" icon="🖥" />
        <StatCard label="Available Screens" value={totalAvailableScreens} color="#00f5d4" icon="📺" />
        <StatCard label="Monthly Revenue" value={`₨${monthlyRevenue.toLocaleString()}`} color="#00c8ff" icon="💰" />
        <StatCard label="Monthly Expenses" value={`₨${monthlyExpenses.toLocaleString()}`} color="#ff4d6d" icon="📉" />
        <StatCard label="Monthly Profit" value={`₨${monthlyProfit.toLocaleString()}`} color={monthlyProfit >= 0 ? "#00f5d4" : "#ff4d6d"} icon="📈" />
        <StatCard label="Pending Payments" value={pendingPayments.length} color="#ffd60a" icon="💳" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={S.card}>
          <h2 style={S.h2}>🔔 Needs Attention</h2>
          {[...expiringToday, ...expiringTomorrow, ...expiringWeek].slice(0, 6).map(c => {
            const si = statusInfo(c.expiryDate);
            const sub = data.subscriptions.find(s => s.id === c.subscriptionId);
            return (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(0,200,255,0.06)" }}>
                <div>
                  <div style={{ fontSize: 13, color: "#c0e0ff", fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "#4060a0" }}>{sub?.name}</div>
                </div>
                <span style={{ ...S.tag(si.color) }}>{si.label}</span>
              </div>
            );
          })}
          {expiringToday.length + expiringTomorrow.length + expiringWeek.length === 0 && <div style={{ color: "#3060a0", fontSize: 13, textAlign: "center", padding: 16 }}>All clear! ✅</div>}
        </div>
        <div style={S.card}>
          <h2 style={S.h2}>📦 Subscription Stats</h2>
          {subStats.map(s => (
            <div key={s.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                <span style={{ color: "#a0c8ff" }}>{s.name}</span>
                <span style={{ color: "#6080a0" }}>{s.used}/{s.totalSeats} used</span>
              </div>
              <div style={{ background: "rgba(0,200,255,0.08)", borderRadius: 4, height: 6 }}>
                <div style={{ height: "100%", background: s.used >= s.totalSeats ? "linear-gradient(90deg,#ff4d6d,#f4a261)" : "linear-gradient(90deg,#00c8ff,#7b2ff7)", width: `${s.totalSeats > 0 ? Math.min(100, (s.used / s.totalSeats) * 100) : 0}%`, borderRadius: 4, transition: "width 0.5s" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ ...S.h2, margin: 0 }}>Recent Customers</h2>
          <button onClick={() => setActive("customers")} style={S.btnSecondary}>View All</button>
        </div>
        <table style={S.table}>
          <thead><tr>{["Name","Service","Issue","Expiry","Status"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {recentCustomers.length === 0 && <tr><td colSpan={5} style={{ ...S.td, textAlign: "center", color: "#3060a0" }}>No customers yet</td></tr>}
            {recentCustomers.map(c => {
              const si = statusInfo(c.expiryDate);
              const sub = data.subscriptions.find(s => s.id === c.subscriptionId);
              return (
                <tr key={c.id}>
                  <td style={S.td}><span style={{ color: "#c0e0ff", fontWeight: 600 }}>{c.name}</span></td>
                  <td style={S.td}><span style={{ color: "#a0c8ff" }}>{sub?.name || "—"}</span></td>
                  <td style={S.td}><span style={{ fontSize: 11, color: "#6080a0" }}>{formatDate(c.issueDate)}</span></td>
                  <td style={S.td}><span style={{ fontSize: 11, color: si.color }}>{formatDate(c.expiryDate)}</span></td>
                  <td style={S.td}><span style={{ ...S.tag(si.color) }}>{si.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [locked, setLocked] = useState(true);
  const [active, setActive] = useState("dashboard");
  const [data, setDataRaw] = useState(loadData);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  function setData(updater) {
    setDataRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveData(next);
      return next;
    });
  }

  if (locked) return <LockScreen onUnlock={() => setLocked(false)} />;

  const pages = {
    dashboard: <Dashboard data={data} setActive={setActive} />,
    customers: <CustomersPage data={data} setData={setData} />,
    subscriptions: <SubscriptionsPage data={data} setData={setData} />,
    accounts: <AccountsPage data={data} setData={setData} />,
    renewalss: <RenewalsPage data={data} setData={setData} />,
    payments: <PaymentsPage data={data} setData={setData} />,
    expenses: <ExpensesPage data={data} setData={setData} />,
    revenue: <RevenuePage data={data} />,
    reports: <ReportsPage data={data} />,
    reminders: <RemindersPage data={data} />,
    settings: <SettingsPage data={data} setData={setData} onLock={() => setLocked(true)} />,
  };

  return (
    <div style={S.page}>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #050a12; }
        ::-webkit-scrollbar-thumb { background: rgba(0,200,255,0.3); border-radius: 2px; }
        input, select, textarea { color-scheme: dark; }
        input:focus, select:focus, textarea:focus { border-color: rgba(0,200,255,0.6) !important; box-shadow: 0 0 0 2px rgba(0,200,255,0.1); }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {!isMobile && <Sidebar active={active} setActive={setActive} onLock={() => setLocked(true)} />}

      <div style={{ ...(!isMobile ? S.content : { padding: "16px 14px 80px" }), animation: "fadeIn 0.3s ease" }}>
        {pages[active] || pages.dashboard}
      </div>

      {isMobile && <BottomNav active={active} setActive={setActive} />}
    </div>
  );
}
