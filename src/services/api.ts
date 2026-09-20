// AdhikarAI API Integration Layer
// Connects the frontend to the AWS Serverless API Gateway backend (Phase 9+).
// Includes full session lifecycle management, request/response schema mapping,
// presigned S3 uploads, real voice query integration, and graceful fallbacks.

import {
  CaseItem,
  DocumentAnalysis,
  GeneratedDocument,
  GeneratedDocumentType,
  Language,
  LegalAnswerData,
  LegalDomain,
  Reminder,
  Source,
} from "@/types";
import {
  MOCK_CASES,
  MOCK_REMINDERS,
  SAMPLE_DOCUMENT_ANALYSIS,
  findAnswerForText,
} from "@/data/mockData";
import { storage } from "@/utils/storage";

const env = (import.meta as unknown as { env?: Record<string, string> }).env;
const API_BASE_URL = (env?.VITE_API_BASE_URL || "").replace(/\/+$/, "");

// In-memory cache for document filenames and local fallback items
const documentFileNames = new Map<string, string>();
let reminders: Reminder[] = [...MOCK_REMINDERS];
let cases: CaseItem[] = [...MOCK_CASES];

// Track in-flight session initialization to avoid duplicate /session calls
let activeSessionPromise: Promise<string> | null = null;

/**
 * Normalizes language codes to backend-supported values ('en' or 'hi').
 * Note: 'hi-en' (Hinglish) is mapped to 'hi'. Gujarati ('gu') falls back to 'en'
 * because Hindi and English are the provisioned backend models.
 */
function mapLang(lang?: Language): "en" | "hi" {
  if (lang === "hi" || lang === "hi-en") return "hi";
  return "en";
}

/**
 * Generic fetch wrapper for calls to the API Gateway.
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`API Error ${res.status} on ${endpoint}: ${errorText || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Retrieves the current session ID or initializes a new one via POST /session.
 * Persists the session ID in localStorage via storage.ts.
 */
export async function getOrCreateSessionId(): Promise<string> {
  const existingId = storage.getSessionId();
  if (existingId) {
    return existingId;
  }

  // If no backend API URL is configured, use local session ID
  if (!API_BASE_URL) {
    const localId = `local-session-${Date.now()}`;
    storage.setSessionId(localId);
    return localId;
  }

  if (!activeSessionPromise) {
    activeSessionPromise = (async () => {
      try {
        const lang = mapLang(storage.getSelectedLanguage());
        const data = await apiRequest<{ sessionId: string }>("/session", {
          method: "POST",
          body: JSON.stringify({ preferredLang: lang }),
        });
        storage.setSessionId(data.sessionId);
        return data.sessionId;
      } catch (err) {
        console.warn("[AdhikarAI] Backend /session initialization failed, using fallback:", err);
        const fallbackId = `session-${Date.now()}`;
        storage.setSessionId(fallbackId);
        return fallbackId;
      } finally {
        activeSessionPromise = null;
      }
    })();
  }
  return activeSessionPromise;
}

// ─── AI Answer Mapping Helpers ────────────────────────────────────────────────

interface BackendGroundedAnswer {
  whatMayApply?: string;
  yourSituation?: string;
  nextSteps?: string[];
  documentsNeeded?: string[];
  source?: { title?: string; excerpt?: string };
  sources?: Source[];
  disclaimer?: string;
  lang?: string;
  situationSummary?: string;
  whatThisMeans?: string;
  domain?: LegalDomain;
  id?: string;
}

