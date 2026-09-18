# AI Layer Learning Notes

Welcome! This document is your mentor-style guide to understanding how the AI Layer of AdhikarAI works, why it is designed this way, how data flows through it, and what safety mechanisms protect users from AI hallucinations.

---

## 1. Current AI Layer Map

Here is the role of each file in your AI layer (`backend/src/ai/`):

### `index.js`
- **Responsibility:** The main public entrypoint (`askLegalAssistant`). It orchestrates the entire workflow (validation → mock/live check → retrieval → grounding check → Nova 2 Lite call → citation extraction → response building).
- **What it should NOT do:** It should not contain raw prompt strings, direct SDK initialization, or low-level HTTP parsing.
- **Talks to:** `contracts.js`, `mockAiService.js`, `bedrockClient.js`, `retrievalService.js`, `grounding.js`, `prompts.js`.

### `contracts.js`
- **Responsibility:** Defines and enforces the exact input request schema (`query`, `language`, `sessionId`, `options.topK`) and output response shape (`status`: `"answered"` | `"fallback"` | `"error"`).
- **What it should NOT do:** It should not make AWS SDK calls or contain legal domain prompts.
- **Talks to:** Used by `index.js`, `mockAiService.js`, `bedrockClient.js`, `grounding.js`.

### `mockAiService.js`
- **Responsibility:** Provides instant, deterministic mock responses for development and testing without calling AWS or spending money.
- **What it should NOT do:** It should not call live AWS Bedrock SDKs or handle real vector searches.
- **Talks to:** Called by `index.js` when `USE_MOCK_AI=true`. Uses `contracts.js` to build response shapes.

### `bedrockClient.js`
- **Responsibility:** Manages the low-level `@aws-sdk/client-bedrock-runtime` client and executes `ConverseCommand` against Amazon Nova 2 Lite (`amazon.nova-lite-v1:0`). Also validates configuration in live mode.
- **What it should NOT do:** It should not evaluate vector search scores or decide if a response is grounded.
- **Talks to:** Called by `index.js`. Uses `contracts.js` for error types (`ConfigurationError`).

### `retrievalService.js`
- **Responsibility:** Connects to AWS Bedrock Knowledge Base via `@aws-sdk/client-bedrock-agent-runtime` (`RetrieveCommand`) to fetch raw text passages, relevance scores, and metadata.
- **What it should NOT do:** It should not invoke LLMs or format final user responses.
- **Talks to:** Called by `index.js`. Uses `bedrockClient.js` for validated environment configuration.

### `grounding.js`
- **Responsibility:** The safety firewall. Compares retrieved vector scores against `MIN_RETRIEVAL_SCORE` (default `0.5`). Extracts verbatim citations from search metadata and triggers fallbacks if context is weak.
- **What it should NOT do:** It should not accept client-provided threshold overrides or generate fake citation text.
- **Talks to:** Called by `index.js`.

### `prompts.js`
- **Responsibility:** Formats Nova 2 Lite system instructions, user prompts, and cleans/parses structured JSON model outputs.
- **What it should NOT do:** It should not execute network requests or perform vector matching.
- **Talks to:** Called by `index.js`.

---

## 2. Current Data Flow

```text
Native App / API Client
      ↓ (HTTP POST /ask)
Backend Handler (e.g. src/handlers/query.js - owned by teammate)
      ↓ passes raw body object
ai/index.js (askLegalAssistant)
      ↓
[1] contracts.js (validateAndNormalizeRequest)
      ├── Invalid request? → Returns status: "error" (code: "INVALID_REQUEST")
      └── Valid request? → Proceed
      ↓
[2] Check USE_MOCK_AI environment variable
      ├── USE_MOCK_AI=true? → ai/mockAiService.js → Returns status: "answered" / "fallback"
      └── USE_MOCK_AI=false? → Live Bedrock Execution
            ↓
[3] ai/bedrockClient.js (getValidatedConfig)
      ├── Missing BEDROCK_KB_ID? → Returns status: "error" (code: "CONFIG_ERROR")
      └── Valid config? → Proceed
            ↓
[4] ai/retrievalService.js (retrieveKnowledgePassages)
      ↓ Executes RetrieveCommand against Bedrock KB
      ↓ Returns passages with vector scores & source metadata
            ↓
[5] ai/grounding.js (evaluateRetrievalQuality)
      ├── topScore < MIN_RETRIEVAL_SCORE (0.5) or 0 passages?
      │     └── Returns status: "fallback" (Zero Hallucination Guardrail)
      └── topScore >= MIN_RETRIEVAL_SCORE?
            ↓
[6] ai/prompts.js (buildSystemPrompt & buildUserPrompt)
      ↓ Formats retrieved passages + query into Nova 2 Lite system prompt
            ↓
[7] ai/bedrockClient.js (invokeNovaModel)
      ↓ Sends ConverseCommand to amazon.nova-lite-v1:0
      ↓ Returns raw JSON text
            ↓
[8] ai/prompts.js (cleanAndParseJsonResponse)
      ↓ Strips markdown backticks, parses JSON
            ↓
[9] ai/grounding.js (extractValidCitations)
      ↓ Extracts real citations from KB metadata (never invents citations)
            ↓
[10] ai/contracts.js (buildAnsweredResponse)
      ↓ Formats final status: "answered" payload
Backend Handler → Native App
```

---

## 3. What Changed In This Step

- **Files Created:**
  - `backend/src/ai/contracts.js`
  - `backend/src/ai/prompts.js`
  - `backend/src/ai/mockAiService.js`
  - `backend/src/ai/bedrockClient.js`
  - `backend/src/ai/retrievalService.js`
  - `backend/src/ai/grounding.js`
  - `backend/src/ai/index.js`
  - `backend/src/ai/test/askLegalAssistant.test.js`
  - `backend/src/ai/AI_LAYER_LEARNING.md`
