import { v4 as uuid } from "uuid";
import { presignedUploadUrl, getAudioExtension } from "../lib/s3.js";
import { ok, fail } from "../lib/response.js";

/**
 * Generates a presigned S3 PUT URL for uploading voice recordings.
 *
 * Flow:
 * 1. User records audio on frontend (WebM, WAV, MP3).
 * 2. Frontend calls POST /upload/audio -> receives { uploadUrl, s3Key, audioId }.
 * 3. Frontend uploads audio bytes directly to S3 via uploadUrl.
 * 4. Frontend passes s3Key to POST /voice-query.
 */
export const handler = async (event) => {
  try {
    const { sessionId, fileName, contentType = "audio/webm" } = JSON.parse(event.body || "{}");
    if (!sessionId) {
      return fail(new Error("sessionId is required"), 400);
    }

    const audioId = uuid();
    const ext = getAudioExtension(contentType, fileName);
    const s3Key = `uploads/${sessionId}/audio/${audioId}.${ext}`;
    const uploadUrl = await presignedUploadUrl(s3Key, contentType, 300);

    return ok({
      audioId,
      s3Key,
      uploadUrl,
      contentType,
    });
  } catch (err) {
    return fail(err);
  }
};
