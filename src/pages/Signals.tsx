import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLedger } from '../context/LedgerContext';
import { supabase } from '../lib/supabase'; 

// COMPONENTS
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { DrillModeModal } from '../components/signals/DrillModeModal'; 
import { SignalDossierModal } from '../components/signals/SignalDossierModal'; 
import { HarvestModal } from '../components/signals/HarvestModal'; 

// UTILS
import { formatNumber } from '../utils/format';
import { type Signal, type SignalPhase } from '../types';

// ICONS
import { 
  Zap, Maximize2, Skull, Trophy, Archive, Clock, 
  DollarSign, ArrowRight, X, AlertTriangle 
} from 'lucide-react';

export const Signals = () => {
  const navigate = useNavigate();
  const { signals, updateSignal, addSignal, commitAction } = useLedger();

  // --- STATE MANAGEMENT ---
  const [isDrillOpen, setIsDrillOpen] = useState(false);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null); 
  
  // Modals
  const [dossierSignal, setDossierSignal] = useState<Signal | null>(null);       
  const [harvestSignal, setHarvestSignal] = useState<Signal | null>(null); // Old Logic
  const [killCandidate, setKillCandidate] = useState<Signal | null>(null); // New Logic
  const [viewModal, setViewModal] = useState<'HARVESTED' | 'GRAVEYARD' | null>(null); // Old Logic

  // --- ANALYTICS (Merged Old & New) ---
  const analytics = useMemo(() => {
    const totalSignals = signals.length;
    const wins = signals.filter(s => s.phase === 'delivered' || s.phase === 'harvested');
    const winRate = totalSignals > 0 ? (wins.length / totalSignals) * 100 : 0;

    // Restored Sector Analysis
    const sectors: Record<string, { count: number, value: number }> = {};
    signals.forEach(s => {
      const sector = s.sector || 'Uncategorized';
      if (!sectors[sector]) sectors[sector] = { count: 0, value: 0 };
      sectors[sector].count++;
      sectors[sector].value += s.totalGenerated;
    });

    const bestSector = Object.entries(sectors).sort((a, b) => b[1].value - a[1].value)[0];

    return { winRate, bestSector };
  }, [signals]);

  // --- ACTIONS ---

  // 1. Dossier Update (New Logic + Supabase)
  const handleDossierUpdate = async (updatedSignal: Signal, logContent: string) => {
    updateSignal(updatedSignal);
    
    // Log to Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await supabase.from('signal_logs').insert({
          signal_id: updatedSignal.id,
          user_id: user.id,
          type: 'FIELD_REPORT',
          content: logContent
        });
    }

    commitAction({
      date: new Date().toISOString(),
      type: 'SIGNAL_UPDATE',
      title: `Updated: ${updatedSignal.title}`,
      description: logContent,
      linkedSignalId: updatedSignal.id
    });
  };

  // 2. Create Signal (New Logic)
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

  // 3. Move Next Phase (Restored Feature)
  const handleMoveNext = (signal: Signal, currentPhase: SignalPhase) => {
    const nextIndex = activeColumns.findIndex(c => c.id === currentPhase) + 1;
    if (nextIndex < activeColumns.length) {
       const nextPhase = activeColumns[nextIndex].id;
       updateSignal({ ...signal, phase: nextPhase, updatedAt: new Date().toISOString() });
       commitAction({
         date: new Date().toISOString(),
         type: 'SIGNAL_ADVANCE',
         title: `Advanced: ${signal.title}`,
         description: `Moved from ${currentPhase} to ${nextPhase}`,
         linkedSignalId: signal.id
       });
    }
  };

  // 4. The "Kill Switch" (Hybrid Logic)
  const initiateKill = (signal: Signal) => {
    // If it has money, ask the question
    if (signal.totalGenerated > 0) {
      setKillCandidate(signal);
    } else {
      // If no money, instant kill (Old Logic)
      updateSignal({ ...signal, phase: 'graveyard', updatedAt: new Date().toISOString() });
      commitAction({ date: new Date().toISOString(), type: 'SIGNAL_KILL', title: `Killed: ${signal.title}`, description: 'Moved to graveyard (No Revenue)', linkedSignalId: signal.id });
      setSelectedSignalId(null);
    }
  };

  // 5. Confirm Kill Decision (Hybrid Logic)
  const confirmKillDecision = (decision: 'GRAVEYARD' | 'HARVEST') => {
    if (!killCandidate) return;
    
    if (decision === 'HARVEST') {
      // HANDOFF TO HARVEST MODAL (The Merge Magic)
      setHarvestSignal(killCandidate);
      setKillCandidate(null);
      setSelectedSignalId(null);
    } else {
      updateSignal({ ...killCandidate, phase: 'graveyard', updatedAt: new Date().toISOString() });
      commitAction({ date: new Date().toISOString(), type: 'SIGNAL_KILL', title: `Killed: ${killCandidate.title}`, description: 'Retired to Graveyard (despite revenue)', linkedSignalId: killCandidate.id });
      setKillCandidate(null);
      setSelectedSignalId(null);
    }
  };

  // 6. Final Harvest Execution (Old Logic)
  const handleHarvestConfirm = (amount: number) => {
    if (!harvestSignal) return;

    updateSignal({ 
      ...harvestSignal, 
      phase: 'harvested', 
      totalGenerated: (harvestSignal.totalGenerated || 0) + amount,
      updatedAt: new Date().toISOString() 
    });

    commitAction({
      date: new Date().toISOString(),
      type: 'SIGNAL_UPDATE',
      title: `Harvested: ${harvestSignal.title}`,
      description: `Realized profit of $${amount}`,
      linkedSignalId: harvestSignal.id,
      amount: amount
    });

    setHarvestSignal(null);
    navigate(`/triage?source=${encodeURIComponent(harvestSignal.title)}&amount=${amount}`);
  };

  // Columns Configuration
  const activeColumns: { id: SignalPhase; label: string; color: string }[] = [
    { id: 'discovery', label: 'Discovery', color: 'bg-blue-500' },
    { id: 'validation', label: 'Validation', color: 'bg-yellow-500' },
    { id: 'contribution', label: 'Contribution', color: 'bg-purple-500' },
    { id: 'delivered', label: 'Delivered', color: 'bg-green-500' },
  ];

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col p-4 md:p-8 pb-20" onClick={() => setSelectedSignalId(null)}>
      
      {/* --- MODALS --- */}
      {isDrillOpen && <DrillModeModal onClose={() => setIsDrillOpen(false)} onSave={handleCreateFromDrill} />}
      {dossierSignal && <SignalDossierModal signal={dossierSignal} onClose={() => setDossierSignal(null)} onUpdate={handleDossierUpdate}/>}
      
      {/* The Harvest Modal (Restored) */}
      {harvestSignal && (
        <HarvestModal 
          signalTitle={harvestSignal.title} 
          onClose={() => setHarvestSignal(null)} 
          onConfirm={handleHarvestConfirm} 
        />
      )}

      {/* The Kill Candidate Decision Modal (New Logic) */}
      {killCandidate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
           <GlassCard className="max-w-md w-full p-6 border-white/20">
             <div className="flex items-center gap-3 mb-4">
               <AlertTriangle className="text-yellow-500" size={24} />
               <h2 className="text-xl font-bold text-white">Classify Outcome</h2>
             </div>
             <p className="text-sm text-gray-300 mb-6">
               <strong className="text-white">{killCandidate.title}</strong> has generated <span className="text-green-400 font-mono">${formatNumber(killCandidate.totalGenerated)}</span>.
               <br/><br/>
               Are you retiring this as a <strong>Win</strong> (Harvest) or a <strong>Loss</strong>?
             </p>
             <div className="flex gap-3">
               <button onClick={() => confirmKillDecision('GRAVEYARD')} className="flex-1 p-3 rounded-xl border border-white/10 hover:bg-white/5 flex flex-col items-center gap-2 group transition-colors">
                 <Skull className="text-gray-500 group-hover:text-red-500" />
                 <span className="text-xs font-bold text-gray-500 group-hover:text-white">Graveyard</span>
               </button>
               <button onClick={() => confirmKillDecision('HARVEST')} className="flex-1 p-3 rounded-xl border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 flex flex-col items-center gap-2 group transition-colors">
                 <Trophy className="text-green-500" />
                 <span className="text-xs font-bold text-green-400 group-hover:text-white">Harvest (Win)</span>
               </button>
             </div>
             <button onClick={() => setKillCandidate(null)} className="w-full mt-4 text-xs text-gray-500 hover:text-white">Cancel</button>
           </GlassCard>
        </div>
      )}

      {/* The History View Modal (Restored from Old Code) */}
      {viewModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6" onClick={(e) => e.stopPropagation()}>
          <GlassCard className="w-full max-w-4xl h-[80vh] flex flex-col relative">
            <button onClick={() => setViewModal(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={24}/></button>

            <div className="mb-6 flex items-center gap-3">
              {viewModal === 'HARVESTED' ? <Trophy className="text-yellow-500" size={24}/> : <Archive className="text-gray-500" size={24}/>}
              <h2 className="text-2xl font-bold text-white">{viewModal === 'HARVESTED' ? 'Hall of Fame' : 'The Graveyard'}</h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {signals.filter(s => viewModal === 'HARVESTED' ? (s.phase === 'harvested' || s.phase === 'delivered') : s.phase === 'graveyard').map(s => (
                <div key={s.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white">{s.title}</span>
                      <span className="text-[10px] bg-white/10 px-2 rounded text-gray-400">{s.sector}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500 mt-2">
                      <span className="flex items-center gap-1"><Clock size={12}/> {s.hoursLogged}h</span>
                      <span className="flex items-center gap-1"><DollarSign size={12}/> ${formatNumber(s.totalGenerated)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600 mb-1">{new Date(s.updatedAt).toLocaleDateString()}</div>
                    {viewModal === 'GRAVEYARD' && (
                       // Allow revival
                       <button onClick={() => { updateSignal({...s, phase: 'discovery'}); setViewModal(null); }} className="text-xs text-blue-400 hover:underline">Revive</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}


      {/* --- HEADER (Merged) --- */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-6">
        <div>
           <h1 className="text-3xl font-bold text-white mb-2">Deal Flow</h1>
           <div className="flex gap-4 text-xs">
             <div className="flex items-center gap-2">
               <span className="text-gray-500">Win Rate:</span>
               <span className="font-mono font-bold text-green-400">{analytics.winRate.toFixed(1)}%</span>
             </div>
             {/* Restored Top Sector Stat */}
             {analytics.bestSector && (
               <div className="flex items-center gap-2">
                 <span className="text-gray-500">Top Sector:</span>
                 <span className="font-mono font-bold text-blue-400">{analytics.bestSector[0]} (${formatNumber(analytics.bestSector[1].value)})</span>
               </div>
             )}
           </div>
        </div>

        {/* Restored View Buttons */}
        <div className="flex gap-2">
          <GlassButton size="sm" variant="secondary" onClick={() => setViewModal('GRAVEYARD')}>
             <Archive size={16} className="mr-2"/> Graveyard
          </GlassButton>
          <GlassButton size="sm" variant="secondary" onClick={() => setViewModal('HARVESTED')}>
             <Trophy size={16} className="mr-2"/> Harvested
          </GlassButton>
          <GlassButton size="sm" onClick={(e) => { e.stopPropagation(); setIsDrillOpen(true); }}>
             <Zap size={16} className="mr-2"/> New Drill
          </GlassButton>
        </div>
      </div>

      {/* --- KANBAN BOARD (New Interaction Model) --- */}
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
                      
                      {/* Price Tag (New) */}
                      {s.totalGenerated > 0 && (
                        <div className="absolute top-2 left-2 z-20 bg-green-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg flex items-center gap-0.5">
                          ${formatNumber(s.totalGenerated)}
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

                      {/* Expanded Actions (Hybrid) */}
                      {isSelected && (
                        <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2 animate-fade-in">
                           <div className="flex justify-between items-center gap-2">
                             <button onClick={(e) => { e.stopPropagation(); setDossierSignal(s); }} className="flex-1 text-xs font-bold text-white bg-green-600/20 hover:bg-green-600/40 px-3 py-1.5 rounded-lg flex items-center justify-center gap-2 border border-green-500/30">
                               <Maximize2 size={12}/> Dossier
                             </button>
                             {col.id !== 'delivered' && (
                               <button onClick={(e) => { e.stopPropagation(); handleMoveNext(s, col.id); }} className="text-xs font-bold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/30 px-3 py-1.5 rounded-lg border border-blue-500/20">
                                 <ArrowRight size={14} />
                               </button>
                             )}
                           </div>
                           
                           <button onClick={(e) => { e.stopPropagation(); initiateKill(s); }} className="text-[10px] text-red-500 hover:text-red-400 flex items-center justify-center gap-1 w-full pt-1">
                             <Skull size={12}/> Kill / End Signal
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
