/**
 * AI Layer Grounding & Citation Engine
 * 
 * Evaluates retrieval relevance against server-side confidence thresholds
 * and extracts verbatim, un-hallucinated citations from KB search results.
 */

const DEFAULT_MIN_RETRIEVAL_SCORE = 0.5;

/**
 * Returns the server-side minimum retrieval score threshold from configuration.
 * Never exposed to the client or app request contract.
 */
export function getMinRetrievalScoreThreshold() {
  const envVal = process.env.MIN_RETRIEVAL_SCORE;
  if (envVal && !isNaN(Number(envVal))) {
    return Number(envVal);
  }
  return DEFAULT_MIN_RETRIEVAL_SCORE;
}

/**
 * Evaluates the quality and grounding of retrieved passages.
 * 
 * @param {Array<{ textSnippet: string, sourceTitle: string, score: number }>} retrievedPassages
 * @returns {{ isGrounded: boolean, topScore: number, reason?: string }}
 */
export function evaluateRetrievalQuality(retrievedPassages = []) {
  if (!Array.isArray(retrievedPassages) || retrievedPassages.length === 0) {
    return {
      isGrounded: false,
      topScore: 0.0,
      reason: "NO_RETRIEVAL_PASSAGES",
    };
  }

  const minScoreThreshold = getMinRetrievalScoreThreshold();
  const topScore = Math.max(...retrievedPassages.map((p) => (typeof p.score === "number" ? p.score : 0.0)));

  if (topScore < minScoreThreshold) {
    return {
      isGrounded: false,
      topScore,
      reason: "WEAK_RETRIEVAL_SCORE",
    };
  }

  return {
    isGrounded: true,
    topScore,
  };
}

/**
 * Generates concise, short excerpts for citations (under 40 words).
 */
function createShortExcerpt(text = "", maxWords = 35) {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(" ") + "...";
}

/**
 * Formats valid citations from retrieved KB passages.
 * Excludes passages below score threshold and prevents hallucinated citations.
 * 
 * @param {Array<{ id: string, textSnippet: string, sourceTitle: string, score: number }>} retrievedPassages
 * @returns {Array<{ id: string, sourceTitle: string, excerpt: string, score: number }>}
 */
export function extractValidCitations(retrievedPassages = []) {
  const minScoreThreshold = getMinRetrievalScoreThreshold();

  return retrievedPassages
    .filter((passage) => typeof passage.score === "number" && passage.score >= minScoreThreshold)
    .map((passage, index) => ({
      id: passage.id || `cit-${index + 1}`,
      sourceTitle: passage.sourceTitle || "Verified Legal Document",
      excerpt: createShortExcerpt(passage.textSnippet),
      score: passage.score,
    }));
}
