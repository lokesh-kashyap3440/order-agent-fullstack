import React, { useState } from "react";

const MODELS = [
  "llama-3.3-70b-versatile",
  "llama3-70b-8192",
  "llama3-8b-8192",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
];

export function SettingsModal({ settings, onSave, onClose }) {
  const [form, setForm] = useState({ ...settings });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(26,20,16,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100, backdropFilter: "blur(2px)",
    }} onClick={onClose}>
      <div style={{
        background: "var(--bg)", border: "1px solid var(--border)",
        borderRadius: "10px", padding: "28px", width: "420px", maxWidth: "90vw",
        boxShadow: "var(--shadow-md)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: "var(--serif)", fontSize: "18px", fontWeight: 600, marginBottom: "20px" }}>
          Settings
        </div>

        <Field label="Groq API Key" hint="Get one free at console.groq.com">
          <input
            type="password" value={form.groqKey}
            placeholder="gsk_..."
            onChange={e => set("groqKey", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="Model">
          <select value={form.groqModel} onChange={e => set("groqModel", e.target.value)} style={inputStyle}>
            {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>

        <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "9px", borderRadius: "var(--radius)",
            border: "1px solid var(--border)", background: "transparent",
            color: "var(--ink-2)", fontSize: "13px",
          }}>
            Cancel
          </button>
          <button onClick={() => { onSave(form); onClose(); }} style={{
            flex: 2, padding: "9px", borderRadius: "var(--radius)",
            border: "none", background: "var(--ink)", color: "var(--bg)",
            fontSize: "13px", fontWeight: 600, fontFamily: "var(--mono)",
          }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "11px", color: "var(--ink-3)",
        textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: "11px", color: "var(--ink-3)", marginTop: "4px" }}>{hint}</div>}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: "var(--radius)",
  border: "1px solid var(--border)", background: "var(--surface)",
  color: "var(--ink)", fontSize: "13px", fontFamily: "var(--mono)", outline: "none",
};
