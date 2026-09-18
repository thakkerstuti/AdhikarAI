import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { buildGroundedAnswerPreamble } from "./promptTemplate.js";

const runtime = new BedrockRuntimeClient({});
const agentRuntime = new BedrockAgentRuntimeClient({});

const KB_ID = process.env.KB_ID;
const MODEL_ID = process.env.MODEL_ID;
const FAST_MODEL_ID = process.env.FAST_MODEL_ID;

/**
 * Grounded answer for a free-text legal question, using the Bedrock
 * Knowledge Base (RAG). This is the core call behind /query and /voice-query.
 */
export async function groundedAnswer(question, lang) {
  const cmd = new RetrieveAndGenerateCommand({
    input: { text: question },
    retrieveAndGenerateConfiguration: {
      type: "KNOWLEDGE_BASE",
      knowledgeBaseConfiguration: {
        knowledgeBaseId: KB_ID,
        modelArn: MODEL_ID,
        generationConfiguration: {
          promptTemplate: {
            textPromptTemplate: `${buildGroundedAnswerPreamble(lang)}

Here is the retrieved legal source material:
$search_results$

User question: ${question}`,
          },
        },
      },
    },
  });

  const res = await agentRuntime.send(cmd);
  return parseJsonAnswer(res.output?.text ?? "");
}

/**
 * Direct model call (no retrieval) for document explain/ask/letter generation,
 * where the "source" is the uploaded document itself rather than the KB.
 */
export async function invokeText(prompt, { fast = false } = {}) {
  const cmd = new ConverseCommand({
    modelId: fast ? FAST_MODEL_ID : MODEL_ID,
    messages: [{ role: "user", content: [{ text: prompt }] }],
    inferenceConfig: { maxTokens: 1500, temperature: 0.2 },
  });
  const res = await runtime.send(cmd);
  return res.output?.message?.content?.[0]?.text ?? "";
}

export async function invokeJson(prompt, opts) {
  const raw = await invokeText(prompt, opts);
  return parseJsonAnswer(raw);
}

function parseJsonAnswer(raw) {
  const cleaned = raw.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Fall back to a safe, visibly-degraded shape rather than throwing,
    // so the UI can still show *something* instead of a hard error.
    return {
      whatMayApply: raw || "The assistant could not produce a structured answer for this question.",
      yourSituation: "",
      nextSteps: [],
      documentsNeeded: [],
      source: { title: "Unavailable", excerpt: "" },
      disclaimer: "This is general legal information, not legal advice.",
      lang: "en",
      _parseError: true,
    };
  }
}
