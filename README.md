# Rocketseat Blog IA

API HTTP para um blog onde os posts são gerados automaticamente por um agente de IA
([Mastra](https://mastra.ai) + OpenAI `gpt-4o`) a partir de uma ideia enviada pelo usuário,
passando por um fluxo de rascunho → aprovação/rejeição → publicação.

## Tecnologias

- [Node.js](https://nodejs.org) 24 (`http` nativo, sem framework web) com ES Modules
- [PostgreSQL](https://www.postgresql.org) 16 (via [`pg`](https://www.npmjs.com/package/pg))
- [Postgrator](https://www.npmjs.com/package/postgrator) para migrations SQL
- [Mastra](https://www.npmjs.com/package/@mastra/core) + OpenAI para geração de conteúdo
- [Zod](https://www.npmjs.com/package/zod) para validação/schema do output da IA
- [Docker](https://www.docker.com) / Docker Compose

## Pré-requisitos

- Node.js na versão definida em [.nvmrc](.nvmrc) (`lts/Krypton`, Node 24)
- Docker e Docker Compose
- Uma chave de API da OpenAI (`OPENAI_API_KEY`)

## Setup local

```bash
# 1. Instala as dependências
npm install

# 2. Copia o .env.example para .env.local e preenche os valores (principalmente OPENAI_API_KEY)
npm run env:setup

# 3. Sobe o Postgres, aplica as migrations e levanta a infra de uma vez
npm run local:setup

# 4. Inicia a aplicação em modo desenvolvimento (com --watch)
npm run dev
```

O servidor sobe em `http://localhost:8080` (configurável via variáveis de ambiente).

### Variáveis de ambiente

Definidas em `.env.local` (baseado em [.env.example](.env.example)):

| Variável         | Descrição                                                              |
| ---------------- | ------------------------------------------------------------------------ |
| `API_HOST`       | Host exibido no log de inicialização do servidor                         |
| `API_PORT`       | Porta em que o servidor HTTP escuta                                      |
| `API_PROTOCOL`   | Protocolo exibido no log de inicialização do servidor (`http`/`https`)   |
| `API_KEY`        | Chave usada para autenticar rotas protegidas (`Authorization: Bearer`)    |
| `DATABASE_URL`   | String de conexão do PostgreSQL                                          |
| `OPENAI_API_KEY` | Chave de API da OpenAI usada pelo agente de IA para gerar os posts       |

## Endpoints

Todas as respostas são em JSON. Rotas marcadas como "Protegida" exigem o header
`Authorization: Bearer <API_KEY>`.

| Método   | Rota                    | Protegida | Descrição                                                                 |
| -------- | ----------------------- | :-------: | -------------------------------------------------------------------------- |
| `GET`    | `/posts`                |    Não*   | Lista posts publicados (`published_at <= NOW()`, aprovados e não rejeitados) |
| `GET`    | `/posts?include=all`    |    Sim    | Lista todos os posts, independente de status                               |
| `GET`    | `/posts/:id`            |    Não    | Busca um post publicado pelo `id`                                           |
| `POST`   | `/posts/draft`          |    Não    | Gera um rascunho de post a partir de uma ideia, usando o agente de IA       |
| `PATCH`  | `/posts/:id/approve`    |    Não    | Aprova e publica um post (`approved_at`/`published_at = now`)              |
| `DELETE` | `/posts/:id/reject`     |    Não    | Rejeita um post (`rejected_at = now`, remove aprovação/publicação)         |

\* Só exige autenticação quando o query param `include=all` é usado.

### `POST /posts/draft`

Body:

```json
{ "ideia": "Como usar IA generativa para criar conteúdo de blog" }
```

Resposta (`201`):

```json
{
  "message": "Post created successfully",
  "post": {
    "id": "xxxxxxxxxxxxxxxxxxxx",
    "titulo": "...",
    "content": "...",
    "published_at": null,
    "created_at": "2026-01-01T00:00:00.000Z",
    "approved_at": null,
    "rejected_at": null
  }
}
```

## Build e geração da imagem Docker

A aplicação roda em produção como uma imagem Docker (build multi-stage, usuário sem
privilégios, apenas dependências de produção). Para buildar a imagem:

```bash
npm run build
```

Isso executa `docker build -t rocketseat-blog-ia-nodejs:latest .` usando o [Dockerfile](Dockerfile).

Para testar a imagem localmente, conectada ao Postgres do `docker compose`:

```bash
npm run infra:up    # garante que o container do Postgres está no ar
npm run docker:run  # sobe a imagem na rede do compose, com DATABASE_URL apontando para "postgres"
```

## Publicação em produção

1. Gere a imagem com `npm run build` (ou `docker build` diretamente, publicando em um
   registry: `docker tag rocketseat-blog-ia-nodejs:latest <registry>/<repo>:<tag>` e
   `docker push <registry>/<repo>:<tag>`).
2. No ambiente de produção, garanta um PostgreSQL acessível e as variáveis de ambiente
   (`API_HOST`, `API_PORT`, `API_PROTOCOL`, `API_KEY`, `DATABASE_URL`, `OPENAI_API_KEY`)
   configuradas (via `--env-file`, secrets do orquestrador, etc.).
3. As migrations em [src/db/migrations](src/db/migrations) são aplicadas automaticamente
   na inicialização do servidor (`runMigrations()` em [src/index.js](src/index.js)).
4. Suba o container expondo a porta `8080`:
   ```bash
   docker run -d --restart unless-stopped \
     -p 8080:8080 \
     --env-file .env.production \
     --name rocketseat-blog-ia-nodejs \
     rocketseat-blog-ia-nodejs:latest
   ```

> O Mastra está configurado sem adapter de storage persistente, usando armazenamento em
> memória apenas para o agente. Isso não afeta os posts (persistidos no Postgres), mas se
> for necessário reter estado interno do Mastra entre reinícios, configure um adapter como
> `@mastra/pg` antes de ir para produção.

## Scripts npm

| Script              | Descrição                                                          |
| ------------------- | --------------------------------------------------------------------- |
| `dev`                | Roda a aplicação localmente com `--watch`, usando `.env.local`        |
| `infra:up`           | Sobe os containers de infraestrutura (`docker compose up -d`)         |
| `infra:down`         | Derruba os containers de infraestrutura                               |
| `db:migrate`         | Aplica as migrations pendentes                                        |
| `db:migrate:up`      | Aplica as migrations pendentes                                        |
| `db:migrate:down`    | Desfaz todas as migrations                                             |
| `env:setup`          | Copia `.env.example` para `.env.local`                                 |
| `local:setup`        | Setup completo: env + migrations + infra                               |
| `build`              | Builda a imagem Docker de produção                                    |
| `docker:run`         | Roda a imagem Docker localmente, conectada à rede do Postgres         |
| `lint` / `lint:fix`  | Lint do código com `oxlint`                                           |
| `format` / `format:check` | Formatação do código com `oxfmt`                                 |

## Estrutura de pastas

```
src/
  index.js              # Entry point: servidor HTTP e definição das rotas
  db/
    index.js             # Pool de conexão e execução de migrations
    migrations/          # Migrations SQL (Postgrator)
  mastra/
    index.js             # Configuração da instância do Mastra
    agents/post-agent.js  # Agente de IA que gera título e conteúdo do post
  server/
    router.js            # Roteador HTTP minimalista
    body.js               # Parser de body JSON das requisições
```
