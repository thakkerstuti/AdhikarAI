export type Language = "en" | "hi" | "hi-en" | "gu";

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  hi: "हिन्दी",
  "hi-en": "Hinglish",
  gu: "ગુજરાતી",
};

export type LegalDomain =
  | "police"
  | "tenant"
  | "employment"
  | "consumer"
  | "safety";

export const DOMAIN_LABELS: Record<LegalDomain, string> = {
  police: "Police & Criminal Procedure",
  tenant: "Tenant–Landlord",
  employment: "Employment",
  consumer: "Consumer Rights",
  safety: "Women & Personal Safety",
};

export interface Source {
  id: string;
  name: string;
  authority: string;
  description: string;
  url: string;
}

export interface LegalAnswerData {
  id: string;
  domain: LegalDomain;
  situationSummary: string;
  whatThisMeans: string;
  nextSteps: string[];
  documentsNeeded: string[];
  sources: Source[];
  createdAt: string;
  isEmergency?: boolean;
}

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text?: string;
  answer?: LegalAnswerData;
  pending?: boolean;
  timestamp: string;
}

export type VoiceState = "ready" | "listening" | "processing" | "answer" | "error";

export interface DocumentAnalysis {
  id: string;
  fileName: string;
  documentType: string;
  summary: string;
  importantPoints: { label: string; value: string }[];
  whatThisMeansForYou: string;
  thingsToCheck: string[];
  questionsToAsk: string[];
}

export type GeneratedDocumentType =
  | "complaint_draft"
  | "legal_notice"
  | "request_letter"
  | "consumer_complaint"
  | "salary_demand";

export const DOCUMENT_TYPE_LABELS: Record<GeneratedDocumentType, string> = {
  complaint_draft: "Complaint draft",
  legal_notice: "Legal notice draft",
  request_letter: "Request letter",
  consumer_complaint: "Consumer complaint draft",
  salary_demand: "Employer salary-demand letter",
};

export interface GeneratedDocument {
  id: string;
  type: GeneratedDocumentType;
  title: string;
  body: string;
  createdAt: string;
}

export interface CaseItem {
  id: string;
  icon: string;
  title: string;
  category: LegalDomain;
  description: string;
  lastUpdated: string;
  nextAction: string;
  reminderId?: string;
  answer?: LegalAnswerData;
}

export interface Reminder {
  id: string;
  title: string;
  dueLabel: string;
  dueDate: string;
  completed: boolean;
  caseId?: string;
}

export interface ExamplePrompt {
  id: string;
  text: string;
  domain: LegalDomain;
}
