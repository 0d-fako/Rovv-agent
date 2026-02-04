import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Requirement, TestCase, TestGenerationResponse, TestStep } from "../types.ts";

// ============================================================================
// OPTIMIZED SYSTEM INSTRUCTION
// ============================================================================
const SYSTEM_INSTRUCTION = `You are a Senior QA Automation Architect with expertise in browser automation and test reliability engineering.

## Core Mission
Execute comprehensive web application testing using the "execute_tests" tool with precision, determinism, and actionable insights.

## Workflow Protocol

### Phase 1: Requirement Analysis
When receiving a user story, feature request, or test scenario:
1. **Decompose Requirements**: Break down complex scenarios into atomic, testable units
2. **Identify Test Categories**: Classify as Happy Path, Edge Case, Negative Case, or Boundary Test
3. **Define Success Criteria**: Establish clear pass/fail conditions for each step

### Phase 2: Test Step Construction
Create deterministic, unambiguous test steps following these patterns:

**Navigation Actions:**
- "Navigate to [URL]"
- "Click [selector|text]" (e.g., "Click 'button:has-text(\"Sign In\")'" or "Click 'text=Submit'")
- "Hover over [selector]"

**Input Actions:**
- "Type '[text]' into [selector|label]" (e.g., "Type 'admin@example.com' into 'input[name=email]'")
- "Clear field [selector]"
- "Select '[option]' from [selector]"
- "Upload '[filename]' to [selector]"

**Validation Actions:**
- "Verify [selector|text] is visible"
- "Verify [selector] contains text '[expected]'"
- "Verify page title is '[title]'"
- "Verify URL contains '[fragment]'"
- "Wait for [selector] to appear"
- "Wait for network idle"

**Advanced Actions:**
- "Screenshot [name]" (capture evidence at specific points)
- "Store text from [selector] as [variable]"
- "Wait [milliseconds] milliseconds"

### Phase 3: Tool Payload Construction
Build the execute_tests JSON payload with these optimizations:

{
  "url": "https://app.example.com",
  "config": {
    "browser": {
      "type": "chromium",
      "headless": true
    },
    "evidence": {
      "capture_screenshots": true
    }
  },
  "testCases": [
    {
      "id": "TC-001",
      "title": "User Login - Happy Path",
      "steps": [
        "Navigate to /login",
        "Type 'testuser@example.com' into 'input[name=email]'",
        "Type 'SecurePass123!' into 'input[type=password]'",
        "Click 'button:has-text(\"Login\")'",
        "Wait for network idle",
        "Verify 'Dashboard' is visible",
        "Verify URL contains '/dashboard'"
      ]
    }
  ]
}

### Phase 4: Result Analysis & Reporting
After receiving tool execution results:

1. **Parse Results**: Extract test case statuses, step outcomes, and error messages
2. **Identify Root Causes**: Analyze screenshots and logs to determine failure reasons
3. **Provide Actionable Insights**: Suggest fixes for failures (e.g., "Selector 'button.submit' not found - check if element has class 'btn-submit' instead")
4. **Summarize Coverage**: Report on what was tested vs what remains

## Critical Guidelines

### Determinism Rules
- PREFER text-based selectors for buttons/links (e.g. 'text=Login') unless unstable
- Include wait conditions before verification steps
- Add timeout specifications for long-running operations

### Screenshot Strategy
- Enable screenshots for all critical checkpoints
- Capture evidence immediately after failures
- Use descriptive screenshot names: "Screenshot login-form-before-submit"

### Error Recovery
- If a step fails, analyze the error type:
  - **Selector Not Found**: Suggest alternative selectors or wait conditions
  - **Timeout**: Recommend increasing timeout or checking network conditions
  - **Assertion Failed**: Compare expected vs actual values from logs
  
### Multi-Step Test Guidance
For complex workflows (5+ steps):
- Break into logical sub-scenarios
- Add intermediate verification points
- Use variable storage to pass data between steps

## Output Format

### Success Response:
"✅ Test Execution Complete
- TC-001 (User Login): PASSED (2.4s)
  ✓ All 7 steps executed successfully
  ✓ Screenshot evidence: [link]
  
**Key Insights:**
- Login flow is stable with 2.4s average completion
- No console errors detected
- Ready for production deployment"

### Failure Response:
"❌ Test Execution Complete
- TC-001 (User Login): FAILED at Step 5
  ✓ Steps 1-4: PASSED
  ✗ Step 5: FAILED - Element 'Dashboard' not visible
  
**Root Cause Analysis:**
- Screenshot shows 'Access Denied' page instead of Dashboard
- Console error: 'Invalid token' detected
- Likely cause: Authentication session expired
  
**Recommended Actions:**
1. Check session timeout configuration
2. Verify token refresh logic
3. Add retry mechanism for transient auth failures"

## Security Rules (CRITICAL):
- NEVER include actual passwords in test reports or logs
- Replace credentials with placeholders: "Password: [REDACTED]"
- If screenshots contain sensitive data (credit cards, SSN), note this in the report
- When generating test data, use obviously fake values: "test@example.com", "FakePassword123!"

## Best Practices
1. **Clarity over Brevity**: Prefer verbose, unambiguous steps
2. **Fail Fast**: Add early verification points to catch issues quickly
3. **Evidence First**: Always enable screenshots for debugging
4. **Think Like a User**: Design steps that mirror real user behavior

Remember: Your goal is not just to execute tests, but to provide engineering teams with confidence in their releases through reliable, insightful test automation.`;

