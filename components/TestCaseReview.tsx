
import React, { useState } from 'react';
import { TestCase, TestGenerationResponse } from '../types.ts';

interface TestCaseReviewProps {
  testCases: TestCase[];
  coverageSummary?: TestGenerationResponse['coverage_summary'];
  metadata?: TestGenerationResponse['generation_metadata'];
  onUpdate: (cases: TestCase[]) => void;
  onProceed: (url: string) => void;
}

const TestCaseReview: React.FC<TestCaseReviewProps> = ({ testCases, coverageSummary, metadata, onUpdate, onProceed }) => {
  const [url, setUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const removeTestCase = (id: string) => {
    onUpdate(testCases.filter(tc => tc.id !== id));
  };

  const updateTestCaseField = (id: string, field: keyof TestCase, value: any) => {
    const updated = testCases.map(tc => tc.id === id ? { ...tc, [field]: value } : tc);
    onUpdate(updated);
  };

  const updateStep = (id: string, index: number, value: string) => {
    const tc = testCases.find(t => t.id === id);
    if (!tc) return;
    const newSteps = [...tc.steps];
    newSteps[index] = value;
    updateTestCaseField(id, 'steps', newSteps);
  };

  const addStep = (id: string) => {
    const tc = testCases.find(t => t.id === id);
    if (!tc) return;
    updateTestCaseField(id, 'steps', [...tc.steps, 'New step...']);
  };

  const removeStep = (id: string, index: number) => {
    const tc = testCases.find(t => t.id === id);
    if (!tc) return;
    const newSteps = tc.steps.filter((_, i) => i !== index);
    updateTestCaseField(id, 'steps', newSteps);
  };

  return (
    <div className="space-y-12 animate-in max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Test <span className="text-indigo-600">Architecture</span></h2>
          <p className="text-slate-500 font-medium">Review the generated suite. Everything is modular and deterministic.</p>
        </div>
        <div className="flex gap-2 p-1.5 bg-emerald-50 rounded-2xl border border-emerald-100">
           <span className="px-4 py-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
             Deterministic Output Enabled
           </span>
        </div>
      </div>

      {coverageSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'AC Covered', value: coverageSummary.acceptance_criteria_covered, color: 'indigo' },
            { label: 'Happy Path', value: coverageSummary.test_types.happy_path, color: 'emerald' },
            { label: 'Edge Cases', value: coverageSummary.test_types.edge_case || 0, color: 'orange' },
            { label: 'Negative', value: coverageSummary.test_types.negative_case, color: 'rose' }
          ].map((stat, i) => (
            <div key={i} className="glass p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className={`text-3xl font-black text-${stat.color || 'orange'}-600 tracking-tight`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-8">
        {testCases.map((tc) => (
          <div key={tc.id} className="glass rounded-[2.5rem] border border-slate-100 p-10 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-700 relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-rose-400 opacity-20"></div>
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-slate-100">{tc.id}</span>
                
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${tc.priority === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                  {tc.priority} Priority
                </span>

                {editingId === tc.id ? (
                  <input 
                    type="text"
                    value={tc.title}
                    onChange={(e) => updateTestCaseField(tc.id, 'title', e.target.value)}
                    className="flex-1 text-xl font-black text-slate-900 border-b-2 border-indigo-100 outline-none focus:border-indigo-600 transition-colors"
                  />
                ) : (
                  <h3 className="text-xl font-black text-slate-900 leading-tight">{tc.title}</h3>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setEditingId(editingId === tc.id ? null : tc.id)}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editingId === tc.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
                >
                  {editingId === tc.id ? 'Save Changes' : 'Edit Matrix'}
                </button>
                <button onClick={() => removeTestCase(tc.id)} className="p-2 text-slate-200 hover:text-rose-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 space-y-8">
                <div>
                  <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    Execution Steps
                  </h4>
                  <div className="space-y-4">
                    {tc.steps.map((step, i) => (
                      <div key={i} className="flex gap-6 group/step">
                        <span className="text-xs font-black text-slate-200 group-hover/step:text-indigo-300 transition-colors w-4">{String(i + 1).padStart(2, '0')}</span>
                        {editingId === tc.id ? (
                          <div className="flex-1 flex gap-3">
                            <textarea 
                              value={step}
                              onChange={(e) => updateStep(tc.id, i, e.target.value)}
                              className="w-full text-sm font-bold text-slate-700 p-3 bg-slate-50 rounded-2xl border-none outline-none resize-none focus:ring-2 focus:ring-indigo-100 transition-all"
                              rows={1}
                            />
                            <button onClick={() => removeStep(tc.id, i)} className="text-rose-300 hover:text-rose-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm font-bold text-slate-700 leading-relaxed flex-1">{step}</p>
                        )}
                      </div>
                    ))}
                    {editingId === tc.id && (
                      <button onClick={() => addStep(tc.id)} className="ml-10 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline pt-2">+ Add Logic Step</button>
                    )}
                  </div>
                </div>
                
                <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Expected Outcome</h4>
                  {editingId === tc.id ? (
                    <textarea 
                      value={tc.expected_result}
                      onChange={(e) => updateTestCaseField(tc.id, 'expected_result', e.target.value)}
                      className="w-full text-sm font-bold text-slate-700 bg-transparent border-none outline-none resize-none p-0 focus:ring-0"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{tc.expected_result}"</p>
                  )}
                </div>
              </div>

              <div className="lg:col-span-4 space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Mock Data Payload</h4>
                    {editingId === tc.id && <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">Live Editor</span>}
                  </div>
                  <div className="relative group/editor">
                    {editingId === tc.id ? (
                      <textarea
                        value={typeof tc.test_data === 'string' ? tc.test_data : JSON.stringify(tc.test_data, null, 2)}
                        onChange={(e) => updateTestCaseField(tc.id, 'test_data', e.target.value)}
                        className="w-full bg-slate-950 p-6 rounded-3xl text-[11px] font-mono text-emerald-400 shadow-2xl min-h-[160px] max-h-[300px] outline-none border border-emerald-500/20 focus:border-emerald-500/50 transition-all leading-relaxed"
                        placeholder='{ "key": "value" }'
                      />
                    ) : (
                      <div className="bg-slate-900 p-6 rounded-3xl text-[11px] font-mono text-indigo-300 shadow-inner overflow-auto max-h-48 leading-relaxed border border-slate-800">
                        {typeof tc.test_data === 'string' ? tc.test_data : JSON.stringify(tc.test_data, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Traceability Matrix</h4>
                  <div className="flex flex-wrap gap-2">
                    {tc.acceptance_criteria_mapping.map((ac, i) => (
                      <span key={i} className="bg-white border border-slate-200 text-slate-500 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-sm">
                        {ac}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-600 rounded-[3rem] p-12 text-white shadow-[0_40px_100px_rgba(79,70,229,0.3)] animate-in">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
            </div>
            <div>
              <h3 className="text-3xl font-black tracking-tight leading-none mb-2">Target Deployment</h3>
              <p className="text-indigo-100 font-medium">Verify the environment before launching the agents.</p>
            </div>
          </div>
          
          <div className="relative">
            <input 
              type="url" 
              placeholder="https://staging-env-v2.company.com"
              className="w-full p-6 bg-white/10 border border-white/20 rounded-3xl placeholder-white/40 focus:ring-4 focus:ring-white/10 outline-none text-xl font-black tracking-tight transition-all text-white"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest">TLS Active</div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pb-20">
        <button
          onClick={() => onProceed(url)}
          disabled={!url || editingId !== null}
          className={`px-20 py-7 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 disabled:opacity-40
            bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200 hover:-translate-y-1`}
        >
          Confirm & Orchestrate
        </button>
      </div>
    </div>
  );
};

export default TestCaseReview;
