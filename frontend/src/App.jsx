import React, { useState, useEffect, useCallback } from "react";
import { Sidebar }       from "./components/Sidebar.jsx";
import { ChatPane }      from "./components/ChatPane.jsx";
import { SettingsModal } from "./components/SettingsModal.jsx";
import { useSettings }   from "./hooks/useSettings.js";
import { fetchThreads, createThread } from "./lib/api.js";

export default function App() {
  const [threads,     setThreads]     = useState([]);
  const [activeId,    setActiveId]    = useState(null);
  const [showSettings,setShowSettings]= useState(false);
  const { settings, save: saveSettings } = useSettings();

  // Load threads
  const loadThreads = useCallback(async () => {
    const list = await fetchThreads();
    setThreads(list);
  }, []);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  // Show settings on first launch if no key
  useEffect(() => {
    if (!settings.groqKey) setShowSettings(true);
  }, []);

  async function handleNew() {
    const t = await createThread("New conversation");
    setThreads(prev => [{ ...t, message_count: 0 }, ...prev]);
    setActiveId(t.id);
  }

  function handleDelete(id) {
    setThreads(prev => prev.filter(t => t.id !== id));
    if (activeId === id) setActiveId(null);
  }

  function handleRename(id, title) {
    setThreads(prev => prev.map(t => t.id === id ? { ...t, title } : t));
  }

  // Called when first message sent — refresh thread list to show updated title
  function handleFirstMessage(msg) {
    setTimeout(() => loadThreads(), 1200);
    // Also optimistically update message count
    setThreads(prev => prev.map(t =>
      t.id === activeId
        ? { ...t, title: msg.slice(0, 50), message_count: t.message_count + 1 }
        : t
    ));
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

      {/* Sidebar */}
      <Sidebar
        threads={threads}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={handleNew}
        onDelete={handleDelete}
        onRename={handleRename}
      />

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Topbar */}
        <div style={{
          height: 48, borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          padding: "0 16px", gap: "8px", background: "var(--surface)", flexShrink: 0,
        }}>
          <div style={{ fontSize: "11px", color: "var(--ink-3)", fontFamily: "var(--mono)" }}>
            {settings.groqModel}
          </div>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              padding: "5px 12px", borderRadius: "var(--radius)",
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--ink-2)", fontSize: "12px", fontFamily: "var(--mono)",
            }}
          >
            ⚙ Settings
          </button>
        </div>

        {/* Chat */}
        <ChatPane
          threadId={activeId}
          settings={settings}
          onFirstMessage={handleFirstMessage}
        />
      </div>

      {/* Settings modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Global animations */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