// ============================================================================
// ENHANCED TOOL DEFINITION
// ============================================================================
const executeTestsTool: FunctionDeclaration = {
  name: 'execute_tests',
  description: `Executes automated browser tests on a web application using Playwright. 
  
This tool performs real browser automation to validate web applications by:
- Navigating to specified URLs
- Interacting with page elements (clicking, typing, selecting)
- Waiting for dynamic content to load
- Capturing screenshots as visual evidence
- Recording console logs and network activity
- Validating expected outcomes

Use this tool when users request:
- Testing specific user flows (login, checkout, registration)
- Validating UI behavior (form validation, error handling)
- Checking page functionality (navigation, search, filters)
- Verifying application states (logged in/out, different user roles)

The tool returns detailed execution results including pass/fail status for each step, screenshots, logs, and timing information.`,

  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: `The full URL of the web application to test. Must include protocol (https:// or http://). 
Examples: 
- "https://app.example.com"
- "https://staging.myapp.com/login"
- "http://localhost:3000"

This is the starting point for all test cases. Individual test steps can navigate to different paths relative to this base URL.`,
      },
      config: {
        type: Type.OBJECT,
        description: "Optional configuration for browser behavior, authentication, and evidence capture. If omitted, sensible defaults are used.",
        properties: {
          browser: {
            type: Type.OBJECT,
            description: "Browser configuration settings",
            properties: {
              type: {
                type: Type.STRING,
                enum: ["chromium", "firefox"],
                description: "Browser engine to use. 'chromium' is recommended for best compatibility and performance. 'firefox' can be used for cross-browser testing."
              },
              headless: {
                type: Type.BOOLEAN,
                description: "Run browser in headless mode (no visible window). Set to true for automated testing, false for debugging."
              }
            }
          },
          authentication: {
            type: Type.OBJECT,
            description: "Optional: Pre-authenticate before running test cases. Useful for testing features behind login walls without adding login steps to every test.",
            properties: {
              enabled: {
                type: Type.BOOLEAN,
                description: "Enable automatic authentication before test execution"
              },
              loginUrl: {
                type: Type.STRING,
                description: "URL of the login page (e.g., https://app.example.com/login)"
              },
              username: {
                type: Type.STRING,
                description: "Username or email for authentication"
              },
              password: {
                type: Type.STRING,
                description: "Password for authentication"
              }
            }
          },
          evidence: {
            type: Type.OBJECT,
            description: "Control what evidence is captured during test execution",
            properties: {
              capture_screenshots: {
                type: Type.BOOLEAN,
                description: "Capture screenshots at key steps and on failures. Highly recommended for debugging."
              },
              capture_network: {
                type: Type.BOOLEAN,
                description: "Record network requests/responses. Useful for API integration testing."
              }
            }
          }
        }
      },
      testCases: {
        type: Type.ARRAY,
        description: "Array of test cases to execute. Each test case represents a complete user flow or feature validation.",
        items: {
          type: Type.OBJECT,
          required: ["id", "title", "steps"],
          properties: {
            id: {
              type: Type.STRING,
              description: "Unique identifier for the test case (e.g., 'TC-001', 'LOGIN-HAPPY-PATH'). Used for result tracking and reporting."
            },
            title: {
              type: Type.STRING,
              description: "Human-readable title describing what this test validates (e.g., 'User Login with Valid Credentials', 'Form Validation - Empty Email Field')"
            },
            steps: {
              type: Type.ARRAY,
              description: `Ordered list of test steps in natural language. Each step is an atomic action or verification.

Supported Step Patterns:

NAVIGATION:
- "Navigate to [url]" - Go to a specific URL
- "Click [selector|text]" - Click by text content or CSS (e.g., "Click 'text=Login'")
- "Hover over [selector]" - Mouse hover

INPUT:
- "Type '[text]' into [selector]" - Enter text into input field
- "Clear field [selector]" - Clear input field
- "Select '[option]' from [selector]" - Select dropdown option
- "Check [selector]" - Check a checkbox
- "Uncheck [selector]" - Uncheck a checkbox

VALIDATION:
- "Verify [selector|text] is visible" - Assert element visibility
- "Verify [selector] contains text '[text]'" - Assert element text content
- "Verify URL contains '[fragment]'" - Assert URL pattern
- "Verify page title is '[title]'" - Assert page title

WAITING:
- "Wait for [selector] to appear" - Explicit wait for element
- "Wait for network idle" - Wait for network requests to complete
- "Wait [ms] milliseconds" - Fixed delay (use sparingly)

ADVANCED:
- "Screenshot [name]" - Capture named screenshot
- "Store text from [selector] as [variable]" - Extract text for later use

Examples:
[
  "Navigate to /login",
  "Type 'user@example.com' into 'input[name=email]'",
  "Type 'password123' into 'input[type=password]'",
  "Click 'button:has-text(\"Login\")'",
  "Wait for network idle",
  "Verify 'Dashboard' is visible",
  "Verify URL contains '/dashboard'"
]`,
              items: {
                type: Type.STRING,
                description: "A single test step in natural language format"
              }
            }
          }
        }
      }
    },
    required: ["url", "testCases"]
  }
};

