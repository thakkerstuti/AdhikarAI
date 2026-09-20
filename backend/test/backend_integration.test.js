// Automated Integration Test Suite for AdhikarAI Backend Handlers (Phase 9.5)
// Runs in offline/mock mode without requiring active AWS credentials or deployment.

import test from "node:test";
import assert from "node:assert/strict";

// Force mock environment variables
process.env.MOCK_DYNAMO = "true";
process.env.USE_MOCK_AI = "true";
process.env.USE_MOCK_S3 = "true";
process.env.USE_MOCK_TRANSCRIBE = "true";
process.env.USE_MOCK_TEXTRACT = "true";
process.env.USE_MOCK_POLLY = "true";
process.env.AWS_REGION = "ap-south-1";

import { handler as createSession } from "../src/handlers/createSession.js";
import { handler as getSession } from "../src/handlers/getSession.js";
import { handler as queryHandler } from "../src/handlers/query.js";
import { handler as uploadDocument } from "../src/handlers/uploadDocument.js";
import { handler as explainDocument } from "../src/handlers/explainDocument.js";
import { handler as askDocument } from "../src/handlers/askDocument.js";
import { handler as generateLetter } from "../src/handlers/generateLetter.js";
import { handler as speakHandler } from "../src/handlers/speak.js";
import { handler as uploadAudio } from "../src/handlers/uploadAudio.js";
import { handler as voiceQuery } from "../src/handlers/voiceQuery.js";
import { handler as casesHandler } from "../src/handlers/cases.js";
import { handler as remindersHandler } from "../src/handlers/reminders.js";

test("1. Session Management: Create & Retrieve Session", async () => {
  const createRes = await createSession({
    body: JSON.stringify({ preferredLang: "hi" }),
  });
  assert.equal(createRes.statusCode, 200);
  const { sessionId } = JSON.parse(createRes.body);
  assert.ok(sessionId, "Session ID should be created");

  const getRes = await getSession({
    pathParameters: { sessionId },
  });
  assert.equal(getRes.statusCode, 200);
  const sessionData = JSON.parse(getRes.body);
  assert.equal(sessionData.sessionId, sessionId);
  assert.equal(sessionData.preferredLang, "hi");
});

test("2. Text Query: POST /query", async () => {
  const sessionRes = await createSession({ body: "{}" });
  const { sessionId } = JSON.parse(sessionRes.body);

  const queryRes = await queryHandler({
    body: JSON.stringify({
      sessionId,
      text: "Landlord is not returning my security deposit",
      lang: "en",
    }),
  });

  assert.equal(queryRes.statusCode, 200);
  const answer = JSON.parse(queryRes.body);
  assert.ok(answer.whatMayApply, "Should return whatMayApply");
  assert.ok(answer.yourSituation, "Should return yourSituation");
  assert.ok(Array.isArray(answer.nextSteps), "Should return nextSteps array");
  assert.ok(answer.source, "Should return statutory source");
});

test("3. Document Upload, Explain & Ask Q&A Flow", async () => {
  const sessionRes = await createSession({ body: "{}" });
  const { sessionId } = JSON.parse(sessionRes.body);

  // Step 1: Upload document metadata
  const uploadRes = await uploadDocument({
    body: JSON.stringify({
      sessionId,
      fileName: "rental-agreement.pdf",
      contentType: "application/pdf",
    }),
  });
  assert.equal(uploadRes.statusCode, 200);
  const { documentId, uploadUrl, s3Key } = JSON.parse(uploadRes.body);
  assert.ok(documentId);
  assert.ok(uploadUrl);
  assert.ok(s3Key);

  // Step 2: Explain document
  const explainRes = await explainDocument({
    pathParameters: { documentId },
    body: JSON.stringify({ sessionId, lang: "en" }),
  });
  assert.equal(explainRes.statusCode, 200);
  const explanation = JSON.parse(explainRes.body);
  assert.ok(explanation.documentType);
  assert.ok(explanation.summary);
  assert.ok(Array.isArray(explanation.keyInformation));

  // Step 3: Ask document Q&A
  const askRes = await askDocument({
    pathParameters: { documentId },
    body: JSON.stringify({
      sessionId,
      question: "What is the notice period mentioned?",
      lang: "en",
    }),
  });
  assert.equal(askRes.statusCode, 200);
  const askAnswer = JSON.parse(askRes.body);
  assert.ok(askAnswer.whatMayApply);
});

test("4. Letter Generation: POST /generate-letter", async () => {
  const sessionRes = await createSession({ body: "{}" });
  const { sessionId } = JSON.parse(sessionRes.body);

  const letterRes = await generateLetter({
    body: JSON.stringify({
      sessionId,
      letterType: "security_deposit",
      lang: "en",
      details: {
        tenantName: "Rohan Sharma",
        landlordName: "Mr. Verma",
        depositAmount: "Rs. 60,000",
      },
    }),
  });

  assert.equal(letterRes.statusCode, 200);
  const letter = JSON.parse(letterRes.body);
  assert.ok(letter.letterId);
  assert.ok(letter.letterText.includes("SECURITY DEPOSIT") || letter.letterText.includes("security deposit"));
});

