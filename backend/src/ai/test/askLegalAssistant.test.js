/**
 * AI Layer Unit & Integration Tests
 * 
 * Tests contracts, validation, mock mode execution, grounding fallback rules,
 * local file retrieval, and configuration error handling for askLegalAssistant.
 */

import assert from "node:assert";
import { test, describe, beforeEach, afterEach } from "node:test";
import { askLegalAssistant } from "../index.js";
import { validateAndNormalizeRequest, RESPONSE_STATUS } from "../contracts.js";
import { evaluateRetrievalQuality, extractValidCitations } from "../grounding.js";
import { cleanAndParseJsonResponse } from "../prompts.js";
import { retrieveLocalPassages } from "../localRetrievalService.js";

describe("AI Layer - Request Validation", () => {
  test("validates and normalizes valid request payload", () => {
    const raw = {
      query: " What is landlord deposit limit? ",
      language: "EN",
      sessionId: " sess-123 ",
      options: { topK: 10 },
    };

    const normalized = validateAndNormalizeRequest(raw);
    assert.strictEqual(normalized.query, "What is landlord deposit limit?");
    assert.strictEqual(normalized.language, "en");
    assert.strictEqual(normalized.sessionId, "sess-123");
    assert.strictEqual(normalized.options.topK, 10);
  });

  test("uses default language (auto) and topK (5) if omitted", () => {
    const raw = { query: "Security deposit rules" };
    const normalized = validateAndNormalizeRequest(raw);
    assert.strictEqual(normalized.language, "auto");
    assert.strictEqual(normalized.options.topK, 5);
  });

  test("throws error when query is empty or missing", () => {
    assert.throws(() => validateAndNormalizeRequest({ query: "   " }), /'query' must be a non-empty string/);
    assert.throws(() => validateAndNormalizeRequest({}), /'query' must be a non-empty string/);
  });

  test("throws error for invalid language", () => {
    assert.throws(() => validateAndNormalizeRequest({ query: "Hello", language: "fr" }), /'language' must be one of/);
  });
});

describe("AI Layer - Mock Mode (USE_MOCK_AI=true)", () => {
  const originalEnv = process.env.USE_MOCK_AI;

  beforeEach(() => {
    process.env.USE_MOCK_AI = "true";
  });

  afterEach(() => {
    process.env.USE_MOCK_AI = originalEnv;
  });

  test("returns grounded answered response for tenancy deposit query", async () => {
    const request = {
      query: "What is the security deposit limit for a rental apartment?",
      language: "en",
    };

    const res = await askLegalAssistant(request);
    assert.strictEqual(res.status, RESPONSE_STATUS.ANSWERED);
    assert.strictEqual(res.grounded, true);
    assert.strictEqual(res.metadata.executionMode, "mock");
    assert.ok(res.answer.whatMayApply.includes("Model Tenancy Act"));
    assert.strictEqual(res.citations.length, 1);
    assert.strictEqual(res.citations[0].sourceTitle, "Model Tenancy Act 2021 - Section 11");
    assert.strictEqual(res.fallback, null);
  });

  test("returns grounded answered response for consumer product refund query", async () => {
    const request = {
      query: "Can I get a refund for a defective product under consumer law?",
      language: "en",
    };

    const res = await askLegalAssistant(request);
    assert.strictEqual(res.status, RESPONSE_STATUS.ANSWERED);
    assert.strictEqual(res.grounded, true);
    assert.ok(res.answer.whatMayApply.includes("Consumer Protection Act"));
  });

  test("returns fallback response for unknown or explicitly un-grounded query", async () => {
    const request = {
      query: "Tell me a fallback query scenario xyz123",
      language: "en",
    };

    const res = await askLegalAssistant(request);
    assert.strictEqual(res.status, RESPONSE_STATUS.FALLBACK);
    assert.strictEqual(res.grounded, false);
    assert.strictEqual(res.metadata.executionMode, "mock");
    assert.strictEqual(res.citations.length, 0);
    assert.ok(res.fallback);
    assert.strictEqual(res.fallback.reason, "WEAK_RETRIEVAL");
  });
});

