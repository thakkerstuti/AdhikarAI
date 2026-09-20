import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
});
export const doc = DynamoDBDocumentClient.from(client);
export const TABLE_NAME = process.env.TABLE_NAME || "legal-helper-sessions";

// Local in-memory store for offline/local testing
const localStore = new Map();

function isLocalOrOffline(err) {
  return (
    process.env.MOCK_DYNAMO === "true" ||
    !process.env.AWS_ACCESS_KEY_ID ||
    err?.name === "CredentialsProviderError" ||
    err?.message?.includes("credentials") ||
    err?.message?.includes("Region")
  );
}

export async function putItem(item) {
  try {
    await doc.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return item;
  } catch (err) {
    if (isLocalOrOffline(err)) {
      localStore.set(`${item.pk}#${item.sk}`, item);
      return item;
    }
    throw err;
  }
}

export async function getItem(pk, sk) {
  try {
    const res = await doc.send(new GetCommand({ TableName: TABLE_NAME, Key: { pk, sk } }));
    return res.Item ?? null;
  } catch (err) {
    if (isLocalOrOffline(err)) {
      return localStore.get(`${pk}#${sk}`) ?? null;
    }
    throw err;
  }
}

export async function querySessionItems(sessionId, skPrefix = "") {
  try {
    const res = await doc.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: skPrefix
          ? "pk = :pk AND begins_with(sk, :skPrefix)"
          : "pk = :pk",
        ExpressionAttributeValues: skPrefix
          ? { ":pk": `SESSION#${sessionId}`, ":skPrefix": skPrefix }
          : { ":pk": `SESSION#${sessionId}` },
      })
    );
    return res.Items ?? [];
  } catch (err) {
    if (isLocalOrOffline(err)) {
      const prefix = `SESSION#${sessionId}`;
      const items = [];
      for (const [key, val] of localStore.entries()) {
        if (key.startsWith(prefix)) {
          if (!skPrefix || val.sk?.startsWith(skPrefix)) {
            items.push(val);
          }
        }
      }
      return items;
    }
    throw err;
  }
}

export async function putCase(sessionId, caseData) {
  const caseId = caseData.caseId || uuid();
  const item = {
    pk: `SESSION#${sessionId}`,
    sk: `CASE#${caseId}`,
    caseId,
    sessionId,
    title: caseData.title,
    category: caseData.category || "General",
    description: caseData.description || "",
    opponentName: caseData.opponentName || "",
    status: caseData.status || "active",
    createdAt: caseData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await putItem(item);
  return item;
}

export async function getCasesBySession(sessionId) {
  return querySessionItems(sessionId, "CASE#");
}

export async function putReminder(sessionId, reminderData) {
  const reminderId = reminderData.reminderId || uuid();
  const item = {
    pk: `SESSION#${sessionId}`,
    sk: `REMINDER#${reminderId}`,
    reminderId,
    sessionId,
    caseId: reminderData.caseId || null,
    title: reminderData.title,
    dueDate: reminderData.dueDate,
    reminderType: reminderData.reminderType || "deadline",
    status: reminderData.status || "pending",
    createdAt: reminderData.createdAt || new Date().toISOString(),
  };
  await putItem(item);
  return item;
}

export async function getRemindersBySession(sessionId) {
  return querySessionItems(sessionId, "REMINDER#");
}

export async function getFullSession(sessionId) {
  const allItems = await querySessionItems(sessionId);
  if (!allItems || allItems.length === 0) {
    return null;
  }

  const sessionData = {
    sessionId,
    createdAt: null,
    preferredLang: "en",
    messages: [],
    documents: [],
    cases: [],
    reminders: [],
    letters: [],
  };

  for (const item of allItems) {
    if (item.sk === "META") {
      sessionData.createdAt = item.createdAt;
      sessionData.preferredLang = item.preferredLang || "en";
    } else if (item.sk.startsWith("MSG#")) {
      sessionData.messages.push(item);
    } else if (item.sk.startsWith("DOC#")) {
      sessionData.documents.push(item);
    } else if (item.sk.startsWith("CASE#")) {
      sessionData.cases.push(item);
    } else if (item.sk.startsWith("REMINDER#")) {
      sessionData.reminders.push(item);
    } else if (item.sk.startsWith("LETTER#")) {
      sessionData.letters.push(item);
    }
  }

  return sessionData;
}


