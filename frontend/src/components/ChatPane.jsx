import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchThread, streamChat } from "../lib/api.js";
import { Message, WelcomeMessage } from "./Message.jsx";

const QUICK = [
  "Show recent orders",
  "Check order ORD-1005",
  "Track shipment for ORD-1012",
];

export function ChatPane({ threadId, settings, onFirstMessage }) {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error,     setError]     = useState(null);
  const bottomRef  = useRef(null);
  const cancelRef  = useRef(null);
  const inputRef   = useRef(null);

  // Load history when thread changes
  useEffect(() => {
    if (!threadId) { setMessages([]); return; }
    setMessages([]);
    fetchThread(threadId).then(t => {
      if (!t || t.error) return;
      setMessages(t.messages.map(m => ({
        id:      Math.random(),
        role:    m.role,
        content: m.content,
        ts:      m.ts,
      })));
    });
  }, [threadId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (text) => {
    const msg = text?.trim() || input.trim();
    if (!msg || streaming || !threadId) return;

    if (!settings.groqKey) {
      setError("Please set your Groq API key in Settings (⚙)");
      return;
    }

    setError(null);
    setInput("");

    // Add user message
    const userId = Math.random();
    setMessages(m => [...m, { id: userId, role: "user", content: msg }]);

    // Add placeholder assistant message
    const asstId = Math.random();
    setMessages(m => [...m, { id: asstId, role: "assistant", content: "", events: [], streaming: true }]);

    setStreaming(true);
    onFirstMessage?.(msg);

    cancelRef.current = streamChat({
      threadId,
      message:   msg,
      groqKey:   settings.groqKey,
      groqModel: settings.groqModel,
      onEvent(evt) {
        setMessages(m => m.map(msg => {
          if (msg.id !== asstId) return msg;
          if (evt.type === "token") {
            return { ...msg, content: msg.content + evt.text };
          }
          if (evt.type === "tool_call" || evt.type === "tool_result") {
            return { ...msg, events: [...(msg.events || []), evt] };
          }
          return msg;
        }));
      },
      onDone() {
        setStreaming(false);
        setMessages(m => m.map(msg =>
          msg.id === asstId ? { ...msg, streaming: false } : msg
        ));
        inputRef.current?.focus();
      },
      onError(err) {
        setStreaming(false);
        setError(err);
        setMessages(m => m.filter(msg => msg.id !== asstId));
      },
    });
  }, [input, streaming, threadId, settings, onFirstMessage]);

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  if (!threadId) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--ink-3)", fontSize: "13px" }}>
        Select a conversation or start a new one
      </div>
    );
  }

  const isEmpty = messages.length === 0;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        {isEmpty && <WelcomeMessage />}
        {messages.map(msg => <Message key={msg.id} msg={msg} />)}
        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: "var(--radius)",
            background: "var(--red-bg)", border: "1px solid var(--red)30",
            color: "var(--red)", fontSize: "12px", marginBottom: "16px",
          }}>
            ⚠ {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions (only when empty) */}
      {isEmpty && (
        <div style={{ padding: "0 28px 12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {QUICK.map(q => (
            <button key={q} onClick={() => send(q)} style={{
              padding: "5px 13px", borderRadius: "20px", fontSize: "11px",
              border: "1px solid var(--border)", background: "var(--surface)",
              color: "var(--ink-2)", fontFamily: "var(--mono)",
              transition: "border-color 0.15s",
            }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div style={{
        padding: "12px 20px 16px", borderTop: "1px solid var(--border)",
        display: "flex", gap: "10px", background: "var(--surface)",
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about your orders…"
          rows={1}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: "var(--radius)",
            border: "1px solid var(--border)", background: "var(--bg)",
            color: "var(--ink)", fontSize: "13px", fontFamily: "var(--mono)",
            outline: "none", resize: "none", lineHeight: 1.5,
            transition: "border-color 0.15s",
          }}
          onFocus={e => e.target.style.borderColor = "var(--ink)"}
          onBlur={e  => e.target.style.borderColor = "var(--border)"}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || streaming}
          style={{
            width: 40, height: 40, borderRadius: "var(--radius)",
            border: "none", background: streaming ? "var(--border)" : "var(--ink)",
            color: "var(--bg)", fontSize: "16px", display: "flex",
            alignItems: "center", justifyContent: "center",
            transition: "background 0.15s", alignSelf: "flex-end",
            opacity: !input.trim() || streaming ? 0.5 : 1,
          }}
        >
          {streaming ? "…" : "↑"}
        </button>
      </div>
    </div>
  );
}
