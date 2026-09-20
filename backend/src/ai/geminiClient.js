/**
 * AI Layer - Google Gemini Client
 * 
 * Invokes Google Gemini 1.5 Flash (gemini-1.5-flash) using simple GEMINI_API_KEY.
 * Zero AWS Console, zero OpenSearch Serverless, zero IAM role complexity.
 */

import { GoogleGenAI } from "@google/genai";
import { ConfigurationError } from "./contracts.js";

const DEFAULT_MODEL_ID = "gemini-1.5-flash";

/**
 * Validates Gemini API configuration.
 * Throws ConfigurationError if GEMINI_API_KEY is missing when USE_MOCK_AI=false.
 */
export function getValidatedGeminiConfig() {
  const isMock = process.env.USE_MOCK_AI === "true";
  const apiKey = process.env.GEMINI_API_KEY;
  const modelId = process.env.GEMINI_MODEL_ID || DEFAULT_MODEL_ID;

  if (!isMock && !apiKey) {
    throw new ConfigurationError(
      "Google Gemini API Key ('GEMINI_API_KEY') is not configured in live mode. Set GEMINI_API_KEY in backend/.env or set USE_MOCK_AI=true."
    );
  }

  return {
    isMock,
    apiKey,
    modelId,
  };
}

let aiInstance = null;

function getAiClient(apiKey) {
  if (!aiInstance && apiKey) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

/**
 * Invokes Google Gemini model with system and user prompts.
 * 
 * @param {Object} params
 * @param {string} params.systemPrompt - System instructions & schema guidelines
 * @param {string} params.userPrompt - Context & user question
 * @returns {Promise<string>} Model response text
 */
export async function invokeGeminiModel({ systemPrompt, userPrompt }) {
  const config = getValidatedGeminiConfig();
  const ai = getAiClient(config.apiKey);

  try {
    const response = await ai.models.generateContent({
      model: config.modelId,
      contents: `${systemPrompt}\n\n${userPrompt}`,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }
    return text;
  } catch (err) {
    if (err instanceof ConfigurationError) throw err;
    throw new Error(`Google Gemini model invocation failed: ${err.message}`);
  }
}
