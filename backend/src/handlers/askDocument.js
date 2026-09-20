import { askDocument } from "../lib/aiService.js";
import { getItem, putItem } from "../lib/dynamo.js";
import { ok, fail } from "../lib/response.js";

export const handler = async (event) => {
  try {
    const documentId = event.pathParameters?.documentId;
    const { sessionId, question, lang = "en" } = JSON.parse(event.body || "{}");
    if (!sessionId || !documentId || !question) {
      return fail(new Error("sessionId, documentId and question are required"), 400);
    }

    const docItem = await getItem(`SESSION#${sessionId}`, `DOC#${documentId}`);
    if (!docItem?.extractedText) {
      return fail(new Error("Document has not been explained yet - call /explain first"), 400);
    }

    const answer = await askDocument(docItem.extractedText, question, lang);

    await putItem({
      pk: `SESSION#${sessionId}`,
      sk: `MSG#${Date.now()}`,
      role: "user",
      text: question,
      documentId,
      answer,
    });

    return ok(answer);
  } catch (err) {
    return fail(err);
  }
};
