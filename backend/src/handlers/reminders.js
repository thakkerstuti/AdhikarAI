import { putReminder, getRemindersBySession } from "../lib/dynamo.js";
import { ok, fail } from "../lib/response.js";

/**
 * Reminders Handler (Product Flow 5):
 * - POST /reminders: Creates a tracked legal deadline, notice period, or hearing reminder.
 * - GET /reminders?sessionId=...: Lists all reminders for a session.
 */
export const handler = async (event) => {
  try {
    const method = event.httpMethod || "GET";

    if (method === "POST") {
      const body = JSON.parse(event.body || "{}");
      const { sessionId, title, dueDate, reminderType, caseId, status } = body;

      if (!sessionId || !title || !dueDate) {
        return fail(new Error("sessionId, title, and dueDate are required"), 400);
      }

      const newReminder = await putReminder(sessionId, {
        title,
        dueDate,
        reminderType: reminderType || "deadline",
        caseId: caseId || null,
        status: status || "pending",
      });

      return ok(newReminder, 201);
    }

    if (method === "GET") {
      const sessionId = event.queryStringParameters?.sessionId;
      if (!sessionId) {
        return fail(new Error("sessionId query parameter is required"), 400);
      }

      const reminders = await getRemindersBySession(sessionId);
      return ok({ reminders });
    }

    return fail(new Error(`Method ${method} not allowed`), 405);
  } catch (err) {
    return fail(err);
  }
};
