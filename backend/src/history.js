import fs   from "fs";
import path  from "path";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), ".data");
const THREADS_FILE = path.join(DATA_DIR, "threads.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadAll() {
  ensureDir();
  if (!fs.existsSync(THREADS_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(THREADS_FILE, "utf8")); }
  catch { return {}; }
}

function saveAll(threads) {
  ensureDir();
  fs.writeFileSync(THREADS_FILE, JSON.stringify(threads, null, 2));
}

export function listThreads() {
  const threads = loadAll();
  return Object.values(threads)
    .map(t => ({
      id:         t.id,
      title:      t.title,
      created_at: t.created_at,
      updated_at: t.updated_at,
      message_count: t.messages.filter(m => m.role === "user").length,
    }))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function getThread(id) {
  const threads = loadAll();
  return threads[id] || null;
}

export function createThread(id, title = "New conversation") {
  const threads = loadAll();
  const now = new Date().toISOString();
  threads[id] = { id, title, messages: [], created_at: now, updated_at: now };
  saveAll(threads);
  return threads[id];
}

export function appendMessages(threadId, ...messages) {
  const threads = loadAll();
  if (!threads[threadId]) createThread(threadId);
  threads[threadId].messages.push(...messages);
  threads[threadId].updated_at = new Date().toISOString();
  saveAll(threads);
}

export function updateTitle(threadId, title) {
  const threads = loadAll();
  if (!threads[threadId]) return;
  threads[threadId].title = title;
  saveAll(threads);
}

export function deleteThread(id) {
  const threads = loadAll();
  delete threads[id];
  saveAll(threads);
}
