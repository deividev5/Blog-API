import { test } from "node:test";
import assert from "node:assert/strict";
import { hasValidApiKey } from "../../src/server/auth.js";

test("returns true for a matching bearer token", () => {
  const req = { headers: { authorization: "Bearer secret" } };

  assert.equal(hasValidApiKey(req, "secret"), true);
});

test("returns false when the scheme is not Bearer", () => {
  const req = { headers: { authorization: "Basic secret" } };

  assert.equal(hasValidApiKey(req, "secret"), false);
});

test("returns false when the token does not match", () => {
  const req = { headers: { authorization: "Bearer wrong" } };

  assert.equal(hasValidApiKey(req, "secret"), false);
});

test("returns false when the authorization header is missing", () => {
  const req = { headers: {} };

  assert.equal(hasValidApiKey(req, "secret"), false);
});

test("returns false when no api key is configured", () => {
  const req = { headers: { authorization: "Bearer secret" } };

  assert.equal(hasValidApiKey(req, undefined), false);
});
