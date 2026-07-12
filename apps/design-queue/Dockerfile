# RDN S2 — design-queue (arm64 / OCI Ampere)
FROM --platform=linux/arm64 node:22-alpine

WORKDIR /app

# Install production deps first for layer caching.
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

# App source.
COPY server.js ./
COPY public ./public

ENV NODE_ENV=production
ENV PORT=8080

# Internal only — the port is NOT published in docker-compose; Caddy on the
# `web` network reverse-proxies to it.
EXPOSE 8080

CMD ["node", "server.js"]
