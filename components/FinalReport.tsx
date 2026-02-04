
import React, { useState, useEffect } from 'react';
import { TestReport, TestCase } from '../types.ts';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import * as gemini from '../services/geminiService.ts';

interface FinalReportProps {
  report?: TestReport;
  agentResponse?: string;
  onRestart: () => void;
}

const FinalReport: React.FC<FinalReportProps> = ({ report, agentResponse, onRestart }) => {
  const [view, setView] = useState<'summary' | 'traceability' | 'evidence' | 'visual' | 'technical'>('summary');
  const [visualAnalysis, setVisualAnalysis] = useState<string | null>(null);
  const [analyzingVisual, setAnalyzingVisual] = useState(false);

  const chartData = report ? [
    { name: 'Passed', value: report.passed, color: '#10b981' },
    { name: 'Failed', value: report.failed, color: '#ef4444' }
  ] : [];

  useEffect(() => {
    if (view === 'visual' && !visualAnalysis && report?.config?.visual?.enabled && report?.config?.visual?.baselineImage) {
      const firstScreenshot = report.testCases[0]?.executedSteps?.[0]?.screenshot;
      if (firstScreenshot) {
        setAnalyzingVisual(true);
        gemini.performVisualRegression(report.config.visual.baselineImage, firstScreenshot)
          .then(setVisualAnalysis)
          .catch(err => {
            console.error("Visual regression failed", err);
            setVisualAnalysis("Visual analysis failed. Verify image formats.");
          })
          .finally(() => setAnalyzingVisual(false));
      }
    }
  }, [view, report, visualAnalysis]);

  if (!report && !agentResponse) return null;

  return (
    <div className="space-y-12 animate-in max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-slate-100 pb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">Operation <span className="text-indigo-600">Debrief</span></h2>
          <p className="text-slate-500 font-medium italic">Verification Intelligence Artifacts & Analytics</p>
        </div>
        <button onClick={onRestart} className="px-10 py-4 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all active:scale-95">
          Reset Matrix
        </button>
      </div>

      {agentResponse && (
        <div className="glass p-12 rounded-[3rem] border border-indigo-100 shadow-2xl shadow-indigo-100/50 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-rose-400"></div>
          <h4 className="text-[10px] font-black text-indigo-600 mb-8 tracking-[0.3em] uppercase flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Agent Intelligence Summary
          </h4>
          <div className="prose prose-indigo max-w-none text-slate-700 leading-relaxed font-bold text-lg whitespace-pre-wrap">
            {agentResponse}
          </div>
        </div>
      )}

      {report && (
        <>
          <div className="flex flex-wrap justify-center gap-2 p-2 bg-slate-100 rounded-[2rem] w-fit mx-auto border border-slate-200">
            {(['summary', 'traceability', 'evidence', 'visual', 'technical'] as const).map(tab => (
              <button 
                key={tab} 
                onClick={() => setView(tab)}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === tab ? 'bg-white text-indigo-600 shadow-lg border border-slate-100 scale-105' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {view === 'summary' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-5 glass p-10 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col items-center">
                <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-10 w-full text-center">Outcome Distribution</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={10} dataKey="value" stroke="none">
                        {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '16px' }} />
                      <Legend verticalAlign="bottom" height={40} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="glass p-10 rounded-[2.5rem] border border-slate-100 shadow-xl text-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Integrity Index</p>
                  <p className="text-7xl font-black text-slate-900 tracking-tighter">{Math.round((report.passed / report.totalTests) * 100)}<span className="text-3xl text-indigo-600">%</span></p>
                </div>
                <div className="glass p-10 rounded-[2.5rem] border border-slate-100 shadow-xl text-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Driver Latency</p>
                  <p className="text-7xl font-black text-indigo-600 tracking-tighter">{(report.executionTimeMs / 1000).toFixed(1)}<span className="text-3xl text-slate-300">s</span></p>
                </div>
                <div className="col-span-full bg-slate-50 p-10 rounded-[3rem] border border-slate-100 text-slate-900">
                  <h4 className="text-[10px] font-black text-slate-300 mb-10 tracking-[0.3em] uppercase flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    Orchestration Specs
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                     <div><p className="text-[10px] font-black text-slate-400 uppercase mb-2">Core Version</p><p className="font-mono text-indigo-600 font-black text-xs tracking-widest">2.5.0-STABLE</p></div>
                     <div><p className="text-[10px] font-black text-slate-400 uppercase mb-2">Engine Mode</p><p className="font-mono text-slate-900 font-black text-xs uppercase">{report.config.executionMode}</p></div>
                     <div><p className="text-[10px] font-black text-slate-400 uppercase mb-2">Visual Core</p><p className={`font-mono font-black text-xs uppercase ${report.config.visual.enabled ? 'text-emerald-500' : 'text-slate-300'}`}>{report.config.visual.enabled ? 'ACTIVE' : 'OFF'}</p></div>
                     <div><p className="text-[10px] font-black text-slate-400 uppercase mb-2">Browser</p><p className="font-mono text-slate-900 font-black text-xs uppercase">{report.config.browser.type}</p></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'traceability' && (
            <div className="space-y-6">
              {report.testCases.map(tc => (
                <div key={tc.id} className="glass p-8 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-colors">
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${tc.status === 'PASS' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {tc.status === 'PASS' ? '✓' : '✗'}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900">{tc.title}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Mapped to: {tc.acceptance_criteria_mapping?.join(', ') || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-tighter">{tc.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === 'evidence' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {report.testCases.flatMap(tc => (tc.executedSteps || []).filter(s => s.screenshot)).map((step, idx) => (
                <div key={idx} className="glass rounded-[2rem] overflow-hidden border border-slate-100 group shadow-lg">
                  <div className="aspect-video relative overflow-hidden">
                    <img src={step.screenshot} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={`Evidence ${idx}`} />
                  </div>
                  <div className="p-6">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Step Reference</p>
                    <p className="text-xs font-bold text-slate-700 line-clamp-2">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === 'technical' && (
            <div className="glass p-12 rounded-[3rem] border border-slate-100">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="space-y-8">
                   <h4 className="text-xl font-black text-slate-900">Automation Parameters</h4>
                   <div className="space-y-4">
                     {Object.entries(report.config).map(([key, val]) => (
                       typeof val !== 'object' && (
                         <div key={key} className="flex justify-between items-center py-3 border-b border-slate-50">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{key}</span>
                           <span className="text-sm font-mono font-bold text-indigo-600">{String(val)}</span>
                         </div>
                       )
                     ))}
                   </div>
                 </div>
                 <div className="space-y-8">
                   <h4 className="text-xl font-black text-slate-900">Timing Artifacts</h4>
                   <div className="grid grid-cols-2 gap-6">
                     <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Total Clock</p>
                       <p className="text-2xl font-black text-slate-900">{(report.executionTimeMs / 1000).toFixed(2)}s</p>
                     </div>
                     <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Avg / Case</p>
                       <p className="text-2xl font-black text-indigo-600">{(report.executionTimeMs / report.totalTests / 1000).toFixed(2)}s</p>
                     </div>
                   </div>
                 </div>
               </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FinalReport;
