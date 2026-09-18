/**
 * AdhikarAI - AI Layer Core Entry Point
 * 
 * Public API exposing askLegalAssistant.
 * Manages request validation, mock/live mode routing, RAG retrieval evaluation,
 * Nova 2 Lite grounded generation, non-hallucinated citation extraction, and fallback handling.
 */

import {
  validateAndNormalizeRequest,
  buildAnsweredResponse,
  buildFallbackResponse,
  buildErrorResponse,
  ValidationError,
  ConfigurationError,
} from "./contracts.js";
import { askLegalAssistantMock } from "./mockAiService.js";
import { getValidatedConfig, invokeNovaModel } from "./bedrockClient.js";
import { retrieveKnowledgePassages } from "./retrievalService.js";
import { evaluateRetrievalQuality, extractValidCitations } from "./grounding.js";
import { buildSystemPrompt, buildUserPrompt, cleanAndParseJsonResponse } from "./prompts.js";

/**
 * Main AI-Layer entry point for Q&A queries.
 * 
 * @param {Object} requestPayload - Raw incoming payload matching AskRequest schema
 * @returns {Promise<Object>} Formatted response matching AskResponse schema
 */
export async function askLegalAssistant(requestPayload) {
  let normalizedRequest;

  // 1. Request Validation
  try {
    normalizedRequest = validateAndNormalizeRequest(requestPayload);
  } catch (err) {
    if (err instanceof ValidationError) {
      return buildErrorResponse({
        code: err.code,
        message: err.message,
        executionMode: process.env.USE_MOCK_AI === "true" ? "mock" : "live",
      });
    }
    return buildErrorResponse({
      code: "INVALID_REQUEST",
      message: err.message || "Invalid request payload.",
      executionMode: process.env.USE_MOCK_AI === "true" ? "mock" : "live",
    });
  }

  // 2. Mock Mode Routing
  const isMock = process.env.USE_MOCK_AI === "true";
  if (isMock) {
    return askLegalAssistantMock(normalizedRequest);
  }

  // 3. Live Bedrock Integration Mode
  try {
    // Validate environmental configuration (throws ConfigurationError if live config is missing)
    getValidatedConfig();

    // Stage 1: Vector Retrieval from Bedrock KB
    const retrievedPassages = await retrieveKnowledgePassages({
      query: normalizedRequest.query,
      topK: normalizedRequest.options.topK,
    });

    // Stage 2: Grounding Evaluation & Weak Retrieval Guard
    const groundingEvaluation = evaluateRetrievalQuality(retrievedPassages);

    if (!groundingEvaluation.isGrounded) {
      // Weak or missing retrieval -> Return fallback response (Zero Hallucination)
      return buildFallbackResponse({
        reason: groundingEvaluation.reason || "WEAK_RETRIEVAL",
        message: "Retrieval score below threshold or no matching knowledge base passages found.",
        executionMode: "live",
        confidenceScore: groundingEvaluation.topScore,
      });
    }

    // Stage 3: Grounded Answer Generation via Amazon Nova 2 Lite
    const systemPrompt = buildSystemPrompt(normalizedRequest.language);
    const userPrompt = buildUserPrompt(normalizedRequest.query, retrievedPassages);

    const rawModelOutput = await invokeNovaModel({
      systemPrompt,
      userPrompt,
    });

    // Clean & Parse JSON Output
    const structuredAnswer = cleanAndParseJsonResponse(rawModelOutput);

    // Extract non-hallucinated citations from retrieved passages
    const citations = extractValidCitations(retrievedPassages);

    // Stage 4: Return Answered Response Contract
    return buildAnsweredResponse({
      answer: structuredAnswer,
      citations,
      confidenceScore: groundingEvaluation.topScore,
      executionMode: "live",
    });
  } catch (err) {
    if (err instanceof ConfigurationError) {
      return buildErrorResponse({
        code: err.code,
        message: err.message,
        executionMode: "live",
      });
    }

    // Unexpected runtime or Bedrock SDK error
    return buildErrorResponse({
      code: err.code || "AI_EXECUTION_ERROR",
      message: err.message || "An error occurred during AI processing.",
      executionMode: "live",
    });
  }
}
