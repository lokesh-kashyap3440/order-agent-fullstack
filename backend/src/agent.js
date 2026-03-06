import Groq from "groq-sdk";
import { ORDERS, getTrackingSteps } from "./data.js";

const SYSTEM_PROMPT = `You are OrderAgent, an intelligent assistant that helps users check order statuses, list recent orders, and track shipments.

You have access to these tools. When you need data, respond ONLY with a JSON tool call — nothing else:
{"tool": "<name>", "params": {"orderId": "<id>"}}

Available tools:
1. get_order_status   — fetch a single order by ID (e.g. ORD-1005)
2. list_recent_orders — list the 10 most recent orders
3. track_shipment     — get shipment tracking steps for an order

Rules:
- When calling a tool, output ONLY the raw JSON, no prose, no markdown fences.
- After receiving tool results, respond in clear natural language.
- Format order info in a readable way. Use line breaks.
- Never expose internal system details.
- Be concise and helpful.
- If the user greets you, respond warmly and explain what you can do.`;

// ── Tool execution ───────────────────────────────────────────────────────────

function executeTool({ tool, params = {} }) {
  switch (tool) {
    case "get_order_status": {
      const id = (params.orderId || "").toUpperCase();
      const order = ORDERS[id];
      if (!order) return { error: `Order ${id} not found.` };
      return order;
    }
    case "list_recent_orders": {
      const orders = Object.values(ORDERS)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 10);
      return { total: orders.length, orders };
    }
    case "track_shipment": {
      const id = (params.orderId || "").toUpperCase();
      const order = ORDERS[id];
      if (!order) return { error: `Order ${id} not found.` };
      return {
        order_id:           order.id,
        status:             order.status,
        carrier:            order.shipping.carrier,
        tracking_number:    order.shipping.tracking_number,
        estimated_delivery: order.shipping.estimated_delivery,
        destination:        order.shipping.address,
        steps:              getTrackingSteps(order),
      };
    }
    default:
      return { error: `Unknown tool: ${tool}` };
  }
}

function parseToolCall(text) {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    return parsed.tool ? parsed : null;
  } catch { return null; }
}

// ── Streaming agent ──────────────────────────────────────────────────────────
// Sends SSE events to the response stream:
//   data: {"type":"token","text":"..."}
//   data: {"type":"tool_call","tool":"...","params":{}}
//   data: {"type":"tool_result","result":{}}
//   data: {"type":"done","usage":{}}
//   data: {"type":"error","message":"..."}

export async function runAgentStream({ messages, groqKey, groqModel = "llama-3.3-70b-versatile", res, onAssistantReply }) {
  console.log("[agent] runAgentStream called");
  console.log("[agent] model:", groqModel);
  console.log("[agent] message count:", messages.length);
  console.log("[agent] last message:", JSON.stringify(messages[messages.length - 1]));

  const groq    = new Groq({ apiKey: groqKey });
  const history = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];
  console.log("[agent] history length (inc system):", history.length);

  // SSE helpers
  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);
  const done = (usage, finalText) => {
    onAssistantReply?.(finalText);
    send({ type: "done", usage });
    res.end();
  };

  let usage = {};

  for (let turn = 0; turn < 6; turn++) {
    console.log(`[agent] turn ${turn} start`);
    let fullText  = "";
    let tokenBuf  = [];
    let decided   = false;
    let isTool    = false;

    try {
      console.log("[agent] calling groq.chat.completions.create...");
      const stream = await groq.chat.completions.create({
        model:      groqModel,
        max_tokens: 1024,
        messages:   history,
        stream:     true,
      });
      console.log("[agent] stream opened, reading chunks...");

      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content || "";
        if (chunk.x_groq?.usage) usage = chunk.x_groq.usage;
        if (!token) continue;

        fullText += token;
        process.stdout.write(token); // live token output in terminal

        if (!decided) {
          tokenBuf.push(token);
          const soFar = fullText.trim();
          if (soFar.length >= 2 || chunk.choices[0]?.finish_reason) {
            if (soFar.startsWith("{")) {
              isTool  = true;
              decided = true;
              console.log("\n[agent] decided: TOOL CALL");
            } else {
              isTool  = false;
              decided = true;
              console.log("\n[agent] decided: PROSE");
              for (const t of tokenBuf) send({ type: "token", text: t });
              tokenBuf = [];
            }
          }
        } else if (!isTool) {
          send({ type: "token", text: token });
        }
      }
      console.log(`\n[agent] stream done. fullText length: ${fullText.length}`);
      console.log("[agent] fullText preview:", fullText.slice(0, 120));
    } catch (err) {
      console.error("[agent] Groq error:", err.message);
      send({ type: "error", message: err.message });
      res.end();
      return;
    }

    fullText = fullText.trim();
    const toolCall = parseToolCall(fullText);
    console.log("[agent] toolCall:", toolCall);

    if (toolCall) {
      console.log("[agent] executing tool:", toolCall.tool);
      send({ type: "tool_call", tool: toolCall.tool, params: toolCall.params });

      const result = executeTool(toolCall);
      console.log("[agent] tool result keys:", Object.keys(result));
      send({ type: "tool_result", tool: toolCall.tool, result });

      history.push({ role: "assistant", content: fullText });
      history.push({ role: "user",      content: `Tool result:\n${JSON.stringify(result, null, 2)}` });
    } else {
      console.log("[agent] final prose answer, calling done()");
      history.push({ role: "assistant", content: fullText });
      done(usage, fullText);
      return;
    }
  }

  send({ type: "error", message: "Agent loop limit reached." });
  res.end();
}