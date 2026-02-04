import React, { useState } from 'react';

interface RequirementAnalysisProps {
  onAnalyze: (text: string, screenshot?: string) => void;
  onRunAutonomous: (prompt: string) => void;
}

const RequirementAnalysis: React.FC<RequirementAnalysisProps> = ({ onAnalyze, onRunAutonomous }) => {
  const [text, setText] = useState('');
  const [screenshot, setScreenshot] = useState<string | undefined>();
  const [isAutonomous, setIsAutonomous] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setScreenshot(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAutonomous) onRunAutonomous(text);
    else if (text.trim() || screenshot) onAnalyze(text, screenshot);
  };

  return (
    <div className="space-y-12 animate-in max-w-5xl mx-auto">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Supercharge your <span className="gradient-text">QA Workflow</span>
        </h2>
        <p className="text-slate-500 font-medium max-w-2xl mx-auto text-lg leading-relaxed">
          From natural language requirements to production-grade automation in seconds. 
          Choose your engine below to begin.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="flex items-center p-1.5 bg-slate-100 rounded-[1.5rem] border border-slate-200 shadow-inner w-fit">
          <button 
            onClick={() => setIsAutonomous(false)}
            className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${!isAutonomous ? 'bg-white text-indigo-600 shadow-lg shadow-indigo-100 border border-slate-100 scale-105' : 'text-slate-500 hover:text-slate-700'}`}>
            Structured Flow
          </button>
          <button 
            onClick={() => setIsAutonomous(true)}
            className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${isAutonomous ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' : 'text-slate-500 hover:text-slate-700'}`}>
            Autonomous Agent
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-100 via-rose-50 to-emerald-100 rounded-[3rem] blur-xl opacity-40 group-focus-within:opacity-100 transition duration-1000"></div>
          <div className="relative bg-white rounded-[2.5rem] border border-slate-200 p-2 shadow-xl overflow-hidden group-focus-within:border-indigo-400 group-focus-within:shadow-indigo-100 transition-all">
            <textarea
              className="w-full h-80 p-8 outline-none resize-none font-medium text-slate-700 placeholder:text-slate-300 leading-relaxed text-xl"
              placeholder={isAutonomous ? "Command: 'Check if users can log in with invalid credentials and see a 401 error message...'" : "Requirements: 'The checkout page must support guest users and display the subtotal before taxes...'"}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="absolute bottom-6 right-8 flex gap-4">
              <button 
                type="button" 
                onClick={() => setText("Run a smoke test on https://vigimatch-frontend-dev.up.railway.app/auth.\n1. Input 'phemii_tester' in username.\n2. Input 'Hbon@1234' in password.\n3. Click Sign In and verify Dashboard header.")}
                className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 transition-all active:scale-95"
              >
                Use Template
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6 group cursor-pointer relative">
            <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            <div className={`w-16 h-16 rounded-[1.5rem] border-2 border-dashed flex items-center justify-center transition-all ${screenshot ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-200 bg-slate-50 text-slate-400 group-hover:border-indigo-300 group-hover:bg-white'}`}>
              {screenshot ? (
                <img src={screenshot} className="w-12 h-12 object-cover rounded-xl" />
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              )}
            </div>
            <div>
              <p className="text-xs font-black text-slate-800 uppercase tracking-widest mb-1">{screenshot ? 'Context Loaded' : 'Visual Context'}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Attach UI reference for agent accuracy</p>
            </div>
            {screenshot && (
              <button type="button" onClick={() => setScreenshot(undefined)} className="z-20 text-rose-500 hover:text-rose-600 font-black text-xs uppercase ml-4">Remove</button>
            )}
          </div>

          <button
            type="submit"
            disabled={!text.trim() && !screenshot}
            className={`px-14 py-6 rounded-[2.2rem] font-black text-sm uppercase tracking-[0.25em] transition-all shadow-2xl active:scale-95 disabled:opacity-40
              ${isAutonomous 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200' 
                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'}`}
          >
            Launch Core Engine
          </button>
        </div>
      </form>
    </div>
  );
};

export default RequirementAnalysis;