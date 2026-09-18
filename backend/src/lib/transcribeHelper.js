import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from "@aws-sdk/client-transcribe";
import { BUCKET_NAME } from "./s3.js";

const transcribe = new TranscribeClient({});

const LANGUAGE_CODES = { en: "en-IN", hi: "hi-IN" };

/**
 * Batch-transcribe a short audio clip already uploaded to S3.
 * Polls GetTranscriptionJob every 2s. Fine for hackathon-length demo clips
 * (a few seconds to ~30s); for production use, move this to an async
 * job + webhook/Step Functions pattern instead of polling inside a Lambda.
 */
export async function transcribeAudio(s3Key, lang, { maxWaitMs = 45000 } = {}) {
  const jobName = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const mediaUri = `s3://${BUCKET_NAME}/${s3Key}`;

  await transcribe.send(
    new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName,
      LanguageCode: LANGUAGE_CODES[lang] ?? "en-IN",
      Media: { MediaFileUri: mediaUri },
      OutputBucketName: BUCKET_NAME,
      OutputKey: `transcripts/${jobName}.json`,
    })
  );

  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 2000));
    const status = await transcribe.send(new GetTranscriptionJobCommand({ TranscriptionJobName: jobName }));
    const job = status.TranscriptionJob;
    if (job.TranscriptionJobStatus === "COMPLETED") {
      const uri = job.Transcript.TranscriptFileUri;
      const res = await fetch(uri);
      const json = await res.json();
      return json.results.transcripts.map((t) => t.transcript).join(" ");
    }
    if (job.TranscriptionJobStatus === "FAILED") {
      throw new Error(`Transcription failed: ${job.FailureReason}`);
    }
  }
  throw new Error("Transcription timed out - try a shorter clip for the demo.");
}
