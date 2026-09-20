/**
 * AI Layer Bedrock Client
 * 
 * Manages Bedrock Runtime client initialization and Nova 2 Lite model invocation.
 * Enforces strict configuration checks when USE_MOCK_AI=false.
 */

import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { ConfigurationError } from "./contracts.js";

const DEFAULT_MODEL_ID = "amazon.nova-lite-v1:0";

/**
 * Validates environmental configuration for live Bedrock integration.
 * Throws ConfigurationError if required settings are missing.
 */
export function getValidatedConfig() {
  const isMock = process.env.USE_MOCK_AI === "true";
  const modelId = process.env.BEDROCK_MODEL_ID || DEFAULT_MODEL_ID;
  const kbId = process.env.BEDROCK_KB_ID || process.env.KB_ID;
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

  if (!isMock) {
    if (!kbId) {
      throw new ConfigurationError(
        "Bedrock Knowledge Base ID ('BEDROCK_KB_ID') is not configured for live AI execution."
      );
    }
  }

  return {
    isMock,
    modelId,
    kbId,
    region,
  };
}

let bedrockRuntimeClientInstance = null;

/**
 * Returns a cached instance of BedrockRuntimeClient.
 */
function getBedrockRuntimeClient(region) {
  if (!bedrockRuntimeClientInstance) {
    bedrockRuntimeClientInstance = new BedrockRuntimeClient({ region });
  }
  return bedrockRuntimeClientInstance;
}

/**
 * Invokes Amazon Nova 2 Lite model with system and user prompts.
 * 
 * @param {Object} params
 * @param {string} params.systemPrompt - System instructions & schema guidelines
 * @param {string} params.userPrompt - Context & user question
 * @returns {Promise<string>} Raw model response text
 */
export async function invokeNovaModel({ systemPrompt, userPrompt }) {
  const config = getValidatedConfig();

  const client = getBedrockRuntimeClient(config.region);

  const command = new ConverseCommand({
    modelId: config.modelId,
    system: [{ text: systemPrompt }],
    messages: [
      {
        role: "user",
        content: [{ text: userPrompt }],
      },
    ],
    inferenceConfig: {
      maxTokens: 1500,
      temperature: 0.1,
    },
  });

  try {
    const response = await client.send(command);
    const content = response.output?.message?.content?.[0]?.text;
    if (!content) {
      throw new Error("Bedrock Nova 2 Lite returned an empty response.");
    }
    return content;
  } catch (err) {
    if (err instanceof ConfigurationError) throw err;
    throw new Error(`Bedrock Nova 2 Lite model invocation failed: ${err.message}`);
  }
}
