
export enum AppStep {
  ANALYSIS = 'ANALYSIS',
  GENERATION = 'GENERATION',
  REVIEW = 'REVIEW',
  CONFIGURATION = 'CONFIGURATION',
  EXECUTION = 'EXECUTION',
  REPORT = 'REPORT',
  AUTONOMOUS = 'AUTONOMOUS'
}

export type BrowserType = 'chromium' | 'firefox';
export type ExecutionMode = 'local_sim' | 'remote_bridge';

export interface VisualValidationConfig {
  enabled: boolean;
  baselineImage?: string;
  figmaUrl?: string;
  threshold: number; // 0-100 percentage
}

export interface AutomationConfig {
  executionMode: ExecutionMode;
  remoteUrl: string;
  browser: {
    type: BrowserType;
    headless: boolean;
    window_size: [number, number];
  };
  timeouts: {
    page_load: number;
    element_wait: number;
  };
  authentication: {
    enabled: boolean;
    loginUrl: string;
    username: string;
    password: string;
  };
  evidence: {
    capture_screenshots: boolean;
    capture_logs: boolean;
    capture_network: boolean;
  };
  visual: VisualValidationConfig;
}

export interface Requirement {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
}

export interface TestStep {
  index: number;
  description: string;
  screenshot?: string;
  log?: string;
  error?: string;
  status: 'PENDING' | 'PASS' | 'FAIL';
  timestamp: string;
  durationMs: number;
  locator?: string;
  networkLogs?: any[];
}

export interface TestCase {
  id: string;
  requirement_id?: string;
  title: string;
  type?: 'Happy Path' | 'Edge Case' | 'Negative Case' | 'Boundary Case' | 'Integration';
  priority?: 'High' | 'Medium' | 'Low';
  steps: string[];
  executedSteps?: TestStep[];
  test_data?: any;
  expected_result?: string;
  acceptance_criteria_mapping?: string[];
  status?: 'PASS' | 'FAIL' | 'PENDING';
  logs?: string[];
}

export interface TestGenerationResponse {
  generation_metadata: {
    generated_at: string;
    model: string;
    deterministic: boolean;
    total_requirements: number;
    total_test_cases: number;
  };
  test_cases: TestCase[];
  coverage_summary: {
    requirements_covered: number;
    acceptance_criteria_covered: number;
    test_types: {
      happy_path: number;
      edge_case: number;
      negative_case: number;
      boundary_case: number;
    };
  };
}

export interface TestReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  testCases: TestCase[];
  summary: string;
  config: AutomationConfig;
  executionTimeMs: number;
}

export interface AppState {
  currentStep: AppStep;
  requirements: Requirement[];
  testCases: TestCase[];
  config: AutomationConfig;
  coverageSummary?: TestGenerationResponse['coverage_summary'];
  metadata?: TestGenerationResponse['generation_metadata'];
  appUrl: string;
  appScreenshot?: string;
  isExecuting: boolean;
  report?: TestReport;
  agentResponse?: string;
}
