FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat curl openssl

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

FROM node:20-alpine AS development

RUN apk add --no-cache libc6-compat curl openssl

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

EXPOSE ${BACKEND_PORT:-3001}

CMD ["npx", "ts-node-dev", "--respawn", "--transpile-only", "src/server.ts"]