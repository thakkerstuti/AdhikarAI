import { extractTextFromS3 } from "../lib/textractHelper.js";
import { explainDocument } from "../lib/aiService.js";
import { getItem, putItem } from "../lib/dynamo.js";
import { ok, fail } from "../lib/response.js";

export const handler = async (event) => {
  try {
    const documentId = event.pathParameters?.documentId;
    const { sessionId, lang = "en" } = JSON.parse(event.body || "{}");
    if (!sessionId || !documentId) return fail(new Error("sessionId and documentId are required"), 400);

    const docItem = await getItem(`SESSION#${sessionId}`, `DOC#${documentId}`);
    if (!docItem) return fail(new Error("Document not found for this session"), 404);

    const extractedText = await extractTextFromS3(docItem.s3Key);
    const summary = await explainDocument(extractedText, lang);

    await putItem({ ...docItem, status: "explained", extractedText, summary });

    return ok({ documentId, extractedText: extractedText.slice(0, 2000), ...summary });
  } catch (err) {
    return fail(err);
  }
};
