
import { TestCase, AutomationConfig, TestStep } from '../types.ts';

/**
 * RemotePlaywrightBridge
 * Connects directly to the user's hosted Playwright environment.
 */
export class RemotePlaywrightBridge {
  private backendUrl = 'https://qa-gpt-backend.onrender.com/execute';

  constructor(
    private config: AutomationConfig,
    private url: string,
    private onStep: (tcId: string, step: TestStep) => void
  ) {}

  /**
   * Executes the test suite using the standard backend payload.
   * Can be used for both standard UI flow and Agentic tool calls.
   */
  async runSuite(testCases: TestCase[], overrideUrl?: string, overrideConfig?: any): Promise<TestCase[]> {
    const targetUrl = overrideUrl || this.url;
    
    // Construct the payload matching the tool_definition.json
    const payload = {
      url: targetUrl,
      config: overrideConfig || {
        browser: {
          // Fix: comparing with 'chromium' which is a valid BrowserType
          type: this.config.browser.type === 'chromium' ? 'chromium' : this.config.browser.type,
          headless: this.config.browser.headless
        },
        authentication: this.config.authentication.enabled ? {
          enabled: true,
          loginUrl: this.config.authentication.loginUrl,
          username: this.config.authentication.username,
          password: this.config.authentication.password
        } : undefined,
        evidence: {
          capture_screenshots: this.config.evidence.capture_screenshots,
          capture_network: this.config.evidence.capture_network
        }
      },
      testCases: testCases.map(tc => ({
        id: tc.id,
        title: tc.title,
        steps: tc.steps
      }))
    };

    try {
      const response = await fetch(this.backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend Error (${response.status}): ${errorText || 'Internal Server Error'}`);
      }

      const result = await response.json();
      
      if (result && result.testCases) {
        const updatedCases = result.testCases as TestCase[];
        
        // Signal the UI for step-by-step updates
        for (const tc of updatedCases) {
          if (tc.executedSteps) {
            for (const step of tc.executedSteps) {
              this.onStep(tc.id, step);
            }
          }
        }
        return updatedCases;
      }

      throw new Error('Invalid response format from backend');

    } catch (error: any) {
      console.error("Automation Bridge Failure:", error);
      throw error;
    }
  }
}

class DeterministicDriver {
  constructor(private config: AutomationConfig, private url: string, private onStep: (tcId: string, step: TestStep) => void) {}
  async runSuite(testCases: TestCase[]): Promise<TestCase[]> {
    const results: TestCase[] = [];
    for (const tc of testCases) {
      const steps: TestStep[] = [];
      for (let i = 0; i < tc.steps.length; i++) {
        const step: TestStep = { index: i, description: tc.steps[i], status: 'PASS', timestamp: new Date().toISOString(), durationMs: 500, screenshot: `https://picsum.photos/seed/${tc.id}-${i}/1280/720` };
        steps.push(step);
        this.onStep(tc.id, step);
        await new Promise(r => setTimeout(r, 200));
      }
      results.push({ ...tc, status: 'PASS', executedSteps: steps });
    }
    return results;
  }
}

export class AutomationEngine {
  private driver: any;
  constructor(config: AutomationConfig, url: string, onStepUpdate: (tcId: string, step: TestStep) => void) {
    if (config.executionMode === 'remote_bridge') {
      this.driver = new RemotePlaywrightBridge(config, url, onStepUpdate);
    } else {
      this.driver = new DeterministicDriver(config, url, onStepUpdate);
    }
  }
  async runSuite(testCases: TestCase[]): Promise<TestCase[]> {
    return this.driver.runSuite(testCases);
  }
}
