import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from "@aws-sdk/client-transcribe";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET_NAME } from "./s3.js";

const transcribe = new TranscribeClient({
  region: process.env.AWS_REGION || "ap-south-1",
});

export const LANGUAGE_CODES = {
  en: "en-IN",
  hi: "hi-IN",
};

/**
 * Maps S3 key extension to AWS Transcribe MediaFormat.
 */
export function getMediaFormat(s3Key = "") {
  const ext = s3Key.split(".").pop().toLowerCase();
  const formatMap = {
    mp3: "mp3",
    wav: "wav",
    webm: "webm",
    ogg: "ogg",
    m4a: "mp4",
    mp4: "mp4",
    flac: "flac",
  };
  return formatMap[ext] || undefined;
}

/**
 * Returns realistic mock transcripts for local/offline testing.
 */
export function getMockTranscript(lang = "en") {
  if (lang === "hi") {
    return "मेरा मकान मालिक घर खाली करने के बाद मेरा 50000 रुपये का सिक्योरिटी डिपॉजिट वापस नहीं कर रहा है। कृपया मेरी सहायता करें।";
  }
  return "My landlord has withheld my security deposit of 50000 rupees after I vacated the flat. He is refusing to refund it.";
}

/**
 * Checks if Transcribe should operate in mock mode.
 */
function isMockTranscribe() {
  if (process.env.USE_MOCK_TRANSCRIBE === "true") return true;
  if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_PROFILE && !process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI) {
    return true;
  }
  return false;
}

/**
 * Batch-transcribe a short audio clip already uploaded to S3.
 * Polls GetTranscriptionJob every 2s (up to maxWaitMs).
 * Automatically reads transcript from S3 and returns text string.
 */
export async function transcribeAudio(s3Key, lang = "en", { maxWaitMs = 45000 } = {}) {
  if (isMockTranscribe()) {
    return getMockTranscript(lang);
  }

  const jobName = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const mediaUri = `s3://${BUCKET_NAME}/${s3Key}`;
  const mediaFormat = getMediaFormat(s3Key);

  const startParams = {
    TranscriptionJobName: jobName,
    LanguageCode: LANGUAGE_CODES[lang] ?? "en-IN",
    Media: { MediaFileUri: mediaUri },
    OutputBucketName: BUCKET_NAME,
    OutputKey: `transcripts/${jobName}.json`,
  };

  if (mediaFormat) {
    startParams.MediaFormat = mediaFormat;
  }

  try {
    await transcribe.send(new StartTranscriptionJobCommand(startParams));
  } catch (err) {
    if (
      err.name === "CredentialsProviderError" ||
      err.message?.includes("credentials") ||
      err.message?.includes("Region")
    ) {
      console.warn("[Transcribe] AWS credentials missing - returning mock transcript");
      return getMockTranscript(lang);
    }
    throw err;
  }

  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 2000));
    const status = await transcribe.send(new GetTranscriptionJobCommand({ TranscriptionJobName: jobName }));
    const job = status.TranscriptionJob;

    if (job.TranscriptionJobStatus === "COMPLETED") {
      const uri = job.Transcript?.TranscriptFileUri;
      let json;

      try {
        if (uri) {
          const res = await fetch(uri);
          if (res.ok) {
            json = await res.json();
          }
        }
      } catch {
        // fetch may fail if bucket has public block; fallback to s3 client below
      }

      if (!json) {
        const s3KeyOut = `transcripts/${jobName}.json`;
        const s3Res = await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3KeyOut }));
        const raw = await s3Res.Body.transformToString();
        json = JSON.parse(raw);
      }

      const transcript = (json.results?.transcripts ?? [])
        .map((t) => t.transcript)
        .join(" ")
        .trim();

      return transcript || "No audible speech detected.";
    }

    if (job.TranscriptionJobStatus === "FAILED") {
      throw new Error(`Transcription failed: ${job.FailureReason || "Unknown Transcribe error"}`);
    }
  }

  throw new Error("Transcription timed out. Please try a shorter audio clip (under 30 seconds).");
}