// ============================================================================
// AUTONOMOUS AGENT EXECUTION
// ============================================================================
export const runAutonomousAgent = async (
  prompt: string,
  onToolCall: (args: any) => Promise<any>
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Enhance the user prompt with execution guidelines
  const enhancedPrompt = `${prompt}

## Autonomous Execution Guidelines
You are executing in autonomous mode. Follow this workflow:

### Phase 1: Intent Analysis
Parse the user command and extract:
- Target URL (if not provided, ask or infer from context)
- Test objective (what should be validated?)
- Test scope (single feature vs end-to-end flow)
- Success criteria (what indicates a pass?)

### Phase 2: Test Design
Based on the command, design test cases that:
- Start from the specified URL or homepage
- Execute the requested actions in logical order
- Include intermediate verification points
- End with explicit success criteria validation

### Phase 3: Tool Call Construction
Build the execute_tests payload with:
- Explicit URL (no placeholders)
- Headless browser configuration
- Screenshot capture enabled
- Clear, actionable test steps using proper Playwright syntax

### Phase 4: Result Interpretation
After receiving tool results:
1. Analyze pass/fail status of each step
2. Review screenshots for visual confirmation
3. Check console logs for errors or warnings
4. Provide a verdict: PASS | FAIL | PARTIAL

### Phase 5: Actionable Report
Summarize findings in this format:

**🎯 Test Objective:** [What was tested]
**📊 Result:** [PASS/FAIL/PARTIAL]
**⏱️ Execution Time:** [Duration]

**Test Coverage:**
- ✅ [Step 1]: PASSED - [Brief explanation]
- ✅ [Step 2]: PASSED - [Brief explanation]
- ❌ [Step 3]: FAILED - [Root cause]

**Evidence:**
- Screenshots: [List key screenshots with context]
- Console Logs: [Highlight critical errors/warnings]

**Verdict:**
[Final assessment in 2-3 sentences]

**Recommendations:**
[If failed: suggestions for fixes]
[If passed: suggestions for additional coverage]

### Critical Rules for Autonomous Mode:
1. ALWAYS include explicit wait conditions ("Wait for network idle", "Wait for 'element' to appear")
2. NEVER assume page elements are immediately available - add waits
3. INCLUDE verification steps after every action
4. USE text-based selectors (text=Submit) for buttons if IDs are missing
5. CAPTURE screenshots at critical junctures
6. ANALYZE failure patterns - explain what earlier steps revealed`;

  // 1. Initial Call: Analyze prompt and decide to call tool
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: enhancedPrompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations: [executeTestsTool] }],
      thinkingConfig: { thinkingBudget: 16000 }
    },
  });

  const calls = response.functionCalls;
  if (calls && calls.length > 0) {
    const call = calls[0];
    if (call.name === 'execute_tests') {
      // 2. Execute the tool call (via the provided callback that hits the Playwright backend)
      const toolResult = await onToolCall(call.args);

      // 3. Send result back to model for summary
      const secondResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          { role: 'user', parts: [{ text: enhancedPrompt }] },
          { role: 'model', parts: [{ text: response.text || "" }, ...calls.map(c => ({ functionCall: c }))] },
          {
            role: 'user',
            parts: [{
              functionResponse: {
                name: call.name,
                id: call.id,
                response: { result: toolResult }
              }
            }]
          }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION
        }
      });

      return secondResponse.text || "Agent processed results but provided no text summary.";
    }
  }

  return response.text || "Agent did not initiate a test run. Please provide more clear instructions.";
};

