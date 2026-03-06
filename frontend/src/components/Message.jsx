import React from "react";
import { OrderCard, OrderListCard, TrackingCard } from "./OrderCard.jsx";

const TOOL_LABELS = {
  get_order_status:   "Looking up order…",
  list_recent_orders: "Fetching recent orders…",
  track_shipment:     "Getting tracking info…",
};

function ToolEvent({ event }) {
  if (event.type === "tool_call") {
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        padding: "4px 10px", borderRadius: "20px", fontSize: "11px",
        background: "var(--blue-bg)", color: "var(--blue)",
        border: "1px solid var(--blue)20", marginBottom: "6px",
      }}>
        <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⚙</span>
        {TOOL_LABELS[event.tool] || `Calling ${event.tool}…`}
      </div>
    );
  }
  if (event.type === "tool_result") {
    const r = event.result;
    if (event.tool === "get_order_status" && r.id)       return <OrderCard order={r} />;
    if (event.tool === "list_recent_orders" && r.orders)  return <OrderListCard orders={r.orders} />;
    if (event.tool === "track_shipment" && r.steps)       return <TrackingCard tracking={r} />;
    if (r.error) return (
      <div style={{ color: "var(--red)", fontSize: "12px", marginBottom: "6px" }}>⚠ {r.error}</div>
    );
  }
  return null;
}

function ThinkingDots() {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center", padding: "6px 0" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: "50%", background: "var(--ink-3)",
          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

function parseText(text) {
  // Convert **bold** and `code` to spans
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`"))
      return <code key={i} style={{ background: "var(--border)", padding: "1px 5px",
        borderRadius: "3px", fontSize: "12px" }}>{p.slice(1, -1)}</code>;
    return p.split("\n").map((line, j, arr) => (
      <React.Fragment key={`${i}-${j}`}>{line}{j < arr.length - 1 && <br />}</React.Fragment>
    ));
  });
}

export function Message({ msg }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <div style={{
          background: "var(--ink)", color: "var(--bg)",
          padding: "10px 16px", borderRadius: "18px 18px 4px 18px",
          maxWidth: "72%", fontSize: "13px", lineHeight: 1.6,
        }}>
          {msg.content}
        </div>
      </div>
    );
  }

  // Assistant message: may have tool events + text
  const events = msg.events || [];
  const text   = msg.content || "";
  const isStreaming = msg.streaming;

  return (
    <div style={{ display: "flex", gap: "10px", marginBottom: "16px", maxWidth: "86%" }}>
      <div style={{
        width: 28, height: 28, borderRadius: "8px", flexShrink: 0,
        background: "var(--ink)", color: "var(--bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "13px", marginTop: "2px",
      }}>
        ◈
      </div>
      <div style={{ flex: 1 }}>
        {events.map((e, i) => <ToolEvent key={i} event={e} />)}
        {(text || isStreaming) && (
          <div style={{ fontSize: "13px", lineHeight: 1.7, color: "var(--ink)" }}>
            {text ? parseText(text) : <ThinkingDots />}
            {isStreaming && text && <span style={{
              display: "inline-block", width: "2px", height: "14px",
              background: "var(--ink)", marginLeft: "2px", verticalAlign: "middle",
              animation: "blink 1s step-end infinite",
            }} />}
          </div>
        )}
      </div>
    </div>
  );
}

export function WelcomeMessage() {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px 32px", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ fontFamily: "var(--serif)", fontSize: "28px", fontWeight: 300,
        color: "var(--ink)", lineHeight: 1.2, marginBottom: "12px" }}>
        Order<em style={{ fontStyle: "italic" }}>Agent</em>
      </div>
      <p style={{ color: "var(--ink-2)", fontSize: "13px", lineHeight: 1.7, marginBottom: "20px" }}>
        Ask me anything about orders. I can look up order status, list recent orders, and track shipments in real time.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
        {["Show recent orders", "Check order ORD-1005", "Track ORD-1012"].map(s => (
          <span key={s} style={{
            padding: "5px 12px", borderRadius: "20px", fontSize: "11px",
            border: "1px solid var(--border)", color: "var(--ink-2)",
            background: "var(--surface)",
          }}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
