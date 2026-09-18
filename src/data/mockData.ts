import {
  CaseItem,
  DocumentAnalysis,
  ExamplePrompt,
  LegalAnswerData,
  Reminder,
  Source,
} from "@/types";

export const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  { id: "p1", text: "My landlord hasn't returned my deposit", domain: "tenant" },
  { id: "p2", text: "My employer hasn't paid my salary", domain: "employment" },
  { id: "p3", text: "I received a notice. What does it mean?", domain: "police" },
  { id: "p4", text: "What can I do about a defective product?", domain: "consumer" },
];

const depositSources: Source[] = [
  {
    id: "src-1",
    name: "Model Tenancy Act, 2021",
    authority: "Ministry of Housing and Urban Affairs",
    description: "Central framework state rent laws are commonly modelled on, including deposit caps and return timelines.",
    url: "https://mohua.gov.in/",
  },
  {
    id: "src-2",
    name: "State Rent Control Act",
    authority: "State Government",
    description: "Sets the specific deposit cap and return period that applies in your state.",
    url: "https://indiacode.nic.in/",
  },
];

const wageSources: Source[] = [
  {
    id: "src-3",
    name: "Payment of Wages Act, 1936",
    authority: "Ministry of Labour & Employment",
    description: "Governs timely payment of wages and the process for recovering unpaid amounts.",
    url: "https://labour.gov.in/",
  },
];

const consumerSources: Source[] = [
  {
    id: "src-4",
    name: "Consumer Protection Act, 2019",
    authority: "Dept. of Consumer Affairs",
    description: "Covers defective goods, deficient services, and the Consumer Commission complaint process.",
    url: "https://consumeraffairs.nic.in/",
  },
  {
    id: "src-5",
    name: "National Consumer Helpline",
    authority: "Toll-free 1915",
    description: "First point of contact for mediation before filing a formal complaint.",
    url: "https://consumerhelpline.gov.in/",
  },
];

export const SAMPLE_ANSWERS: Record<string, LegalAnswerData> = {
  deposit: {
    id: "ans-deposit",
    domain: "tenant",
    situationSummary:
      "You moved out of a rented property and your landlord has not returned your security deposit.",
    whatThisMeans:
      "Security deposits are meant to cover unpaid rent or damage beyond normal wear and tear. Landlords are generally expected to return the balance within a set period after you vacate, minus any reasonable, itemised deductions.",
    nextSteps: [
      "Send a written request to your landlord stating the amount and your move-out date.",
      "Keep a copy of the rental agreement and any move-in/move-out photos.",
      "If there's no response in a reasonable time, escalate to your state's Rent Authority or a consumer forum.",
      "Consider generating a formal deposit-request letter from this app.",
    ],
    documentsNeeded: ["Rental agreement", "Payment receipts", "Move-out communication", "Photos of the property"],
    sources: depositSources,
    createdAt: new Date().toISOString(),
  },
  wages: {
    id: "ans-wages",
    domain: "employment",
    situationSummary: "Your employer has not paid your salary for a period you worked.",
    whatThisMeans:
      "Employers are required to pay wages within a prescribed period after each wage cycle. Unpaid wages can generally be claimed through a written demand, and if unresolved, through the labour authority.",
    nextSteps: [
      "Note the exact period and amount owed.",
      "Send a written request to your employer via email or letter.",
      "Keep pay slips, attendance records, and any written promises of payment.",
      "If unresolved, file a claim with your state Labour Commissioner's office.",
    ],
    documentsNeeded: ["Employment contract", "Pay slips", "Attendance records", "Written correspondence"],
    sources: wageSources,
    createdAt: new Date().toISOString(),
  },
  consumer: {
    id: "ans-consumer",
    domain: "consumer",
    situationSummary: "You received a defective product and want to know how to complain.",
    whatThisMeans:
      "Consumers have a right to replacement, refund, or compensation for defective goods or deficient services. Most disputes start with a written complaint to the seller, followed by the National Consumer Helpline if unresolved.",
    nextSteps: [
      "Write to the seller describing the defect and the resolution you want.",
      "Keep the invoice, warranty card, and photos or video of the defect.",
      "Call the National Consumer Helpline (1915) if the seller doesn't respond.",
      "File with the District Consumer Commission for higher-value claims.",
    ],
    documentsNeeded: ["Invoice / receipt", "Warranty card", "Photos or video of the defect", "Communication with seller"],
    sources: consumerSources,
    createdAt: new Date().toISOString(),
  },
};

