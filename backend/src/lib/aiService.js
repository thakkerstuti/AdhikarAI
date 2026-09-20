// AI Abstraction Layer for NYAYA VOICE (Adhikar).
// Acts as the bridge between Mitali's backend handlers and Pranjal's Bedrock AI.
//
// When USE_MOCK_AI is "true" (or not yet set to "false"), it returns realistic
// mock legal responses conforming strictly to Pranjal's schemas without requiring
// Bedrock credentials or SDK initialization.
// When USE_MOCK_AI is "false", it delegates directly to Pranjal's bedrockClient.js.

import {
  getMockGroundedAnswer,
  getMockDocumentExplain,
  getMockDocumentAsk,
  getMockLetter,
} from "./mockAiData.js";

/**
 * Checks whether mock AI responses should be used.
 * Defaults to true for local/parallel backend development.
 * Set USE_MOCK_AI="false" in environment/template.yaml to engage Pranjal's live Bedrock models.
 */
export function isMockAiEnabled() {
  return process.env.USE_MOCK_AI !== "false";
}

/**
 * Helper to dynamically load Pranjal's Bedrock client only when real AI is requested.
 * Prevents initialization errors when running in mock mode.
 */
async function getBedrockClient() {
  return import("./bedrockClient.js");
}

/**
 * Helper to dynamically load prompt templates for real Bedrock generation.
 */
async function getPromptTemplate() {
  return import("./promptTemplate.js");
}

/**
 * Grounded legal Q&A (RAG).
 * Used by /query and /voice-query.
 */
export async function groundedAnswer(question, lang = "en") {
  if (isMockAiEnabled()) {
    return getMockGroundedAnswer(question, lang);
  }
  const bedrock = await getBedrockClient();
  return bedrock.groundedAnswer(question, lang);
}

/**
 * High-level document explanation (OCR text analysis).
 * Used by /documents/{documentId}/explain.
 */
export async function explainDocument(extractedText, lang = "en") {
  if (isMockAiEnabled()) {
    return getMockDocumentExplain(extractedText, lang);
  }
  const [bedrock, prompts] = await Promise.all([getBedrockClient(), getPromptTemplate()]);
  const prompt = prompts.buildDocumentExplainPrompt(extractedText, lang);
  return bedrock.invokeJson(prompt);
}

/**
 * Follow-up question on an uploaded document.
 * Used by /documents/{documentId}/ask.
 */
export async function askDocument(extractedText, question, lang = "en") {
  if (isMockAiEnabled()) {
    return getMockDocumentAsk(extractedText, question, lang);
  }
  const [bedrock, prompts] = await Promise.all([getBedrockClient(), getPromptTemplate()]);
  const prompt = prompts.buildDocumentAskPrompt(extractedText, question, lang);
  return bedrock.invokeJson(prompt, { fast: true });
}

/**
 * Formal legal letter generation.
 * Used by /generate-letter.
 */
export async function generateLetter(letterType, lang = "en", details = {}) {
  if (isMockAiEnabled()) {
    return getMockLetter(letterType, lang, details);
  }
  const [bedrock, prompts] = await Promise.all([getBedrockClient(), getPromptTemplate()]);
  const prompt = prompts.buildLetterPrompt(letterType, lang, details);
  return bedrock.invokeText(prompt);
}

/**
 * Drop-in adapter for direct JSON invocations.
 */
export async function invokeJson(prompt, opts) {
  if (isMockAiEnabled()) {
    const lang = prompt.includes("Hindi") ? "hi" : "en";
    if (prompt.includes("documentType") || prompt.includes("Rental Agreement")) {
      return getMockDocumentExplain("", lang);
    }
    if (prompt.includes("User question:")) {
      return getMockDocumentAsk("", "", lang);
    }
    return getMockGroundedAnswer("", lang);
  }
  const bedrock = await getBedrockClient();
  return bedrock.invokeJson(prompt, opts);
}

/**
 * Drop-in adapter for direct text invocations.
 */
export async function invokeText(prompt, opts) {
  if (isMockAiEnabled()) {
    const lang = prompt.includes("Hindi") ? "hi" : "en";
    return getMockLetter("security_deposit", lang, {});
  }
  const bedrock = await getBedrockClient();
  return bedrock.invokeText(prompt, opts);
}
