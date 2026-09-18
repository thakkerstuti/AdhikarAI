/**
 * AI Layer Request and Response Contracts
 * 
 * Strict contract schemas and builder functions for askLegalAssistant.
 */

export const RESPONSE_STATUS = {
  ANSWERED: "answered",
  FALLBACK: "fallback",
  ERROR: "error",
};

export const DEFAULT_DISCLAIMER =
  "This is general legal information, not legal advice. For specific legal disputes, consult a qualified advocate or legal service authority.";

/**
 * Validates and normalizes the incoming request payload.
 * Throws a ValidationError if required fields are missing or invalid.
 */
export function validateAndNormalizeRequest(payload = {}) {
  if (!payload || typeof payload !== "object") {
    throw new ValidationError("Request payload must be an object.");
  }

  const { query, language = "auto", sessionId, options = {} } = payload;

  if (!query || typeof query !== "string" || !query.trim()) {
    throw new ValidationError("'query' must be a non-empty string.");
  }

  const normalizedLang = String(language).toLowerCase().trim();
  const validLanguages = ["en", "hi", "auto"];
  if (!validLanguages.includes(normalizedLang)) {
    throw new ValidationError(`'language' must be one of: ${validLanguages.join(", ")}`);
  }

  const topK = options?.topK && Number.isInteger(Number(options.topK)) && Number(options.topK) > 0
    ? Number(options.topK)
    : 5;

  return {
    query: query.trim(),
    language: normalizedLang,
    sessionId: typeof sessionId === "string" ? sessionId.trim() : undefined,
    options: {
      topK,
    },
  };
}

/**
 * Builds a grounded response payload (status: "answered").
 */
export function buildAnsweredResponse({
  answer,
  citations = [],
  confidenceScore = 0.0,
  executionMode = "live",
}) {
  return {
    status: RESPONSE_STATUS.ANSWERED,
    answer: {
      whatMayApply: answer.whatMayApply || "",
      yourSituation: answer.yourSituation || "",
      nextSteps: Array.isArray(answer.nextSteps) ? answer.nextSteps : [],
      documentsNeeded: Array.isArray(answer.documentsNeeded) ? answer.documentsNeeded : [],
    },
    grounded: true,
    citations: citations.map((c, idx) => ({
      id: c.id || `cit-${idx + 1}`,
      sourceTitle: c.sourceTitle || "Verified Legal Document",
      excerpt: c.excerpt || "",
      score: typeof c.score === "number" ? Number(c.score.toFixed(2)) : 0.0,
    })),
    fallback: null,
    disclaimer: DEFAULT_DISCLAIMER,
    metadata: {
      executionMode,
      confidenceScore: typeof confidenceScore === "number" ? Number(confidenceScore.toFixed(2)) : 0.0,
    },
  };
}

/**
 * Builds a fallback response payload (status: "fallback").
 */
export function buildFallbackResponse({
  reason = "WEAK_RETRIEVAL",
  message = "Retrieval score below threshold or no matching knowledge base passages found.",
  executionMode = "live",
  confidenceScore = 0.0,
}) {
  return {
    status: RESPONSE_STATUS.FALLBACK,
    answer: {
      whatMayApply: "We could not find specific legal statutory provisions in our verified knowledge base matching your query.",
      yourSituation: "Your query appears to involve legal scenarios outside our current grounded knowledge repository.",
      nextSteps: [
        "Rephrase your question using specific legal terms (e.g., 'security deposit limit', 'eviction notice', 'unpaid wages').",
        "Consult a qualified legal practitioner or District Legal Services Authority (DLSA).",
      ],
      documentsNeeded: [
        "Relevant written notices or communications",
        "Identity documents and contracts related to your issue",
      ],
    },
    grounded: false,
    citations: [],
    fallback: {
      reason,
      message,
    },
    disclaimer: DEFAULT_DISCLAIMER,
    metadata: {
      executionMode,
      confidenceScore: typeof confidenceScore === "number" ? Number(confidenceScore.toFixed(2)) : 0.0,
    },
  };
}

/**
 * Builds an error response payload (status: "error").
 */
export function buildErrorResponse({
  code = "SYSTEM_ERROR",
  message = "An internal AI layer error occurred.",
  executionMode = "live",
}) {
  return {
    status: RESPONSE_STATUS.ERROR,
    answer: null,
    grounded: false,
    citations: [],
    fallback: null,
    disclaimer: DEFAULT_DISCLAIMER,
    error: {
      code,
      message,
    },
    metadata: {
      executionMode,
      confidenceScore: 0.0,
    },
  };
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.code = "INVALID_REQUEST";
  }
}

export class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigurationError";
    this.code = "CONFIG_ERROR";
  }
}
