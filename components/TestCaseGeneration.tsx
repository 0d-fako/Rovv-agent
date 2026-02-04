
import React, { useState } from 'react';
import { Requirement } from '../types.ts';

interface TestCaseGenerationProps {
  requirements: Requirement[];
  onGenerate: (updated: Requirement[]) => void;
}

const TestCaseGeneration: React.FC<TestCaseGenerationProps> = ({ requirements, onGenerate }) => {
  const [localReqs, setLocalReqs] = useState<Requirement[]>(requirements);
  const [editingId, setEditingId] = useState<string | null>(null);

  const updateReq = (id: string, field: keyof Requirement, value: any) => {
    setLocalReqs(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const updateAC = (id: string, index: number, value: string) => {
    const req = localReqs.find(r => r.id === id);
    if (!req) return;
    const newAC = [...req.acceptanceCriteria];
    newAC[index] = value;
    updateReq(id, 'acceptanceCriteria', newAC);
  };

  const removeAC = (id: string, index: number) => {
    const req = localReqs.find(r => r.id === id);
    if (!req) return;
    const newAC = req.acceptanceCriteria.filter((_, i) => i !== index);
    updateReq(id, 'acceptanceCriteria', newAC);
  };

  const addAC = (id: string) => {
    const req = localReqs.find(r => r.id === id);
    if (!req) return;
    updateReq(id, 'acceptanceCriteria', [...req.acceptanceCriteria, 'New acceptance criterion...']);
  };

  return (
    <div className="space-y-12 animate-in max-w-5xl mx-auto">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Structured <span className="text-indigo-600">Requirements</span></h2>
        <p className="text-slate-500 font-medium max-w-xl mx-auto">Review and refine the architectural requirements extracted by the agent. These will form the foundation of your test suite.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {localReqs.map((req) => (
          <div key={req.id} className="glass rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 border border-slate-100 relative group">
            <button 
              onClick={() => setEditingId(editingId === req.id ? null : req.id)}
              className={`absolute top-6 right-6 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editingId === req.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
            >
              {editingId === req.id ? 'Save Changes' : 'Modify'}
            </button>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase tracking-widest border border-indigo-100">{req.id}</span>
              {editingId === req.id ? (
                <input 
                  type="text" 
                  className="flex-1 font-black text-lg border-b-2 border-indigo-100 outline-none focus:border-indigo-600 transition-colors"
                  value={req.title}
                  onChange={(e) => updateReq(req.id, 'title', e.target.value)}
                />
              ) : (
                <h3 className="text-lg font-black text-slate-900">{req.title}</h3>
              )}
            </div>

            <div className="space-y-6">
              {editingId === req.id ? (
                <textarea 
                  className="w-full text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-2xl border-none outline-none resize-none leading-relaxed"
                  value={req.description}
                  rows={3}
                  onChange={(e) => updateReq(req.id, 'description', e.target.value)}
                />
              ) : (
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{req.description}</p>
              )}

              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Acceptance Criteria</p>
                <div className="space-y-2">
                  {req.acceptanceCriteria.map((ac, i) => (
                    <div key={i} className="flex items-start group/ac">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 mr-3 flex-shrink-0"></div>
                      {editingId === req.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input 
                            type="text"
                            className="flex-1 text-sm font-medium text-slate-700 bg-transparent border-b border-slate-100 focus:border-indigo-400 outline-none pb-1"
                            value={ac}
                            onChange={(e) => updateAC(req.id, i, e.target.value)}
                          />
                          <button onClick={() => removeAC(req.id, i)} className="text-rose-400 hover:text-rose-600 opacity-0 group-hover/ac:opacity-100 transition-opacity">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-slate-700 leading-snug">{ac}</p>
                      )}
                    </div>
                  ))}
                  {editingId === req.id && (
                    <button onClick={() => addAC(req.id)} className="text-[10px] text-indigo-600 font-black uppercase tracking-widest hover:underline pt-2">+ New Criterion</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-8">
        <button
          onClick={() => onGenerate(localReqs)}
          disabled={editingId !== null}
          className={`px-12 py-5 rounded-[2.2rem] font-black text-sm uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95 disabled:opacity-40
            bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200`}
        >
          Generate Deterministic Test Suite
        </button>
      </div>
    </div>
  );
};

export default TestCaseGeneration;
