import express  from "express";
import cors     from "cors";
import { v4 as uuid } from "uuid";
import { ORDERS, getTrackingSteps } from "./data.js";
import { runAgentStream }           from "./agent.js";
import {
  listThreads, getThread, createThread,
  appendMessages, updateTitle, deleteThread,
} from "./history.js";

const app  = express();
const PORT = process.env.PORT || 3001;
const ORDER_TOKEN = process.env.ORDER_TOKEN || "demo-token-123";

app.use(cors());
app.use(express.json());

// ── Auth middleware for order API ────────────────────────────────────────────
function authOrder(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (token !== ORDER_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  next();
}

// ════════════════════════════════════════════════════════════════════════════
//  ORDER API  (same as before)
// ════════════════════════════════════════════════════════════════════════════

app.get("/api/orders", authOrder, (req, res) => {
  let orders = Object.values(ORDERS);
  if (req.query.status) orders = orders.filter(o => o.status === req.query.status);
  const limit = parseInt(req.query.limit || "10");
  const [field, dir] = (req.query.sort || "created_at:desc").split(":");
  orders.sort((a, b) => dir === "asc"
    ? (a[field] || "").localeCompare(b[field] || "")
    : (b[field] || "").localeCompare(a[field] || ""));
  res.json({ total: orders.length, limit, orders: orders.slice(0, limit) });
});

app.get("/api/orders/:id", authOrder, (req, res) => {
  const order = ORDERS[req.params.id.toUpperCase()];
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

app.get("/api/orders/:id/tracking", authOrder, (req, res) => {
  const order = ORDERS[req.params.id.toUpperCase()];
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json({
    order_id:           order.id,
    status:             order.status,
    carrier:            order.shipping.carrier,
    tracking_number:    order.shipping.tracking_number,
    estimated_delivery: order.shipping.estimated_delivery,
    destination:        order.shipping.address,
    steps:              getTrackingSteps(order),
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  CHAT THREADS API
// ════════════════════════════════════════════════════════════════════════════

// List all threads
app.get("/api/threads", (req, res) => {
  res.json(listThreads());
});

// Create thread
app.post("/api/threads", (req, res) => {
  const id     = uuid();
  const title  = req.body.title || "New conversation";
  const thread = createThread(id, title);
  res.status(201).json(thread);
});

// Get thread with messages
app.get("/api/threads/:id", (req, res) => {
  const thread = getThread(req.params.id);
  if (!thread) return res.status(404).json({ error: "Thread not found" });
  res.json(thread);
});

// Delete thread
app.delete("/api/threads/:id", (req, res) => {
  deleteThread(req.params.id);
  res.status(204).end();
});

// Rename thread
app.patch("/api/threads/:id", (req, res) => {
  const thread = getThread(req.params.id);
  if (!thread) return res.status(404).json({ error: "Thread not found" });
  if (req.body.title) updateTitle(req.params.id, req.body.title);
  res.json(getThread(req.params.id));
});

// ════════════════════════════════════════════════════════════════════════════
//  AGENT CHAT  (SSE streaming)
// ════════════════════════════════════════════════════════════════════════════

app.post("/api/threads/:id/chat", async (req, res) => {
  const { message, groqKey, groqModel } = req.body;
  console.log("[chat] incoming:", { threadId: req.params.id, message, hasKey: !!groqKey, groqModel });

  if (!message) return res.status(400).json({ error: "message required" });
  if (!groqKey)  return res.status(400).json({ error: "groqKey required" });

  const threadId = req.params.id;
  let thread = getThread(threadId);
  console.log("[chat] thread found:", !!thread, "messages:", thread?.messages?.length ?? 0);
  if (!thread) thread = createThread(threadId);

  // Auto-title thread from first user message (before appending)
  const isFirstMessage = thread.messages.filter(m => m.role === "user").length === 0;
  if (isFirstMessage) updateTitle(threadId, message.slice(0, 50));

  // Persist user message
  appendMessages(threadId, { role: "user", content: message, ts: new Date().toISOString() });

  // SSE headers
  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");
  res.flushHeaders();
  console.log("[chat] SSE headers flushed");

  // Build message history from UPDATED thread (includes the new user message)
  const updatedThread = getThread(threadId);
  const messages = updatedThread.messages.map(({ role, content }) => ({ role, content }));
  console.log("[chat] sending", messages.length, "messages to agent");

  // Callback to persist assistant reply once agent is done
  function onAssistantReply(text) {
    if (!text.trim()) return;
    appendMessages(threadId, {
      role: "assistant",
      content: text.trim(),
      ts: new Date().toISOString(),
    });
  }

  await runAgentStream({ messages, groqKey, groqModel, res, onAssistantReply });
});

// ── Health ───────────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`
┌─────────────────────────────────────────┐
│   Order Agent Backend  :${PORT}            │
│                                         │
│   GET  /api/orders                      │
│   GET  /api/orders/:id                  │
│   GET  /api/orders/:id/tracking         │
│   GET  /api/threads                     │
│   POST /api/threads                     │
│   POST /api/threads/:id/chat  (SSE)     │
└─────────────────────────────────────────┘
`);
});