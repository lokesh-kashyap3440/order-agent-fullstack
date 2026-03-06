import React from "react";

const STATUS_META = {
  delivered:  { label: "Delivered",  color: "var(--green)",  bg: "var(--green-bg)" },
  shipped:    { label: "Shipped",    color: "var(--amber)",  bg: "var(--amber-bg)" },
  processing: { label: "Processing", color: "var(--blue)",   bg: "var(--blue-bg)"  },
  pending:    { label: "Pending",    color: "var(--ink-2)",  bg: "var(--surface)"  },
  cancelled:  { label: "Cancelled",  color: "var(--red)",    bg: "var(--red-bg)"   },
};

function Badge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: "20px",
      fontSize: "11px", fontWeight: 500, letterSpacing: "0.5px",
      color: meta.color, background: meta.bg,
      border: `1px solid ${meta.color}30`,
    }}>
      {meta.label.toUpperCase()}
    </span>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0",
      borderBottom: "1px solid var(--border)", fontSize: "12px" }}>
      <span style={{ color: "var(--ink-3)" }}>{label}</span>
      <span style={{ color: "var(--ink)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export function OrderCard({ order }) {
  if (!order || order.error) return null;
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", padding: "14px", marginTop: "10px",
      boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <span style={{ fontFamily: "var(--serif)", fontSize: "15px", fontWeight: 600 }}>
          {order.id}
        </span>
        <Badge status={order.status} />
      </div>
      <Row label="Product"  value={`${order.item?.name} × ${order.item?.quantity}`} />
      <Row label="Total"    value={`$${order.payment?.total?.toFixed(2)}`} />
      <Row label="Payment"  value={order.payment?.method} />
      <Row label="Carrier"  value={order.shipping?.carrier} />
      <Row label="Address"  value={order.shipping?.address} />
      {order.shipping?.estimated_delivery && (
        <Row label="Est. Delivery" value={new Date(order.shipping.estimated_delivery).toLocaleDateString()} />
      )}
      <Row label="Customer" value={order.customer?.email} />
    </div>
  );
}

export function OrderListCard({ orders }) {
  if (!orders?.length) return null;
  return (
    <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
      {orders.map(o => (
        <div key={o.id} style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", padding: "10px 14px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: "13px" }}>{o.id}</div>
            <div style={{ fontSize: "11px", color: "var(--ink-2)", marginTop: "2px" }}>
              {o.item?.name} — ${o.payment?.total?.toFixed(2)}
            </div>
          </div>
          <Badge status={o.status} />
        </div>
      ))}
    </div>
  );
}

export function TrackingCard({ tracking }) {
  if (!tracking?.steps) return null;
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", padding: "14px", marginTop: "10px",
    }}>
      <div style={{ fontFamily: "var(--serif)", fontWeight: 600, marginBottom: "4px" }}>
        {tracking.order_id} — {tracking.carrier}
      </div>
      <div style={{ fontSize: "11px", color: "var(--ink-3)", marginBottom: "12px" }}>
        {tracking.tracking_number}
        {tracking.estimated_delivery &&
          ` · Est. ${new Date(tracking.estimated_delivery).toLocaleDateString()}`}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {tracking.steps.map((step, i) => (
          <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "16px", flexShrink: 0 }}>
              <div style={{
                width: 12, height: 12, borderRadius: "50%", marginTop: "4px", flexShrink: 0,
                background: step.done ? "var(--green)" : step.active ? "var(--amber)" : "var(--border)",
                boxShadow: step.active ? "0 0 0 3px var(--amber-bg)" : "none",
              }} />
              {i < tracking.steps.length - 1 && (
                <div style={{ width: 1, flexGrow: 1, minHeight: 16,
                  background: step.done ? "var(--green)" : "var(--border)" }} />
              )}
            </div>
            <div style={{ paddingBottom: "12px" }}>
              <div style={{ fontSize: "12px", fontWeight: step.done || step.active ? 600 : 400,
                color: step.done ? "var(--ink)" : step.active ? "var(--amber)" : "var(--ink-3)" }}>
                {step.label}
              </div>
              <div style={{ fontSize: "11px", color: "var(--ink-3)" }}>
                {step.location}
                {step.timestamp && ` · ${new Date(step.timestamp).toLocaleDateString()}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
