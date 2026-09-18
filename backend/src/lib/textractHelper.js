import { TextractClient, DetectDocumentTextCommand } from "@aws-sdk/client-textract";
import { BUCKET_NAME } from "./s3.js";

const textract = new TextractClient({});

/** Extract raw text from a document already uploaded to S3. */
export async function extractTextFromS3(s3Key) {
  const res = await textract.send(
    new DetectDocumentTextCommand({
      Document: { S3Object: { Bucket: BUCKET_NAME, Name: s3Key } },
    })
  );
  return (res.Blocks ?? [])
    .filter((b) => b.BlockType === "LINE")
    .map((b) => b.Text)
    .join("\n");
}
