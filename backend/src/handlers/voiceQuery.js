import { transcribeAudio } from "../lib/transcribeHelper.js";
import { groundedAnswer } from "../lib/bedrockClient.js";
import { putItem } from "../lib/dynamo.js";
import { ok, fail } from "../lib/response.js";

// Expects the audio to already be uploaded to S3 (via /documents-style
// presigned URL flow reused for audio) - the client posts the resulting key.
export const handler = async (event) => {
  try {
    const { sessionId, audioS3Key, lang = "en" } = JSON.parse(event.body || "{}");
    if (!sessionId || !audioS3Key) return fail(new Error("sessionId and audioS3Key are required"), 400);

    const transcript = await transcribeAudio(audioS3Key, lang);
    const answer = await groundedAnswer(transcript, lang);

    await putItem({
      pk: `SESSION#${sessionId}`,
      sk: `MSG#${Date.now()}`,
      role: "user",
      text: transcript,
      answer,
      viaVoice: true,
    });

    return ok({ transcript, ...answer });
  } catch (err) {
    return fail(err);
  }
};
