import { useState, useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';
import { supabase } from '../lib/supabase'; 
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { DrillModeModal } from '../components/signals/DrillModeModal'; 
import { SignalDossierModal } from '../components/signals/SignalDossierModal'; 
import { Naira } from '../components/ui/Naira';
import { formatNumber } from '../utils/format';
import { type Signal, type SignalPhase } from '../types';
import { Clock, Zap, Maximize2, X, Skull, Trophy } from 'lucide-react';

export const Signals = () => {
  const { signals, updateSignal, addSignal, commitAction } = useLedger();

  const [isDrillOpen, setIsDrillOpen] = useState(false);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null); 
  const [dossierSignal, setDossierSignal] = useState<Signal | null>(null);       
  
  // KILL PROTOCOL STATE
  const [killCandidate, setKillCandidate] = useState<Signal | null>(null);

  // --- ANALYTICS ---
  const analytics = useMemo(() => {
    const totalSignals = signals.length;
    const wins = signals.filter(s => s.phase === 'delivered' || s.phase === 'harvested');
    const winRate = totalSignals > 0 ? (wins.length / totalSignals) * 100 : 0;
    return { winRate };
  }, [signals]);

  // --- ACTIONS ---
  
  const handleDossierUpdate = async (updatedSignal: Signal, logContent: string) => {
    updateSignal(updatedSignal);
    await supabase.from('signal_logs').insert({
      signal_id: updatedSignal.id,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      type: 'FIELD_REPORT',
      content: logContent
    });
    commitAction({
      date: new Date().toISOString(),
      type: 'SIGNAL_UPDATE',
      title: `Updated: ${updatedSignal.title}`,
      description: logContent,
      linkedSignalId: updatedSignal.id
    });
  };

  const handleCreateFromDrill = (data: Partial<Signal>) => {
    if (!data.title) { alert("Title required"); return; }
    addSignal({
        title: data.title,
        sector: data.sector || 'General',
        phase: 'discovery',
        confidence: data.confidence || 5,
        effort: 'low',
        hoursLogged: 0,
        totalGenerated: 0,
        redFlags: [],
        proofOfWork: [],
        thesis: { alpha: '', catalyst: '', invalidation: '', expectedValue: 0 },
        research: { links: {}, token: { status: 'none' }, findings: '', pickReason: '', drillNotes: {} },
        timeline: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data as any
    });
    setIsDrillOpen(false);
  };

  // --- THE SMART KILL PROTOCOL ---
  const initiateKill = (signal: Signal) => {
    if (signal.totalGenerated > 0) {
      // It made money -> Ask user to classify outcome
      setKillCandidate(signal);
    } else {
      // It made nothing -> Auto-Kill to Graveyard
      updateSignal({ ...signal, phase: 'graveyard', updatedAt: new Date().toISOString() });
      commitAction({ date: new Date().toISOString(), type: 'SIGNAL_KILL', title: `Killed: ${signal.title}`, description: 'Moved to graveyard (No Revenue)', linkedSignalId: signal.id });
      setSelectedSignalId(null);
    }
  };

  const confirmKillDecision = (decision: 'GRAVEYARD' | 'HARVEST') => {
    if (!killCandidate) return;
    
    const phase = decision === 'HARVEST' ? 'harvested' : 'graveyard';
    const desc = decision === 'HARVEST' ? 'Retired as Winner (Harvested)' : 'Retired to Graveyard (despite revenue)';
    
    updateSignal({ ...killCandidate, phase, updatedAt: new Date().toISOString() });
    commitAction({ date: new Date().toISOString(), type: decision === 'HARVEST' ? 'SIGNAL_HARVEST' : 'SIGNAL_KILL', title: `${decision === 'HARVEST' ? 'Harvested' : 'Killed'}: ${killCandidate.title}`, description: desc, linkedSignalId: killCandidate.id });
    
    setKillCandidate(null);
    setSelectedSignalId(null);
  };

  const activeColumns: { id: SignalPhase; label: string; color: string }[] = [
    { id: 'discovery', label: 'Discovery', color: 'bg-blue-500' },
    { id: 'validation', label: 'Validation', color: 'bg-yellow-500' },
    { id: 'contribution', label: 'Contribution', color: 'bg-purple-500' },
    { id: 'delivered', label: 'Delivered', color: 'bg-green-500' },
  ];

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col p-4 md:p-8 pb-20" onClick={() => setSelectedSignalId(null)}>
      
      {/* MODALS */}
      {isDrillOpen && <DrillModeModal onClose={() => setIsDrillOpen(false)} onSave={handleCreateFromDrill} />}
      {dossierSignal && <SignalDossierModal signal={dossierSignal} onClose={() => setDossierSignal(null)} onUpdate={handleDossierUpdate}/>}

      {/* KILL PROTOCOL MODAL */}
      {killCandidate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
           <GlassCard className="max-w-md w-full p-6 border-white/20">
             <div className="flex items-center gap-3 mb-4">
               <Zap className="text-yellow-500" size={24} />
               <h2 className="text-xl font-bold text-white">Classify Outcome</h2>
             </div>
             <p className="text-sm text-gray-300 mb-6">
               <strong className="text-white">{killCandidate.title}</strong> has generated <span className="text-green-400 font-mono"><Naira/>{formatNumber(killCandidate.totalGenerated)}</span>.
               <br/><br/>
               Are you retiring this as a <strong>Win</strong> (Harvest) or a <strong>Loss</strong>?
             </p>
             <div className="flex gap-3">
               <button onClick={() => confirmKillDecision('GRAVEYARD')} className="flex-1 p-3 rounded-xl border border-white/10 hover:bg-white/5 flex flex-col items-center gap-2 group">
                 <Skull className="text-gray-500 group-hover:text-red-500" />
                 <span className="text-xs font-bold text-gray-500 group-hover:text-white">Graveyard</span>
               </button>
               <button onClick={() => confirmKillDecision('HARVEST')} className="flex-1 p-3 rounded-xl border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 flex flex-col items-center gap-2 group">
                 <Trophy className="text-green-500" />
                 <span className="text-xs font-bold text-green-400 group-hover:text-white">Harvest (Win)</span>
               </button>
             </div>
             <button onClick={() => setKillCandidate(null)} className="w-full mt-4 text-xs text-gray-500 hover:text-white">Cancel</button>
           </GlassCard>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-end gap-6 mb-6">
        <div>
           <h1 className="text-3xl font-bold text-white mb-2">Deal Flow</h1>
           <div className="text-xs text-gray-500 flex gap-4">
             <span>Win Rate: <span className="text-green-400">{analytics.winRate.toFixed(1)}%</span></span>
           </div>
        </div>
        <GlassButton size="sm" onClick={(e) => { e.stopPropagation(); setIsDrillOpen(true); }}>
           <Zap size={16} className="mr-2"/> New Drill
        </GlassButton>
      </div>

      {/* KANBAN */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {activeColumns.map(col => (
          <div key={col.id} className="min-w-[300px] flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <div className={`w-2 h-2 rounded-full ${col.color}`}/>
              <span className="font-bold text-xs uppercase text-gray-400">{col.label}</span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pb-20">
              {signals.filter(s => s.phase === col.id).map(s => {
                const isSelected = selectedSignalId === s.id;
                
                return (
                  <div key={s.id} onClick={(e) => { e.stopPropagation(); setSelectedSignalId(isSelected ? null : s.id); }}>
                    <GlassCard className={`p-4 cursor-pointer relative transition-all duration-300 ${isSelected ? 'border-green-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)] scale-[1.02] z-10' : 'hover:border-white/30'}`}>
                      
                      {/* --- PRICE TAG (TOP LEFT) --- */}
                      {s.totalGenerated > 0 && (
                        <div className="absolute top-2 left-2 z-20 bg-green-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg flex items-center gap-0.5">
                          <Naira isBlack/>{formatNumber(s.totalGenerated)}
                        </div>
                      )}

                      <div className="flex justify-end mb-2 h-4">
                        {s.redFlags && s.redFlags.length > 0 && <span className="text-[10px] text-red-500 flex items-center gap-1">🚩 Flagged</span>}
                      </div>

                      <h4 className="font-bold text-white text-sm mb-2 mt-1">{s.title}</h4>

                      <div className="flex gap-2 text-[10px] mb-2">
                        <span className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300 font-mono">{s.sector}</span>
                        <span className={`${s.confidence > 7 ? 'text-green-500' : 'text-orange-500'}`}>{s.confidence}/10 Conf</span>
                      </div>

                      {/* ACTION BAR (PEEK) */}
                      {isSelected && (
                        <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center animate-fade-in">
                           <button onClick={(e) => { e.stopPropagation(); setDossierSignal(s); }} className="text-xs font-bold text-white bg-green-600/20 hover:bg-green-600/40 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-green-500/30">
                             <Maximize2 size={12}/> Dossier
                           </button>
                           
                           <button onClick={(e) => { e.stopPropagation(); initiateKill(s); }} className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 px-2">
                             <Skull size={14}/> Kill
                           </button>
                        </div>
                      )}
                    </GlassCard>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
