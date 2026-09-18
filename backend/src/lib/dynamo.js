import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
export const doc = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME;

export async function putItem(item) {
  await doc.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function getItem(pk, sk) {
  const res = await doc.send(new GetCommand({ TableName: TABLE_NAME, Key: { pk, sk } }));
  return res.Item ?? null;
}

export async function querySessionItems(sessionId, skPrefix) {
  const res = await doc.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)",
      ExpressionAttributeValues: { ":pk": `SESSION#${sessionId}`, ":skPrefix": skPrefix },
    })
  );
  return res.Items ?? [];
}
