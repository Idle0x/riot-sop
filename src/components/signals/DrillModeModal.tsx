import { useState, useEffect, useMemo } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { GlassInput } from '../ui/GlassInput';
import { X, ArrowRight, Link as LinkIcon, AlertCircle, Database, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { type Signal } from '../../types';
import { useLedger } from '../../context/LedgerContext';
import { MANUAL_CHAPTERS } from '../../data/manual_content';

interface Props {
  onClose: () => void;
  onSave: (data: Partial<Signal>) => void;
}

export const DrillModeModal = ({ onClose, onSave }: Props) => {
  const { signals } = useLedger(); 
  const [step, setStep] = useState(1);
  const [confidenceCap, setConfidenceCap] = useState(10);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    sector: '',
    confidence: 5,
    links: { website: '', twitter: '', github: '', docs: '' },
    token: { status: 'none', utility: '', tgeDate: '', launchPlan: '' },
    findings: '',
    pickReason: '',
    drillNotes: {} as Record<string, string>,
    timeEstimates: { weekly: 0, total: 0, completionDate: '' }
  });

  // 1. Sector Autocomplete Logic
  const existingSectors = useMemo(() => {
    const sectors = new Set(signals.map(s => s.sector).filter(Boolean));
    return Array.from(sectors).sort();
  }, [signals]);

  const filteredSectors = existingSectors.filter(s => 
    s.toLowerCase().includes(formData.sector.toLowerCase()) && 
    s.toLowerCase() !== formData.sector.toLowerCase()
  );

  // 2. Red Flags Source (Fixed TypeScript Error)
  const RED_FLAGS_SOURCE = useMemo(() => {
    const filterChapter = MANUAL_CHAPTERS.find(c => c.id === 'filters');
    // FIX: Added (b: any) to allow checking 'variant' on the union type
    const flagBlock = filterChapter?.content.find((b: any) => b.type === 'card_grid' && b.variant === 'danger');
    return (flagBlock as any)?.items || [];
  }, []);

  // 3. Confidence Logic
  useEffect(() => {
    let cap = 10;
    const missing = [];

    if (!formData.links.website) { cap -= 1; missing.push("Website"); }
    if (!formData.links.twitter) { cap -= 1; missing.push("Socials"); }
    if (!formData.findings || formData.findings.length < 50) { cap -= 3; missing.push("Deep Findings"); }
    if (!formData.pickReason) { cap -= 2; missing.push("Alpha Thesis"); }
    
    if (formData.confidence > cap) {
      setFormData(prev => ({ ...prev, confidence: cap }));
    }
    
    setConfidenceCap(cap);
    setMissingFields(missing);
  }, [formData.links, formData.findings, formData.pickReason]);

  const updateLink = (key: keyof typeof formData.links, val: string) => {
    setFormData(prev => ({ ...prev, links: { ...prev.links, [key]: val } }));
  };

  const updateToken = (key: string, val: string) => {
    setFormData(prev => ({ ...prev, token: { ...prev.token, [key]: val } }));
  };

  const handleFinish = () => {
    onSave({
      title: formData.title,
      sector: formData.sector,
      confidence: formData.confidence,
      research: {
        links: formData.links,
        token: formData.token as any,
        findings: formData.findings,
        pickReason: formData.pickReason,
        drillNotes: formData.drillNotes
      },
      thesis: {
        alpha: formData.pickReason,
        catalyst: 'Pending',
        invalidation: 'Pending',
        expectedValue: 0
      },
      timeEstimates: formData.timeEstimates,
      sessionLogs: [],
      lastSessionAt: new Date().toISOString()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
      <GlassCard className="w-full max-w-lg p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-white">Research Drill</h2>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map(s => (
                <div key={s} className={`h-1 w-8 rounded-full transition-colors duration-300 ${step >= s ? 'bg-accent-success' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20}/></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><LinkIcon size={18} className="text-blue-400"/> The Artifacts</h3>
              <GlassInput icon={<LinkIcon size={14}/>} placeholder="Website URL" value={formData.links.website} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLink('website', e.target.value)} />
              <GlassInput icon={<LinkIcon size={14}/>} placeholder="Twitter/X Link" value={formData.links.twitter} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLink('twitter', e.target.value)} />
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <GlassInput icon={<Database size={14}/>} placeholder="GitHub / Codebase" value={formData.links.github} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLink('github', e.target.value)} />
                <textarea className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white mt-2 h-16 resize-none" placeholder="Repo Activity Notes" onChange={(e) => setFormData(p => ({...p, drillNotes: {...p.drillNotes, github: e.target.value}}))}/>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><AlertCircle size={18} className="text-yellow-400"/> Tokenomics</h3>
              <div className="grid grid-cols-3 gap-2">
                {['live', 'pending', 'none'].map(s => (
                  <button key={s} onClick={() => updateToken('status', s)} className={`p-3 rounded-xl border text-xs font-bold uppercase ${formData.token.status === s ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-white/10'}`}>{s}</button>
                ))}
              </div>
              {formData.token.status === 'live' && <GlassInput label="Utility" value={formData.token.utility} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateToken('utility', e.target.value)} />}
              {formData.token.status === 'pending' && <div className="space-y-3 p-4 bg-white/5 rounded-xl"><GlassInput label="TGE Date" type="date" value={formData.token.tgeDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateToken('tgeDate', e.target.value)} /><GlassInput label="Launch Plan" value={formData.token.launchPlan} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateToken('launchPlan', e.target.value)} /></div>}
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-white">Deep Work</h3>
              <textarea className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white h-24" placeholder="Why did you pick this? (Alpha Thesis)" value={formData.pickReason} onChange={(e) => setFormData(p => ({...p, pickReason: e.target.value}))}/>
              <textarea className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white h-32" placeholder="Specific Findings (Min 50 chars)" value={formData.findings} onChange={(e) => setFormData(p => ({...p, findings: e.target.value}))}/>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Clock size={18} className="text-purple-400"/> Time Commitment</h3>
              <div className="grid grid-cols-2 gap-4">
                 <GlassInput label="Est. Hours/Week" type="number" value={formData.timeEstimates.weekly || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({...p, timeEstimates: {...p.timeEstimates, weekly: parseFloat(e.target.value)}}))} />
                 <GlassInput label="Target Completion" type="date" value={formData.timeEstimates.completionDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({...p, timeEstimates: {...p.timeEstimates, completionDate: e.target.value}}))} />
              </div>
              <GlassInput label="Total Hours Est." type="number" value={formData.timeEstimates.total || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({...p, timeEstimates: {...p.timeEstimates, total: parseFloat(e.target.value)}}))} />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-fade-in text-center py-4">
              <div className="inline-flex p-4 rounded-full bg-green-500/10 text-green-500 mb-2"><CheckCircle2 size={32}/></div>
              <h3 className="text-xl font-bold text-white">Name the Asset</h3>

              <div className="text-left space-y-4">
                <GlassInput label="Project Name" value={formData.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({...p, title: e.target.value}))} autoFocus />
                
                <div className="relative">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Sector</label>
                    <input 
                        type="text"
                        value={formData.sector}
                        onChange={(e) => { setFormData(p => ({...p, sector: e.target.value})); setShowSuggestions(true); }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} 
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-white/30"
                        placeholder="e.g. DePin, AI"
                    />
                    {showSuggestions && filteredSectors.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-40 overflow-y-auto">
                            <div className="p-2 text-[10px] text-gray-500 uppercase font-bold bg-white/5">Known Sectors</div>
                            {filteredSectors.map(s => (
                                <button key={s} onClick={() => { setFormData(p => ({...p, sector: s})); setShowSuggestions(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-2">
                   <div className="flex items-center gap-2 mb-2 text-red-400">
                      <AlertTriangle size={14} />
                      <span className="text-xs font-bold uppercase">Manual Check</span>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                      {RED_FLAGS_SOURCE.map((flag: any, idx: number) => (
                         <div key={idx} className="text-[10px] text-gray-400 flex items-start gap-1">
                            <span className="text-red-500/50">•</span>
                            <span title={flag.body} className="hover:text-white cursor-help transition-colors">{flag.title}</span>
                         </div>
                      ))}
                   </div>
                </div>

                <div className={`p-4 rounded-xl border transition-all duration-300 ${missingFields.length > 0 ? 'bg-red-500/5 border-red-500/30' : 'bg-green-500/10 border-green-500/50 shadow-md'}`}>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Initial Confidence</label>
                    <span className={`font-bold ${missingFields.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {formData.confidence}/10 {missingFields.length > 0 && `(Capped at ${confidenceCap})`}
                    </span>
                  </div>
                  <input type="range" min="1" max={confidenceCap} value={formData.confidence} onChange={(e) => setFormData(p => ({...p, confidence: Number(e.target.value)}))} className={`w-full cursor-pointer ${missingFields.length > 0 ? 'accent-red-500' : 'accent-green-500'}`}/>
                  {missingFields.length > 0 && (
                    <div className="mt-3 text-xs text-red-400 flex items-start gap-2">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0"/>
                      <div><strong>Confidence Locked:</strong> Missing {missingFields.join(', ')}.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-black/20 flex justify-between">
          <button onClick={() => setStep(s => Math.max(1, s - 1))} className={`text-sm text-gray-500 hover:text-white ${step === 1 ? 'opacity-0 disabled' : ''}`}>Back</button>
          {step < 5 ? (
            <GlassButton onClick={() => setStep(s => s + 1)} size="sm">Next Step <ArrowRight size={16} className="ml-2"/></GlassButton>
          ) : (
            <GlassButton onClick={handleFinish} disabled={!formData.title} size="sm">Create Signal</GlassButton>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