function mapBackendAnswerToLegalAnswer(
  backendData: BackendGroundedAnswer,
  fallbackDomain: LegalDomain = "tenant",
  idPrefix: string = "ans"
): LegalAnswerData {
  const sources: Source[] = backendData.sources?.length
    ? backendData.sources
    : backendData.source
    ? [
        {
          id: "src-1",
          name: backendData.source.title || "Statutory Legal Authority",
          authority: "Government of India / Statutory Source",
          description: backendData.source.excerpt || "",
          url: "#",
        },
      ]
    : [];

  return {
    id: backendData.id || `${idPrefix}-${Date.now()}`,
    domain: backendData.domain || fallbackDomain,
    situationSummary:
      backendData.situationSummary ||
      backendData.yourSituation ||
      "Your situation as analyzed against applicable Indian legal rights.",
    whatThisMeans:
      backendData.whatThisMeans ||
      backendData.whatMayApply ||
      "Plain-language explanation of legal principles relevant to your query.",
    nextSteps: Array.isArray(backendData.nextSteps) ? backendData.nextSteps : [],
    documentsNeeded: Array.isArray(backendData.documentsNeeded) ? backendData.documentsNeeded : [],
    sources,
    createdAt: new Date().toISOString(),
    isEmergency: false,
  };
}

// ─── Legal Q&A (POST /query) ──────────────────────────────────────────────────

/**
 * Ask a legal question by text.
 * Sends POST /query with { sessionId, text, lang }.
 */
export async function askQuestion(text: string, lang: Language): Promise<LegalAnswerData> {
  if (!API_BASE_URL) {
    return findAnswerForText(text);
  }

  const sessionId = await getOrCreateSessionId();
  const response = await apiRequest<BackendGroundedAnswer>("/query", {
    method: "POST",
    body: JSON.stringify({
      sessionId,
      text,
      lang: mapLang(lang),
    }),
  });

  return mapBackendAnswerToLegalAnswer(response, "tenant", "query");
}

// ─── Voice Recording & Query (POST /upload/audio + POST /voice-query) ─────────

export interface VoiceQueryResult {
  transcript: string;
  audioUrl: string | null;
  answer: LegalAnswerData;
}

/**
 * Process recorded voice query audio:
 * 1. POST /upload/audio -> get presigned S3 upload URL.
 * 2. PUT audio blob to S3.
 * 3. POST /voice-query -> Transcribe + Bedrock RAG + Polly TTS -> returns transcript, audioUrl, and legal answer.
 */
export async function voiceQuery(audioBlob: Blob, lang?: Language): Promise<VoiceQueryResult> {
  const currentLang = lang || storage.getSelectedLanguage();

  if (!API_BASE_URL) {
    const mockAnswer = findAnswerForText("security deposit refund");
    return {
      transcript: "My landlord has withheld my security deposit of 50000 rupees after I moved out.",
      audioUrl: null,
      answer: mockAnswer,
    };
  }

  const sessionId = await getOrCreateSessionId();
  const contentType = audioBlob.type || "audio/webm";
  const ext = contentType.includes("mp4")
    ? "mp4"
    : contentType.includes("wav")
    ? "wav"
    : contentType.includes("ogg")
    ? "ogg"
    : "webm";
  const fileName = `voice-recording-${Date.now()}.${ext}`;

  // Step 1: Request presigned S3 upload URL for audio
  const uploadData = await apiRequest<{
    uploadUrl: string;
    s3Key?: string;
    audioS3Key?: string;
    audioId: string;
  }>("/upload/audio", {
    method: "POST",
    body: JSON.stringify({
      sessionId,
      fileName,
      contentType,
    }),
  });

  const uploadUrl = uploadData.uploadUrl;
  const audioS3Key =
    uploadData.s3Key ||
    uploadData.audioS3Key ||
    `uploads/${sessionId}/audio/${uploadData.audioId}.${ext}`;

  // Step 2: Upload raw audio bytes to S3
  const s3PutRes = await fetch(uploadUrl, {
    method: "PUT",
    body: audioBlob,
    headers: {
      "Content-Type": contentType,
    },
  });

  if (!s3PutRes.ok) {
    throw new Error(`Failed to upload audio to S3: ${s3PutRes.statusText}`);
  }

  // Step 3: Call voice-query handler
  const queryRes = await apiRequest<{
    transcript?: string;
    audioUrl?: string;
    whatMayApply?: string;
    yourSituation?: string;
    nextSteps?: string[];
    documentsNeeded?: string[];
    source?: { title?: string; excerpt?: string };
    sources?: Source[];
    disclaimer?: string;
    lang?: string;
  }>("/voice-query", {
    method: "POST",
    body: JSON.stringify({
      sessionId,
      audioS3Key,
      lang: mapLang(currentLang),
    }),
  });

  const legalAnswer = mapBackendAnswerToLegalAnswer(queryRes, "tenant", "voice-ans");

  return {
    transcript: queryRes.transcript || "Spoken query",
    audioUrl: queryRes.audioUrl || null,
    answer: legalAnswer,
  };
}

