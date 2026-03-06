import React, { useState } from "react";
import { deleteThread, renameThread } from "../lib/api.js";

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function Sidebar({ threads, activeId, onSelect, onNew, onDelete, onRename }) {
  const [hoverId,  setHoverId]  = useState(null);
  const [editId,   setEditId]   = useState(null);
  const [editText, setEditText] = useState("");

  async function handleDelete(e, id) {
    e.stopPropagation();
    await deleteThread(id);
    onDelete(id);
  }

  function startEdit(e, t) {
    e.stopPropagation();
    setEditId(t.id);
    setEditText(t.title);
  }

  async function commitEdit(id) {
    if (editText.trim()) {
      await renameThread(id, editText.trim());
      onRename(id, editText.trim());
    }
    setEditId(null);
  }

  return (
    <div style={{
      width: 240, flexShrink: 0, background: "var(--surface)",
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column", height: "100%",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>
          Order<em>Agent</em>
        </div>
        <button onClick={onNew} style={{
          width: "100%", padding: "8px 12px", borderRadius: "var(--radius)",
          border: "1px solid var(--border)", background: "var(--bg)",
          color: "var(--ink)", fontSize: "12px", display: "flex",
          alignItems: "center", gap: "6px", fontFamily: "var(--mono)",
        }}>
          <span style={{ fontSize: "16px", lineHeight: 1 }}>+</span> New conversation
        </button>
      </div>

      {/* Thread list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
        {threads.length === 0 && (
          <div style={{ padding: "16px 8px", color: "var(--ink-3)", fontSize: "12px", textAlign: "center" }}>
            No conversations yet
          </div>
        )}
        {threads.map(t => (
          <div
            key={t.id}
            onClick={() => onSelect(t.id)}
            onMouseEnter={() => setHoverId(t.id)}
            onMouseLeave={() => setHoverId(null)}
            style={{
              padding: "8px 10px", borderRadius: "var(--radius)", marginBottom: "2px",
              cursor: "pointer", position: "relative",
              background: t.id === activeId ? "var(--accent-bg)" : hoverId === t.id ? "var(--bg)" : "transparent",
              borderLeft: t.id === activeId ? "2px solid var(--accent)" : "2px solid transparent",
            }}
          >
            {editId === t.id ? (
              <input
                autoFocus value={editText}
                onChange={e => setEditText(e.target.value)}
                onBlur={() => commitEdit(t.id)}
                onKeyDown={e => { if (e.key === "Enter") commitEdit(t.id); if (e.key === "Escape") setEditId(null); }}
                onClick={e => e.stopPropagation()}
                style={{
                  width: "100%", border: "1px solid var(--border)", borderRadius: "3px",
                  padding: "2px 4px", fontSize: "12px", fontFamily: "var(--mono)",
                  background: "var(--bg)", color: "var(--ink)", outline: "none",
                }}
              />
            ) : (
              <>
                <div style={{
                  fontSize: "12px", fontWeight: 500, color: "var(--ink)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  paddingRight: hoverId === t.id ? "40px" : "0",
                }}>
                  {t.title}
                </div>
                <div style={{ fontSize: "10px", color: "var(--ink-3)", marginTop: "2px" }}>
                  {t.message_count} msg · {timeAgo(t.updated_at)}
                </div>
                {hoverId === t.id && (
                  <div style={{ position: "absolute", right: "6px", top: "50%",
                    transform: "translateY(-50%)", display: "flex", gap: "2px" }}>
                    <IconBtn title="Rename" onClick={e => startEdit(e, t)}>✎</IconBtn>
                    <IconBtn title="Delete" onClick={e => handleDelete(e, t.id)} danger>✕</IconBtn>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, danger, title }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 22, height: 22, borderRadius: "4px", border: "none",
        background: hov ? (danger ? "var(--red-bg)" : "var(--surface)") : "transparent",
        color: hov && danger ? "var(--red)" : "var(--ink-3)",
        fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
      {children}
    </button>
  );
}
