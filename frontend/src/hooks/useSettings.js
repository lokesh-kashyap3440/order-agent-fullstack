import { useState } from "react";

const STORAGE_KEY = "order_agent_settings";

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}

export function useSettings() {
  const [settings, setSettings] = useState(() => ({
    groqKey:   "",
    groqModel: "llama-3.3-70b-versatile",
    ...load(),
  }));

  function save(updates) {
    const next = { ...settings, ...updates };
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return { settings, save };
}
