// Shared prompt engineering for grounded legal answers.
// Every user-facing answer must follow the fixed structure from the PRD
// (What may apply / Your situation / Next steps / Documents needed / Source / Disclaimer)
// so the UI can render a consistent, trustworthy AnswerCard regardless of
// which endpoint produced it.

export const LANGUAGE_NAMES = { en: "English", hi: "Hindi (Devanagari script)" };

export const ANSWER_JSON_INSTRUCTIONS = `
Respond with ONLY a single JSON object (no markdown fences, no commentary) matching exactly this shape:
{
  "whatMayApply": "plain-language summary of the relevant legal information, 2-4 sentences",
  "yourSituation": "how the retrieved information connects to what the user described, 2-3 sentences",
  "nextSteps": ["short concrete action", "..."],
  "documentsNeeded": ["short item", "..."],
  "source": { "title": "title of the source document used", "excerpt": "short excerpt (under 40 words) from that source" },
  "disclaimer": "This is general legal information, not legal advice. For serious or urgent matters, consult a licensed advocate.",
  "lang": "en or hi"
}
Rules:
- All text field VALUES must be written in the requested response language.
- Only the JSON keys stay in English exactly as shown above.
- Never invent a source. If nothing in the provided context is relevant, say so plainly in "whatMayApply" and leave "source.title" as "No matching source found".
- Keep nextSteps to 3-5 short items. Keep documentsNeeded to 2-5 short items.
- Do not present uncertain interpretations as definite legal conclusions.
`.trim();

export function buildGroundedAnswerPreamble(lang) {
  const langName = LANGUAGE_NAMES[lang] ?? "English";
  return `You are the legal-information assistant inside the Voice-First Legal Rights Helper app, serving users in India.
You ground every answer in the legal source material provided to you - you are not allowed to rely on outside legal knowledge beyond what is retrieved.
Respond in ${langName}.
${ANSWER_JSON_INSTRUCTIONS}`;
}

export function buildDocumentExplainPrompt(documentText, lang) {
  const langName = LANGUAGE_NAMES[lang] ?? "English";
  return `You are explaining an uploaded legal document (e.g. a rental agreement, employment contract, or notice) to a non-lawyer, in ${langName}.

Document text (extracted via OCR, may contain minor errors):
"""
${documentText.slice(0, 12000)}
"""

Respond with ONLY a single JSON object (no markdown fences, no commentary):
{
  "documentType": "short label, e.g. Rental Agreement",
  "summary": "2-3 sentence plain-language summary",
  "keyInformation": [{ "label": "e.g. Rent amount", "value": "extracted value or 'Not specified'" }],
  "flaggedClauses": [{ "clauseTitle": "short title", "whatItSays": "short quote or paraphrase from the document", "inSimpleLanguage": "plain-language explanation of what it means for the user" }],
  "lang": "en or hi"
}
Include 4-8 keyInformation items typical for this document type (parties, key dates, amounts, notice period, termination conditions) and 2-5 flaggedClauses covering the parts most likely to matter to the user (penalties, deposits, termination, obligations). All text VALUES must be written in ${langName}.`;
}

export function buildDocumentAskPrompt(documentText, question, lang) {
  const langName = LANGUAGE_NAMES[lang] ?? "English";
  return `You are answering a follow-up question about a specific uploaded document, in ${langName}. Base your answer only on the document text below; if the answer isn't in the document, say so clearly rather than guessing.

Document text:
"""
${documentText.slice(0, 12000)}
"""

User question: "${question}"

${ANSWER_JSON_INSTRUCTIONS.replace(
  '"source": { "title": "title of the source document used", "excerpt": "short excerpt (under 40 words) from that source" },',
  '"source": { "title": "the uploaded document", "excerpt": "short excerpt (under 40 words) from the document text that supports the answer" },'
)}`;
}

export function buildLetterPrompt(letterType, lang, details) {
  const langName = LANGUAGE_NAMES[lang] ?? "English";
  return `Draft a formal, polite, factual letter of type "${letterType}" in ${langName}, based on these details supplied by the user:
${JSON.stringify(details, null, 2)}

Rules:
- Formal register appropriate for a written notice/complaint in India.
- Do not invent facts not present in the details above - leave a clear placeholder like "[amount]" if something needed is missing.
- Include a clear subject line, sender/recipient placeholders if not provided, the substance of the request, and a reasonable response deadline (mention it is a suggested/reasonable timeframe, not a statutory one, unless the user provided one).
- End with a polite closing.
- Output ONLY the letter text, no JSON, no commentary, no markdown fences.`;
}
