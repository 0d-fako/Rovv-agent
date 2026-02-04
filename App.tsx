
import React, { useState, useCallback } from 'react';
import { AppStep, AppState, Requirement, TestCase, TestReport, AutomationConfig, TestStep } from './types.ts';
import * as gemini from './services/geminiService.ts';
import { RemotePlaywrightBridge } from './services/automationService.ts';
import HeaderComponent from './components/Header.tsx';
import RequirementAnalysis from './components/RequirementAnalysis.tsx';
import TestCaseGeneration from './components/TestCaseGeneration.tsx';
import TestCaseReview from './components/TestCaseReview.tsx';
import ConfigurationPanel from './components/ConfigurationPanel.tsx';
import TestExecution from './components/TestExecution.tsx';
import FinalReport from './components/FinalReport.tsx';

const DEFAULT_CONFIG: AutomationConfig = {
  executionMode: 'remote_bridge',
  remoteUrl: 'https://qa-gpt-backend.onrender.com/execute',
  browser: {
    type: 'chromium',
    headless: true,
    window_size: [1920, 1080]
  },
  timeouts: {
    page_load: 30,
    element_wait: 10
  },
  authentication: {
    enabled: false,
    loginUrl: '',
    username: '',
    password: ''
  },
  evidence: {
    capture_screenshots: true,
    capture_logs: true,
    capture_network: true
  },
  visual: {
    enabled: false,
    threshold: 5
  }
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentStep: AppStep.ANALYSIS,
    requirements: [],
    testCases: [],
    config: DEFAULT_CONFIG,
    appUrl: '',
    isExecuting: false,
  });

  const [loading, setLoading] = useState(false);

  const handleRequirementAnalysis = useCallback(async (text: string, screenshot?: string) => {
    setLoading(true);
    const reqs = await gemini.analyzeRequirements(text);
    setState(prev => ({ ...prev, requirements: reqs, appScreenshot: screenshot, currentStep: AppStep.GENERATION }));
    setLoading(false);
  }, []);

  const handleRunAutonomous = useCallback(async (prompt: string) => {
    setLoading(true);
    setState(prev => ({ ...prev, currentStep: AppStep.AUTONOMOUS }));
    
    try {
      const bridge = new RemotePlaywrightBridge(state.config, '', (tcId, step) => {
        console.debug(`[AGENT] Executed Step for ${tcId}:`, step);
      });

      const summary = await gemini.runAutonomousAgent(prompt, async (args) => {
        setState(prev => ({ 
          ...prev, 
          appUrl: args.url, 
          testCases: args.testCases.map((tc: any) => ({ ...tc, status: 'PENDING' })),
          isExecuting: true 
        }));
        
        const results = await bridge.runSuite(args.testCases, args.url, args.config);
        setState(prev => ({ ...prev, testCases: results, isExecuting: false }));
        return results;
      });

      setState(prev => ({ ...prev, agentResponse: summary, currentStep: AppStep.REPORT }));
    } catch (err: any) {
      alert("Autonomous Execution failed: " + err.message);
      setState(prev => ({ ...prev, currentStep: AppStep.ANALYSIS }));
    } finally {
      setLoading(false);
    }
  }, [state.config]);

  const handleGenerateTestCases = useCallback(async (updatedRequirements: Requirement[]) => {
    setLoading(true);
    try {
      const result = await gemini.generateTestCases(updatedRequirements);
      setState(prev => ({ 
        ...prev, 
        requirements: updatedRequirements,
        testCases: result.test_cases, 
        coverageSummary: result.coverage_summary,
        metadata: result.generation_metadata,
        currentStep: AppStep.REVIEW 
      }));
    } catch (err) {
      alert("Failed to generate test cases.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateTestCases = useCallback((updatedCases: TestCase[]) => {
    setState(prev => ({ ...prev, testCases: updatedCases }));
  }, []);

  const handleProceedToConfig = useCallback((url: string) => {
    setState(prev => ({ ...prev, appUrl: url, currentStep: AppStep.CONFIGURATION }));
  }, []);

  const handleStartExecution = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: AppStep.EXECUTION }));
  }, []);

  const handleFinishExecution = useCallback((results: TestCase[]) => {
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    
    const report: TestReport = {
      timestamp: new Date().toISOString(),
      totalTests: results.length,
      passed,
      failed,
      testCases: results,
      summary: `QA-GPT Automation Run: ${passed} Passed, ${failed} Failed.`,
      config: state.config,
      executionTimeMs: results.reduce((acc, tc) => acc + (tc.executedSteps?.reduce((t, s) => t + s.durationMs, 0) || 0), 0)
    };

    setState(prev => ({ ...prev, testCases: results, report, currentStep: AppStep.REPORT }));
  }, [state.config]);

  const restart = () => {
    setState({
      currentStep: AppStep.ANALYSIS,
      requirements: [],
      testCases: [],
      config: DEFAULT_CONFIG,
      appUrl: '',
      isExecuting: false,
    });
  };

  const renderStep = () => {
    if (loading && state.currentStep !== AppStep.AUTONOMOUS) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[500px] animate-in">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-200 blur-3xl opacity-30 animate-pulse"></div>
            <div className="relative w-24 h-24 border-[4px] border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
          <p className="mt-8 text-slate-900 font-black text-xl tracking-tight">Synthesizing Architecture</p>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Gemini 3 Pro • Optimized for Traceability</p>
        </div>
      );
    }

    switch (state.currentStep) {
      case AppStep.ANALYSIS:
        return <RequirementAnalysis onAnalyze={handleRequirementAnalysis} onRunAutonomous={handleRunAutonomous} />;
      case AppStep.GENERATION:
        return <TestCaseGeneration requirements={state.requirements} onGenerate={handleGenerateTestCases} />;
      case AppStep.REVIEW:
        return <TestCaseReview testCases={state.testCases} coverageSummary={state.coverageSummary} metadata={state.metadata} onUpdate={handleUpdateTestCases} onProceed={handleProceedToConfig} />;
      case AppStep.CONFIGURATION:
        return <ConfigurationPanel config={state.config} onChange={c => setState(s => ({...s, config: c}))} onProceed={handleStartExecution} />;
      case AppStep.AUTONOMOUS:
      case AppStep.EXECUTION:
        return <TestExecution testCases={state.testCases} appUrl={state.appUrl} config={state.config} onComplete={handleFinishExecution} />;
      case AppStep.REPORT:
        return <FinalReport report={state.report} onRestart={restart} agentResponse={state.agentResponse} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pb-20 antialiased">
      <HeaderComponent currentStep={state.currentStep} />
      <main className="max-w-7xl mx-auto px-6 mt-12">
        {renderStep()}
      </main>
    </div>
  );
};

export default App;
