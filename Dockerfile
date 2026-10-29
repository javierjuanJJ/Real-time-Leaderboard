# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (better layer caching)
# --legacy-peer-deps: npm >=10 bug workaround for peer dependency resolution errors
COPY backend/package.json ./
RUN npm install --legacy-peer-deps

# Copy source and generate Prisma client
COPY backend/ ./
RUN npx prisma generate

# ---------- Production stage ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app ./

EXPOSE 3000

CMD ["node", "server.js"]
