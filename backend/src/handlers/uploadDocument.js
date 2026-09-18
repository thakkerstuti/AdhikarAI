import { v4 as uuid } from "uuid";
import { presignedUploadUrl } from "../lib/s3.js";
import { putItem } from "../lib/dynamo.js";
import { ok, fail } from "../lib/response.js";

// Returns a presigned S3 PUT url. The client uploads the file bytes directly
// to S3 with that URL, then calls POST /documents/{documentId}/explain.
export const handler = async (event) => {
  try {
    const { sessionId, fileName, contentType } = JSON.parse(event.body || "{}");
    if (!sessionId || !fileName) return fail(new Error("sessionId and fileName are required"), 400);

    const documentId = uuid();
    const s3Key = `uploads/${sessionId}/${documentId}/${fileName}`;
    const uploadUrl = await presignedUploadUrl(s3Key, contentType || "application/octet-stream");

    await putItem({
      pk: `SESSION#${sessionId}`,
      sk: `DOC#${documentId}`,
      documentId,
      s3Key,
      fileName,
      status: "uploading",
      createdAt: new Date().toISOString(),
    });

    return ok({ documentId, uploadUrl, s3Key });
  } catch (err) {
    return fail(err);
  }
};
