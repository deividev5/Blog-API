import http from "node:http";
import { nanoid } from "nanoid";
import { mastra } from "./mastra/index.js";
import { pool } from "./db/index.js";
import { createRouter } from "./server/router.js";
import { parseJsonBody } from "./server/body.js";
import { hasValidApiKey } from "./server/auth.js";
import { postSchema } from "./schemas/post-schema.js";

// Monta o roteador com todas as rotas da API e retorna um servidor HTTP pronto para receber requisições (sem dar listen)
export function createApp() {
  const { API_KEY } = process.env;
  const router = createRouter();

  router.get("/posts", async (req, res) => {
    const { searchParams } = new URL(req.url, "http://localhost");
    const includeAll = searchParams.get("include") === "all";

    if (includeAll && !hasValidApiKey(req, API_KEY)) {
      res.writeHead(403, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Missing or invalid API key" }));
    }

    try {
      const { rows } = await pool.query(
        includeAll
          ? "SELECT * FROM posts ORDER BY created_at DESC"
          : "SELECT * FROM posts WHERE published_at <= NOW() AND rejected_at IS NULL AND approved_at IS NOT NULL ORDER BY created_at DESC",
      );
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ data: rows }));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Failed to fetch posts", error: error.message }));
    }
  });

  router.get("/posts/:id", async (req, res) => {
    const { id } = req.params;

    try {
      const { rows } = await pool.query(
        "SELECT * FROM posts WHERE published_at <= NOW() AND rejected_at IS NULL AND approved_at IS NOT NULL AND id = $1",
        [id],
      );
      if (!rows[0]) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Post not found" }));
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ data: rows[0] }));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Failed to fetch post", error: error.message }));
    }
  });

  router.post("/posts/draft", async (req, res) => {
    try {
      const body = await parseJsonBody(req);
      const postAgent = mastra.getAgentById("post-agent");

      // Gera título e conteúdo (markdown) a partir da ideia usando o agente de IA
      const { object } = await postAgent.generate(
        `Crie um post de blog a partir da seguinte ideia: ${body.ideia}`,
        { structuredOutput: { schema: postSchema } },
      );

      const post = {
        id: nanoid(),
        titulo: object.titulo,
        content: object.content,
        published_at: null,
        created_at: new Date(),
        approved_at: null,
        rejected_at: null,
      };

      const { rows } = await pool.query(
        `INSERT INTO posts (id, titulo, content, published_at, created_at, approved_at, rejected_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          post.id,
          post.titulo,
          post.content,
          post.published_at,
          post.created_at,
          post.approved_at,
          post.rejected_at,
        ],
      );

      res.writeHead(201, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Post created successfully", post: rows[0] }));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Failed to generate post", error: error.message }));
    }
  });

  router.patch("/posts/:id/approve", async (req, res) => {
    const { id } = req.params;

    try {
      const now = new Date();
      const { rows } = await pool.query(
        `UPDATE posts SET approved_at = $1, rejected_at = NULL, published_at = $1 WHERE id = $2 RETURNING *`,
        [now, id],
      );

      if (!rows[0]) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Post not found" }));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Post approved successfully", data: rows[0] }));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Failed to approve post", error: error.message }));
    }
  });

  router.delete("/posts/:id/reject", async (req, res) => {
    const { id } = req.params;

    try {
      const now = new Date();
      const { rows } = await pool.query(
        `UPDATE posts SET rejected_at = $1, published_at = NULL, approved_at = NULL WHERE id = $2 RETURNING *`,
        [now, id],
      );

      if (!rows[0]) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Post not found" }));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Post rejected successfully", data: rows[0] }));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Failed to reject post", error: error.message }));
    }
  });

  return http.createServer((req, res) => router.handle(req, res));
}
