import { putCase, getCasesBySession, getCaseById } from "../lib/dynamo.js";
import { ok, fail } from "../lib/response.js";

/**
 * Cases Handler:
 * - POST /cases: Creates a tracked legal case/dispute for a session.
 * - GET /cases?sessionId=...: Lists all tracked cases for a session.
 * - GET /cases/{caseId}?sessionId=...: Retrieves a single case by ID.
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
      const caseId = event.pathParameters?.caseId;
      const sessionId = event.queryStringParameters?.sessionId || event.headers?.["x-session-id"];

      if (!sessionId) {
        return fail(new Error("sessionId query parameter is required"), 400);
      }

      if (caseId) {
        const caseItem = await getCaseById(sessionId, caseId);
        if (!caseItem) {
          return fail(new Error("Case not found"), 404);
        }
        return ok(caseItem);
      }

      const cases = await getCasesBySession(sessionId);
      return ok({ cases });
    }

    return fail(new Error(`Method ${method} not allowed`), 405);
  } catch (err) {
    return fail(err);
  }
};
