# ── dependencies ──────────────────────────────────────
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# ── development ────────────────────────────────────────
FROM node:20-alpine AS development

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE ${FRONTEND_PORT:-3000}

CMD ["npx", "next", "dev", "-p", "3000"]