// ============================================================================
// REQUIREMENT ANALYSIS
// ============================================================================
export const analyzeRequirements = async (text: string): Promise<Requirement[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `You are analyzing requirement documentation to extract structured, testable requirements for QA automation.

## Analysis Task
Extract and structure all testable requirements from the following documentation. Each requirement must be:
- **Atomic**: Tests a single, well-defined behavior
- **Measurable**: Has clear acceptance criteria that can be automated
- **Traceable**: Links back to original business need
- **Prioritizable**: Can be ranked by importance

## Extraction Rules

### Identify These Requirement Types:
1. **Functional**: User actions and system behaviors (e.g., "User can log in with email and password")
2. **UI/UX**: Visual and interaction requirements (e.g., "Error messages display in red above form fields")
3. **Performance**: Speed and responsiveness criteria (e.g., "Page loads within 2 seconds")
4. **Security**: Authentication, authorization, data protection (e.g., "Sessions expire after 30 minutes of inactivity")
5. **Validation**: Input constraints and error handling (e.g., "Email field rejects invalid formats")
6. **Integration**: External system interactions (e.g., "Payment processes via Stripe API")

### For Each Requirement, Extract:
- **Unique ID**: REQ-001, REQ-002, etc. (increment sequentially)
- **Title**: Concise, action-oriented summary (max 80 chars)
- **Description**: Detailed explanation of the requirement (2-3 sentences)
- **Acceptance Criteria**: Testable conditions that define "done" (minimum 2, maximum 5)

### Acceptance Criteria Guidelines:
Write in Given-When-Then format when applicable:
- ✅ "Given a valid email, When user clicks 'Login', Then dashboard page loads"
- ✅ "System displays error message when password is less than 8 characters"
- ❌ "Login works properly" (too vague)
- ❌ "User experience is good" (not measurable)

### Handle Ambiguity:
- If documentation is vague, create 2 interpretations as separate requirements
- If acceptance criteria are missing, infer them from description
- If scope is unclear, default to smallest testable unit

## Input Documentation:
${text}

## Quality Checks Before Returning:
- All requirement IDs are unique and sequential
- Every requirement has 2-5 testable acceptance criteria
- Descriptions are specific, not generic
- No duplicate requirements (check for semantic similarity)
- Each criterion uses measurable language (no "good", "fast", "user-friendly")

Extract all testable requirements now. Be thorough but avoid inventing requirements not present in the documentation.`,
    config: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            acceptanceCriteria: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["id", "title", "description", "acceptanceCriteria"]
        }
      }
    }
  });

  try {
    const outputText = response.text || "[]";
    return JSON.parse(outputText.trim());
  } catch (e) {
    console.error("Failed to parse requirements", e);
    return [];
  }
};

