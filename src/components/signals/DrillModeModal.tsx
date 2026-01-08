import { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { GlassInput } from '../ui/GlassInput';
import { X, ArrowRight, Link as LinkIcon, AlertCircle, Database, CheckCircle2 } from 'lucide-react';
import { type Signal } from '../../types';

interface Props {
  onClose: () => void;
  onSave: (data: Partial<Signal>) => void;
}

export const DrillModeModal = ({ onClose, onSave }: Props) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    sector: '',
    confidence: 5,
    links: { website: '', twitter: '', github: '', docs: '' },
    token: { status: 'none', utility: '', tgeDate: '', launchPlan: '' },
    findings: '',
    pickReason: '',
    drillNotes: {} as Record<string, string>
  });

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
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
      <GlassCard className="w-full max-w-lg p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-white">Research Drill</h2>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className={`h-1 w-8 rounded-full ${step >= s ? 'bg-accent-success' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20}/></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <LinkIcon size={18} className="text-blue-400"/> The Artifacts
              </h3>
              <p className="text-xs text-gray-400">If it doesn't exist, leave it blank.</p>
              
              <GlassInput icon={<LinkIcon size={14}/>} placeholder="Website URL" value={formData.links.website} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLink('website', e.target.value)} />
              <GlassInput icon={<LinkIcon size={14}/>} placeholder="Twitter/X Link" value={formData.links.twitter} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLink('twitter', e.target.value)} />
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <GlassInput icon={<Database size={14}/>} placeholder="GitHub / Codebase" value={formData.links.github} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLink('github', e.target.value)} />
                <textarea 
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white mt-2 h-16 resize-none"
                  placeholder="Note: Is the repo active? When was last commit?"
                  onChange={(e) => setFormData(p => ({...p, drillNotes: {...p.drillNotes, github: e.target.value}}))}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertCircle size={18} className="text-yellow-400"/> Tokenomics
              </h3>
              
              <div className="grid grid-cols-3 gap-2">
                {['live', 'pending', 'none'].map(s => (
                  <button 
                    key={s}
                    onClick={() => updateToken('status', s)}
                    className={`p-3 rounded-xl border text-xs font-bold uppercase ${
                      formData.token.status === s 
                      ? 'bg-white text-black border-white' 
                      : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {formData.token.status === 'live' && (
                 <GlassInput label="Utility (Why hold it?)" value={formData.token.utility} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateToken('utility', e.target.value)} />
              )}

              {formData.token.status === 'pending' && (
                <div className="space-y-3 p-4 bg-white/5 rounded-xl">
                   <GlassInput label="Expected TGE Date" type="date" value={formData.token.tgeDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateToken('tgeDate', e.target.value)} />
                   <GlassInput label="Launch Plans (L1? Fair launch?)" value={formData.token.launchPlan} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateToken('launchPlan', e.target.value)} />
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-white">Deep Work</h3>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Why did you pick this?</label>
                <textarea 
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white mt-1 h-24"
                  placeholder="This becomes your 'Alpha' in the thesis..."
                  value={formData.pickReason}
                  onChange={(e) => setFormData(p => ({...p, pickReason: e.target.value}))}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Specific Findings</label>
                <textarea 
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white mt-1 h-32"
                  placeholder="Tech details, team background, unique mechanics..."
                  value={formData.findings}
                  onChange={(e) => setFormData(p => ({...p, findings: e.target.value}))}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-fade-in text-center py-4">
              <div className="inline-flex p-4 rounded-full bg-green-500/10 text-green-500 mb-2">
                <CheckCircle2 size={32}/>
              </div>
              <h3 className="text-xl font-bold text-white">Name the Asset</h3>
              <p className="text-sm text-gray-400">You have done the work. It is worthy of the board.</p>
              
              <div className="text-left space-y-4">
                <GlassInput label="Project Name" value={formData.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({...p, title: e.target.value}))} autoFocus />
                <GlassInput label="Sector (e.g. DePin, L2)" value={formData.sector} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({...p, sector: e.target.value}))} />
                
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Initial Confidence</label>
                    <span className="text-accent-success font-bold">{formData.confidence}/10</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" 
                    value={formData.confidence} 
                    onChange={(e) => setFormData(p => ({...p, confidence: Number(e.target.value)}))} 
                    className="w-full accent-green-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-black/20 flex justify-between">
          <button 
            onClick={() => setStep(s => Math.max(1, s - 1))}
            className={`text-sm text-gray-500 hover:text-white ${step === 1 ? 'opacity-0 disabled' : ''}`}
          >
            Back
          </button>

          {step < 4 ? (
            <GlassButton onClick={() => setStep(s => s + 1)} size="sm">
              Next Step <ArrowRight size={16} className="ml-2"/>
            </GlassButton>
          ) : (
            <GlassButton onClick={handleFinish} disabled={!formData.title} size="sm">
              Create Signal
            </GlassButton>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
