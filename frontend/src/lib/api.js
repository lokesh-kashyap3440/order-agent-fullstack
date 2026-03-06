const BASE = "/api";

export async function fetchThreads() {
  const r = await fetch(`${BASE}/threads`);
  return r.json();
}

export async function createThread(title = "New conversation") {
  const r = await fetch(`${BASE}/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  return r.json();
}

export async function fetchThread(id) {
  const r = await fetch(`${BASE}/threads/${id}`);
  return r.json();
}

export async function deleteThread(id) {
  await fetch(`${BASE}/threads/${id}`, { method: "DELETE" });
}

export async function renameThread(id, title) {
  const r = await fetch(`${BASE}/threads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  return r.json();
}

// Returns an EventSource-like readable — calls onEvent(evt) for each SSE event
// and onDone() when stream ends.
export function streamChat({ threadId, message, groqKey, groqModel, onEvent, onDone, onError }) {
  const controller = new AbortController();

  fetch(`${BASE}/threads/${threadId}/chat`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ message, groqKey, groqModel }),
    signal:  controller.signal,
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      onError(err.error || "Request failed");
      return;
    }
    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let   buffer  = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        try {
          const evt = JSON.parse(trimmed.slice(5).trim());
          onEvent(evt);
          if (evt.type === "done" || evt.type === "error") { onDone(); return; }
        } catch {}
      }
    }
    onDone();
  }).catch(err => {
    if (err.name !== "AbortError") onError(err.message);
  });

  return () => controller.abort();
}
