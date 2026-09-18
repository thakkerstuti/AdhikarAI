/**
 * AI Layer Prompt Engineering for Amazon Nova 2 Lite
 * 
 * Provides system prompts and prompt templates for grounded legal Q&A,
 * formatted specifically for Nova 2 Lite JSON output compliance.
 */

export const LANGUAGE_LABEL_MAP = {
  en: "English",
  hi: "Hindi (Devanagari script)",
  auto: "the language in which the user's question is written (Hindi or English)",
};

/**
 * Builds the system prompt for Nova 2 Lite grounded answer generation.
 */
export function buildSystemPrompt(language = "auto") {
  const langInstruction = LANGUAGE_LABEL_MAP[language] || LANGUAGE_LABEL_MAP.auto;

  return `You are AdhikarAI, an AI legal rights assistant serving citizens in India.
Your task is to answer the user's legal question strictly using ONLY the provided retrieved legal source material.

CRITICAL CONSTRAINTS:
1. You MUST ground your answer completely in the provided retrieved search results.
2. DO NOT use outside legal knowledge or make up legal facts.
3. Output language: Respond in ${langInstruction}.
4. Output format: You MUST respond with ONLY a single valid JSON object (no markdown code blocks, no trailing commentary, no extra text outside JSON).

Required JSON Shape:
{
  "whatMayApply": "plain-language summary of statutory provisions or legal rights (2-4 sentences)",
  "yourSituation": "explanation of how the legal provisions connect to the user's query (2-3 sentences)",
  "nextSteps": ["actionable step 1", "actionable step 2", "actionable step 3"],
  "documentsNeeded": ["document 1", "document 2"]
}
`;
}

/**
 * Builds the user prompt combining the retrieved search results and user question.
 */
export function buildUserPrompt(query, retrievedPassages = []) {
  const contextString = retrievedPassages
    .map((passage, index) => `[Source ${index + 1} - ${passage.sourceTitle}]\n${passage.textSnippet}`)
    .join("\n\n");

  return `Retrieved Legal Source Material:
"""
${contextString}
"""

User Question: "${query}"

Respond with ONLY the JSON object specified in system instructions.`;
}

/**
 * Cleanly strips markdown code fences and parses JSON output from Nova 2 Lite.
 */
export function cleanAndParseJsonResponse(rawText = "") {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Empty or non-string response received from model.");
  }

  let cleaned = rawText.trim();
  // Strip opening markdown fenced block e.g. ```json
  cleaned = cleaned.replace(/^```(?:json)?/i, "").trim();
  // Strip closing markdown block e.g. ```
  cleaned = cleaned.replace(/```$/, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Parsed output is not a JSON object.");
    }
    return parsed;
  } catch (err) {
    throw new Error(`Failed to parse structured JSON response from model: ${err.message}. Raw output snippet: ${rawText.slice(0, 100)}`);
  }
}
