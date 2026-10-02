// Especificação OpenAPI 3.0 da API, usada para gerar a documentação Swagger em /api/docs
export function createOpenApiSpec() {
  const { API_PROTOCOL = "http", API_HOST = "localhost", API_PORT = "8080" } = process.env;

  const post = {
    type: "object",
    properties: {
      id: { type: "string" },
      titulo: { type: "string" },
      content: { type: "string" },
      published_at: { type: "string", format: "date-time", nullable: true },
      created_at: { type: "string", format: "date-time" },
      approved_at: { type: "string", format: "date-time", nullable: true },
      rejected_at: { type: "string", format: "date-time", nullable: true },
    },
  };

  return {
    openapi: "3.0.3",
    info: {
      title: "Rocketseat Blog IA API",
      description: "API de um blog com posts gerados por IA",
      version: "1.0.0",
    },
    servers: [{ url: `${API_PROTOCOL}://${API_HOST}:${API_PORT}` }],
    tags: [{ name: "Posts" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer" },
      },
      schemas: { Post: post },
    },
    paths: {
      "/posts": {
        get: {
          tags: ["Posts"],
          summary: "Lista os posts",
          parameters: [
            {
              name: "include",
              in: "query",
              required: false,
              description: "Use 'all' para incluir posts não publicados (requer API key)",
              schema: { type: "string", enum: ["all"] },
            },
          ],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Lista de posts",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: { $ref: "#/components/schemas/Post" } },
                    },
                  },
                },
              },
            },
            403: { description: "API key ausente ou inválida" },
            500: { description: "Erro ao buscar os posts" },
          },
        },
      },
      "/posts/{id}": {
        get: {
          tags: ["Posts"],
          summary: "Busca um post publicado pelo id",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: {
              description: "Post encontrado",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { data: { $ref: "#/components/schemas/Post" } },
                  },
                },
              },
            },
            404: { description: "Post não encontrado" },
            500: { description: "Erro ao buscar o post" },
          },
        },
      },
      "/posts/draft": {
        post: {
          tags: ["Posts"],
          summary: "Gera um rascunho de post a partir de uma ideia usando IA",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ideia"],
                  properties: { ideia: { type: "string" } },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Post criado com sucesso",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      post: { $ref: "#/components/schemas/Post" },
                    },
                  },
                },
              },
            },
            500: { description: "Erro ao gerar o post" },
          },
        },
      },
      "/posts/{id}/approve": {
        patch: {
          tags: ["Posts"],
          summary: "Aprova e publica um post",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: {
              description: "Post aprovado com sucesso",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      data: { $ref: "#/components/schemas/Post" },
                    },
                  },
                },
              },
            },
            404: { description: "Post não encontrado" },
            500: { description: "Erro ao aprovar o post" },
          },
        },
      },
      "/posts/{id}/reject": {
        delete: {
          tags: ["Posts"],
          summary: "Rejeita um post",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: {
              description: "Post rejeitado com sucesso",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      data: { $ref: "#/components/schemas/Post" },
                    },
                  },
                },
              },
            },
            404: { description: "Post não encontrado" },
            500: { description: "Erro ao rejeitar o post" },
          },
        },
      },
    },
  };
}
