import { v4 as uuid } from "uuid";
import { transcribeAudio } from "../lib/transcribeHelper.js";
import { groundedAnswer } from "../lib/aiService.js";
import { synthesizeSpeechToS3, formatTextForSpeech } from "../lib/pollyHelper.js";
import { presignedDownloadUrl } from "../lib/s3.js";
import { putItem } from "../lib/dynamo.js";
import { ok, fail } from "../lib/response.js";

// End-to-end voice flow:
// Audio S3 key -> Transcribe -> AI answer -> Polly TTS -> S3 MP3 -> audioUrl returned
export const handler = async (event) => {
  try {
    const { sessionId, audioS3Key, lang = "en" } = JSON.parse(event.body || "{}");
    if (!sessionId || !audioS3Key) return fail(new Error("sessionId and audioS3Key are required"), 400);

    const transcript = await transcribeAudio(audioS3Key, lang);
    const answer = await groundedAnswer(transcript, lang);

    // Synthesize spoken answer
    const audioId = uuid();
    const audioOutKey = `generated/${sessionId}/audio/${audioId}.mp3`;
    const speechText = formatTextForSpeech(answer);
    await synthesizeSpeechToS3(speechText, lang, audioOutKey);
    const audioUrl = await presignedDownloadUrl(audioOutKey);

    await putItem({
      pk: `SESSION#${sessionId}`,
      sk: `MSG#${Date.now()}`,
      role: "user",
      text: transcript,
      answer,
      audioUrl,
      viaVoice: true,
    });

    return ok({ transcript, audioUrl, ...answer });
  } catch (err) {
    return fail(err);
  }
};