test("5. Voice Flow: Upload Audio, Voice Query, & Speak TTS", async () => {
  const sessionRes = await createSession({ body: "{}" });
  const { sessionId } = JSON.parse(sessionRes.body);

  // Step 1: Upload audio metadata
  const audioUploadRes = await uploadAudio({
    body: JSON.stringify({
      sessionId,
      fileName: "recording.webm",
      contentType: "audio/webm",
    }),
  });
  assert.equal(audioUploadRes.statusCode, 200);
  const { uploadUrl, s3Key } = JSON.parse(audioUploadRes.body);
  assert.ok(uploadUrl);
  assert.ok(s3Key);

  // Step 2: Voice Query
  const voiceQueryRes = await voiceQuery({
    body: JSON.stringify({
      sessionId,
      audioS3Key: s3Key,
      lang: "en",
    }),
  });
  assert.equal(voiceQueryRes.statusCode, 200);
  const voiceData = JSON.parse(voiceQueryRes.body);
  assert.ok(voiceData.transcript);
  assert.ok(voiceData.whatMayApply);

  // Step 3: Speak TTS
  const speakRes = await speakHandler({
    body: JSON.stringify({
      text: "Your security deposit must be refunded within 30 days.",
      lang: "en",
      sessionId,
    }),
  });
  assert.equal(speakRes.statusCode, 200);
  const speakData = JSON.parse(speakRes.body);
  assert.ok(speakData.audioUrl);
});

test("6. Cases: List, Create & Get Single Case", async () => {
  const sessionRes = await createSession({ body: "{}" });
  const { sessionId } = JSON.parse(sessionRes.body);

  // Create case
  const createRes = await casesHandler({
    httpMethod: "POST",
    body: JSON.stringify({
      sessionId,
      title: "Security Deposit Withholding by Landlord",
      category: "Tenant",
      description: "Landlord refused to return Rs 50,000 deposit after move out.",
      opponentName: "Sharma Residency",
      status: "active",
    }),
  });
  assert.equal(createRes.statusCode, 201);
  const createdCase = JSON.parse(createRes.body);
  assert.ok(createdCase.caseId);

  // List cases
  const listRes = await casesHandler({
    httpMethod: "GET",
    queryStringParameters: { sessionId },
  });
  assert.equal(listRes.statusCode, 200);
  const { cases } = JSON.parse(listRes.body);
  assert.equal(cases.length, 1);
  assert.equal(cases[0].caseId, createdCase.caseId);

  // Get single case
  const getSingleRes = await casesHandler({
    httpMethod: "GET",
    pathParameters: { caseId: createdCase.caseId },
    queryStringParameters: { sessionId },
  });
  assert.equal(getSingleRes.statusCode, 200);
  const singleCase = JSON.parse(getSingleRes.body);
  assert.equal(singleCase.caseId, createdCase.caseId);
  assert.equal(singleCase.title, "Security Deposit Withholding by Landlord");
});

test("7. Reminders: Full CRUD (List, Create, Update PUT, Delete DELETE)", async () => {
  const sessionRes = await createSession({ body: "{}" });
  const { sessionId } = JSON.parse(sessionRes.body);

  // 1. Create reminder
  const createRes = await remindersHandler({
    httpMethod: "POST",
    body: JSON.stringify({
      sessionId,
      title: "Send 15-day notice to landlord",
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      reminderType: "deadline",
      status: "pending",
    }),
  });
  assert.equal(createRes.statusCode, 201);
  const created = JSON.parse(createRes.body);
  assert.ok(created.reminderId);
  assert.equal(created.status, "pending");

  // 2. List reminders
  const listRes = await remindersHandler({
    httpMethod: "GET",
    queryStringParameters: { sessionId },
  });
  assert.equal(listRes.statusCode, 200);
  const { reminders } = JSON.parse(listRes.body);
  assert.equal(reminders.length, 1);
  assert.equal(reminders[0].reminderId, created.reminderId);

  // 3. Update reminder via PUT
  const updateRes = await remindersHandler({
    httpMethod: "PUT",
    pathParameters: { reminderId: created.reminderId },
    body: JSON.stringify({
      sessionId,
      reminderId: created.reminderId,
      completed: true,
      title: "Send 15-day notice to landlord (Sent)",
    }),
  });
  assert.equal(updateRes.statusCode, 200);
  const updated = JSON.parse(updateRes.body);
  assert.equal(updated.status, "completed");
  assert.equal(updated.title, "Send 15-day notice to landlord (Sent)");

  // 4. Delete reminder via DELETE
  const deleteRes = await remindersHandler({
    httpMethod: "DELETE",
    pathParameters: { reminderId: created.reminderId },
    queryStringParameters: { sessionId },
  });
  assert.equal(deleteRes.statusCode, 200);
  const deleteData = JSON.parse(deleteRes.body);
  assert.equal(deleteData.deleted, true);

  // Verify list is now empty
  const finalListRes = await remindersHandler({
    httpMethod: "GET",
    queryStringParameters: { sessionId },
  });
  const { reminders: finalReminders } = JSON.parse(finalListRes.body);
  assert.equal(finalReminders.length, 0);
});
