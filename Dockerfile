# ── Stage 1: build React frontend ───────────────────────────────────────────
FROM node:20-alpine AS frontend-build

RUN npm install -g pnpm

WORKDIR /app
COPY pnpm-workspace.yaml package.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json  ./backend/

# Install only frontend deps
RUN pnpm install --filter frontend

COPY frontend ./frontend
RUN pnpm --filter frontend build

# ── Stage 2: production backend ──────────────────────────────────────────────
FROM node:20-alpine AS production

RUN npm install -g pnpm

WORKDIR /app
COPY pnpm-workspace.yaml package.json ./
COPY backend/package.json ./backend/

# Install only backend production deps
RUN pnpm install --filter backend --prod

#approve builds
RUN pnpm approve-builds

# Copy backend source
COPY backend/src ./backend/src

# Copy built frontend into backend's public folder
COPY --from=frontend-build /app/frontend/dist ./backend/public

# Data directory for chat persistence
RUN mkdir -p /data

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/data

CMD ["node", "backend/src/index.js"]