import { test, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import { createApp } from "../../src/app.js";
import { pool, runMigrations } from "../../src/db/index.js";
import { postAgent } from "../../src/mastra/agents/post-agent.js";

process.env.API_KEY ??= "e2e-test-key";

let app;

// Suite E2E: sobe o app real sobre uma conexão Postgres real (via docker-compose), só o agente de IA é mockado
before(async () => {
  await runMigrations();
  app = createApp();
});

beforeEach(async () => {
  await pool.query("DELETE FROM posts");
});

after(async () => {
  await pool.query("DELETE FROM posts");
  await pool.end();
});

test("ciclo completo: cria rascunho, aprova, lista publicamente e rejeita", async (t) => {
  t.mock.method(postAgent, "generate", async () => ({
    object: { titulo: "Post E2E", content: "# Conteúdo gerado em E2E" },
  }));

  const draftResponse = await supertest(app)
    .post("/posts/draft")
    .send({ ideia: "Executar um teste E2E" });

  assert.equal(draftResponse.status, 201);
  const postId = draftResponse.body.post.id;
  assert.ok(postId);

  // Antes de aprovado, o post não deve aparecer na listagem pública
  const listBeforeApproval = await supertest(app).get("/posts");
  assert.deepEqual(listBeforeApproval.body.data, []);

  const approveResponse = await supertest(app).patch(`/posts/${postId}/approve`);
  assert.equal(approveResponse.status, 200);
  assert.ok(approveResponse.body.data.approved_at);

  const listAfterApproval = await supertest(app).get("/posts");
  assert.equal(listAfterApproval.body.data.length, 1);
  assert.equal(listAfterApproval.body.data[0].id, postId);

  const singlePost = await supertest(app).get(`/posts/${postId}`);
  assert.equal(singlePost.status, 200);
  assert.equal(singlePost.body.data.titulo, "Post E2E");

  const rejectResponse = await supertest(app).delete(`/posts/${postId}/reject`);
  assert.equal(rejectResponse.status, 200);
  assert.ok(rejectResponse.body.data.rejected_at);

  const listAfterReject = await supertest(app).get("/posts");
  assert.deepEqual(listAfterReject.body.data, []);
});

test("GET /posts/:id retorna 404 para um post inexistente", async () => {
  const response = await supertest(app).get("/posts/does-not-exist");

  assert.equal(response.status, 404);
});

test("GET /posts?include=all exige autenticação", async () => {
  const withoutKey = await supertest(app).get("/posts?include=all");
  assert.equal(withoutKey.status, 403);

  const withKey = await supertest(app)
    .get("/posts?include=all")
    .set("Authorization", `Bearer ${process.env.API_KEY}`);
  assert.equal(withKey.status, 200);
});

test("PATCH /posts/:id/approve retorna 404 para um post inexistente", async () => {
  const response = await supertest(app).patch("/posts/does-not-exist/approve");

  assert.equal(response.status, 404);
});

test("DELETE /posts/:id/reject retorna 404 para um post inexistente", async () => {
  const response = await supertest(app).delete("/posts/does-not-exist/reject");

  assert.equal(response.status, 404);
});
