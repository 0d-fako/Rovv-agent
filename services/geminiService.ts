
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Requirement, TestCase, TestGenerationResponse } from "../types.ts";

const SYSTEM_INSTRUCTION = `You are an expert QA Automation Engineer. Your goal is to test web applications using the "execute_tests" tool.
When a user provides a User Story or a specific testing scenario:
1. Analyze the requirements.
2. Formulate a list of precise, sequential test steps (e.g., "Click 'Login'", "Type 'user' into 'Username'").
3. Construct a valid JSON payload for the execute_tests tool.
4. Always include a verify step to assert success or failure (e.g., "Verify 'Dashboard' is visible").

Tool Configuration Guidelines:
- Browser: Chromium (headless) is preferred.
- Screenshots: Enable them for better debugging.

After receiving tool output:
- Analyze the results and summary.
- Report which steps passed and failed.
- If a test failed, explain why based on the logs or error messages.`;

const executeTestsTool: FunctionDeclaration = {
  name: 'execute_tests',
  description: 'Executes automated browser tests on a web application using Playwright.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: 'The full URL of the web application to test.',
      },
      config: {
        type: Type.OBJECT,
        properties: {
          browser: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["chromium", "firefox"], default: "chromium" },
              headless: { type: Type.BOOLEAN, default: true }
            }
          },
          evidence: {
            type: Type.OBJECT,
            properties: {
              capture_screenshots: { type: Type.BOOLEAN, default: true }
            }
          }
        }
      },
      testCases: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          required: ["id", "title", "steps"],
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of natural language steps (e.g. 'Click Login', 'Type text into Field')."
            }
          }
        }
      }
    },
    required: ["url", "testCases"]
  }
};

export const runAutonomousAgent = async (
  prompt: string, 
  onToolCall: (args: any) => Promise<any>
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 1. Initial Call: Analyze prompt and decide to call tool
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
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
        model: 'gemini-3-pro-preview',
        contents: [
          { role: 'user', parts: [{ text: prompt }] },
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

export const analyzeRequirements = async (text: string): Promise<Requirement[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following requirement documentation and extract a list of testable requirements in JSON format.
    Ensure each requirement has a unique ID (REQ-001, REQ-002, etc.).
    
    Documentation:
    ${text}
    `,
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

export const generateTestCases = async (requirements: Requirement[]): Promise<TestGenerationResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Act as a world-class Senior QA Automation Architect. 
    Generate a comprehensive, deterministic test suite based on these requirements. 
    Include Happy Path, Edge Cases, and Negative Scenarios. 
    Ensure acceptance criteria mapping is precise and every test case has logical steps.
    
    Requirements:
    ${JSON.stringify(requirements, null, 2)}
    `,
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

export const performVisualRegression = async (baseline: string, actual: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { text: "Perform a high-precision visual regression analysis between the 'Design Baseline' (first image) and 'Actual UI' (second image). Identify any layout shifts, spacing issues (padding/margin), font differences, color variances, or missing elements. Provide a bulleted technical summary." },
        { inlineData: { mimeType: 'image/png', data: baseline.split(',')[1] } },
        { inlineData: { mimeType: 'image/png', data: actual.split(',')[1] } }
      ]
    },
    config: {
      thinkingConfig: { thinkingBudget: 0 }
    }
  });
  return response.text || "No discrepancies found or analysis could not be generated.";
};