// ─── Document Upload (2-Step Flow: POST /documents + S3 Direct PUT) ───────────

/**
 * Upload a document (image/PDF).
 * Flow:
 * 1. POST /documents -> returns { documentId, uploadUrl, s3Key }
 * 2. PUT file bytes directly to the presigned S3 uploadUrl
 */
export async function uploadDocument(file: File): Promise<{ documentId: string; fileName: string }> {
  if (!API_BASE_URL) {
    documentFileNames.set("doc-1", file.name);
    return { documentId: "doc-1", fileName: file.name };
  }

  const sessionId = await getOrCreateSessionId();

  // Step 1: Request presigned S3 upload URL from backend
  const { documentId, uploadUrl } = await apiRequest<{
    documentId: string;
    uploadUrl: string;
    s3Key: string;
  }>("/documents", {
    method: "POST",
    body: JSON.stringify({
      sessionId,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
    }),
  });

  // Step 2: Directly upload file bytes to S3 using the presigned URL
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  });

  if (!uploadRes.ok) {
    throw new Error(`Failed to upload document to storage: ${uploadRes.statusText}`);
  }

  documentFileNames.set(documentId, file.name);
  return { documentId, fileName: file.name };
}

// ─── Document Explanation (POST /documents/{documentId}/explain) ──────────────

interface BackendDocumentExplainResponse {
  documentId?: string;
  extractedText?: string;
  documentType?: string;
  summary?: string;
  keyInformation?: { label: string; value: string }[];
  flaggedClauses?: {
    clauseTitle: string;
    whatItSays: string;
    inSimpleLanguage: string;
  }[];
  lang?: string;
  importantPoints?: { label: string; value: string }[];
  whatThisMeansForYou?: string;
  thingsToCheck?: string[];
  questionsToAsk?: string[];
}

/**
 * Get structured plain-language explanation for an uploaded document.
 * Calls POST /documents/{documentId}/explain with { sessionId, lang }.
 */
export async function getDocumentExplanation(documentId: string): Promise<DocumentAnalysis> {
  if (!API_BASE_URL) {
    return SAMPLE_DOCUMENT_ANALYSIS;
  }

  const sessionId = await getOrCreateSessionId();
  const lang = mapLang(storage.getSelectedLanguage());

  const data = await apiRequest<BackendDocumentExplainResponse>(
    `/documents/${encodeURIComponent(documentId)}/explain`,
    {
      method: "POST",
      body: JSON.stringify({
        sessionId,
        lang,
      }),
    }
  );

  const fileName = documentFileNames.get(documentId) || "Uploaded Document";

  // Map keyInformation -> importantPoints
  const importantPoints =
    data.importantPoints ||
    data.keyInformation?.map((k) => ({ label: k.label, value: k.value })) ||
    [];

  // Map flaggedClauses -> whatThisMeansForYou and thingsToCheck
  const flaggedClauses = data.flaggedClauses || [];
  const whatThisMeansForYou =
    data.whatThisMeansForYou ||
    (flaggedClauses.length
      ? flaggedClauses.map((c) => `${c.clauseTitle}: ${c.inSimpleLanguage}`).join("\n\n")
      : data.summary || "Document parsed successfully.");

  const thingsToCheck =
    data.thingsToCheck ||
    (flaggedClauses.length
      ? flaggedClauses.map((c) => `Verify clause: ${c.clauseTitle} ("${c.whatItSays}")`)
      : [
          "Verify the full names and addresses of all signing parties",
          "Check whether termination or notice periods match your expectations",
          "Verify financial amounts, deposit refund timelines, and penalty clauses",
        ]);

  const questionsToAsk =
    data.questionsToAsk || [
      "Can deductions be made from the security deposit for normal wear and tear?",
      "How much advance written notice is required to terminate this agreement?",
      "What are the statutory legal remedies if terms of this agreement are breached?",
    ];

  return {
    id: data.documentId || documentId,
    fileName,
    documentType: data.documentType || "Legal Document",
    summary: data.summary || "Document analysis completed.",
    importantPoints,
    whatThisMeansForYou,
    thingsToCheck,
    questionsToAsk,
  };
}

