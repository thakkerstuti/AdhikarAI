import { putCase, getCasesBySession } from "../lib/dynamo.js";
import { ok, fail } from "../lib/response.js";

/**
 * Cases Handler (Product Flow 5):
 * - POST /cases: Creates a tracked legal case/dispute for a session.
 * - GET /cases?sessionId=...: Lists all tracked cases for a session.
 */
export const handler = async (event) => {
  try {
    const method = event.httpMethod || "GET";

    if (method === "POST") {
      const body = JSON.parse(event.body || "{}");
      const { sessionId, title, category, description, opponentName, status } = body;

      if (!sessionId || !title) {
        return fail(new Error("sessionId and title are required"), 400);
      }

      const newCase = await putCase(sessionId, {
        title,
        category: category || "General",
        description: description || "",
        opponentName: opponentName || "",
        status: status || "active",
      });

      return ok(newCase, 201);
    }

    if (method === "GET") {
      const sessionId = event.queryStringParameters?.sessionId;
      if (!sessionId) {
        return fail(new Error("sessionId query parameter is required"), 400);
      }

      const cases = await getCasesBySession(sessionId);
      return ok({ cases });
    }

    return fail(new Error(`Method ${method} not allowed`), 405);
  } catch (err) {
    return fail(err);
  }
};
