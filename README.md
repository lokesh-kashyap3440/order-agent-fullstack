# OrderAgent

A full-stack agentic chatbot that answers questions about orders using a live REST API.

**Stack:** React + Vite (frontend) · Express + Groq SDK (backend) · pnpm monorepo

---

## Quick Start

### 1. Install dependencies
```bash
pnpm install
```

### 2. Configure backend
```bash
cp backend/.env.example backend/.env
# Edit backend/.env if needed (defaults work out of the box)
```

### 3. Start everything
```bash
pnpm dev
```

- Frontend → http://localhost:5173  
- Backend  → http://localhost:3001

### 4. Add your Groq API key
Open the app, click **⚙ Settings**, paste your key from [console.groq.com](https://console.groq.com).  
Free tier — no credit card needed.

---

## Project Structure

```
order-agent/
├── pnpm-workspace.yaml
├── package.json          # root scripts
├── backend/
│   ├── src/
│   │   ├── index.js      # Express server + routes
│   │   ├── agent.js      # Groq streaming agent loop
│   │   ├── data.js       # Seed order data
│   │   └── history.js    # Chat persistence (JSON on disk)
│   └── .data/            # Auto-created, stores threads.json
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── Sidebar.jsx       # Thread list
    │   │   ├── ChatPane.jsx      # Streaming chat UI
    │   │   ├── Message.jsx       # Message + tool events
    │   │   ├── OrderCard.jsx     # Rich order/tracking cards
    │   │   └── SettingsModal.jsx
    │   ├── hooks/
    │   │   └── useSettings.js
    │   └── lib/
    │       └── api.js            # Fetch + SSE client
    └── vite.config.js
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/orders` | List orders |
| GET | `/api/orders/:id` | Single order |
| GET | `/api/orders/:id/tracking` | Tracking steps |
| GET | `/api/threads` | List chat threads |
| POST | `/api/threads` | Create thread |
| GET | `/api/threads/:id` | Get thread + messages |
| POST | `/api/threads/:id/chat` | **SSE** streaming chat |
| PATCH | `/api/threads/:id` | Rename thread |
| DELETE | `/api/threads/:id` | Delete thread |

## Supported Models (Groq, all free)
- `llama-3.3-70b-versatile` ← recommended
- `llama3-70b-8192`
- `llama3-8b-8192`
- `mixtral-8x7b-32768`
- `gemma2-9b-it`
