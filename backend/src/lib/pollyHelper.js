import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { s3, BUCKET_NAME } from "./s3.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const polly = new PollyClient({
  region: process.env.AWS_REGION || "ap-south-1",
});

export const VOICE_IDS = {
  en: "Kajal", // Neural, Indian English
  hi: "Kajal", // Neural, Hindi
};

/**
 * Formats an answer object or string into conversational text suitable for Polly speech synthesis.
 */
export function formatTextForSpeech(answerOrText) {
  if (!answerOrText) return "";
  if (typeof answerOrText === "string") {
    return answerOrText.slice(0, 2800).trim();
  }

  const parts = [];
  if (answerOrText.whatMayApply) parts.push(answerOrText.whatMayApply);
  if (answerOrText.yourSituation) parts.push(answerOrText.yourSituation);
  if (Array.isArray(answerOrText.nextSteps) && answerOrText.nextSteps.length > 0) {
    const stepsSummary = answerOrText.lang === "hi"
      ? `मुख्य कदम: ${answerOrText.nextSteps.slice(0, 3).join(". ")}`
      : `Recommended next steps: ${answerOrText.nextSteps.slice(0, 3).join(". ")}`;
    parts.push(stepsSummary);
  }

  return parts.join(" ").slice(0, 2800).trim();
}

function isMockPolly() {
  if (process.env.USE_MOCK_POLLY === "true") return true;
  if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_PROFILE && !process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI) {
    return true;
  }
  return false;
}

export async function synthesizeSpeechToS3(text, lang = "en", outKey) {
  const speechText = formatTextForSpeech(text);
  if (!speechText) return outKey;

  if (isMockPolly()) {
    return outKey;
  }

  try {
    const res = await polly.send(
      new SynthesizeSpeechCommand({
        Text: speechText,
        OutputFormat: "mp3",
        VoiceId: VOICE_IDS[lang] ?? VOICE_IDS.en,
        Engine: "neural",
        LanguageCode: lang === "hi" ? "hi-IN" : "en-IN",
      })
    );

    const bytes = await res.AudioStream.transformToByteArray();
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: outKey,
        Body: bytes,
        ContentType: "audio/mpeg",
      })
    );
    return outKey;
  } catch (err) {
    if (
      err.name === "CredentialsProviderError" ||
      err.message?.includes("credentials") ||
      err.message?.includes("Region")
    ) {
      console.warn("[Polly] AWS credentials missing - returning mock speech key");
      return outKey;
    }
    throw err;
  }
}

