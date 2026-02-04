
import React from 'react';
import { AutomationConfig, BrowserType, ExecutionMode } from '../types.ts';

interface ConfigurationPanelProps {
  config: AutomationConfig;
  onChange: (config: AutomationConfig) => void;
  onProceed: () => void;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ config, onChange, onProceed }) => {
  const updateConfig = (path: string, value: any) => {
    const newConfig = { ...config };
    const parts = path.split('.');
    let current: any = newConfig;
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    onChange(newConfig);
  };

  return (
    <div className="space-y-12 animate-in max-w-6xl mx-auto">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Engine <span className="text-indigo-600">Parameters</span></h2>
        <p className="text-slate-500 font-medium">Fine-tune the orchestration core and driver behavior.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
          <section className="glass p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-8 flex items-center gap-3">
               <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
               Environment Profile
            </h3>
            <div className="flex p-2 bg-slate-100 rounded-[1.8rem] border border-slate-200 mb-8">
              {(['local_sim', 'remote_bridge'] as ExecutionMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => updateConfig('executionMode', mode)}
                  className={`flex-1 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    config.executionMode === mode ? 'bg-white text-indigo-600 shadow-lg border border-slate-100 scale-[1.02]' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {mode === 'local_sim' ? 'AI Synthesizer' : 'Remote Bridge'}
                </button>
              ))}
            </div>
            
            {config.executionMode === 'remote_bridge' && (
              <div className="space-y-3 animate-in">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Gateway Endpoint</label>
                <div className="relative">
                  <input 
                    type="url" 
                    placeholder="https://automation.hub/wd/hub"
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold font-mono outline-none focus:ring-4 focus:ring-indigo-50 shadow-inner text-slate-900"
                    value={config.remoteUrl}
                    onChange={e => updateConfig('remoteUrl', e.target.value)}
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500"></div>
                </div>
              </div>
            )}
          </section>

          <section className="glass p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-8 flex items-center gap-3">
               <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
               Browser Stack
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {([ 'chromium', 'firefox' ] as BrowserType[]).map(type => (
                <button
                  key={type}
                  onClick={() => updateConfig('browser.type', type)}
                  className={`py-8 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${
                    config.browser.type === type ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-lg' : 'border-slate-50 hover:border-slate-100'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${config.browser.type === type ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
                  </div>
                  <span className="capitalize font-black text-[10px] tracking-widest uppercase">{type} Engine</span>
                </button>
              ))}
            </div>
            
            <div className="mt-8 p-6 bg-slate-50 rounded-[1.8rem] flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-slate-900 leading-tight">Headless Orchestration</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Bypass UI rendering for maximum velocity</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.browser.headless}
                  onChange={e => updateConfig('browser.headless', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <section className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
            <h3 className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em] mb-10">Advanced Synthesis</h3>
            
            <div className="space-y-8 relative z-10">
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <div>
                  <p className="text-sm font-black text-white">Encrypted Auth Flow</p>
                  <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-widest opacity-60">Inject persistent credentials</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={config.authentication.enabled}
                  onChange={e => updateConfig('authentication.enabled', e.target.checked)}
                  className="w-6 h-6 rounded-lg bg-white/10 border-white/20 accent-white"
                />
              </div>

              {config.authentication.enabled && (
                <div className="grid grid-cols-2 gap-4 animate-in">
                  <input 
                    type="text" 
                    placeholder="Username" 
                    className="bg-white/10 border border-white/20 rounded-2xl p-4 text-xs font-bold outline-none focus:bg-white/20 focus:ring-2 focus:ring-white/20 placeholder:text-white/40 text-white" 
                    value={config.authentication.username} 
                    onChange={e => updateConfig('authentication.username', e.target.value)} 
                  />
                  <input 
                    type="password" 
                    placeholder="Passphrase" 
                    className="bg-white/10 border border-white/20 rounded-2xl p-4 text-xs font-bold outline-none focus:bg-white/20 focus:ring-2 focus:ring-white/20 placeholder:text-white/40 text-white" 
                    value={config.authentication.password} 
                    onChange={e => updateConfig('authentication.password', e.target.value)} 
                  />
                </div>
              )}

              <div className="space-y-4">
                <p className="text-[10px] font-black text-white uppercase tracking-widest opacity-40">Telemetry Artifacts</p>
                <div className="grid grid-cols-2 gap-4">
                   <button onClick={() => updateConfig('evidence.capture_screenshots', !config.evidence.capture_screenshots)} className={`py-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${config.evidence.capture_screenshots ? 'bg-white text-indigo-600 shadow-xl' : 'border-white/20 text-white hover:bg-white/10'}`}>Screenshots</button>
                   <button onClick={() => updateConfig('evidence.capture_network', !config.evidence.capture_network)} className={`py-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${config.evidence.capture_network ? 'bg-white text-indigo-600 shadow-xl' : 'border-white/20 text-white hover:bg-white/10'}`}>Traffic logs</button>
                </div>
              </div>

              <div className="pt-8">
                 <div className="bg-black/20 p-6 rounded-[2rem] border border-white/5 backdrop-blur-sm">
                   <div className="flex items-center justify-between mb-4">
                     <span className="text-[9px] font-black text-indigo-200 uppercase tracking-[0.3em]">Runtime Spec</span>
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                   </div>
                   <pre className="text-[10px] font-mono text-indigo-100 opacity-60 leading-relaxed overflow-hidden">
{`config:
  mode: ${config.executionMode}
  driver: ${config.browser.type}
  wait: ${config.timeouts.element_wait}s
  logs: ${config.evidence.capture_logs ? 'enabled' : 'disabled'}`}
                   </pre>
                 </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="flex justify-center pt-8 pb-20">
        <button
          onClick={onProceed}
          className="px-16 py-6 rounded-[2.5rem] bg-indigo-600 text-white font-black text-sm uppercase tracking-[0.3em] hover:bg-indigo-700 transition-all shadow-[0_40px_100px_rgba(79,70,229,0.3)] hover:-translate-y-1 active:scale-95"
        >
          Initialize Automation Matrix
        </button>
      </div>
    </div>
  );
};

export default ConfigurationPanel;
