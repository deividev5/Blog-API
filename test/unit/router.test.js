import { test } from "node:test";
import assert from "node:assert/strict";
import { createRouter } from "../../src/server/router.js";

function createResponse() {
  const res = {
    statusCode: undefined,
    headers: undefined,
    body: undefined,
    writeHead(statusCode, headers) {
      res.statusCode = statusCode;
      res.headers = headers;
    },
    end(data) {
      res.body = data;
    },
  };
  return res;
}

test("dispatches to the handler registered for the matching method and path", async () => {
  const router = createRouter();
  let called = false;
  router.get("/posts", async (req, res) => {
    called = true;
    res.end();
  });

  await router.handle({ method: "GET", url: "/posts" }, createResponse());

  assert.equal(called, true);
});

test("extracts named params from the url", async () => {
  const router = createRouter();
  let capturedParams;
  router.get("/posts/:id", async (req, res) => {
    capturedParams = req.params;
    res.end();
  });

  await router.handle({ method: "GET", url: "/posts/abc123" }, createResponse());

  assert.deepEqual(capturedParams, { id: "abc123" });
});

test("ignores the query string when matching routes", async () => {
  const router = createRouter();
  let called = false;
  router.get("/posts", async (req, res) => {
    called = true;
    res.end();
  });

  await router.handle({ method: "GET", url: "/posts?include=all" }, createResponse());

  assert.equal(called, true);
});

test("distinguishes routes by HTTP method", async () => {
  const router = createRouter();
  let getCalled = false;
  let postCalled = false;
  router.get("/posts", async (req, res) => {
    getCalled = true;
    res.end();
  });
  router.post("/posts", async (req, res) => {
    postCalled = true;
    res.end();
  });

  await router.handle({ method: "POST", url: "/posts" }, createResponse());

  assert.equal(getCalled, false);
  assert.equal(postCalled, true);
});

test("responds with 404 when no route matches", async () => {
  const router = createRouter();
  const res = createResponse();

  await router.handle({ method: "GET", url: "/unknown" }, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(JSON.parse(res.body), { message: "Not Found" });
});
