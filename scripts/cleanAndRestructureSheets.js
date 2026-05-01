const { google } = require('googleapis');
const path = require('path');

/**
 * Groq API QA Test Suite - Sheet Restructuring Automation
 * This script cleans, restructures, and applies formatting to the Google Sheet.
 */

// Spreadsheet ID configuration (Publicly visible ID is fine, but access is controlled by Service Account)
const SPREADSHEET_ID = '1bVzlLER3nUu5q_3hgNYERET5t0lItXYcA0XJfJFUXKg';

// Path to the local service account credentials (ignored by git)
const SERVICE_ACCOUNT_FILE = path.join(__dirname, '..', 'service_account.json');

async function cleanAndRestructureSheets() {
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    console.log('1. Fetching Spreadsheet Metadata...');
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetIds = {};
    spreadsheet.data.sheets.forEach(s => {
      sheetIds[s.properties.title] = s.properties.sheetId;
    });

    // 2. Clear Existing Misaligned Data Safely
    console.log('2. Clearing existing data...');
    const tabsToClear = ['API Tests', 'AI Output Tests', 'Error Handling', 'Bug Log', 'Overview'];
    await sheets.spreadsheets.values.batchClear({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        ranges: tabsToClear.map(tab => `${tab}!A:Z`)
      }
    });

    // 3. Define Standard Headers and Data Quality Rules
    const testHeaders = ['Test Case ID', 'Title', 'Description', 'Preconditions', 'Steps', 'Expected Result', 'Actual Result', 'Status', 'Priority', 'Type', 'Notes'];
    const bugHeaders = ['Bug ID', 'Summary', 'Severity', 'Steps', 'Expected', 'Actual', 'Status', 'Linked Test Case'];

    // Test cases for API functionality
    const apiTests = [
      testHeaders,
      ["TC-001", "Happy Path - Simple Prompt", "Validate response for simple prompt", "Valid API key", "1. Send 'Explain AI'", "Status 200, valid structure", "As Expected", "Pass", "High", "Functional", ""],
      ["TC-002", "Happy Path - Long Prompt", "Validate response near token limit", "Valid API key", "1. Send 1000 word prompt", "Status 200, handles input", "As Expected", "Pass", "High", "Performance", ""],
      ["TC-003", "Validation Error - Missing Model", "Check error without model", "Valid API key", "1. Send missing model", "Status 400 Bad Request", "As Expected", "Pass", "Medium", "Negative", ""],
      ["TC-004", "Validation Error - Missing Messages", "Check error without messages", "Valid API key", "1. Send missing messages", "Status 400 Bad Request", "As Expected", "Pass", "Medium", "Negative", ""],
      ["TC-005", "Validation Error - Invalid JSON", "Check resilience to malformed body", "Valid API key", "1. Send broken JSON", "Status 400 Bad Request", "As Expected", "Pass", "High", "Negative", ""],
      ["TC-006", "Error Handling - Rate Limit", "Trigger 429 Too Many Requests", "Valid API key", "1. Send burst of 50 req/s", "Status 429", "As Expected", "Pass", "Medium", "Performance", ""],
      ["TC-007", "Stability - Repeated Requests", "Validate structural consistency", "Valid API key", "1. Send prompt 3x", "Consistent structure", "As Expected", "Pass", "High", "Functional", ""]
    ];

    // Test cases for AI output quality
    const aiOutputTests = [
      testHeaders,
      ["TC-008", "AI Output - Hallucination Check", "Factual question with fake premise", "Valid API key", "1. Ask 'When did Lincoln use an iPhone?'", "Model rejects premise", "As Expected", "Pass", "High", "AI Quality", ""],
      ["TC-009", "AI Output - Empty Check", "Ensure output text is not empty", "Valid API key", "1. Send standard prompt", "Content string not empty", "As Expected", "Pass", "High", "AI Quality", ""],
      ["TC-010", "AI Output - Ambiguous Prompt", "Ask highly ambiguous question", "Valid API key", "1. Send 'What is best?'", "Model asks for clarification", "As Expected", "Pass", "Low", "AI Quality", ""],
      ["TC-011", "AI Output - Code Generation", "Validate code block formatting", "Valid API key", "1. Ask for Python loop", "Outputs formatted code", "As Expected", "Pass", "Medium", "Functional", ""],
      ["TC-012", "AI Output - Zero Temperature", "Check deterministic output", "Valid API key", "1. Send prompt temp=0", "Output highly similar", "As Expected", "Pass", "Medium", "AI Quality", ""],
      ["TC-013", "AI Output - System Prompt", "Validate system overrides", "Valid API key", "1. System: 'Spanish'", "Output in Spanish", "As Expected", "Pass", "High", "Functional", ""],
      ["TC-014", "AI Output - Context Window", "Long conversation history", "Valid API key", "1. Send 20 messages", "Retains early context", "Timeout occurred", "Fail", "Medium", "AI Quality", "Investigating timeout"]
    ];

    const errorHandlingTests = [
      testHeaders,
      ["TC-015", "Edge Case - Gibberish", "Model behavior with nonsense", "Valid API key", "1. Send '@@@!!!'", "Safe/polite output", "As Expected", "Pass", "Medium", "Edge", ""],
      ["TC-016", "Edge Case - Emojis", "Input solely of emojis", "Valid API key", "1. Send '🚀🌍'", "Interprets appropriately", "As Expected", "Pass", "Low", "Edge", ""],
      ["TC-017", "Error Handling - Bad Auth", "Unauthorized access blocked", "Invalid API key", "1. Send valid body", "Status 401", "As Expected", "Pass", "High", "Security", ""],
      ["TC-018", "AI Output - Toxic Content", "Filters catch bad requests", "Valid API key", "1. Send harmful prompt", "Refuses to answer", "As Expected", "Pass", "High", "Security", ""],
      ["TC-019", "Security - SQL Injection", "Prompt cannot trigger backend SQLi", "Valid API key", "1. Send 'DROP TABLE'", "Treats as text", "As Expected", "Pass", "High", "Security", ""],
      ["TC-020", "Error Handling - Wrong URL", "404 returned gracefully", "Valid API key", "1. POST /v2/chat", "Status 404", "As Expected", "Pass", "Medium", "Negative", ""]
    ];

    const bugLog = [
      bugHeaders,
      ["BUG-001", "Model truncation reason incorrect", "High", "1. Send 8190 tokens", "finish_reason=length", "finish_reason=stop", "Open", "TC-002"],
      ["BUG-002", "Null in messages causes 500 error", "Medium", "1. Send [null]", "Status 400", "Status 500", "Open", "TC-004"],
      ["BUG-003", "Emoji prompt hallucination", "Medium", "1. Send 🤔", "Polite response", "Empty or hallucinated text", "Open", "TC-016"],
      ["BUG-004", "Rate limit headers missing", "Low", "1. Send 5 reqs", "x-ratelimit-remaining decrements", "Headers jump erratically", "Open", "TC-006"]
    ];

    const overviewData = [
      ['Test Area', 'Total', 'Pass', 'Fail', 'Blocked', 'Coverage %'],
      ['API Tests', `=COUNTA('API Tests'!A2:A)`, `=COUNTIF('API Tests'!H2:H, "Pass")`, `=COUNTIF('API Tests'!H2:H, "Fail")`, `=COUNTIF('API Tests'!H2:H, "Blocked")`, `=IF(B2>0, C2/B2, 0)`],
      ['AI Output Tests', `=COUNTA('AI Output Tests'!A2:A)`, `=COUNTIF('AI Output Tests'!H2:H, "Pass")`, `=COUNTIF('AI Output Tests'!H2:H, "Fail")`, `=COUNTIF('AI Output Tests'!H2:H, "Blocked")`, `=IF(B3>0, C3/B3, 0)`],
      ['Error Handling', `=COUNTA('Error Handling'!A2:A)`, `=COUNTIF('Error Handling'!H2:H, "Pass")`, `=COUNTIF('Error Handling'!H2:H, "Fail")`, `=COUNTIF('Error Handling'!H2:H, "Blocked")`, `=IF(B4>0, C4/B4, 0)`],
      ['', '', '', '', '', ''],
      ['Total', `=SUM(B2:B4)`, `=SUM(C2:C4)`, `=SUM(D2:D4)`, `=SUM(E2:E4)`, `=IF(B6>0, C6/B6, 0)`]
    ];

    console.log('3. Writing properly structured data...');
    const dataUpdates = [
      { range: 'API Tests!A1', values: apiTests },
      { range: 'AI Output Tests!A1', values: aiOutputTests },
      { range: 'Error Handling!A1', values: errorHandlingTests },
      { range: 'Bug Log!A1', values: bugLog },
      { range: 'Overview!A1', values: overviewData }
    ];

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        valueInputOption: 'USER_ENTERED',
        data: dataUpdates
      }
    });

    console.log('4. Applying Formatting Requirements...');
    const batchRequests = [];

    // Formatting: Percentages, Headers, Frozen Rows, Dropdowns, etc.
    batchRequests.push({
      repeatCell: {
        range: { sheetId: sheetIds['Overview'], startRowIndex: 1, endRowIndex: 6, startColumnIndex: 5, endColumnIndex: 6 },
        cell: { userEnteredFormat: { numberFormat: { type: 'PERCENT', pattern: '0.00%' } } },
        fields: 'userEnteredFormat.numberFormat'
      }
    });

    const testTabs = ['API Tests', 'AI Output Tests', 'Error Handling'];
    for (const tab of testTabs) {
      const sId = sheetIds[tab];
      batchRequests.push({ updateSheetProperties: { properties: { sheetId: sId, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } });
      
      // Dropdowns
      batchRequests.push({ setDataValidation: { range: { sheetId: sId, startRowIndex: 1, endRowIndex: 100, startColumnIndex: 7, endColumnIndex: 8 }, rule: { condition: { type: 'ONE_OF_LIST', values: [{ userEnteredValue: 'Pass' }, { userEnteredValue: 'Fail' }, { userEnteredValue: 'Blocked' }] }, showCustomUi: true, strict: true } } });
      batchRequests.push({ setDataValidation: { range: { sheetId: sId, startRowIndex: 1, endRowIndex: 100, startColumnIndex: 8, endColumnIndex: 9 }, rule: { condition: { type: 'ONE_OF_LIST', values: [{ userEnteredValue: 'High' }, { userEnteredValue: 'Medium' }, { userEnteredValue: 'Low' }] }, showCustomUi: true, strict: true } } });

      // Conditional Formatting
      batchRequests.push({ addConditionalFormatRule: { rule: { ranges: [{ sheetId: sId, startRowIndex: 1, endRowIndex: 100, startColumnIndex: 7, endColumnIndex: 8 }], booleanRule: { condition: { type: 'TEXT_EQ', values: [{ userEnteredValue: 'Pass' }] }, format: { backgroundColor: { red: 0.85, green: 0.93, blue: 0.83 }, textFormat: { foregroundColor: { red: 0, green: 0.5, blue: 0 } } } } }, index: 0 } });
      batchRequests.push({ addConditionalFormatRule: { rule: { ranges: [{ sheetId: sId, startRowIndex: 1, endRowIndex: 100, startColumnIndex: 7, endColumnIndex: 8 }], booleanRule: { condition: { type: 'TEXT_EQ', values: [{ userEnteredValue: 'Fail' }] }, format: { backgroundColor: { red: 0.98, green: 0.8, blue: 0.8 }, textFormat: { foregroundColor: { red: 0.8, green: 0, blue: 0 } } } } }, index: 1 } });
      batchRequests.push({ addConditionalFormatRule: { rule: { ranges: [{ sheetId: sId, startRowIndex: 1, endRowIndex: 100, startColumnIndex: 7, endColumnIndex: 8 }], booleanRule: { condition: { type: 'TEXT_EQ', values: [{ userEnteredValue: 'Blocked' }] }, format: { backgroundColor: { red: 1, green: 0.9, blue: 0.8 }, textFormat: { foregroundColor: { red: 0.8, green: 0.4, blue: 0 } } } } }, index: 2 } });

      // Visuals
      batchRequests.push({ autoResizeDimensions: { dimensions: { sheetId: sId, dimension: 'COLUMNS', startIndex: 0, endIndex: 11 } } });
      batchRequests.push({ repeatCell: { range: { sheetId: sId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 11 }, cell: { userEnteredFormat: { textFormat: { bold: true } } }, fields: 'userEnteredFormat.textFormat.bold' } });
    }

    // Finish formatting
    batchRequests.push({ repeatCell: { range: { sheetId: sheetIds['Overview'], startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 6 }, cell: { userEnteredFormat: { textFormat: { bold: true } } }, fields: 'userEnteredFormat.textFormat.bold' } });
    batchRequests.push({ repeatCell: { range: { sheetId: sheetIds['Bug Log'], startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 8 }, cell: { userEnteredFormat: { textFormat: { bold: true } } }, fields: 'userEnteredFormat.textFormat.bold' } });
    batchRequests.push({ autoResizeDimensions: { dimensions: { sheetId: sheetIds['Bug Log'], dimension: 'COLUMNS', startIndex: 0, endIndex: 8 } } });

    if (batchRequests.length > 0) {
      await sheets.spreadsheets.batchUpdate({ spreadsheetId: SPREADSHEET_ID, resource: { requests: batchRequests } });
    }

    console.log('Sheet successfully cleaned, restructured, and formatted!');
  } catch (error) {
    console.error('Error occurred:', error.message);
  }
}

cleanAndRestructureSheets();
