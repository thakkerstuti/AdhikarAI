import { putReminder, getRemindersBySession, updateReminder, deleteReminder } from "../lib/dynamo.js";
import { ok, fail } from "../lib/response.js";

/**
 * Reminders Handler:
 * - GET /reminders?sessionId=...: Lists all reminders for a session.
 * - POST /reminders: Creates a reminder.
 * - PUT /reminders/{reminderId}: Updates reminder status/title/dueDate.
 * - DELETE /reminders/{reminderId}: Deletes a reminder.
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
      const sessionId = event.queryStringParameters?.sessionId || event.headers?.["x-session-id"];
      if (!sessionId) {
        return fail(new Error("sessionId query parameter is required"), 400);
      }

      const reminders = await getRemindersBySession(sessionId);
      return ok({ reminders });
    }

    if (method === "PUT") {
      const body = JSON.parse(event.body || "{}");
      const reminderId = event.pathParameters?.reminderId || body.reminderId || body.id;
      const sessionId = body.sessionId || event.queryStringParameters?.sessionId || event.headers?.["x-session-id"];

      if (!sessionId || !reminderId) {
        return fail(new Error("sessionId and reminderId are required"), 400);
      }

      const patch = {};
      if (body.title !== undefined) patch.title = body.title;
      if (body.dueDate !== undefined) patch.dueDate = body.dueDate;
      if (body.status !== undefined) patch.status = body.status;
      if (body.completed !== undefined) patch.status = body.completed ? "completed" : "pending";
      if (body.reminderType !== undefined) patch.reminderType = body.reminderType;

      const updated = await updateReminder(sessionId, reminderId, patch);
      if (!updated) {
        return fail(new Error("Reminder not found"), 404);
      }

      return ok(updated);
    }

    if (method === "DELETE") {
      const reminderId = event.pathParameters?.reminderId || event.queryStringParameters?.reminderId;
      const sessionId = event.queryStringParameters?.sessionId || event.headers?.["x-session-id"];

      if (!sessionId || !reminderId) {
        return fail(new Error("sessionId and reminderId are required"), 400);
      }

      await deleteReminder(sessionId, reminderId);
      return ok({ deleted: true, reminderId });
    }

    return fail(new Error(`Method ${method} not allowed`), 405);
  } catch (err) {
    return fail(err);
  }
};
