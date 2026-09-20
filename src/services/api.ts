// Single service layer the rest of the app talks to. Every function here is
// a mock today; swap the implementation (not the call sites) once the real
// backend exists. No backend URLs or fetch calls appear anywhere outside
// this file.

import {
  CaseItem,
  DocumentAnalysis,
  GeneratedDocument,
  GeneratedDocumentType,
  Language,
  LegalAnswerData,
  Reminder,
} from "@/types";
import {
  MOCK_CASES,
  MOCK_REMINDERS,
  SAMPLE_DOCUMENT_ANALYSIS,
  findAnswerForText,
} from "@/data/mockData";

const NETWORK_DELAY_MS = 900;

function delay<T>(value: T, ms = NETWORK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

let reminders: Reminder[] = [...MOCK_REMINDERS];
let cases: CaseItem[] = [...MOCK_CASES];

/** Ask a legal question by text (or already-transcribed voice text). */
export async function askQuestion(text: string, _lang: Language): Promise<LegalAnswerData> {
  return delay(findAnswerForText(text), 1100);
}

/** Upload a document (image/PDF). Returns a document id to explain next. */
export async function uploadDocument(file: File): Promise<{ documentId: string; fileName: string }> {
  return delay({ documentId: "doc-1", fileName: file.name }, 700);
}

/** Get the structured explanation for a previously uploaded document. */
export async function getDocumentExplanation(_documentId: string): Promise<DocumentAnalysis> {
  return delay(SAMPLE_DOCUMENT_ANALYSIS, 1300);
}

/** Ask a follow-up question scoped to a specific uploaded document. */
export async function askAboutDocument(_documentId: string, question: string): Promise<LegalAnswerData> {
  return delay(findAnswerForText(question), 900);
}

/** Generate a draft letter/notice/complaint from structured details. */
export async function generateLetter(
  type: GeneratedDocumentType,
  details: Record<string, string>
): Promise<GeneratedDocument> {
  const body = buildMockLetterBody(type, details);
  return delay(
    {
      id: `gen-${Date.now()}`,
      type,
      title: mockLetterTitle(type),
      body,
      createdAt: new Date().toISOString(),
    },
    1200
  );
}

/** Text-to-speech for "Listen to this answer". Returns a playable audio URL. */
export async function speakAnswer(_text: string, _lang: Language): Promise<{ audioUrl: string | null }> {
  // No audio backend yet - UI should degrade gracefully when audioUrl is null.
  return delay({ audioUrl: null }, 500);
}

export async function getCases(): Promise<CaseItem[]> {
  return delay(cases, 500);
}

export async function getCase(caseId: string): Promise<CaseItem | undefined> {
  return delay(cases.find((c) => c.id === caseId), 400);
}

export async function getReminders(): Promise<Reminder[]> {
  return delay(reminders, 400);
}

export async function createReminder(title: string, dueLabel: string, caseId?: string): Promise<Reminder> {
  const reminder: Reminder = {
    id: `rem-${Date.now()}`,
    title,
    dueLabel,
    dueDate: new Date().toISOString(),
    completed: false,
    caseId,
  };
  reminders = [reminder, ...reminders];
  return delay(reminder, 400);
}

export async function updateReminder(id: string, patch: Partial<Reminder>): Promise<Reminder | undefined> {
  reminders = reminders.map((r) => (r.id === id ? { ...r, ...patch } : r));
  return delay(reminders.find((r) => r.id === id), 300);
}

export async function deleteReminder(id: string): Promise<void> {
  reminders = reminders.filter((r) => r.id !== id);
  return delay(undefined, 300);
}

// ---- mock content helpers (stand in for the real generation backend) ----

function mockLetterTitle(type: GeneratedDocumentType): string {
  switch (type) {
    case "complaint_draft":
      return "Complaint Draft";
    case "legal_notice":
      return "Legal Notice";
    case "request_letter":
      return "Request Letter";
    case "consumer_complaint":
      return "Consumer Complaint";
    case "salary_demand":
      return "Salary Demand Letter";
  }
}

function buildMockLetterBody(type: GeneratedDocumentType, details: Record<string, string>): string {
  const lines = Object.entries(details)
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `${labelize(k)}: ${v}`)
    .join("\n");

  return `${mockLetterTitle(type)}

Date: ${new Date().toLocaleDateString()}

${lines || "[Add your details to personalise this draft]"}

To Whom It May Concern,

This letter is a formal request regarding the matter described above. Please
treat this as a request for resolution within a reasonable timeframe.

[This is a mock preview draft. The real draft will be generated from your
retrieved sources and reviewed details once the backend is connected.]

Regards,
[Your name]`;
}

function labelize(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}
