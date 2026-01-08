import { useState, useMemo } from 'react';
import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { GlassInput } from '../components/ui/GlassInput';
import { DrillModeModal } from '../components/signals/DrillModeModal'; 
import { type Signal, type SignalPhase } from '../types';
import { Clock, DollarSign, ArrowRight, Zap, Archive, Trophy, X, AlertTriangle, ScrollText, PenLine, Scale, BrainCircuit } from 'lucide-react';
import { Naira } from '../components/ui/Naira';

export const Signals = () => {
  const { signals, updateSignal, commitAction } = useFinancials();

  // --- UI STATES ---
  const [isDrillOpen, setIsDrillOpen] = useState(false);
  const [viewModal, setViewModal] = useState<'HARVESTED' | 'GRAVEYARD' | null>(null);
  
  // NEW: Editing State for Thesis
  const [editingSignal, setEditingSignal] = useState<Signal | null>(null);
  
  // NEW: Post-Mortem State (The Interrogation)
  const [postMortemSignal, setPostMortemSignal] = useState<{ signal: Signal, targetPhase: SignalPhase } | null>(null);
  const [postMortemAnswers, setPostMortemAnswers] = useState({ plan: '', luck: '' });

  // --- ANALYTICS ENGINE ---
  const analytics = useMemo(() => {
    const totalSignals = signals.length;
    const wins = signals.filter(s => s.phase === 'delivered' || s.phase === 'harvested');
    const winRate = totalSignals > 0 ? (wins.length / totalSignals) * 100 : 0;

    const sectors: Record<string, { count: number, value: number }> = {};
    signals.forEach(s => {
      if (!sectors[s.sector]) sectors[s.sector] = { count: 0, value: 0 };
      sectors[s.sector].count++;
      sectors[s.sector].value += s.totalGenerated;
    });

    const bestSector = Object.entries(sectors).sort((a, b) => b[1].value - a[1].value)[0];
    return { winRate, bestSector };
  }, [signals]);

  // --- CALCULATORS ---
  const getHourlyRate = (s: Signal) => {
    if (s.hoursLogged === 0) return 0;
    return (s.totalGenerated / s.hoursLogged).toFixed(0);
  };

  const getRMultiple = (s: Signal) => {
    // Est. Cost = Hours * $20 (Assumed base rate for calculation)
    const cost = Math.max(1, s.hoursLogged * 20); 
    const ev = s.thesis?.expectedValue || 0;
    const r = ev / cost;
    return r.toFixed(1);
  };

  // --- ACTIONS ---

  // 1. Initiate Move (Intercept for Post-Mortem)
  const initiateMove = (signal: Signal, phase: SignalPhase) => {
    if (phase === 'graveyard' || phase === 'harvested') {
      setPostMortemSignal({ signal, targetPhase: phase });
    } else {
      executeMove(signal, phase);
    }
  };

  // 2. Execute Move (Final Commit)
  const executeMove = (signal: Signal, phase: SignalPhase, notes?: string) => {
    updateSignal({ ...signal, phase, updatedAt: new Date().toISOString() });
    
    let description = `Moved to ${phase}`;
    if (notes) description += ` | Post-Mortem: ${notes}`;

    commitAction({
      id: crypto.randomUUID(), 
      date: new Date().toISOString(), 
      type: 'SIGNAL_UPDATE',
      title: `Signal moved: ${signal.title}`, 
      description, 
      linkedSignalId: signal.id
    });
  };

  // 3. Handle Post-Mortem Submit
  const submitPostMortem = () => {
    if (!postMortemSignal) return;
    const notes = `Plan: ${postMortemAnswers.plan} | Luck/Skill: ${postMortemAnswers.luck}`;
    executeMove(postMortemSignal.signal, postMortemSignal.targetPhase, notes);
    setPostMortemSignal(null);
    setPostMortemAnswers({ plan: '', luck: '' });
  };

  // 4. Handle Thesis Save
  const saveThesis = () => {
    if (editingSignal) {
      updateSignal(editingSignal);
      setEditingSignal(null);
    }
  };

  // 5. Create New Signal
  const handleCreateFromDrill = (data: Partial<Signal>) => {
    const newSignal: Signal = {
      id: crypto.randomUUID(),
      title: 'New Vetted Project', 
      sector: 'General',
      phase: 'discovery',
      confidence: data.confidence || 5,
      effort: 'med',
      hoursLogged: 0,
      totalGenerated: 0,
      redFlags: data.redFlags || [],
      proofOfWork: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      checklist: data.checklist,
      thesis: {
        alpha: 'Pending Analysis',
        catalyst: 'Pending',
        invalidation: 'Pending',
        expectedValue: 0,
        ...data.thesis
      },
      ...data as any
    };
    updateSignal(newSignal);
    setIsDrillOpen(false);
  };

  const activeColumns: { id: SignalPhase; label: string; color: string }[] = [
    { id: 'discovery', label: 'Discovery (Inbox)', color: 'bg-blue-500' },
    { id: 'validation', label: 'Validation (Filter)', color: 'bg-yellow-500' },
    { id: 'contribution', label: 'Contribution (Grind)', color: 'bg-purple-500' },
    { id: 'delivered', label: 'Delivered (Waiting)', color: 'bg-green-500' },
  ];

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col p-4 md:p-8 pb-20">

      {/* MODAL: DRILL MODE */}
      {isDrillOpen && <DrillModeModal onClose={() => setIsDrillOpen(false)} onSave={handleCreateFromDrill} />}

      {/* MODAL: THESIS EDITOR */}
      {editingSignal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
          <GlassCard className="w-full max-w-lg p-6 relative">
            <button onClick={() => setEditingSignal(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><PenLine size={20}/> Investment Thesis</h2>
            
            <div className="space-y-4">
              <GlassInput 
                label="The Alpha (Why is this unique?)" 
                value={editingSignal.thesis.alpha} 
                onChange={e => setEditingSignal({...editingSignal, thesis: {...editingSignal.thesis, alpha: e.target.value}})}
              />
              <GlassInput 
                label="The Catalyst (What triggers payout?)" 
                value={editingSignal.thesis.catalyst} 
                onChange={e => setEditingSignal({...editingSignal, thesis: {...editingSignal.thesis, catalyst: e.target.value}})}
              />
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <GlassInput 
                  label="The Invalidation (When do I quit?)" 
                  className="text-red-300"
                  value={editingSignal.thesis.invalidation} 
                  onChange={e => setEditingSignal({...editingSignal, thesis: {...editingSignal.thesis, invalidation: e.target.value}})}
                />
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                 <GlassInput 
                  label="Expected Value (USD)" 
                  type="number"
                  className="text-green-400 font-mono"
                  value={editingSignal.thesis.expectedValue} 
                  onChange={e => setEditingSignal({...editingSignal, thesis: {...editingSignal.thesis, expectedValue: Number(e.target.value)}})}
                />
              </div>
              <GlassButton className="w-full" onClick={saveThesis}>Lock Thesis</GlassButton>
            </div>
          </GlassCard>
        </div>
      )}

      {/* MODAL: POST-MORTEM (THE INTERROGATION) */}
      {postMortemSignal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
          <GlassCard className="w-full max-w-md p-6 relative">
             <button onClick={() => setPostMortemSignal(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
             <div className="mb-6 text-center">
               <BrainCircuit size={40} className="mx-auto text-accent-info mb-2"/>
               <h2 className="text-xl font-bold text-white">Post-Mortem Required</h2>
               <p className="text-xs text-gray-400 uppercase">Honesty is your only edge.</p>
             </div>

             <div className="space-y-4">
               <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">Did you follow your plan?</label>
                 <textarea 
                   className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white mt-1 h-20"
                   placeholder="Yes/No and why..."
                   value={postMortemAnswers.plan}
                   onChange={e => setPostMortemAnswers({...postMortemAnswers, plan: e.target.value})}
                 />
               </div>
               <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">Was it Luck or Skill?</label>
                 <select 
                   className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white mt-1"
                   value={postMortemAnswers.luck}
                   onChange={e => setPostMortemAnswers({...postMortemAnswers, luck: e.target.value})}
                 >
                   <option value="">Select...</option>
                   <option value="Skill">Pure Skill (Thesis played out)</option>
                   <option value="Luck">Luck (Market saved me)</option>
                   <option value="Bad Luck">Bad Luck (Black swan)</option>
                   <option value="Stupidity">Stupidity (I ignored flags)</option>
                 </select>
               </div>
               <GlassButton 
                  className="w-full" 
                  disabled={!postMortemAnswers.plan || !postMortemAnswers.luck}
                  onClick={submitPostMortem}
                >
                  Confirm Move
                </GlassButton>
             </div>
          </GlassCard>
        </div>
      )}

      {/* MODAL: DEEP DIVE (Harvested/Graveyard) */}
      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
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
                      <span className="flex items-center gap-1"><Clock size={12}/> {s.hoursLogged}h Invested</span>
                      <span className="flex items-center gap-1"><DollarSign size={12}/> ${s.totalGenerated} Generated</span>
                      <span className="flex items-center gap-1 text-green-400">ROI: ${getHourlyRate(s)}/hr</span>
                    </div>
                    {/* THESIS DISPLAY */}
                    {s.thesis && (
                        <div className="mt-3 p-3 bg-black/20 rounded-lg border border-white/5 text-xs text-gray-400 font-mono space-y-1">
                            <div><span className="text-blue-400 font-bold">ALPHA:</span> {s.thesis.alpha}</div>
                            <div><span className="text-red-400 font-bold">INVALIDATION:</span> {s.thesis.invalidation}</div>
                        </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600 mb-1">{new Date(s.updatedAt).toLocaleDateString()}</div>
                    {viewModal === 'GRAVEYARD' && (
                      <button onClick={() => initiateMove(s, 'discovery')} className="text-xs text-blue-400 hover:underline">Revive</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* HEADER & METRICS */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-6">
        <div>
           <h1 className="text-3xl font-bold text-white mb-2">Deal Flow</h1>
           <div className="flex gap-4 text-xs">
             <div className="flex items-center gap-2">
               <span className="text-gray-500">Win Rate:</span>
               <span className="font-mono font-bold text-green-400">{analytics.winRate.toFixed(1)}%</span>
             </div>
             {analytics.bestSector && (
               <div className="flex items-center gap-2">
                 <span className="text-gray-500">Top Sector:</span>
                 <span className="font-mono font-bold text-blue-400">{analytics.bestSector[0]} (${analytics.bestSector[1].value})</span>
               </div>
             )}
           </div>
        </div>

        <div className="flex gap-2">
          <GlassButton size="sm" variant="secondary" onClick={() => setViewModal('GRAVEYARD')}>
             <Archive size={16} className="mr-2"/> Graveyard
          </GlassButton>
          <GlassButton size="sm" variant="secondary" onClick={() => setViewModal('HARVESTED')}>
             <Trophy size={16} className="mr-2"/> Harvested
          </GlassButton>
          <GlassButton size="sm" onClick={() => setIsDrillOpen(true)}>
             <Zap size={16} className="mr-2"/> Drill Mode
          </GlassButton>
        </div>
      </div>

      {/* KANBAN BOARD */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {activeColumns.map(col => (
          <div key={col.id} className="min-w-[320px] flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <div className={`w-2 h-2 rounded-full ${col.color}`}/>
              <span className="font-bold text-xs uppercase text-gray-400">{col.label}</span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto">
              {signals.filter(s => s.phase === col.id).map(s => {
                const rMultiple = getRMultiple(s);
                const isBadBet = Number(rMultiple) < 10;
                
                return (
                  <GlassCard key={s.id} className="p-4 hover:border-white/30 cursor-pointer group relative">
                    {/* Header: Sector & Time */}
                    <div className="flex justify-between mb-2">
                      <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300 font-mono tracking-tight">{s.sector}</span>
                      <span className="text-[10px] text-gray-500 flex items-center gap-1"><Clock size={10}/> {s.hoursLogged}h</span>
                    </div>

                    <h4 className="font-bold text-white text-sm mb-2">{s.title}</h4>

                    {/* R-MULTIPLE BADGE (Risk/Reward) */}
                    <div className="flex items-center justify-between mb-2 p-1.5 bg-black/40 rounded border border-white/5">
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Scale size={10}/> R-Multiple
                        </div>
                        <div className={`font-mono text-xs font-bold ${isBadBet ? 'text-red-500' : 'text-green-400'}`}>
                            {rMultiple}x {isBadBet && <span className="text-[8px] uppercase ml-1">(BAD BET)</span>}
                        </div>
                    </div>

                    {/* THESIS PREVIEW */}
                    {s.thesis && (
                       <div 
                         onClick={(e) => { e.stopPropagation(); setEditingSignal(s); }}
                         className="mb-2 flex items-start gap-2 text-[10px] text-gray-400 bg-black/20 p-2 rounded border border-white/5 hover:bg-white/5 transition-colors cursor-text"
                       >
                          <ScrollText size={12} className="mt-0.5 shrink-0"/>
                          <div>
                              <div className="font-bold text-blue-400 mb-0.5">THESIS:</div>
                              <span className="line-clamp-2 italic">{s.thesis.alpha === 'Pending Analysis' ? 'Click to write thesis...' : s.thesis.alpha}</span>
                          </div>
                       </div>
                    )}

                    <div className="flex gap-2 text-[10px] mb-2">
                      <span className={`${s.confidence > 7 ? 'text-green-500' : 'text-orange-500'}`}>{s.confidence.toFixed(1)}/10 Conf</span>
                      <span className="text-gray-500 capitalize">{s.effort} Effort</span>
                    </div>

                    {s.redFlags.length > 0 && (
                      <div className="mb-2">
                        <span className="text-[10px] text-red-400 flex items-center gap-1"><AlertTriangle size={8}/> {s.redFlags.length} Flags</span>
                      </div>
                    )}

                    {/* ACTIONS OVERLAY */}
                    <div className="pt-2 border-t border-white/10 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => initiateMove(s, 'graveyard')} className="text-[10px] text-gray-500 hover:text-red-500 mr-auto">Kill</button>
                       {col.id === 'delivered' ? (
                         <button onClick={() => initiateMove(s, 'harvested')} className="text-[10px] text-green-400 hover:underline flex items-center gap-1">Harvest <DollarSign size={10}/></button>
                       ) : (
                         <button onClick={() => initiateMove(s, activeColumns[activeColumns.findIndex(c => c.id === col.id) + 1].id as SignalPhase)} className="text-[10px] text-white hover:underline flex items-center gap-1">Next <ArrowRight size={10}/></button>
                       )}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