describe("AI Layer - Local RAG & File Retrieval", () => {
  test("retrieves legal passages from local knowledge-base directory", () => {
    const passages = retrieveLocalPassages({ query: "security deposit tenant landlord", topK: 3 });
    assert.ok(passages.length > 0);
    assert.strictEqual(passages[0].sourceTitle, "Security Deposit");
    assert.ok(passages[0].score > 0.5);
    assert.ok(passages[0].textSnippet.includes("security deposit"));
  });
});

describe("AI Layer - Configuration Error Handling (USE_MOCK_AI=false)", () => {
  const originalMock = process.env.USE_MOCK_AI;
  const originalKb = process.env.BEDROCK_KB_ID;
  const originalGemini = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    process.env.USE_MOCK_AI = "false";
    delete process.env.BEDROCK_KB_ID;
    delete process.env.KB_ID;
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    process.env.USE_MOCK_AI = originalMock;
    if (originalKb) process.env.BEDROCK_KB_ID = originalKb;
    if (originalGemini) process.env.GEMINI_API_KEY = originalGemini;
  });

  test("throws configuration error when GEMINI_API_KEY or BEDROCK_KB_ID is missing in live mode", async () => {
    const request = { query: "What is the wage payment rule?" };
    const res = await askLegalAssistant(request);

    assert.strictEqual(res.status, RESPONSE_STATUS.ERROR);
    assert.strictEqual(res.grounded, false);
    assert.strictEqual(res.metadata.executionMode, "live");
    assert.strictEqual(res.error.code, "CONFIG_ERROR");
  });
});

describe("AI Layer - Grounding & Citation Rules", () => {
  test("triggers fallback when retrieval passages are empty", () => {
    const evalResult = evaluateRetrievalQuality([]);
    assert.strictEqual(evalResult.isGrounded, false);
    assert.strictEqual(evalResult.topScore, 0.0);
    assert.strictEqual(evalResult.reason, "NO_RETRIEVAL_PASSAGES");
  });

  test("triggers fallback when top retrieval score is below MIN_RETRIEVAL_SCORE (0.5)", () => {
    const passages = [
      { id: "1", textSnippet: "Irrelevant clause", sourceTitle: "Doc A", score: 0.35 },
      { id: "2", textSnippet: "Random text", sourceTitle: "Doc B", score: 0.2 },
    ];
    const evalResult = evaluateRetrievalQuality(passages);
    assert.strictEqual(evalResult.isGrounded, false);
    assert.strictEqual(evalResult.topScore, 0.35);
    assert.strictEqual(evalResult.reason, "WEAK_RETRIEVAL_SCORE");
  });

  test("passes grounding evaluation when top score meets or exceeds MIN_RETRIEVAL_SCORE (0.5)", () => {
    const passages = [
      { id: "1", textSnippet: "Landlord deposit law", sourceTitle: "Act 2021", score: 0.82 },
    ];
    const evalResult = evaluateRetrievalQuality(passages);
    assert.strictEqual(evalResult.isGrounded, true);
    assert.strictEqual(evalResult.topScore, 0.82);
  });

  test("extracts citations strictly from matching passages and prevents low-score inclusion", () => {
    const passages = [
      { id: "cit-1", textSnippet: "Valid section passage text", sourceTitle: "Act Section 1", score: 0.85 },
      { id: "cit-2", textSnippet: "Weak passage text", sourceTitle: "Act Section 2", score: 0.25 },
    ];
    const citations = extractValidCitations(passages);
    assert.strictEqual(citations.length, 1);
    assert.strictEqual(citations[0].id, "cit-1");
    assert.strictEqual(citations[0].sourceTitle, "Act Section 1");
    assert.strictEqual(citations[0].score, 0.85);
  });
});

describe("AI Layer - Prompt Output Parser", () => {
  test("strips markdown code blocks and parses clean JSON", () => {
    const rawMarkdown = "```json\n{\n  \"whatMayApply\": \"Test\",\n  \"yourSituation\": \"Test sit\",\n  \"nextSteps\": [],\n  \"documentsNeeded\": []\n}\n```";
    const parsed = cleanAndParseJsonResponse(rawMarkdown);
    assert.strictEqual(parsed.whatMayApply, "Test");
    assert.strictEqual(parsed.yourSituation, "Test sit");
  });

  test("throws error when JSON is corrupt or invalid", () => {
    const corrupt = "```json\n{ invalid json \n```";
    assert.throws(() => cleanAndParseJsonResponse(corrupt), /Failed to parse structured JSON response/);
  });
});