// ─── Document Q&A (POST /documents/{documentId}/ask) ──────────────────────────

/**
 * Ask a follow-up question scoped to an uploaded document.
 * Calls POST /documents/{documentId}/ask with { sessionId, question, lang }.
 */
export async function askAboutDocument(documentId: string, question: string): Promise<LegalAnswerData> {
  if (!API_BASE_URL) {
    return findAnswerForText(question);
  }

  const sessionId = await getOrCreateSessionId();
  const lang = mapLang(storage.getSelectedLanguage());

  const data = await apiRequest<BackendGroundedAnswer>(
    `/documents/${encodeURIComponent(documentId)}/ask`,
    {
      method: "POST",
      body: JSON.stringify({
        sessionId,
        question,
        lang,
      }),
    }
  );

  return mapBackendAnswerToLegalAnswer(data, "tenant", "doc-ask");
}

// ─── Letter Generation (POST /generate-letter) ────────────────────────────────

function mapFrontendLetterTypeToBackend(type: GeneratedDocumentType): string {
  switch (type) {
    case "salary_demand":
      return "unpaid_wages";
    case "consumer_complaint":
    case "complaint_draft":
      return "consumer_complaint";
    case "legal_notice":
    case "request_letter":
    default:
      return "security_deposit";
  }
}

/**
 * Normalizes details payload so backend templates receive appropriate keys.
 */
function normalizeLetterDetails(type: GeneratedDocumentType, details: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = { ...details };

  // For tenancy / security deposit
  if (!normalized.tenantName && normalized.yourName) normalized.tenantName = normalized.yourName;
  if (!normalized.landlordName && (normalized.recipientName || normalized.against)) {
    normalized.landlordName = normalized.recipientName || normalized.against;
  }
  if (!normalized.propertyAddress && normalized.matter) normalized.propertyAddress = normalized.matter;
  if (!normalized.depositAmount && normalized.amountOwed) normalized.depositAmount = normalized.amountOwed;
  if (!normalized.moveOutDate && normalized.deadline) normalized.moveOutDate = normalized.deadline;

  // For employment / wages
  if (!normalized.employeeName && normalized.yourName) normalized.employeeName = normalized.yourName;
  if (!normalized.employerName && (normalized.recipientName || normalized.against)) {
    normalized.employerName = normalized.recipientName || normalized.against;
  }

  // For consumer complaints
  if (!normalized.customerName && normalized.yourName) normalized.customerName = normalized.yourName;
  if (!normalized.sellerName && (normalized.recipientName || normalized.against)) {
    normalized.sellerName = normalized.recipientName || normalized.against;
  }

  return normalized;
}

/**
 * Generate a formal legal notice or complaint draft from structured details.
 * Calls POST /generate-letter with { sessionId, letterType, lang, details }.
 */