// ============================================================================
// TEST CASE GENERATION
// ============================================================================
export const generateTestCases = async (requirements: Requirement[]): Promise<TestGenerationResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: `You are a Principal QA Automation Architect with 15+ years of experience in test strategy, automation framework design, and quality engineering at scale.

## Mission
Generate a production-grade, deterministic test suite that provides comprehensive coverage of the provided requirements. Every test case must be executable via Playwright automation and traceable back to acceptance criteria.

## Test Suite Architecture

### Coverage Strategy
For each requirement, generate test cases across these dimensions:

1. **Happy Path** (1-2 tests per requirement)
   - Primary user flow with valid inputs
   - Expected behavior under normal conditions
   - Goal: Verify core functionality works as designed

2. **Edge Cases** (2-3 tests per requirement)
   - Boundary values (min/max inputs, empty states, full capacity)
   - Unusual but valid scenarios (special characters, different formats)
   - Goal: Ensure system handles valid extremes

3. **Negative Cases** (1-2 tests per requirement)
   - Invalid inputs (wrong format, out-of-range values)
   - Missing required fields
   - Unauthorized access attempts
   - Goal: Verify proper error handling and validation

4. **Boundary Cases** (0-1 tests per requirement if applicable)
   - Exactly at limits (e.g., 255-character field with 255 chars)
   - Transition points (logged in → logged out)
   - Goal: Catch off-by-one errors and state transition bugs

### Test Case Construction Rules

#### Structure Each Test Case With:
1. **Unique ID**: TC-XXX format, sequential numbering
2. **Requirement Mapping**: Link to parent requirement (REQ-XXX)
3. **Clear Title**: "Feature - Scenario Type" format
   - ✅ "User Login - Invalid Password Handling"
   - ✅ "Checkout Form - Boundary Test with 255-Char Address"
   - ❌ "Test Login" (too vague)

4. **Test Type Classification**: Happy Path | Edge Case | Negative Case | Boundary Case

5. **Priority Assignment**:
   - High: Critical business flows, security features, data integrity
   - Medium: Important features, secondary workflows
   - Low: Nice-to-have features, cosmetic issues

6. **Executable Steps**: Atomic actions that Playwright can interpret
   - Use format: "[Action] [Target/Value]"
   - Example: "Click 'button[data-testid=login]'" NOT "Login to system"
   - Be specific with selectors: 'input[name=email]' over "email field"
   - Include explicit wait conditions: "Wait for 'h1.dashboard-title' to appear"

7. **Test Data** (when needed):
   - Specify exact values: "Email: test@example.com, Password: Test123!"
   - For negative tests: "Email: invalid-format, Password: 123"

8. **Expected Result**: Single-sentence assertion of success state
   - ✅ "User is redirected to dashboard with username 'John Doe' visible in header"
   - ❌ "System works correctly" (not verifiable)

9. **Acceptance Criteria Mapping**: Array of criteria IDs this test validates

### Step Writing Best Practices

#### Navigation Steps:
- "Navigate to 'https://app.example.com/login'"
- "Click link 'Sign Up'"
- "Click button 'Next Step'"

#### Input Steps:
- "Type 'john@example.com' into 'input[name=email]'"
- "Type 'SecurePass123!' into 'input[type=password]'"
- "Select 'United States' from 'select[name=country]'"

#### Validation Steps (CRITICAL - Always include):
- "Verify 'Dashboard' is visible"
- "Verify 'div.error-message' contains text 'Invalid email format'"
- "Verify URL contains '/profile'"
- "Wait for 'Loading...' to disappear"

### Coverage Requirements

#### Traceability Matrix:
- Every acceptance criterion MUST be tested by at least 1 test case
- Every requirement MUST have at least 3 test cases (happy + edge + negative)
- High-priority requirements should have 5+ test cases

#### Test Type Balance:
Target distribution:
- 30-40% Happy Path
- 30-40% Edge Cases
- 20-30% Negative Cases
- 0-10% Boundary Cases

## Input Requirements:
${JSON.stringify(requirements, null, 2)}

## Generation Instructions

### Step 1: Analyze Requirements
- Parse each requirement and its acceptance criteria
- Identify testable behaviors vs non-testable statements

### Step 2: Design Test Scenarios
For each requirement:
1. Write 1 comprehensive happy path test covering primary flow
2. Identify 2-3 edge cases by asking "What could go wrong but still be valid?"
3. Design 1-2 negative tests for common user errors
4. Add boundary tests for numeric/text length constraints

### Step 3: Write Executable Steps
- Start with navigation to test context
- Add prerequisites (e.g., "Navigate to login", "Type credentials")
- Execute the action under test
- Add explicit wait conditions
- Verify the expected outcome (NEVER skip verification)

### Step 4: Validate Coverage
- Check that every acceptance criterion is mapped to at least one test
- Ensure all requirements have minimum 3 test cases
- Verify step sequences are logical and executable

### Step 5: Add Metadata
Set deterministic=true in metadata if:
- All test steps are explicit and unambiguous
- No random data or dynamic values used
- Steps produce consistent results on repeated execution

## Quality Checklist
Before returning the test suite, verify:
- Every test case has 4-10 executable steps
- All steps use valid Playwright actions
- Every test ends with at least one "Verify" step
- Acceptance criteria mapping is complete (no unmapped criteria)
- Test IDs are unique and sequential
- Test priorities reflect business criticality
- Test data is specified (not generic "enter valid data")
- Expected results are specific and measurable

Generate the complete test suite now with maximum determinism and traceability.`,
    config: {
      temperature: 0,
      thinkingConfig: { thinkingBudget: 32768 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          generation_metadata: {
            type: Type.OBJECT,
            properties: {
              generated_at: { type: Type.STRING },
              model: { type: Type.STRING },
              deterministic: { type: Type.BOOLEAN },
              total_requirements: { type: Type.NUMBER },
              total_test_cases: { type: Type.NUMBER }
            },
            required: ["generated_at", "model", "deterministic", "total_requirements", "total_test_cases"]
          },
          test_cases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                requirement_id: { type: Type.STRING },
                title: { type: Type.STRING },
                type: { type: Type.STRING },
                priority: { type: Type.STRING },
                steps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                test_data: { type: Type.STRING },
                expected_result: { type: Type.STRING },
                acceptance_criteria_mapping: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["id", "requirement_id", "title", "type", "priority", "steps", "expected_result", "acceptance_criteria_mapping"]
            }
          },
          coverage_summary: {
            type: Type.OBJECT,
            properties: {
              requirements_covered: { type: Type.NUMBER },
              acceptance_criteria_covered: { type: Type.NUMBER },
              test_types: {
                type: Type.OBJECT,
                properties: {
                  happy_path: { type: Type.NUMBER },
                  edge_case: { type: Type.NUMBER },
                  negative_case: { type: Type.NUMBER },
                  boundary_case: { type: Type.NUMBER }
                },
                required: ["happy_path", "edge_case", "negative_case", "boundary_case"]
              }
            },
            required: ["requirements_covered", "acceptance_criteria_covered", "test_types"]
          }
        },
        required: ["generation_metadata", "test_cases", "coverage_summary"]
      }
    }
  });

  try {
    const outputText = response.text || "{}";
    return JSON.parse(outputText.trim());
  } catch (e) {
    throw new Error("Failed to generate test suite.");
  }
};

