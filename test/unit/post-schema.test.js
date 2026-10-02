import { test } from "node:test";
import assert from "node:assert/strict";
import { postSchema } from "../../src/schemas/post-schema.js";

test("accepts a valid post payload", () => {
  const result = postSchema.safeParse({ titulo: "Título", content: "Conteúdo" });

  assert.equal(result.success, true);
});

test("rejects a payload missing the titulo field", () => {
  const result = postSchema.safeParse({ content: "Conteúdo" });

  assert.equal(result.success, false);
});

test("rejects a payload missing the content field", () => {
  const result = postSchema.safeParse({ titulo: "Título" });

  assert.equal(result.success, false);
});

test("rejects a payload with wrong field types", () => {
  const result = postSchema.safeParse({ titulo: 123, content: true });

  assert.equal(result.success, false);
});
