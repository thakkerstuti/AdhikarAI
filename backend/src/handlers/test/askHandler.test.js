/**
 * Unit Tests for /ask Lambda Handler
 * 
 * Verifies API Gateway request parsing, mock mode routing, CORS header inclusion,
 * HTTP status codes, and response contract compliance.
 */

import assert from "node:assert";
import { test, describe, beforeEach, afterEach } from "node:test";
import { handler as askHandler } from "../ask.js";

describe("/ask Lambda Handler - Mock Mode Integration", () => {
  const originalEnv = process.env.USE_MOCK_AI;

  beforeEach(() => {
    process.env.USE_MOCK_AI = "true";
  });

  afterEach(() => {
    process.env.USE_MOCK_AI = originalEnv;
  });

  test("handles valid API Gateway POST /ask event and returns 200 with answered contract", async () => {
    const event = {
      body: JSON.stringify({
        query: "What is the security deposit limit for a rented apartment?",
        language: "en",
        options: { topK: 5 },
      }),
    };

    const response = await askHandler(event);
    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.headers["Content-Type"], "application/json");
    assert.strictEqual(response.headers["Access-Control-Allow-Origin"], "*");

    const body = JSON.parse(response.body);
    assert.strictEqual(body.status, "answered");
    assert.strictEqual(body.grounded, true);
    assert.strictEqual(body.metadata.executionMode, "mock");
    assert.ok(body.answer.whatMayApply.includes("Model Tenancy Act"));
    assert.strictEqual(body.citations.length, 1);
  });

  test("returns 200 with fallback contract for ungrounded or unknown queries", async () => {
    const event = {
      body: JSON.stringify({
        query: "Uncovered legal scenario fallback query xyz123",
        language: "en",
      }),
    };

    const response = await askHandler(event);
    assert.strictEqual(response.statusCode, 200);

    const body = JSON.parse(response.body);
    assert.strictEqual(body.status, "fallback");
    assert.strictEqual(body.grounded, false);
    assert.strictEqual(body.citations.length, 0);
    assert.ok(body.fallback);
    assert.strictEqual(body.fallback.reason, "WEAK_RETRIEVAL");
  });

  test("returns 400 for invalid JSON body", async () => {
    const event = {
      body: "{ invalid json string ",
    };

    const response = await askHandler(event);
    assert.strictEqual(response.statusCode, 400);

    const body = JSON.parse(response.body);
    assert.ok(body.error.includes("Invalid JSON"));
  });

  test("returns 400 for missing query parameter in request body", async () => {
    const event = {
      body: JSON.stringify({
        language: "en",
      }),
    };

    const response = await askHandler(event);
    assert.strictEqual(response.statusCode, 400);

    const body = JSON.parse(response.body);
    assert.strictEqual(body.status, "error");
    assert.strictEqual(body.error.code, "INVALID_REQUEST");
  });
});
