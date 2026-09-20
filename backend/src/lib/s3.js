import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({ region: process.env.AWS_REGION || "ap-south-1" });
const BUCKET_NAME = process.env.BUCKET_NAME || "adhikar-app-bucket";

export const ALLOWED_AUDIO_TYPES = {
  "audio/webm": "webm",
  "audio/mp3": "mp3",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
  "audio/mp4": "mp4",
  "audio/m4a": "m4a",
  "audio/x-m4a": "m4a",
};

export const ALLOWED_DOCUMENT_TYPES = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
};

export function getAudioExtension(contentType = "audio/webm", fileName = "") {
  if (fileName) {
    const parts = fileName.split(".");
    if (parts.length > 1) {
      const ext = parts.pop().toLowerCase();
      if (["webm", "mp3", "wav", "ogg", "mp4", "m4a"].includes(ext)) {
        return ext;
      }
    }
  }
  const cleanType = (contentType || "").split(";")[0].trim().toLowerCase();
  return ALLOWED_AUDIO_TYPES[cleanType] || "webm";
}

export async function presignedUploadUrl(key, contentType, expiresInSeconds = 300) {
  if (process.env.MOCK_S3 === "true") {
    return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}?mock-presigned-upload=true`;
  }
  try {
    const cmd = new PutObjectCommand({ Bucket: BUCKET_NAME, Key: key, ContentType: contentType });
    return await getSignedUrl(s3, cmd, { expiresIn: expiresInSeconds });
  } catch (err) {
    if (
      err.name === "CredentialsProviderError" ||
      err.message?.includes("credentials") ||
      err.message?.includes("Region") ||
      !process.env.AWS_ACCESS_KEY_ID
    ) {
      return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}?mock-presigned-upload=true`;
    }
    throw err;
  }
}

export async function presignedDownloadUrl(key, expiresInSeconds = 900) {
  if (process.env.MOCK_S3 === "true") {
    return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}?mock-presigned-download=true`;
  }
  try {
    const cmd = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    return await getSignedUrl(s3, cmd, { expiresIn: expiresInSeconds });
  } catch (err) {
    if (
      err.name === "CredentialsProviderError" ||
      err.message?.includes("credentials") ||
      err.message?.includes("Region") ||
      !process.env.AWS_ACCESS_KEY_ID
    ) {
      return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}?mock-presigned-download=true`;
    }
    throw err;
  }
}

export async function putTextObject(key, body, contentType = "text/plain") {
  if (process.env.MOCK_S3 === "true" || !process.env.AWS_ACCESS_KEY_ID) {
    return key;
  }
  try {
    await s3.send(new PutObjectCommand({ Bucket: BUCKET_NAME, Key: key, Body: body, ContentType: contentType }));
    return key;
  } catch (err) {
    if (
      err.name === "CredentialsProviderError" ||
      err.message?.includes("credentials") ||
      err.message?.includes("Region") ||
      !process.env.AWS_ACCESS_KEY_ID
    ) {
      return key;
    }
    throw err;
  }
}

export { BUCKET_NAME };

