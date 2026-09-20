import { TextractClient, DetectDocumentTextCommand } from "@aws-sdk/client-textract";
import { BUCKET_NAME } from "./s3.js";

const textract = new TextractClient({
  region: process.env.AWS_REGION || "ap-south-1",
});

export const SUPPORTED_EXTENSIONS = ["jpg", "jpeg", "png", "pdf"];

export function getMockExtractedText() {
  return `RESIDENTIAL RENTAL AGREEMENT
This Lease Agreement is made on 1st November 2024 between:
LANDLORD: Mr. Ramesh Sharma, residing at Bengaluru, Karnataka.
TENANT: Mr. Amit Kumar, residing at Bengaluru, Karnataka.

PREMISES: Flat No. 402, Green Meadows Apartments, Bellandur, Bengaluru.

TERMS AND CONDITIONS:
1. TENANCY PERIOD: The tenancy shall be for an initial period of 11 (eleven) months commencing from 1st November 2024.
2. MONTHLY RENT: The Tenant agrees to pay a monthly rent of Rs. 22,000/- (Twenty Two Thousand Only) on or before the 5th day of each English calendar month.
3. SECURITY DEPOSIT: The Tenant has paid a sum of Rs. 66,000/- (Sixty Six Thousand Only) as interest-free refundable security deposit to the Landlord.
4. LOCK-IN PERIOD: Both parties agree to a lock-in period of 6 months during which the agreement cannot be terminated.
5. TERMINATION & NOTICE: Either party may terminate this agreement after the lock-in period by providing one calendar month (30 days) prior written notice.
6. REFUND OF DEPOSIT: The security deposit shall be refunded within 30 days of handing over peaceful, vacant possession, subject to deduction of painting charges and actual physical damage beyond normal wear and tear.`;
}

function isMockTextract() {
  if (process.env.USE_MOCK_TEXTRACT === "true") return true;
  if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_PROFILE && !process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI) {
    return true;
  }
  return false;
}

/**
 * Extract raw text from a document image or PDF in S3 using Amazon Textract.
 */
export async function extractTextFromS3(s3Key) {
  if (isMockTextract()) {
    return getMockExtractedText();
  }

  const ext = (s3Key || "").split(".").pop().toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new Error(`Unsupported document format .${ext}. Textract supports JPG, PNG, and PDF.`);
  }

  try {
    const res = await textract.send(
      new DetectDocumentTextCommand({
        Document: { S3Object: { Bucket: BUCKET_NAME, Name: s3Key } },
      })
    );

    const extractedText = (res.Blocks ?? [])
      .filter((b) => b.BlockType === "LINE")
      .map((b) => b.Text)
      .join("\n")
      .trim();

    if (!extractedText) {
      return "No text could be extracted from this document image. Please ensure the document is clear, oriented correctly, and legible.";
    }

    return extractedText;
  } catch (err) {
    if (
      err.name === "CredentialsProviderError" ||
      err.message?.includes("credentials") ||
      err.message?.includes("Region")
    ) {
      console.warn("[Textract] AWS credentials missing - returning mock extracted text");
      return getMockExtractedText();
    }
    if (err.name === "UnsupportedDocumentException") {
      throw new Error(`Textract cannot process this document format. Please upload a clear JPG, PNG, or PDF.`);
    }
    if (err.name === "BadDocumentException") {
      throw new Error(`The uploaded document appears corrupted or unreadable.`);
    }
    throw err;
  }
}