export async function generateLetter(
  type: GeneratedDocumentType,
  details: Record<string, string>
): Promise<GeneratedDocument> {
  const title = mockLetterTitle(type);

  if (!API_BASE_URL) {
    const body = buildMockLetterBody(type, details);
    return {
      id: `gen-${Date.now()}`,
      type,
      title,
      body,
      createdAt: new Date().toISOString(),
    };
  }

  const sessionId = await getOrCreateSessionId();
  const backendLetterType = mapFrontendLetterTypeToBackend(type);
  const normalizedDetails = normalizeLetterDetails(type, details);
  const lang = mapLang(storage.getSelectedLanguage());

  const data = await apiRequest<{
    letterId: string;
    letterType: string;
    lang: string;
    letterText: string;
    downloadUrl: string;
  }>("/generate-letter", {
    method: "POST",
    body: JSON.stringify({
      sessionId,
      letterType: backendLetterType,
      lang,
      details: normalizedDetails,
    }),
  });

  return {
    id: data.letterId || `gen-${Date.now()}`,
    type,
    title,
    body: data.letterText || buildMockLetterBody(type, details),
    createdAt: new Date().toISOString(),
  };
}

// ─── Text-to-Speech (POST /speak) ─────────────────────────────────────────────

/**
 * Text-to-speech for "Listen to this answer".
 * Calls POST /speak with { text, lang, sessionId }.
 * Returns a playable S3 audio URL.
 */
export async function speakAnswer(text: string, lang: Language): Promise<{ audioUrl: string | null }> {
  if (!API_BASE_URL) {
    return { audioUrl: null };
  }

  try {
    const sessionId = await getOrCreateSessionId();
    const data = await apiRequest<{ audioUrl?: string }>("/speak", {
      method: "POST",
      body: JSON.stringify({
        text,
        lang: mapLang(lang),
        sessionId,
      }),
    });
    return { audioUrl: data.audioUrl || null };
  } catch (err) {
    console.warn("[AdhikarAI API] /speak call failed, degrading gracefully:", err);
    return { audioUrl: null };
  }
}

// ─── Cases (GET /cases, POST /cases, GET /cases/{id}) ─────────────────────────

function mapCategoryToLegalDomain(category?: string): LegalDomain {
  const cat = (category || "").toLowerCase();
  if (cat.includes("police") || cat.includes("criminal")) return "police";
  if (cat.includes("tenant") || cat.includes("landlord") || cat.includes("rent")) return "tenant";
  if (cat.includes("employment") || cat.includes("wage") || cat.includes("salary")) return "employment";
  if (cat.includes("consumer") || cat.includes("product") || cat.includes("refund")) return "consumer";
  if (cat.includes("safety") || cat.includes("women")) return "safety";
  return "tenant";
}

function mapCategoryToIcon(category?: string): string {
  const cat = (category || "").toLowerCase();
  if (cat.includes("police") || cat.includes("criminal")) return "ShieldAlert";
  if (cat.includes("tenant") || cat.includes("landlord")) return "Home";
  if (cat.includes("employment") || cat.includes("wage")) return "Briefcase";
  if (cat.includes("consumer")) return "ShoppingCart";
  return "Home";
}

interface BackendCaseItem {
  caseId?: string;
  id?: string;
  sessionId?: string;
  title?: string;
  category?: string;
  description?: string;
  opponentName?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  icon?: string;
  nextAction?: string;
}

/**
 * Retrieve all tracked legal cases for the current session.
 * Calls GET /cases?sessionId=...
 */
