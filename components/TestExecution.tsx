import React, { useEffect, useState, useRef } from 'react';
import { TestCase, TestStep, AutomationConfig } from '../types.ts';
import { AutomationEngine } from '../services/automationService.ts';

interface TestExecutionProps {
  testCases: TestCase[];
  appUrl: string;
  config: AutomationConfig;
  onComplete: (results: TestCase[]) => void;
}

const TestExecution: React.FC<TestExecutionProps> = ({ testCases, appUrl, config, onComplete }) => {
  const [executingTcId, setExecutingTcId] = useState<string | null>(null);
  const [results, setResults] = useState<TestCase[]>(testCases.map(tc => ({ ...tc, status: 'PENDING', executedSteps: [] })));
  const [currentStep, setCurrentStep] = useState<TestStep | null>(null);
  const [isRemoteLoading, setIsRemoteLoading] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const isStarted = useRef(false);

  useEffect(() => {
    if (isStarted.current) return;
    isStarted.current = true;

    if (config.executionMode === 'remote_bridge') setIsRemoteLoading(true);

    const engine = new AutomationEngine(config, appUrl, (tcId, step) => {
      setExecutingTcId(tcId);
      setCurrentStep(step);
      setResults(prev => prev.map(tc => {
        if (tc.id === tcId) {
          const existing = tc.executedSteps || [];
          const newSteps = [...existing.filter(s => s.index !== step.index), step].sort((a, b) => a.index - b.index);
          return { ...tc, executedSteps: newSteps };
        }
        return tc;
      }));
    });

    const run = async () => {
      try {
        const suiteResults = await engine.runSuite(results);
        setResults(suiteResults);
        setIsRemoteLoading(false);
        await new Promise(r => setTimeout(r, 1000));
        onComplete(suiteResults);
      } catch (err) {
        setIsRemoteLoading(false);
        alert("Execution encountered a critical error.");
      }
    };
    run();
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [results, executingTcId]);

  const passedCount = results.filter(r => r.status === 'PASS').length;
  const failedCount = results.filter(r => r.status === 'FAIL').length;

  return (
    <div className="space-y-10 animate-in">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-200 blur-xl opacity-40 animate-pulse"></div>
            <div className="relative w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm">
               <svg className="w-8 h-8 animate-spin" style={{ animationDuration: '4s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">Live Orchestration</h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-indigo-600 font-bold text-[10px] tracking-widest uppercase bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">{appUrl}</span>
              <span className="text-slate-200">|</span>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Driver: {config.browser.type}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-10">
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-300 uppercase mb-1 tracking-widest">Stable</p>
                <p className="text-xl font-black text-emerald-500">{passedCount}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-300 uppercase mb-1 tracking-widest">Broken</p>
                <p className="text-xl font-black text-rose-500">{failedCount}</p>
              </div>
           </div>
           <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-100 flex items-center gap-3 ml-2">
              <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping opacity-75"></div>
              <span className="text-[10px] font-black text-white uppercase tracking-widest">{isRemoteLoading ? 'Booting' : 'Syncing'}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 min-h-[750px]">
        {/* Queue - Light & Airy */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Test Pipeline</h3>
            <span className="text-[10px] font-bold text-slate-300 uppercase">{results.length} total</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide pr-2">
            {results.map((tc) => (
              <div 
                key={tc.id} 
                className={`p-6 rounded-3xl border transition-all duration-700 relative overflow-hidden group ${
                  executingTcId === tc.id ? 'border-indigo-400 bg-white shadow-xl scale-[1.03] z-10' : 'border-slate-100 bg-white/50 hover:bg-white'
                }`}
              >
                {executingTcId === tc.id && <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black text-slate-400 group-hover:text-indigo-500 transition-colors tracking-widest">{tc.id}</span>
                  {tc.status === 'PASS' ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>
                  ) : tc.status === 'FAIL' ? (
                    <div className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></div>
                  ) : executingTcId === tc.id ? (
                    <div className="flex gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></div><div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{animationDelay: '0.2s'}}></div></div>
                  ) : null}
                </div>
                <p className="text-xs font-black text-slate-800 leading-tight uppercase tracking-tight">{tc.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Browser Feedback - "Apple Style" Frame */}
        <div className="lg:col-span-6 flex flex-col bg-slate-50 border-8 border-slate-100 rounded-[3rem] shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-full h-12 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-20">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-200"></div>
              <div className="w-3 h-3 rounded-full bg-slate-200"></div>
              <div className="w-3 h-3 rounded-full bg-slate-200"></div>
            </div>
            <div className="bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 flex items-center gap-3 w-72">
               <svg className="w-2.5 h-2.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
               <span className="text-[9px] font-mono text-slate-400 truncate">{appUrl}</span>
            </div>
            <div className="w-10"></div>
          </div>
          
          <div className="flex-1 pt-12 relative flex items-center justify-center overflow-hidden">
            {isRemoteLoading ? (
               <div className="flex flex-col items-center gap-8 text-center px-12 animate-in">
                 <div className="w-24 h-24 border-[4px] border-slate-100 border-t-indigo-500 rounded-full animate-spin"></div>
                 <div className="space-y-2">
                   <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Spinning up Worker</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Initializing high-throughput browser instance</p>
                 </div>
               </div>
            ) : currentStep?.screenshot ? (
              <div className="w-full h-full p-4 group">
                <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl relative border border-slate-100">
                  <img src={currentStep.screenshot} className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105" alt="Execution Frame" />
                  <div className="absolute bottom-6 left-6 right-6 p-6 glass rounded-2xl animate-in shadow-xl shadow-indigo-200/20">
                     <div className="flex items-center gap-4">
                        <div className="w-1.5 h-12 bg-indigo-600 rounded-full"></div>
                        <div>
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">Current Command</p>
                          <p className="text-slate-900 font-black text-lg tracking-tight leading-tight">{currentStep.description}</p>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 opacity-20">
                <svg className="w-20 h-20 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                <p className="font-black text-[10px] tracking-[0.4em] uppercase text-slate-400">Stream Pending</p>
              </div>
            )}
          </div>
        </div>

        {/* Telemetry - "Syntax Light" */}
        <div className="lg:col-span-3 flex flex-col bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-lg">
          <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logs</h3>
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 font-mono text-[10px] space-y-4 scrollbar-hide text-slate-600">
            {results.flatMap(tc => (tc.logs || [])).map((log, i) => (
              <div key={i} className="flex gap-4 group hover:bg-slate-50 p-1 rounded transition-colors animate-in">
                <span className="text-slate-300 select-none w-8">{String(i + 1).padStart(3, '0')}</span>
                <span className="flex-1 leading-relaxed break-words font-medium">
                  {log.includes('PASSED') ? <span className="text-emerald-500 font-bold uppercase">✓</span> : log.includes('FAILED') ? <span className="text-rose-500 font-bold uppercase">✗</span> : <span className="text-indigo-400">›</span>} {log}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
             <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Core v2.5.0-Release</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestExecution;