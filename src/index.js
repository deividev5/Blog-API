import http from "node:http";
import { nanoid } from "nanoid";
import { z } from "zod";
import { mastra } from "./mastra/index.js";
import { pool, runMigrations } from "./db/index.js";
import { createRouter } from "./server/router.js";
import { parseJsonBody } from "./server/body.js";

// Extraindo as variáveis de ambiente para configuração do servidor HTTP
const { API_HOST, API_PORT, API_PROTOCOL } = process.env;

// Schema do post gerado pelo agente de IA
const postSchema = z.object({
  titulo: z.string(),
  content: z.string(),
});

// Aplica as migrations pendentes antes do servidor começar a atender requisições
await runMigrations();

const router = createRouter();

router.get("/posts", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM posts ORDER BY created_at DESC");
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
    const { rows } = await pool.query("SELECT * FROM posts WHERE id = $1", [id]);
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

// Criando o servidor HTTP delegando o roteamento para o router
const server = http.createServer((req, res) => router.handle(req, res));

// Iniciando o servidor na porta definida nas variáveis de ambiente
server.listen(API_PORT, () => {
  console.log(`Server running on ${API_PROTOCOL}://${API_HOST}:${API_PORT}`);
  console.log("Press Ctrl+C to stop the server");
});
