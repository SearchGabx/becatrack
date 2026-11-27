# 1) Dependencias
FROM node:20-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 2) Build
FROM node:20-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN npm run build

# 3) Imagen final liviana
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl && npm i -g prisma@6
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/prisma ./prisma
# No correr como root dentro del contenedor
USER node
EXPOSE 3000
# Aplica migraciones pendientes y arranca el servidor Next.js standalone
CMD ["sh", "-c", "prisma migrate deploy && node server.js"]
