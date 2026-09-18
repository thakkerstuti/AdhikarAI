/**
 * AI Layer Mock Service
 * 
 * Deterministic mock implementation used when USE_MOCK_AI=true.
 * Provides instant, zero-cost responses for development and integration testing.
 */

import { buildAnsweredResponse, buildFallbackResponse } from "./contracts.js";

const MOCK_FIXTURES = [
  {
    keywords: ["deposit", "rent", "tenant", "landlord", "tenancy"],
    answer: {
      whatMayApply:
        "Under the Model Tenancy Act 2021 (Section 11), a landlord cannot demand a security deposit exceeding two months' rent for residential property.",
      yourSituation:
        "If your landlord is demanding a deposit greater than 2 months of rent, this exceeds the statutory cap established for residential tenancy agreements.",
      nextSteps: [
        "Review your tenancy agreement draft for deposit terms.",
        "Inform the landlord about statutory security deposit guidelines.",
        "Obtain a written receipt for all paid deposits and advances.",
      ],
      documentsNeeded: [
        "Draft Rental Agreement",
        "Bank payment receipts or transfer proof",
        "Communication log with landlord",
      ],
    },
    citations: [
      {
        id: "cit-mock-1",
        sourceTitle: "Model Tenancy Act 2021 - Section 11",
        excerpt: "No landlord shall claim or receive a security deposit exceeding two months' rent for residential tenancy.",
        score: 0.92,
      },
    ],
    confidenceScore: 0.92,
  },
  {
    keywords: ["consumer", "defective", "refund", "return", "product", "warranty"],
    answer: {
      whatMayApply:
        "Under the Consumer Protection Act 2019 (Section 2(7)), consumers are entitled to a full refund or replacement for goods containing manufacturing defects or misleading representations.",
      yourSituation:
        "Because the purchased item failed within the warranty window, you possess a legal right to seek remediation or a full refund from the seller or manufacturer.",
      nextSteps: [
        "Send a formal written complaint to the seller's customer service.",
        "Preserve original purchase invoice and warranty card.",
        "File an online complaint on the National Consumer Helpline (NCH) portal.",
      ],
      documentsNeeded: [
        "Original Purchase Tax Invoice",
        "Warranty card or receipt",
        "Photos or videos showing the product defect",
      ],
    },
    citations: [
      {
        id: "cit-mock-2",
        sourceTitle: "Consumer Protection Act 2019 - Consumer Rights",
        excerpt: "Every consumer has the right to be protected against unfair trade practices and receive replacement for defective goods.",
        score: 0.89,
      },
    ],
    confidenceScore: 0.89,
  },
  {
    keywords: ["wage", "salary", "pay", "delay", "employer", "unpaid"],
    answer: {
      whatMayApply:
        "Under the Payment of Wages Act 1936, wages must be disbursed before the 7th or 10th day of the succeeding month, depending on total workforce size.",
      yourSituation:
        "Withholding earned wages past statutory deadlines constitutes an unauthorized deduction and a breach of labor regulations.",
      nextSteps: [
        "Issue a formal written notice demanding release of pending salary.",
        "Collect monthly pay slips and employment contract.",
        "Approach the District Labour Commissioner if non-payment persists.",
      ],
      documentsNeeded: [
        "Employment Offer Letter / Contract",
        "Bank account statements showing missing payments",
        "Past salary slips",
      ],
    },
    citations: [
      {
        id: "cit-mock-3",
        sourceTitle: "Payment of Wages Act 1936 - Time of Payment",
        excerpt: "Wages of every person employed shall be paid before the expiry of the seventh day after the last day of the wage-period.",
        score: 0.86,
      },
    ],
    confidenceScore: 0.86,
  },
];

/**
 * Handles mock Q&A queries deterministically.
 */
export async function askLegalAssistantMock(normalizedRequest) {
  const queryLower = normalizedRequest.query.toLowerCase();

  // Trigger fallback scenario for explicit test triggers or completely unknown queries
  if (queryLower.includes("fallback") || queryLower.includes("unknown") || queryLower.includes("xyz123")) {
    return buildFallbackResponse({
      reason: "WEAK_RETRIEVAL",
      message: "Mock retrieval score below threshold or query out of knowledge base domain.",
      executionMode: "mock",
      confidenceScore: 0.0,
    });
  }

  // Match keyword fixture
  const matchedFixture = MOCK_FIXTURES.find((fixture) =>
    fixture.keywords.some((keyword) => queryLower.includes(keyword))
  );

  if (matchedFixture) {
    return buildAnsweredResponse({
      answer: matchedFixture.answer,
      citations: matchedFixture.citations,
      confidenceScore: matchedFixture.confidenceScore,
      executionMode: "mock",
    });
  }

  // Generic fallback if no mock keywords match
  return buildFallbackResponse({
    reason: "WEAK_RETRIEVAL",
    message: "No relevant legal knowledge base entries found in mock database.",
    executionMode: "mock",
    confidenceScore: 0.0,
  });
}