- **What Was Added:** Created local learning document `AI_LAYER_LEARNING.md` for technical mentoring, architectural map, data flow diagrams, security decisions, and grounding rules.
- **Why It Was Needed:** To provide a comprehensive, beginner-friendly mentor guide explaining every file, decision, risk, and testing procedure in the AI layer.
- **What Problem It Prevents:** Prevents confusion about file responsibilities, data flow, security boundaries, and RAG grounding mechanics.

---

## 4. Important Design Decisions

1. **Why Mock-First?**
   - Allows native app developers and backend infrastructure teammates to immediately test the `/ask` contract and build UI components without waiting for AWS Bedrock Knowledge Base vector index setup or incurring AWS costs during early development.
2. **Why Native App Should NOT Call Bedrock Directly:**
   - Security: Calling AWS Bedrock directly from a mobile device requires putting AWS IAM credentials on the device, exposing AWS resources to key extraction and abuse.
   - Cost Control: Direct client access prevents rate-limiting, query validation, and cost caps.
   - Architectural Boundary: The mobile app should only know about backend REST API endpoints.
3. **Why `minScore` is Server-Side Only:**
   - Allowing clients to pass arbitrary `minScore` values lets malicious clients override safety limits (e.g. passing `minScore = 0.0` to force AI generation on ungrounded/irrelevant queries). The AI safety boundary must be controlled exclusively by the backend configuration (`MIN_RETRIEVAL_SCORE`).
4. **Why Fallback Exists (`status: "fallback"`):**
   - Legal domain information must be accurate. If the vector index contains no relevant statutory provisions for a user's question, generating an answer using general model memory risks legal hallucination. A structured fallback clearly informs the user while suggesting safe next steps.
5. **Why Citations Must Come from Retrieved Sources Only:**
   - LLMs can easily generate convincing fake citation titles like "Section 42A of Indian Rent Act". Extracting citations strictly from AWS Bedrock KB result metadata guarantees 100% genuine source attribution.

---

## 5. AWS / Security Notes

- **AWS Services Involved:**
  - **Amazon Bedrock Runtime:** Invokes Nova 2 Lite (`amazon.nova-lite-v1:0`).
  - **Amazon Bedrock Agent Runtime:** Performs vector retrieval against Bedrock Knowledge Base (`RetrieveCommand`).
  - **Amazon OpenSearch Serverless / Bedrock KB:** Vector store hosting legal domain documents.
- **Environment Variables:**
  - `BEDROCK_MODEL_ID`: Model ID (default `amazon.nova-lite-v1:0`).
  - `BEDROCK_KB_ID`: Knowledge Base ID created in Bedrock Console.
  - `AWS_REGION`: AWS Region (e.g. `us-east-1`).
  - `USE_MOCK_AI`: Set `true` for offline/mock mode; set `false` for live Bedrock mode.
  - `MIN_RETRIEVAL_SCORE`: Server-side confidence threshold (default `0.5`).
- **Security Rule:** AWS IAM credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) are **never** hardcoded. AWS SDK automatically picks up IAM role credentials provided by AWS Lambda in production.
- **Security Mistake Avoided:** Prevents leaking internal AWS KB IDs or S3 bucket URIs in the mobile app API response by stripping raw storage locations into human-friendly document titles.

---

## 6. RAG / Hallucination Guardrails

- **How Retrieval Works:**
  - User query string is converted to vector embeddings by Bedrock KB and searched against indexed legal documents using cosine similarity.
- **How Grounding is Checked:**
  - Each retrieved chunk returns a relevance `score` between 0.0 and 1.0. `grounding.js` calculates `topScore = Math.max(...scores)`.
- **When Fallback is Triggered:**
  - If 0 chunks are returned OR `topScore < MIN_RETRIEVAL_SCORE` (0.5), generation is cancelled immediately and a fallback payload is returned.
- **Why We Do Not Generate Answers Without Context:**
  - LLMs can fabricate laws or penalties when guessing. Halting generation on weak retrieval enforces zero hallucination.
- **How Citations Are Created:**
  - `extractValidCitations` extracts `sourceTitle`, short text excerpt (< 40 words), and score directly from retrieved vector chunks.

---

## 7. How To Test Locally

- **Command to Run Tests:**
  ```bash
  npm test
  # or
  node --test src/ai/test/askLegalAssistant.test.js
  ```
- **What the Test Proves:**
  - Proves contract compliance for `askLegalAssistant`.
  - Verifies request validation and error responses.
  - Verifies mock mode returns grounded answers for match queries and fallback for unknown queries.
  - Verifies live mode throws `CONFIG_ERROR` if `BEDROCK_KB_ID` is missing when `USE_MOCK_AI=false`.
  - Verifies score threshold rules and citation formatting.
- **Expected Success Result:**
  - `14 pass, 0 fail`
- **Common Failures & Meanings:**
  - `ERR_MODULE_NOT_FOUND`: `node_modules` not installed. Fix: run `npm install` in `backend/`.
  - `CONFIG_ERROR`: `USE_MOCK_AI=false` set without `BEDROCK_KB_ID`. Fix: set `USE_MOCK_AI=true` or set `BEDROCK_KB_ID`.

---

## 8. Open Questions / Assumptions

- **Knowledge Base ID (`BEDROCK_KB_ID`):** To be supplied by teammate after AWS Bedrock Console Knowledge Base creation.
- **AWS Region:** Assumed `us-east-1` (can be overridden via `AWS_REGION`).
- **Backend Route Wiring:** Teammate will wire API Gateway `/ask` handler to invoke `askLegalAssistant(requestPayload)` from `src/ai/index.js`.
