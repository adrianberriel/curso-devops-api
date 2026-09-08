# syntax=docker/dockerfile:1

# ---- Stage 1: build ----
# node:24.20-alpine3.24 — Node 24 es la versión LTS activa actual ("krypton"),
# pineada a un patch y una versión de Alpine específicos (no floating tags como
# "24-alpine" ni "latest") para builds reproducibles.
FROM node:24.20-alpine3.24 AS builder

WORKDIR /app

# Dependencias primero: esta capa de cache solo se invalida si cambian
# package.json / package-lock.json, no cada vez que cambia el código fuente.
COPY package.json package-lock.json ./
RUN npm ci

# Ahora sí el código fuente y el build. Cambia mucho más seguido que las
# dependencias, por eso va después: no rompe el cache de la capa anterior.
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

# Sacamos las devDependencies (typescript, @nestjs/cli, vitest, oxlint, etc.)
# antes de pasar node_modules a la imagen final — no hacen falta en runtime.
RUN npm prune --omit=dev

# ---- Stage 2: runtime ----
FROM node:24.20-alpine3.24 AS runner

WORKDIR /app
ENV NODE_ENV=production

# La imagen oficial de Node ya trae un usuario sin privilegios llamado "node"
# (uid 1000) — lo usamos en vez de correr como root.
# Referencia: https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md#non-root-user
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/main"]