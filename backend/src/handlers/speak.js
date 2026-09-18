import { v4 as uuid } from "uuid";
import { synthesizeSpeechToS3 } from "../lib/pollyHelper.js";
import { presignedDownloadUrl } from "../lib/s3.js";
import { ok, fail } from "../lib/response.js";

export const handler = async (event) => {
  try {
    const { text, lang = "en", sessionId = "anon" } = JSON.parse(event.body || "{}");
    if (!text) return fail(new Error("text is required"), 400);

    const key = `generated/${sessionId}/audio/${uuid()}.mp3`;
    await synthesizeSpeechToS3(text, lang, key);
    const audioUrl = await presignedDownloadUrl(key);

    return ok({ audioUrl });
  } catch (err) {
    return fail(err);
  }
};
