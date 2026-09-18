/**
 * AI Layer Retrieval Service
 * 
 * Manages Bedrock Knowledge Base vector retrieval via BedrockAgentRuntimeClient.
 * Extracts matching passages, relevance scores, and metadata without exposing AWS internals.
 */

import { BedrockAgentRuntimeClient, RetrieveCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { getValidatedConfig } from "./bedrockClient.js";

let bedrockAgentClientInstance = null;

function getBedrockAgentClient(region) {
  if (!bedrockAgentClientInstance) {
    bedrockAgentClientInstance = new BedrockAgentRuntimeClient({ region });
  }
  return bedrockAgentClientInstance;
}

/**
 * Parses human-friendly source title from S3 location URI or metadata.
 */
function parseSourceTitle(location) {
  if (!location) return "Verified Legal Source";

  const s3Uri = location.s3Location?.uri || location.type || "";
  if (s3Uri.includes("/")) {
    const filename = s3Uri.split("/").pop();
    if (filename) {
      // Clean up extensions e.g. "security-deposit-en.txt" -> "Security Deposit Rules"
      const cleanName = filename
        .replace(/\.[^/.]+$/, "")
        .replace(/-en$/i, "")
        .replace(/-hi$/i, "")
        .replace(/[-_]/g, " ");
      return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    }
  }

  return "Verified Legal Source";
}

/**
 * Retrieves legal knowledge base passages matching the user query.
 * 
 * @param {Object} params
 * @param {string} params.query - User query text
 * @param {number} params.topK - Maximum number of vector passages to retrieve
 * @returns {Promise<Array<{ textSnippet: string, sourceTitle: string, score: number, id: string }>>}
 */
export async function retrieveKnowledgePassages({ query, topK = 5 }) {
  const config = getValidatedConfig();
  const client = getBedrockAgentClient(config.region);

  const command = new RetrieveCommand({
    knowledgeBaseId: config.kbId,
    retrievalQuery: {
      text: query,
    },
    retrievalConfiguration: {
      vectorSearchConfiguration: {
        numberOfResults: topK,
      },
    },
  });

  try {
    const response = await client.send(command);
    const retrievalResults = response.retrievalResults || [];

    return retrievalResults.map((result, idx) => {
      const textSnippet = result.content?.text || "";
      const score = typeof result.score === "number" ? result.score : 0.0;
      const sourceTitle = parseSourceTitle(result.location);

      return {
        id: `cit-${idx + 1}`,
        textSnippet: textSnippet.trim(),
        sourceTitle,
        score,
      };
    });
  } catch (err) {
    throw new Error(`Bedrock Knowledge Base retrieval failed: ${err.message}`);
  }
}
