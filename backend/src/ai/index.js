/**
 * AdhikarAI - AI Layer Core Entry Point
 * 
 * Public API exposing askLegalAssistant.
 * Manages request validation, mock/live mode routing, RAG retrieval evaluation,
 * Gemini 1.5 Flash grounded generation, non-hallucinated citation extraction, and fallback handling.
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
import { getValidatedGeminiConfig, invokeGeminiModel } from "./geminiClient.js";
import { getValidatedConfig as getValidatedBedrockConfig, invokeNovaModel } from "./bedrockClient.js";
import { retrieveKnowledgePassages } from "./retrievalService.js";
import { retrieveLocalPassages } from "./localRetrievalService.js";
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

  // 3. Live AI Execution Mode (Google Gemini API or Bedrock)
  try {
    const isGeminiMode = Boolean(process.env.GEMINI_API_KEY || process.env.AI_PROVIDER === "gemini");

    let retrievedPassages = [];
    let rawModelOutput = "";

    if (isGeminiMode) {
      // Live Google Gemini 1.5 Flash + Local RAG Mode
      getValidatedGeminiConfig();

      retrievedPassages = retrieveLocalPassages({
        query: normalizedRequest.query,
        topK: normalizedRequest.options.topK,
      });

      const groundingEvaluation = evaluateRetrievalQuality(retrievedPassages);
      if (!groundingEvaluation.isGrounded) {
        return buildFallbackResponse({
          reason: groundingEvaluation.reason || "WEAK_RETRIEVAL",
          message: "Retrieval score below threshold or no matching knowledge base passages found.",
          executionMode: "live",
          confidenceScore: groundingEvaluation.topScore,
        });
      }

      const systemPrompt = buildSystemPrompt(normalizedRequest.language);
      const userPrompt = buildUserPrompt(normalizedRequest.query, retrievedPassages);

      rawModelOutput = await invokeGeminiModel({
        systemPrompt,
        userPrompt,
      });

      const structuredAnswer = cleanAndParseJsonResponse(rawModelOutput);
      const citations = extractValidCitations(retrievedPassages);

      return buildAnsweredResponse({
        answer: structuredAnswer,
        citations,
        confidenceScore: groundingEvaluation.topScore,
        executionMode: "live",
      });
    } else {
      // Live Bedrock Mode
      getValidatedBedrockConfig();

      retrievedPassages = await retrieveKnowledgePassages({
        query: normalizedRequest.query,
        topK: normalizedRequest.options.topK,
      });

      const groundingEvaluation = evaluateRetrievalQuality(retrievedPassages);
      if (!groundingEvaluation.isGrounded) {
        return buildFallbackResponse({
          reason: groundingEvaluation.reason || "WEAK_RETRIEVAL",
          message: "Retrieval score below threshold or no matching knowledge base passages found.",
          executionMode: "live",
          confidenceScore: groundingEvaluation.topScore,
        });
      }

      const systemPrompt = buildSystemPrompt(normalizedRequest.language);
      const userPrompt = buildUserPrompt(normalizedRequest.query, retrievedPassages);

      rawModelOutput = await invokeNovaModel({
        systemPrompt,
        userPrompt,
      });

      const structuredAnswer = cleanAndParseJsonResponse(rawModelOutput);
      const citations = extractValidCitations(retrievedPassages);

      return buildAnsweredResponse({
        answer: structuredAnswer,
        citations,
        confidenceScore: groundingEvaluation.topScore,
        executionMode: "live",
      });
    }
  } catch (err) {
    if (err instanceof ConfigurationError) {
      return buildErrorResponse({
        code: err.code,
        message: err.message,
        executionMode: "live",
      });
    }

    return buildErrorResponse({
      code: err.code || "AI_EXECUTION_ERROR",
      message: err.message || "An error occurred during AI processing.",
      executionMode: "live",
    });
  }
}
