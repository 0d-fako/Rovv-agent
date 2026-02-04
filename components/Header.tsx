import React from 'react';
import { AppStep } from '../types.ts';

interface HeaderProps {
  currentStep: AppStep;
}

const Header: React.FC<HeaderProps> = ({ currentStep }) => {
  const steps = [
    { key: AppStep.ANALYSIS, label: 'Analyze' },
    { key: AppStep.GENERATION, label: 'Generate' },
    { key: AppStep.REVIEW, label: 'Review' },
    { key: AppStep.CONFIGURATION, label: 'Setup' },
    { key: AppStep.EXECUTION, label: 'Live' },
    { key: AppStep.REPORT, label: 'Results' }
  ];

  const currentIdx = steps.findIndex(s => s.key === currentStep || (currentStep === AppStep.AUTONOMOUS && s.key === AppStep.EXECUTION));

  return (
    <header className="sticky top-0 z-50 px-6 py-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between glass rounded-3xl p-3 px-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 leading-tight tracking-tight uppercase">QA-GPT <span className="text-indigo-600">2.5</span></h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Autonomous Core</p>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          {steps.map((step, index) => {
            const isActive = currentStep === step.key || (currentStep === AppStep.AUTONOMOUS && step.key === AppStep.EXECUTION);
            const isCompleted = currentIdx > index;
            
            return (
              <div key={step.key} className="flex items-center">
                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  isActive 
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-100 scale-105' 
                    : isCompleted 
                      ? 'text-emerald-500 hover:text-emerald-600 cursor-pointer' 
                      : 'text-slate-400'}`}>
                  {isCompleted ? (
                    <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  ) : (
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center border font-mono ${isActive ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200'}`}>{index + 1}</span>
                  )}
                  {step.label}
                </div>
                {index < steps.length - 1 && (
                  <div className="mx-1 text-slate-200 text-xs">/</div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;