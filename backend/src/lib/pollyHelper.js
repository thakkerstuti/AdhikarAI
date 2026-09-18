import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { s3, BUCKET_NAME } from "./s3.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const polly = new PollyClient({});

const VOICE_IDS = {
  en: "Kajal", // Neural, Indian English
  hi: "Kajal", // Kajal also supports Hindi; swap for a dedicated hi-IN voice if your region offers one
};

export async function synthesizeSpeechToS3(text, lang, outKey) {
  const res = await polly.send(
    new SynthesizeSpeechCommand({
      Text: text.slice(0, 3000),
      OutputFormat: "mp3",
      VoiceId: VOICE_IDS[lang] ?? VOICE_IDS.en,
      Engine: "neural",
      LanguageCode: lang === "hi" ? "hi-IN" : "en-IN",
    })
  );
  const bytes = await res.AudioStream.transformToByteArray();
  await s3.send(new PutObjectCommand({ Bucket: BUCKET_NAME, Key: outKey, Body: bytes, ContentType: "audio/mpeg" }));
  return outKey;
}
