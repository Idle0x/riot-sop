import { useState, useMemo } from 'react';
import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { DrillModeModal } from '../components/signals/DrillModeModal'; 
import { type Signal, type SignalPhase } from '../types';
import { Clock, DollarSign, ArrowRight, Zap, Archive, Trophy, X, AlertTriangle } from 'lucide-react';

export const Signals = () => {
  const { signals, updateSignal, commitAction } = useFinancials();
  
  // UI States
  const [isDrillOpen, setIsDrillOpen] = useState(false);
  const [viewModal, setViewModal] = useState<'HARVESTED' | 'GRAVEYARD' | null>(null);
  
  // --- ANALYTICS ENGINE ---
  const analytics = useMemo(() => {
    const totalSignals = signals.length;
    const wins = signals.filter(s => s.phase === 'delivered' || s.phase === 'harvested');
    const winRate = totalSignals > 0 ? (wins.length / totalSignals) * 100 : 0;
    
    // Sector Analysis
    const sectors: Record<string, { count: number, value: number }> = {};
    signals.forEach(s => {
      if (!sectors[s.sector]) sectors[s.sector] = { count: 0, value: 0 };
      sectors[s.sector].count++;
      sectors[s.sector].value += s.totalGenerated;
    });

    const bestSector = Object.entries(sectors).sort((a, b) => b[1].value - a[1].value)[0];

    return { winRate, bestSector };
  }, [signals]);

  // --- ACTIONS ---
  const moveSignal = (signal: Signal, phase: SignalPhase) => {
    updateSignal({ ...signal, phase, updatedAt: new Date().toISOString() });
    commitAction({
      id: crypto.randomUUID(), date: new Date().toISOString(), type: 'SIGNAL_UPDATE',
      title: `Signal moved: ${signal.title}`, description: `Moved to ${phase}`, linkedSignalId: signal.id
    });
  };

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
      ...data as any
    };
    updateSignal(newSignal);
    setIsDrillOpen(false);
  };

  const getHourlyRate = (s: Signal) => {
    if (s.hoursLogged === 0) return 0;
    return (s.totalGenerated / s.hoursLogged).toFixed(0);
  };

  // --- COLUMNS ---
  const activeColumns: { id: SignalPhase; label: string; color: string }[] = [
    { id: 'discovery', label: 'Discovery (Inbox)', color: 'bg-blue-500' },
    { id: 'validation', label: 'Validation (Filter)', color: 'bg-yellow-500' },
    { id: 'contribution', label: 'Contribution (Grind)', color: 'bg-purple-500' },
    { id: 'delivered', label: 'Delivered (Waiting)', color: 'bg-green-500' },
  ];

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col p-4 md:p-8 pb-20">
      
      {isDrillOpen && <DrillModeModal onClose={() => setIsDrillOpen(false)} onSave={handleCreateFromDrill} />}

      {/* DEEP DIVE MODAL (Harvested/Graveyard) */}
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
                    
                    {/* DEEP ANALYSIS */}
                    <div className="flex gap-4 text-xs text-gray-500 mt-2">
                      <span className="flex items-center gap-1"><Clock size={12}/> {s.hoursLogged}h Invested</span>
                      <span className="flex items-center gap-1"><DollarSign size={12}/> ${s.totalGenerated} Generated</span>
                      <span className="flex items-center gap-1 text-green-400">ROI: ${getHourlyRate(s)}/hr</span>
                    </div>

                    {/* Reasons/Flags */}
                    {s.redFlags.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {s.redFlags.map((flag, i) => (
                          <span key={i} className="text-[10px] text-red-400 border border-red-500/20 px-1.5 rounded flex items-center gap-1">
                            <AlertTriangle size={8}/> {flag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-gray-600 mb-1">{new Date(s.updatedAt).toLocaleDateString()}</div>
                    {viewModal === 'GRAVEYARD' && (
                      <button onClick={() => moveSignal(s, 'discovery')} className="text-xs text-blue-400 hover:underline">Revive</button>
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
          <div key={col.id} className="min-w-[300px] flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <div className={`w-2 h-2 rounded-full ${col.color}`}/>
              <span className="font-bold text-xs uppercase text-gray-400">{col.label}</span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto">
              {signals.filter(s => s.phase === col.id).map(s => (
                <GlassCard key={s.id} className="p-4 hover:border-white/30 cursor-pointer group relative">
                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300 font-mono tracking-tight">{s.sector}</span>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1"><Clock size={10}/> {s.hoursLogged}h</span>
                  </div>
                  
                  <h4 className="font-bold text-white text-sm mb-2">{s.title}</h4>

                  <div className="flex gap-2 text-[10px] mb-2">
                    <span className={`${s.confidence > 7 ? 'text-green-500' : 'text-orange-500'}`}>{s.confidence.toFixed(1)}/10</span>
                    <span className="text-gray-500 capitalize">{s.effort} Effort</span>
                  </div>

                  {/* Narrative/Red Flags Mini-Badges */}
                  {s.redFlags.length > 0 && (
                    <div className="mb-2">
                      <span className="text-[10px] text-red-400 flex items-center gap-1"><AlertTriangle size={8}/> {s.redFlags.length} Flags</span>
                    </div>
                  )}

                  {/* QUICK ACTIONS OVERLAY */}
                  <div className="pt-2 border-t border-white/10 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => moveSignal(s, 'graveyard')} className="text-[10px] text-gray-500 hover:text-red-500 mr-auto">Kill</button>
                     {col.id === 'delivered' ? (
                       <button onClick={() => moveSignal(s, 'harvested')} className="text-[10px] text-green-400 hover:underline flex items-center gap-1">Harvest <DollarSign size={10}/></button>
                     ) : (
                       <button onClick={() => moveSignal(s, activeColumns[activeColumns.findIndex(c => c.id === col.id) + 1].id as SignalPhase)} className="text-[10px] text-white hover:underline flex items-center gap-1">Next <ArrowRight size={10}/></button>
                     )}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