export async function getCases(): Promise<CaseItem[]> {
  if (!API_BASE_URL) {
    return cases;
  }

  const sessionId = await getOrCreateSessionId();
  const data = await apiRequest<{ cases: BackendCaseItem[] }>(
    `/cases?sessionId=${encodeURIComponent(sessionId)}`
  );

  return (data.cases || []).map((c) => ({
    id: c.caseId || c.id || `case-${Date.now()}`,
    icon: c.icon || mapCategoryToIcon(c.category),
    title: c.title || "Legal Dispute",
    category: mapCategoryToLegalDomain(c.category),
    description: c.description || (c.opponentName ? `Against ${c.opponentName}` : "Active dispute"),
    lastUpdated: c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : "Recently",
    nextAction: c.nextAction || (c.status === "active" ? "Action pending" : "Resolved"),
  }));
}

/**
 * Retrieve a specific case by its ID.
 * Calls GET /cases/{caseId}?sessionId=... with fallback to list lookup.
 */
export async function getCase(caseId: string): Promise<CaseItem | undefined> {
  if (!API_BASE_URL) {
    return cases.find((c) => c.id === caseId);
  }

  const sessionId = await getOrCreateSessionId();
  try {
    const c = await apiRequest<BackendCaseItem>(
      `/cases/${encodeURIComponent(caseId)}?sessionId=${encodeURIComponent(sessionId)}`
    );
    if (!c) return undefined;
    return {
      id: c.caseId || c.id || caseId,
      icon: c.icon || mapCategoryToIcon(c.category),
      title: c.title || "Legal Dispute",
      category: mapCategoryToLegalDomain(c.category),
      description: c.description || (c.opponentName ? `Against ${c.opponentName}` : "Active dispute"),
      lastUpdated: c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : "Recently",
      nextAction: c.nextAction || (c.status === "active" ? "Action pending" : "Resolved"),
    };
  } catch (err) {
    console.warn(`[AdhikarAI] GET /cases/${caseId} failed, falling back to list lookup:`, err);
    const all = await getCases();
    return all.find((c) => c.id === caseId);
  }
}

/**
 * Create a new tracked legal case.
 * Calls POST /cases with { sessionId, title, category, description, opponentName, status }.
 */
export async function createCase(
  title: string,
  category: string = "Tenant",
  description: string = "",
  opponentName: string = ""
): Promise<CaseItem> {
  if (!API_BASE_URL) {
    const newCase: CaseItem = {
      id: `case-${Date.now()}`,
      icon: mapCategoryToIcon(category),
      title,
      category: mapCategoryToLegalDomain(category),
      description,
      lastUpdated: "Just now",
      nextAction: "Initial consultation recorded",
    };
    cases = [newCase, ...cases];
    return newCase;
  }

  const sessionId = await getOrCreateSessionId();
  const created = await apiRequest<BackendCaseItem>("/cases", {
    method: "POST",
    body: JSON.stringify({
      sessionId,
      title,
      category,
      description,
      opponentName,
      status: "active",
    }),
  });

  return {
    id: created.caseId || created.id || `case-${Date.now()}`,
    icon: created.icon || mapCategoryToIcon(created.category),
    title: created.title || title,
    category: mapCategoryToLegalDomain(created.category),
    description: created.description || description,
    lastUpdated: "Just now",
    nextAction: "Action recorded",
  };
}

// ─── Reminders (GET, POST, PUT, DELETE /reminders) ────────────────────────────

interface BackendReminderItem {
  reminderId?: string;
  id?: string;
  sessionId?: string;
  caseId?: string | null;
  title?: string;
  dueDate?: string;
  dueLabel?: string;
  reminderType?: string;
  status?: string;
  completed?: boolean;
  createdAt?: string;
}

/**
 * Retrieve all reminders for the active session.
 * Calls GET /reminders?sessionId=...
 */
