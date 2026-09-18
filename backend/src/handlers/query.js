import { groundedAnswer } from "../lib/bedrockClient.js";
import { putItem } from "../lib/dynamo.js";
import { ok, fail } from "../lib/response.js";

export const handler = async (event) => {
  try {
    const { sessionId, text, lang = "en" } = JSON.parse(event.body || "{}");
    if (!sessionId || !text) return fail(new Error("sessionId and text are required"), 400);

    const answer = await groundedAnswer(text, lang);

    await putItem({
      pk: `SESSION#${sessionId}`,
      sk: `MSG#${Date.now()}`,
      role: "user",
      text,
      answer,
    });

    return ok(answer);
  } catch (err) {
    return fail(err);
  }
};
