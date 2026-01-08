import { useState, useMemo } from 'react';
import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { DrillModeModal } from '../components/signals/DrillModeModal'; 
import { TransitionWizard } from '../components/signals/TransitionWizard';
import { ClosureModal } from '../components/signals/ClosureModal';
import { type Signal, type SignalPhase } from '../types';
import { Clock, DollarSign, ArrowRight, Zap, Archive, Trophy, X, AlertTriangle, ScrollText, Github, Globe, Twitter, BookOpen, AlertCircle, Scale, Pencil } from 'lucide-react';

export const Signals = () => {
  const { signals, updateSignal, commitAction, logSignalTime } = useFinancials();

  // --- UI STATES ---
  const [isDrillOpen, setIsDrillOpen] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null); // For Dossier View
  const [transitionSignal, setTransitionSignal] = useState<{signal: Signal, target: SignalPhase} | null>(null);
  const [closureSignal, setClosureSignal] = useState<Signal | null>(null);
  const [showHarvestedOnly, setShowHarvestedOnly] = useState(false); // The Trophy Room Toggle

  // --- ANALYTICS ---
  const analytics = useMemo(() => {
    const total = signals.length;
    const wins = signals.filter(s => s.outcome?.status === 'retired_winner').length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    // ... sector logic remains same
    return { winRate };
  }, [signals]);

  // --- HELPERS ---
  const getRMultiple = (s: Signal) => {
    const cost = Math.max(1, s.hoursLogged * 20); // $20/hr base rate
    const ev = s.thesis.expectedValue || 0;
    return (ev / cost).toFixed(1);
  };

  // --- ACTIONS ---
  const handleCreate = (data: Partial<Signal>) => {
    const newSignal: Signal = {
      id: crypto.randomUUID(),
      title: 'New Project',
      sector: 'General',
      phase: 'discovery',
      confidence: 5,
      effort: 'med',
      hoursLogged: 0,
      totalGenerated: 0,
      redFlags: [],
      proofOfWork: [],
      timeline: [{ date: new Date().toISOString(), phase: 'discovery', context: 'Signal Created via Drill' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      thesis: { alpha: '', catalyst: '', invalidation: '', expectedValue: 0 },
      research: { 
        links: {}, 
        token: { status: 'none' }, 
        findings: '', 
        pickReason: '', 
        drillNotes: {} 
      },
      ...data as any // Merge drill data
    };
    updateSignal(newSignal);
    setIsDrillOpen(false);
  };

  const handleMoveConfirm = (notes: string, addedHours: number) => {
    if (!transitionSignal) return;
    const { signal, target } = transitionSignal;
    
    // Log time if added
    if (addedHours > 0) logSignalTime(signal.id, addedHours);

    // Update Phase & Timeline
    const updated: Signal = {
      ...signal,
      phase: target,
      updatedAt: new Date().toISOString(),
      hoursLogged: signal.hoursLogged + addedHours,
      timeline: [
        { date: new Date().toISOString(), phase: target, context: notes },
        ...signal.timeline
      ]
    };
    
    updateSignal(updated);
    commitAction({
      id: crypto.randomUUID(), date: new Date().toISOString(), type: 'SIGNAL_UPDATE',
      title: `Promoted: ${signal.title}`, description: `Moved to ${target}`, linkedSignalId: signal.id
    });
    setTransitionSignal(null);
  };

  const handleClosureConfirm = (outcome: any) => {
    if (!closureSignal) return;
    const updated: Signal = {
      ...closureSignal,
      phase: outcome.status === 'retired_winner' ? 'harvested' : 'graveyard',
      outcome: outcome,
      updatedAt: new Date().toISOString()
    };
    updateSignal(updated);
    commitAction({
      id: crypto.randomUUID(), date: new Date().toISOString(), type: 'SIGNAL_UPDATE',
      title: `Project Closed: ${closureSignal.title}`, description: `Outcome: ${outcome.status}`, linkedSignalId: closureSignal.id
    });
    setClosureSignal(null);
    setSelectedSignal(null); // Close dossier if open
  };

  const activeColumns: { id: SignalPhase; label: string; color: string }[] = [
    { id: 'discovery', label: 'Discovery (Inbox)', color: 'bg-blue-500' },
    { id: 'validation', label: 'Validation (Filter)', color: 'bg-yellow-500' },
    { id: 'contribution', label: 'Contribution (Grind)', color: 'bg-purple-500' },
    { id: 'delivered', label: 'Delivered (Waiting)', color: 'bg-green-500' },
  ];

  // Filter Logic: If Trophy Room is ON, show only winners. Else show active board.
  const displayedSignals = showHarvestedOnly 
    ? signals.filter(s => s.totalGenerated > 0)
    : signals.filter(s => !['harvested', 'graveyard'].includes(s.phase));

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col p-4 md:p-8 pb-20">
      
      {/* MODALS */}
      {isDrillOpen && <DrillModeModal onClose={() => setIsDrillOpen(false)} onSave={handleCreate} />}
      
      {transitionSignal && (
        <TransitionWizard 
          signal={transitionSignal.signal} 
          targetPhase={transitionSignal.target} 
          onConfirm={handleMoveConfirm} 
          onClose={() => setTransitionSignal(null)} 
        />
      )}

      {closureSignal && (
        <ClosureModal 
          signal={closureSignal} 
          onConfirm={handleClosureConfirm} 
          onClose={() => setClosureSignal(null)} 
        />
      )}

      {/* DOSSIER VIEW (Intelligence Report) */}
      {selectedSignal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
          <GlassCard className="w-full max-w-4xl h-[85vh] flex flex-col relative overflow-hidden">
            
            {/* DOSSIER HEADER */}
            <div className="p-6 border-b border-white/10 flex justify-between items-start bg-white/5">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-white">{selectedSignal.title}</h2>
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-300 border border-white/10">{selectedSignal.sector}</span>
                  {selectedSignal.research.token.status === 'live' && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30">Token Live</span>}
                </div>
                <div className="flex gap-4 text-xs text-gray-400">
                   <a href={selectedSignal.research.links.website} target="_blank" className="hover:text-white flex items-center gap-1"><Globe size={12}/> Website</a>
                   <a href={selectedSignal.research.links.twitter} target="_blank" className="hover:text-blue-400 flex items-center gap-1"><Twitter size={12}/> Twitter</a>
                   <a href={selectedSignal.research.links.github} target="_blank" className="hover:text-white flex items-center gap-1"><Github size={12}/> Code</a>
                </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => setClosureSignal(selectedSignal)} className="px-3 py-1.5 rounded border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/10">
                    {selectedSignal.totalGenerated > 0 ? 'Retire Winner' : 'Kill Project'}
                 </button>
                 <button onClick={() => setSelectedSignal(null)} className="text-gray-500 hover:text-white"><X size={24}/></button>
              </div>
            </div>

            {/* DOSSIER BODY */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
               
               {/* LEFT COL: THESIS & FINANCIALS */}
               <div className="space-y-6">
                  {/* Financials Card */}
                  <div className="p-4 bg-black/20 rounded-xl border border-white/10">
                     <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><Scale size={12}/> Financials</h3>
                     <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                           <div className="text-[10px] text-gray-500">Invested</div>
                           <div className="text-white font-mono">{selectedSignal.hoursLogged} hrs</div>
                        </div>
                        <div>
                           <div className="text-[10px] text-gray-500">Generated</div>
                           <div className="text-green-400 font-mono">${selectedSignal.totalGenerated}</div>
                        </div>
                     </div>
                     <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                        <span className="text-xs text-gray-400">R-Multiple</span>
                        <span className={`font-mono font-bold ${Number(getRMultiple(selectedSignal)) < 10 ? 'text-red-500' : 'text-green-500'}`}>{getRMultiple(selectedSignal)}x</span>
                     </div>
                  </div>

                  {/* Thesis Card */}
                  <div className="space-y-3">
                     <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-xl">
                        <div className="text-[10px] font-bold text-blue-400 mb-1">ALPHA (WHY?)</div>
                        <p className="text-xs text-gray-300 leading-relaxed">{selectedSignal.thesis.alpha}</p>
                     </div>
                     <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                        <div className="text-[10px] font-bold text-gray-400 mb-1">CATALYST (WHEN?)</div>
                        <p className="text-xs text-gray-300">{selectedSignal.thesis.catalyst}</p>
                     </div>
                     <div className="p-3 bg-red-900/10 border border-red-500/20 rounded-xl">
                        <div className="text-[10px] font-bold text-red-400 mb-1">INVALIDATION (STOP LOSS)</div>
                        <p className="text-xs text-gray-300">{selectedSignal.thesis.invalidation}</p>
                     </div>
                  </div>
               </div>

               {/* MIDDLE/RIGHT COL: INTELLIGENCE & HISTORY */}
               <div className="md:col-span-2 space-y-6">
                  {/* Findings */}
                  <div>
                     <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><BookOpen size={14}/> Deep Findings</h3>
                     <div className="p-4 bg-white/5 rounded-xl border border-white/10 min-h-[100px] text-sm text-gray-300 whitespace-pre-wrap">
                        {selectedSignal.research.findings || "No deep dive notes logged."}
                     </div>
                  </div>

                  {/* Token Logic Result */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Token Status</div>
                        <div className="text-white font-bold capitalize">{selectedSignal.research.token.status}</div>
                        {selectedSignal.research.token.status === 'pending' && (
                           <div className="text-xs text-yellow-400 mt-1">TGE: {selectedSignal.research.token.tgeDate || 'Unknown'}</div>
                        )}
                     </div>
                     <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Utility / Plan</div>
                        <div className="text-xs text-gray-300">{selectedSignal.research.token.utility || selectedSignal.research.token.launchPlan || "N/A"}</div>
                     </div>
                  </div>

                  {/* Timeline / History (The Grayed Out Logic) */}
                  <div>
                     <h3 className="text-sm font-bold text-white mb-3">Narrative History</h3>
                     <div className="space-y-4 pl-4 border-l border-white/10">
                        {selectedSignal.timeline.map((entry, i) => (
                           <div key={i} className={`relative ${i === 0 ? 'opacity-100' : 'opacity-50 hover:opacity-100 transition-opacity'}`}>
                              <div className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-accent-success' : 'bg-gray-600'}`} />
                              <div className="text-xs font-bold text-gray-400 mb-0.5">{new Date(entry.date).toLocaleDateString()} • <span className="uppercase">{entry.phase}</span></div>
                              <p className="text-sm text-gray-300">{entry.context}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

            </div>
          </GlassCard>
        </div>
      )}

      {/* HEADER CONTROLS */}
      <div className="flex justify-between items-end mb-6">
        <div>
           <h1 className="text-3xl font-bold text-white mb-2">Deal Flow</h1>
           <div className="flex gap-4 text-xs text-gray-400">
              <span>Win Rate: <span className="text-green-400 font-bold">{analytics.winRate.toFixed(0)}%</span></span>
           </div>
        </div>
        
        <div className="flex gap-2">
           <button 
             onClick={() => setShowHarvestedOnly(!showHarvestedOnly)}
             className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
               showHarvestedOnly ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-white/5 border-white/10 text-gray-400'
             }`}
           >
             <Trophy size={14}/> Trophy Room
           </button>
           <GlassButton size="sm" onClick={() => setIsDrillOpen(true)}>
             <Zap size={14} className="mr-2"/> Drill Mode
           </GlassButton>
        </div>
      </div>

      {/* BOARD */}
      {!showHarvestedOnly ? (
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
          {activeColumns.map(col => (
            <div key={col.id} className="min-w-[320px] flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <div className={`w-2 h-2 rounded-full ${col.color}`}/>
                <span className="font-bold text-xs uppercase text-gray-400">{col.label}</span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto">
                {displayedSignals.filter(s => s.phase === col.id).map(s => (
                  <GlassCard 
                    key={s.id} 
                    className="p-4 hover:border-white/30 cursor-pointer group relative"
                    onClick={() => setSelectedSignal(s)} // OPEN DOSSIER
                  >
                    <div className="flex justify-between mb-2">
                      <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300 font-mono">{s.sector}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); logSignalTime(s.id, 1); }} // QUICK LOG
                        className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1"
                      >
                        <Clock size={10}/> {s.hoursLogged}h <span className="text-accent-success ml-1 opacity-0 group-hover:opacity-100">+1h</span>
                      </button>
                    </div>

                    <h4 className="font-bold text-white text-sm mb-2">{s.title}</h4>

                    {/* Thesis Preview */}
                    <div className="text-[10px] text-gray-400 bg-black/20 p-2 rounded mb-2 line-clamp-2">
                       <span className="text-blue-400 font-bold">ALPHA:</span> {s.thesis.alpha}
                    </div>

                    {/* ACTIONS (Only visible on hover) */}
                    <div className="pt-2 border-t border-white/10 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={(e) => { e.stopPropagation(); setClosureSignal(s); }} 
                         className="text-[10px] text-gray-500 hover:text-red-500 mr-auto"
                       >
                         Kill
                       </button>
                       <button 
                         onClick={(e) => { 
                           e.stopPropagation(); 
                           const nextIdx = activeColumns.findIndex(c => c.id === col.id) + 1;
                           if (nextIdx < activeColumns.length) {
                             setTransitionSignal({ signal: s, target: activeColumns[nextIdx].id });
                           }
                         }} 
                         className="text-[10px] text-white hover:underline flex items-center gap-1"
                       >
                         Next <ArrowRight size={10}/>
                       </button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TROPHY ROOM VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {displayedSignals.map(s => (
             <GlassCard key={s.id} className="p-6 border-yellow-500/20 bg-yellow-900/5 cursor-pointer" onClick={() => setSelectedSignal(s)}>
                <div className="flex justify-between items-start mb-4">
                   <h3 className="font-bold text-white text-lg">{s.title}</h3>
                   <div className="text-green-400 font-mono font-bold">+${s.totalGenerated}</div>
                </div>
                <div className="flex gap-4 text-xs text-gray-400">
                   <span>{s.hoursLogged} Hrs</span>
                   <span className="text-green-500">{getRMultiple(s)}x ROI</span>
                </div>
             </GlassCard>
           ))}
        </div>
      )}

    </div>
  );
};