// ============================================================================
// VISUAL REGRESSION ANALYSIS
// ============================================================================
export const performVisualRegression = async (baseline: string, actual: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: {
      parts: [
        {
          text: `You are a Visual QA Specialist performing pixel-perfect regression analysis.

## Analysis Task
Compare the Design Baseline (first image) against the Actual UI Implementation (second image). Your goal is to identify discrepancies that would constitute UI bugs or design inconsistencies.

## Visual Inspection Checklist

### 1. Layout & Structure (Critical)
- **Element Positioning**: Check if all elements are in the correct positions
- **Spacing Issues**: Compare padding and margins between elements
- **Alignment**: Verify vertical and horizontal alignment of text, buttons, images
- **Layout Shifts**: Identify any elements that have moved relative to their expected position

### 2. Typography (High Priority)
- **Font Family**: Confirm font faces match
- **Font Size**: Compare text sizes (headings, body text, captions)
- **Font Weight**: Check bold, regular, light variants
- **Line Height**: Look for text cramming or excessive line spacing
- **Text Color**: Compare text colors against baseline

### 3. Colors & Visual Style (High Priority)
- **Background Colors**: Compare page/component background colors
- **Border Colors**: Check borders around inputs, cards, buttons
- **Shadow Differences**: Compare box-shadows and drop-shadows
- **Color Accuracy**: Use approximate hex values

### 4. Components (Critical)
- **Buttons**: Check size, color, border-radius, text, icon placement
- **Forms**: Compare input fields, labels, error states, placeholders
- **Icons**: Verify icon presence, size, color, position
- **Images**: Check for missing/broken images, sizing, aspect ratio

### 5. Missing or Extra Elements
- **Missing Elements**: List any elements in baseline that are absent in actual
- **Extra Elements**: List any elements in actual that weren't in baseline
- **Content Differences**: Text changes, missing labels, extra buttons

## Severity Classification

**🔴 Critical**: Issues that break functionality or major visual regression
**🟠 High**: Noticeable issues that don't break functionality
**🟡 Medium**: Minor inconsistencies that may not be immediately noticeable
**🟢 Low**: Negligible differences that don't impact user experience

## Analysis Output Format

### Visual Regression Summary
**Overall Assessment**: [Pass / Minor Issues / Significant Issues / Failed]
**Match Percentage**: [Estimate 0-100%]
**Critical Issues Found**: [Count]

### Detailed Findings:

**🔴 Critical Issues (Priority 1):**
1. [Issue description] - Expected: [baseline], Actual: [implementation]
   Location: [Where on the page]
   Impact: [How this affects users]

**🟠 High Priority Issues:**
[Same format]

**🟡 Medium Priority Issues:**
[Same format]

### Recommendations:
1. [Action item to fix critical issue 1]
2. [Action item to fix critical issue 2]

## Notes:
- Image comparison performed via visual inspection (not pixel-perfect diff)
- Minor anti-aliasing differences are expected between design tools and browsers
- Focus on user-facing discrepancies, not sub-pixel variations

Now analyze these images:
- First Image: Design Baseline (expected)
- Second Image: Actual UI Implementation (to validate)` },
        { inlineData: { mimeType: 'image/png', data: baseline.split(',')[1] } },
        { inlineData: { mimeType: 'image/png', data: actual.split(',')[1] } }
      ]
    },
    config: {
      thinkingConfig: { thinkingBudget: 8000 }
    }
  });
  return response.text || "No discrepancies found or analysis could not be generated.";
};

