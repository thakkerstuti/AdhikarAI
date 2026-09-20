import { getFullSession } from "../lib/dynamo.js";
import { ok, fail } from "../lib/response.js";

/**
 * Session History Retrieval (GET /session/{sessionId})
 *
 * Invoked when the user opens or refreshes the application.
 * Returns the entire state of their session workspace:
 * - Metadata (createdAt, preferredLang)
 * - Conversation messages (both text and voice, with audioUrls)
 * - Uploaded documents and OCR summaries
 * - Tracked legal cases
 * - Active reminders
 * - Generated dispute letters
 */
export const handler = async (event) => {
  try {
    const sessionId = event.pathParameters?.sessionId || event.queryStringParameters?.sessionId;
    if (!sessionId) {
      return fail(new Error("sessionId is required"), 400);
    }

    const sessionData = await getFullSession(sessionId);
    if (!sessionData) {
      return fail(new Error("Session not found"), 404);
    }

    return ok(sessionData);
  } catch (err) {
    return fail(err);
  }
};
