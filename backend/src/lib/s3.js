import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME;

export async function presignedUploadUrl(key, contentType, expiresInSeconds = 300) {
  const cmd = new PutObjectCommand({ Bucket: BUCKET_NAME, Key: key, ContentType: contentType });
  return getSignedUrl(s3, cmd, { expiresIn: expiresInSeconds });
}

export async function presignedDownloadUrl(key, expiresInSeconds = 900) {
  const cmd = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
  return getSignedUrl(s3, cmd, { expiresIn: expiresInSeconds });
}

export async function putTextObject(key, body, contentType = "text/plain") {
  await s3.send(new PutObjectCommand({ Bucket: BUCKET_NAME, Key: key, Body: body, ContentType: contentType }));
  return key;
}

export { BUCKET_NAME };
