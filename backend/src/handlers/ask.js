/**
 * Lambda Handler for /ask Endpoint
 * 
 * Bridges API Gateway POST /ask requests to the AI Layer (askLegalAssistant).
 * Runs in MOCK MODE (USE_MOCK_AI=true) to provide zero-cost, contract-compliant responses.
 */

import { askLegalAssistant } from "../ai/index.js";
import { ok, fail } from "../lib/response.js";

export const handler = async (event = {}) => {
  try {
    let payload = {};
    if (event.body) {
      try {
        payload = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
      } catch (parseErr) {
        return fail(new Error("Invalid JSON in request body."), 400);
      }
    } else if (event.query || event.question) {
      payload = event;
    }

    // Default to mock mode for offline / dev execution if environment variable is not explicitly set
    if (process.env.USE_MOCK_AI === undefined) {
      process.env.USE_MOCK_AI = "true";
    }

    // Invoke AI layer askLegalAssistant
    const result = await askLegalAssistant(payload);

    // Map AI response status to appropriate HTTP status code
    const statusCode = result.status === "error" ? 400 : 200;

    return ok(result, statusCode);
  } catch (err) {
    return fail(err, 500);
  }
};