export async function getReminders(): Promise<Reminder[]> {
  if (!API_BASE_URL) {
    return reminders;
  }

  const sessionId = await getOrCreateSessionId();
  const data = await apiRequest<{ reminders: BackendReminderItem[] }>(
    `/reminders?sessionId=${encodeURIComponent(sessionId)}`
  );

  return (data.reminders || []).map((r) => ({
    id: r.reminderId || r.id || `rem-${Date.now()}`,
    title: r.title || "Reminder",
    dueLabel:
      r.dueLabel ||
      (r.dueDate
        ? new Date(r.dueDate).toLocaleString([], { dateStyle: "short", timeStyle: "short" })
        : "No deadline set"),
    dueDate: r.dueDate || new Date().toISOString(),
    completed: r.status === "completed" || Boolean(r.completed),
    caseId: r.caseId || undefined,
  }));
}

/**
 * Create a new deadline reminder.
 * Calls POST /reminders with { sessionId, title, dueDate, caseId, reminderType, status }.
 */
export async function createReminder(title: string, dueLabel: string, caseId?: string): Promise<Reminder> {
  if (!API_BASE_URL) {
    const reminder: Reminder = {
      id: `rem-${Date.now()}`,
      title,
      dueLabel,
      dueDate: new Date().toISOString(),
      completed: false,
      caseId,
    };
    reminders = [reminder, ...reminders];
    return reminder;
  }

  const sessionId = await getOrCreateSessionId();

  // Backend requires a valid dueDate timestamp string
  const parsedDate = new Date(dueLabel);
  const dueDate = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString();

  const created = await apiRequest<BackendReminderItem>("/reminders", {
    method: "POST",
    body: JSON.stringify({
      sessionId,
      title,
      dueDate,
      reminderType: "deadline",
      caseId: caseId || null,
      status: "pending",
    }),
  });

  return {
    id: created.reminderId || created.id || `rem-${Date.now()}`,
    title: created.title || title,
    dueLabel: dueLabel || new Date(dueDate).toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
    dueDate: created.dueDate || dueDate,
    completed: created.status === "completed",
    caseId: created.caseId || undefined,
  };
}

/**
 * Update reminder status or details.
 * Calls PUT /reminders/{reminderId} with { sessionId, reminderId, ...patch }.
 */
export async function updateReminder(id: string, patch: Partial<Reminder>): Promise<Reminder | undefined> {
  if (!API_BASE_URL) {
    reminders = reminders.map((r) => (r.id === id ? { ...r, ...patch } : r));
    return reminders.find((r) => r.id === id);
  }

  const sessionId = await getOrCreateSessionId();
  const updated = await apiRequest<BackendReminderItem>(`/reminders/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({
      sessionId,
      reminderId: id,
      title: patch.title,
      dueDate: patch.dueDate,
      dueLabel: patch.dueLabel,
      completed: patch.completed,
      status: patch.completed !== undefined ? (patch.completed ? "completed" : "pending") : undefined,
    }),
  });

  return {
    id: updated.reminderId || updated.id || id,
    title: updated.title || "",
    dueLabel:
      patch.dueLabel ||
      updated.dueLabel ||
      (updated.dueDate
        ? new Date(updated.dueDate).toLocaleString([], { dateStyle: "short", timeStyle: "short" })
        : "No date set"),
    dueDate: updated.dueDate || patch.dueDate || new Date().toISOString(),
    completed: updated.status === "completed" || Boolean(updated.completed),
    caseId: updated.caseId || undefined,
  };
}

/**
 * Delete a reminder permanently.
 * Calls DELETE /reminders/{reminderId}?sessionId=...
 */
export async function deleteReminder(id: string): Promise<void> {
  if (!API_BASE_URL) {
    reminders = reminders.filter((r) => r.id !== id);
    return;
  }

  const sessionId = await getOrCreateSessionId();
  await apiRequest<{ deleted: boolean }>(
    `/reminders/${encodeURIComponent(id)}?sessionId=${encodeURIComponent(sessionId)}`,
    {
      method: "DELETE",
    }
  );
  reminders = reminders.filter((r) => r.id !== id);
}

// ─── Mock Fallback Helpers (Preserved for offline development) ─────────────────

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

Regards,
[Your name]`;
}

function labelize(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}
