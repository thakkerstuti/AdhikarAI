import { v4 as uuid } from "uuid";
import { generateLetter } from "../lib/aiService.js";
import { LETTER_TYPES } from "../../letters/templates.js";
import { putTextObject, presignedDownloadUrl } from "../lib/s3.js";
import { putItem } from "../lib/dynamo.js";
import { ok, fail } from "../lib/response.js";

export const handler = async (event) => {
  try {
    const { sessionId, letterType, lang = "en", details = {} } = JSON.parse(event.body || "{}");
    if (!sessionId || !letterType) return fail(new Error("sessionId and letterType are required"), 400);
    if (!LETTER_TYPES[letterType]) return fail(new Error(`Unknown letterType. Valid: ${Object.keys(LETTER_TYPES).join(", ")}`), 400);

    const letterText = await generateLetter(letterType, lang, details);

    const letterId = uuid();
    const s3Key = `generated/${sessionId}/letters/${letterId}.txt`;
    await putTextObject(s3Key, letterText, "text/plain; charset=utf-8");
    const downloadUrl = await presignedDownloadUrl(s3Key);

    await putItem({
      pk: `SESSION#${sessionId}`,
      sk: `LETTER#${Date.now()}`,
      letterId,
      letterType,
      lang,
      s3Key,
    });

    return ok({ letterId, letterType, lang, letterText, downloadUrl });
  } catch (err) {
    return fail(err);
  }
};
