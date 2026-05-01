# Groq AI API - QA Automation Suite

## 1. Project Overview
This repository contains a comprehensive, production-grade Quality Assurance automation suite designed to test the Groq AI API (LLaMA 3). Recognizing the non-deterministic nature of AI outputs, this test suite heavily prioritizes structural validation, resilience against edge cases, and safety mechanisms over brittle exact-match verifications. The project bridges automated API execution via Newman with centralized, formatted test case management using the Google Sheets API.

## 2. API Used
* **Provider**: Groq API (OpenAI-compatible format)
* **Base URL**: `https://api.groq.com/openai/v1`
* **Target Model**: `llama3-8b-8192`
* **Auth**: Bearer Token Authorization

## 3. Folder Structure
```text
/postman
  ├── collection.json         # Complete Postman test collection
  └── environment.json        # Postman environment variables (requires API key setup)
/scripts
  ├── googleSheetsSetup.js         # Initial script to scaffold sheets (deprecated/legacy)
  └── cleanAndRestructureSheets.js # Core Node.js script to clean, populate, and format the QA Sheet
/docs
  ├── test-cases.md           # Markdown backup of test cases
  └── bug-log.md              # Markdown backup of the bug log
/reports                      # Output directory for Newman HTML reports (generated at runtime)
/tests
  └── basic.spec.ts           # Basic Playwright health-check test for Groq UI/Docs
README.md                     # Project documentation
package.json                  # NPM scripts and dependencies
service_account.json          # Google Sheets API credentials (MUST BE PROVIDED LOCALLY)
```

## 4. Setup Instructions

### Prerequisites
* Node.js (v18+)
* A valid `service_account.json` (see `service_account.example.json` for the template).
* A valid `postman/environment.json` (see `postman/environment.example.json` for the template).

### Installation
1.  **Clone the repository.**
2.  **Setup Credentials**: 
    *   Duplicate `service_account.example.json` as `service_account.json` and add your Google Cloud credentials.
    *   Duplicate `postman/environment.example.json` as `postman/environment.json` and add your Groq API Key.
3.  **Install Dependencies**:
```bash
npm install --legacy-peer-deps
# Install Playwright browsers (if running the UI tests)
npx playwright install --with-deps
```

## 5. Running Tests (Postman, Newman, Playwright)

We provide configured NPM scripts for seamless execution.

**Run Basic API Tests (CLI Output):**
```bash
npm run test:api
```

**Run API Tests & Generate HTML Report:**
```bash
npm run test:report
```
*Note: This will output a detailed HTML report into the `/reports` directory using the `newman-reporter-htmlextra` module.*

**Run Playwright UI Health Check:**
```bash
npm run test:playwright
```

## 6. Google Sheets Integration
Test case management is handled dynamically via Google Sheets. The script ensures correct formatting, conditional coloring (Pass=Green, Fail=Red), dropdown validation, and overview analytics.

To push the latest structured data to your Google Sheet:
```bash
npm run sheets:setup
```

## 7. AI Output Validation Strategy
Testing an LLM API is fundamentally different from testing a deterministic REST API. Validating exact string matching is considered an anti-pattern because the model's exact tokens cannot be predicted reliably and may change between runs even with identical prompts (unless `temperature=0`, which limits testing scope).

Instead, this suite validates:
1. **Schema Stability**: Strictly ensuring `id`, `choices`, `message`, and `content` fields exist and adhere to expected data types.
2. **Quality & Presence**: Validating the output length is `> 20` characters and is not an empty string.
3. **Relevance**: Using keyword inclusion checks to ensure the generated text semantically aligns with the prompt.
4. **Safety & Fallbacks**: Testing prompt injection, gibberish inputs, and verifying that the model gracefully declines harmful inputs rather than crashing or providing toxic content.

This approach ensures robustness because it tests the *boundaries and behavior* of the API system rather than the *creative variance* of the LLM itself.

## 8. Key Failure Observations (Failure Analysis)

During QA execution, several critical failure modes unique to LLM APIs were observed and logged. 

**Example: Long Context Timeout & Degradation (TC-014)**
* **Root Cause Hypothesis**: Sending a massive context window (e.g., 20 complex alternating messages) approaches the maximum token limit (`8192` for LLaMA3) and heavily taxes inference latency, causing the connection to time out or the model's attention mechanism to drop early context constraints.
* **Impact**: High reliability risk in production. End-users with long-running conversational sessions will experience sudden dropped connections or hallucinations.
* **Suggested Mitigation**: 
  1. Implement aggressive server-side **chunking** and context window summarization before hitting the Groq API.
  2. Implement strict **timeout & retry** logic in the middleware (e.g., exponential backoff).
  3. Enforce maximum token thresholds on the client side.

## 9. Bug Tracking Approach
All anomalies are logged in the **Bug Log** tab of the Google Sheet (and backed up to `docs/bug-log.md`). Our approach mandates:
* **Traceability**: Every bug MUST be linked to a specific Test Case ID (e.g., TC-002, TC-016).
* **AI Specificity**: We distinguish between "API Validation" bugs (e.g., 500 errors on null arrays) and "AI Quality" bugs (e.g., hallucinating unicode characters on emoji inputs).

## 10. Recording Instructions
If a defect occurs during manual validation or automated pipeline failure:
1. Capture the exact Request JSON body and the prompt used.
2. Note the Response JSON, HTTP Status Code, and Headers (especially `x-ratelimit-remaining` to debug rate-limiting desyncs).
3. Record the anomaly in the **Bug Log** tab. For UX/UI bugs or sporadic AI output formatting issues, include an attached screenshot/recording linked directly in the spreadsheet's "Notes" column.

## Sample Test Execution Output

The Postman collection is executed via Newman with both CLI and HTML reporting.

Example:

- Total Requests: 3
- Assertions: 4
- Failures: 0
- Avg Response Time: ~600ms

HTML report available at:
reports/test-report.html
