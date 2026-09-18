import { v4 as uuid } from "uuid";
import { putItem } from "../lib/dynamo.js";
import { ok, fail } from "../lib/response.js";

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const sessionId = uuid();
    await putItem({
      pk: `SESSION#${sessionId}`,
      sk: "META",
      createdAt: new Date().toISOString(),
      preferredLang: body.preferredLang || "en",
    });
    return ok({ sessionId });
  } catch (err) {
    return fail(err);
  }
};
