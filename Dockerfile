FROM node:18-alpine AS base

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

FROM node:18-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

COPY --from=base /app/node_modules ./node_modules

COPY package*.json ./

COPY backend ./backend

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "backend/server.js"]