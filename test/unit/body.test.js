import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { parseJsonBody } from "../../src/server/body.js";

function createRequest(chunks) {
  const req = new EventEmitter();
  queueMicrotask(() => {
    for (const chunk of chunks) req.emit("data", Buffer.from(chunk));
    req.emit("end");
  });
  return req;
}

test("parses a valid JSON body", async () => {
  const req = createRequest(['{"ideia":"testes"}']);

  const result = await parseJsonBody(req);

  assert.deepEqual(result, { ideia: "testes" });
});

test("resolves to an empty object when the body is empty", async () => {
  const req = createRequest([]);

  const result = await parseJsonBody(req);

  assert.deepEqual(result, {});
});

test("rejects when the body is not valid JSON", async () => {
  const req = createRequest(["not-json"]);

  await assert.rejects(() => parseJsonBody(req));
});

test("rejects when the request stream emits an error", async () => {
  const req = new EventEmitter();
  const boom = new Error("boom");
  queueMicrotask(() => req.emit("error", boom));

  await assert.rejects(() => parseJsonBody(req), boom);
});

test("assembles multiple chunks before parsing", async () => {
  const req = createRequest(['{"ideia":', '"testes em chunks"}']);

  const result = await parseJsonBody(req);

  assert.deepEqual(result, { ideia: "testes em chunks" });
});
