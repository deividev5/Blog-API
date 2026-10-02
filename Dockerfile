# syntax=docker/dockerfile:1

ARG NODE_VERSION=24-alpine

# ---- deps: instala apenas as dependências de produção ----
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

COPY package.json package-lock.json ./
# --ignore-scripts evita rodar o hook "prepare" (lefthook), que é só para dev
RUN npm ci --omit=dev --ignore-scripts

# ---- runtime: imagem final enxuta para produção ----
FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# Executa a aplicação com um usuário sem privilégios
USER node

EXPOSE 8080

CMD ["node", "src/index.js"]
