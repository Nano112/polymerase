FROM oven/bun:1 AS base
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json bun.lock turbo.json ./
COPY packages/core/package.json ./packages/core/package.json
COPY shared/package.json ./shared/package.json
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json

# DO the copy version agnostic 
COPY schematic-renderer-1.1.10.tgz ./schematic-renderer-1.1.10.tgz
COPY schematic-renderer-1.1.10.tgz ./client/schematic-renderer-1.1.10.tgz
# Install dependencies (skip postinstall since source files aren't available yet)
RUN bun install --ignore-scripts

# Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build all packages
ENV VITE_SERVER_URL=""
RUN bun run build

# Server Runner
FROM oven/bun:1 AS server
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/packages ./packages

ENV NODE_ENV=production
ENV PORT=3000

VOLUME ["/app/server/data"]

WORKDIR /app/server
EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]

# Client Runner
FROM nginx:alpine AS client
COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]