// ============================================================================
// NEW: TEST FAILURE ANALYSIS
// ============================================================================
export const analyzeTestFailure = async (
  testCase: TestCase,
  failedStep: TestStep,
  screenshot?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const parts: any[] = [
    {
      text: `You are a QA Engineer debugging a test failure. Analyze the following failed test and provide actionable insights.

## Failed Test Context

**Test Case:** ${testCase.title}
**Test ID:** ${testCase.id}
**Failed Step:** ${failedStep.description}
**Step Index:** ${failedStep.index + 1} of ${testCase.steps.length}
**Error:** ${failedStep.error || 'No error message captured'}
**Console Log:** ${failedStep.log || 'No console logs captured'}

**Previous Steps (that passed):**
${testCase.executedSteps?.slice(0, failedStep.index).map((s, i) => `${i + 1}. ${s.description} - ${s.status}`).join('\n') || 'No previous steps'}

**Full Test Steps:**
${testCase.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## Debugging Task

### 1. Failure Classification
Identify the failure type:
- **Selector Issue**: Element not found or selector is incorrect
- **Timing Issue**: Element not ready (race condition, slow loading)
- **Validation Failure**: Expected result didn't match actual
- **Navigation Failure**: Page didn't load or redirected unexpectedly
- **Input Failure**: Unable to interact with element (disabled, hidden, overlapped)
- **Application Error**: JavaScript error, network error, or server issue

### 2. Root Cause Analysis
Based on the error, logs, and screenshot (if available), determine why the step failed.

### 3. Possible Causes (rank by likelihood)
List 3-5 potential root causes, ordered from most to least likely.

### 4. Recommended Fixes
Provide specific, actionable fixes:

**Immediate Fix (for this test run):**
[Show the corrected step(s)]

**Long-term Fix (for reliability):**
- Action items to prevent recurrence

## Output Format

**🔍 Failure Type:** [Classification]

**🎯 Root Cause:** [Primary cause in one sentence]

**📊 Evidence Analysis:**
${screenshot ? "- Screenshot reviewed: [Key observations]" : "- No screenshot available"}
- Error message: [Analysis]
- Console logs: [Relevant entries]

**💡 Likely Causes (ranked):**
1. [Most likely] - [Explanation]
2. [Second likely] - [Explanation]
3. [Third likely] - [Explanation]

**🔧 Recommended Fix:**
Replace step ${failedStep.index + 1}:
FROM: "${failedStep.description}"
TO: "[Corrected step with explanation]"

**🛡️ Prevention Strategy:**
- [How to make test more reliable]

**🐛 Application Bug?:** [Yes/No + explanation]

Now analyze this failure.` }
  ];

  if (screenshot) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: screenshot.split(',')[1]
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: { parts },
    config: {
      temperature: 0.3,
      thinkingConfig: { thinkingBudget: 8000 }
    }
  });

  return response.text || "Unable to analyze failure.";
};