export function findAnswerForText(text: string): LegalAnswerData {
  const lower = text.toLowerCase();
  if (lower.includes("deposit") || lower.includes("landlord") || lower.includes("rent")) {
    return SAMPLE_ANSWERS.deposit;
  }
  if (lower.includes("salary") || lower.includes("wage") || lower.includes("employer") || lower.includes("pay")) {
    return SAMPLE_ANSWERS.wages;
  }
  if (lower.includes("product") || lower.includes("refund") || lower.includes("defect") || lower.includes("consumer")) {
    return SAMPLE_ANSWERS.consumer;
  }
  return SAMPLE_ANSWERS.deposit;
}

export const SAMPLE_DOCUMENT_ANALYSIS: DocumentAnalysis = {
  id: "doc-1",
  fileName: "rental-agreement.pdf",
  documentType: "Rental Agreement",
  summary:
    "This is an 11-month residential rental agreement between a tenant and landlord, covering rent, deposit, and termination terms.",
  importantPoints: [
    { label: "Monthly rent", value: "₹18,000" },
    { label: "Security deposit", value: "₹54,000 (3 months)" },
    { label: "Agreement duration", value: "11 months" },
    { label: "Notice period", value: "30 days" },
  ],
  whatThisMeansForYou:
    "If you want to move out before the agreement ends, you're expected to give 30 days' written notice. Leaving without notice may affect how much of your deposit is returned.",
  thingsToCheck: [
    "Whether the deposit return timeline is stated anywhere in the agreement.",
    "Whether there's an early-termination penalty clause.",
    "Who is responsible for repairs versus normal wear and tear.",
  ],
  questionsToAsk: [
    "What happens if I leave before the agreement ends?",
    "Is the deposit amount capped by local rent control rules?",
    "What counts as 'damage' versus normal wear and tear here?",
  ],
};

export const MOCK_CASES: CaseItem[] = [
  {
    id: "case-1",
    icon: "Home",
    title: "Security Deposit",
    category: "tenant",
    description: "Landlord hasn't returned ₹54,000 deposit after move-out.",
    lastUpdated: "2 days ago",
    nextAction: "Send deposit request letter",
    reminderId: "rem-1",
    answer: SAMPLE_ANSWERS.deposit,
  },
  {
    id: "case-2",
    icon: "Briefcase",
    title: "Unpaid Salary",
    category: "employment",
    description: "One month's salary pending from previous employer.",
    lastUpdated: "5 days ago",
    nextAction: "Follow up with HR",
    reminderId: "rem-2",
    answer: SAMPLE_ANSWERS.wages,
  },
  {
    id: "case-3",
    icon: "ShoppingCart",
    title: "Product Complaint",
    category: "consumer",
    description: "Defective washing machine, seller not responding.",
    lastUpdated: "1 week ago",
    nextAction: "Call National Consumer Helpline",
    answer: SAMPLE_ANSWERS.consumer,
  },
];

export const MOCK_REMINDERS: Reminder[] = [
  { id: "rem-1", title: "Send deposit request", dueLabel: "Tomorrow · 10:00 AM", dueDate: "2025-01-01", completed: false, caseId: "case-1" },
  { id: "rem-2", title: "Follow up on complaint", dueLabel: "Friday · 5:00 PM", dueDate: "2025-01-03", completed: false, caseId: "case-2" },
  { id: "rem-3", title: "Call consumer helpline", dueLabel: "Completed", dueDate: "2024-12-20", completed: true, caseId: "case-3" },
];
