/**
 * AI Layer - Local File Retrieval Service (Zero-Cloud RAG)
 * 
 * Reads legal source text files directly from backend/knowledge-base/
 * and performs fast in-memory passage relevance scoring.
 * Requires zero AWS Console or cloud vector store setup!
 */

import fs from "node:fs";
import path from "node:path";

const KB_DIR_RELATIVE = "../../knowledge-base";

/**
 * Normalizes and extracts searchable text paragraphs from local knowledge base files.
 */
function loadLocalKnowledgeDocuments() {
  const kbDir = path.resolve(import.meta.dirname || "", KB_DIR_RELATIVE);

  if (!fs.existsSync(kbDir)) {
    return [];
  }

  const documents = [];

  function scanDir(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".txt")) {
        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          const title = entry.name
            .replace(/\.[^/.]+$/, "")
            .replace(/-en$/i, "")
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());

          documents.push({
            id: `doc-${documents.length + 1}`,
            sourceTitle: title,
            filePath: fullPath,
            content: content.trim(),
          });
        } catch (err) {
          // Ignore unreadable files
        }
      }
    }
  }

  scanDir(kbDir);
  return documents;
}

/**
 * Computes keyword similarity score between query and document content.
 */
function calculateRelevanceScore(query, text) {
  const queryWords = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  if (queryWords.length === 0) return 0.0;

  const textLower = text.toLowerCase();
  let matches = 0;

  for (const word of queryWords) {
    if (textLower.includes(word)) {
      matches++;
    }
  }

  const baseScore = matches / queryWords.length;
  // Boost score if key legal terms match
  const keywordBoost = (textLower.includes("tenant") || textLower.includes("deposit") || textLower.includes("consumer") || textLower.includes("wage") || textLower.includes("salary")) ? 0.2 : 0.0;

  return Math.min(1.0, baseScore + keywordBoost);
}

/**
 * Retrieves matching legal passages from local files.
 * 
 * @param {Object} params
 * @param {string} params.query - User query string
 * @param {number} params.topK - Max passages to return
 * @returns {Array<{ id: string, textSnippet: string, sourceTitle: string, score: number }>}
 */
export function retrieveLocalPassages({ query, topK = 5 }) {
  const docs = loadLocalKnowledgeDocuments();
  if (docs.length === 0) return [];

  const scoredPassages = docs.map((doc) => {
    const score = calculateRelevanceScore(query, doc.content);
    return {
      id: doc.id,
      textSnippet: doc.content.slice(0, 1500),
      sourceTitle: doc.sourceTitle,
      score: Number(score.toFixed(2)),
    };
  });

  // Filter passages with non-zero score and sort descending
  const matches = scoredPassages
    .filter((p) => p.score > 0.0)
    .sort((a, b) => b.score - a.score);

  return matches.slice(0, topK);
}
