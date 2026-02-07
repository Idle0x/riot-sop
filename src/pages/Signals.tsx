import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLedger } from '../context/LedgerContext';
import { supabase } from '../lib/supabase'; 

// COMPONENTS
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { DrillModeModal } from '../components/signals/DrillModeModal'; 
import { SignalDossierModal } from '../components/signals/SignalDossierModal'; 
import { ClosureModal } from '../components/signals/ClosureModal'; 
import { TransitionWizard } from '../components/signals/TransitionWizard'; 
import { GraveyardVault } from '../components/signals/GraveyardVault'; 
import { OperatorsManual } from '../components/signals/OperatorsManual'; 
import { TreasuryVault } from '../components/signals/TreasuryVault'; 

// UTILS
import { formatNumber } from '../utils/format';
import { getSectorStyle, generateAssetID } from '../utils/colors'; 
import { transitionLifecycle } from '../utils/lifecycle'; 
import { type Signal, type SignalPhase } from '../types';

// ICONS
import { 
  Zap, Maximize2, Skull, Archive, 
  DollarSign, ArrowRight, ArrowLeft, Flame, Snowflake, Landmark, BookOpen 
} from 'lucide-react';

export const Signals = () => {
  const navigate = useNavigate();
  const { signals, updateSignal, addSignal, commitAction } = useLedger();

  // --- MODAL STATE ---
  const [isDrillOpen, setIsDrillOpen] = useState(false);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null); 
  const [showGraveyard, setShowGraveyard] = useState(false);
  const [showTreasury, setShowTreasury] = useState(false); 
  const [showManual, setShowManual] = useState(false); 

  const [dossierSignal, setDossierSignal] = useState<Signal | null>(null);       
  const [killSignal, setKillSignal] = useState<Signal | null>(null); 
  const [promoteSignal, setPromoteSignal] = useState<{signal: Signal, phase: SignalPhase} | null>(null);

  // --- ANALYTICS ENGINE ---
  const analytics = useMemo(() => {
    const total = signals.length;
    const wins = signals.filter(s => s.totalGenerated > 0);
    const winRate = total > 0 ? (wins.length / total) * 100 : 0;
    
    const sectors: Record<string, { count: number, value: number }> = {};
    signals.forEach(s => {
      const sec = s.sector || 'Uncategorized';
      if (!sectors[sec]) sectors[sec] = { count: 0, value: 0 };
      sectors[sec].count++;
      sectors[sec].value += s.totalGenerated;
    });

    const bestSector = Object.entries(sectors).sort((a, b) => b[1].value - a[1].value)[0];
    return { winRate, bestSector };
  }, [signals]);

  // --- CORE HANDLERS ---
  const handleManualAction = (actionId: string) => {
    if (actionId === 'open_drill') setIsDrillOpen(true);
    if (actionId === 'open_triage') navigate('/triage');
  };

  const handleHarvestClick = (signal: Signal) => {
    // Deep-links the amount if known, or just the source ID
    navigate(`/triage?source=${encodeURIComponent(signal.id)}`);
  };

  const initiateMove = (signal: Signal, currentPhase: SignalPhase, direction: 'next' | 'prev') => {
    const activeColumns: SignalPhase[] = ['discovery', 'validation', 'contribution', 'delivered'];
    const currentIndex = activeColumns.indexOf(currentPhase);
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= 0 && nextIndex < activeColumns.length) {
       setPromoteSignal({ signal, phase: activeColumns[nextIndex] });
    }
  };

  const confirmMove = (notes: string, addedHours: number) => {
    if (!promoteSignal) return;
    const { signal, phase } = promoteSignal;
    const newHours = (signal.hoursLogged || 0) + addedHours;
    const updatedLifecycle = transitionLifecycle(signal, phase, newHours, notes);

    updateSignal({ 
        ...signal, 
        phase, 
        hoursLogged: newHours,
        lifecycle: updatedLifecycle, 
        updatedAt: new Date().toISOString() 
    });

    commitAction({
      date: new Date().toISOString(),
      type: 'SIGNAL_ADVANCE',
      title: `Phase Shift: ${signal.title}`,
      description: `Moved to ${phase.toUpperCase()} | ${notes}`,
      linkedSignalId: signal.id
    });
    setPromoteSignal(null);
  };

  const confirmKill = (outcome: any) => {
    if (!killSignal) return;
    const updatedLifecycle = transitionLifecycle(killSignal, 'graveyard', killSignal.hoursLogged || 0, outcome.reason);
    updateSignal({ ...killSignal, phase: 'graveyard', outcome, lifecycle: updatedLifecycle, updatedAt: new Date().toISOString() });
    commitAction({ date: new Date().toISOString(), type: 'SIGNAL_KILL', title: `Killed: ${killSignal.title}`, description: outcome.reason, linkedSignalId: killSignal.id });
    setKillSignal(null);
  };

  const activeColumns: { id: SignalPhase; label: string; color: string }[] = [
    { id: 'discovery', label: 'Discovery', color: 'bg-blue-500' },
    { id: 'validation', label: 'Validation', color: 'bg-yellow-500' },
    { id: 'contribution', label: 'Contribution', color: 'bg-purple-500' },
    { id: 'delivered', label: 'Delivered', color: 'bg-green-500' },
  ];

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col p-4 md:p-8 pb-20 overflow-hidden" onClick={() => setSelectedSignalId(null)}>
      
      {/* MODALS */}
      {isDrillOpen && <DrillModeModal onClose={() => setIsDrillOpen(false)} onSave={(data) => { addSignal(data as any); setIsDrillOpen(false); }} />}
      {dossierSignal && <SignalDossierModal signal={dossierSignal} onClose={() => setDossierSignal(null)} onUpdate={(s) => updateSignal(s)}/>}
      {killSignal && <ClosureModal signal={killSignal} onClose={() => setKillSignal(null)} onConfirm={confirmKill} />}
      {promoteSignal && <TransitionWizard signal={promoteSignal.signal} targetPhase={promoteSignal.phase} onClose={() => setPromoteSignal(null)} onConfirm={confirmMove} />}
      {showGraveyard && <GraveyardVault onClose={() => setShowGraveyard(false)} onRevive={(s) => updateSignal({...s, phase: 'discovery'})} />}
      {showTreasury && <TreasuryVault onClose={() => setShowTreasury(false)} />}
      <OperatorsManual isOpen={showManual} onClose={() => setShowManual(false)} onAction={handleManualAction} />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-8">
        <div>
           <h1 className="text-3xl font-bold text-white tracking-tight">Deal Flow</h1>
           <div className="flex gap-4 text-[10px] mt-2 font-mono uppercase tracking-widest text-gray-500">
             <span>Win Rate: <b className="text-green-400">{analytics.winRate.toFixed(1)}%</b></span>
             {analytics.bestSector && <span>Alpha: <b className="text-blue-400">{analytics.bestSector[0]}</b></span>}
           </div>
        </div>

        <div className="flex gap-2">
          <GlassButton size="sm" variant="secondary" onClick={() => setShowTreasury(true)} className="text-yellow-400 border-yellow-500/20">
             <Landmark size={14} className="mr-2"/> Treasury
          </GlassButton>
          <GlassButton size="sm" variant="secondary" onClick={() => setShowGraveyard(true)}>
             <Archive size={14} className="mr-2"/> Crypt
          </GlassButton>
          <GlassButton size="sm" onClick={(e) => { e.stopPropagation(); setIsDrillOpen(true); }}>
             <Zap size={14} className="mr-2"/> New Drill
          </GlassButton>
        </div>
      </div>

      {/* BOARD */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-12">
        {activeColumns.map(col => (
          <div key={col.id} className="min-w-[320px] max-w-[320px] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${col.color} shadow-[0_0_8px] shadow-current`}/>
                <span className="font-bold text-[10px] uppercase text-gray-400 tracking-tighter">{col.label}</span>
              </div>
              <span className="text-[10px] font-mono text-gray-600">{signals.filter(s => s.phase === col.id).length}</span>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              {signals.filter(s => s.phase === col.id).map(s => {
                const isSelected = selectedSignalId === s.id;
                const sector = getSectorStyle(s.sector);
                const assetID = generateAssetID(s.title, s.createdAt);
                
                // Activity Logic
                const daysInactive = (new Date().getTime() - new Date(s.updatedAt).getTime()) / (1000*60*60*24);
                const isStale = daysInactive > 14;

                return (
                  <div key={s.id} onClick={(e) => { e.stopPropagation(); setSelectedSignalId(isSelected ? null : s.id); }}>
                    <GlassCard className={`p-4 cursor-pointer relative transition-all duration-500 border-l-2 ${sector.border} ${isSelected ? 'ring-1 ring-white/20 bg-white/10' : ''} ${isStale ? 'opacity-50' : ''}`}>
                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter ${sector.bg} ${sector.text}`}>
                          {s.sector}
                        </span>
                        <span className="text-[9px] font-mono text-gray-600 uppercase">{assetID}</span>
                      </div>

                      <h4 className="font-bold text-white text-sm mb-4 line-clamp-1">{s.title}</h4>

                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <div className="flex items-center gap-2">
                           {daysInactive < 3 && <Flame size={12} className="text-orange-500 animate-pulse"/>}
                           <span className="text-gray-500">{s.hoursLogged}h</span>
                        </div>
                        {s.totalGenerated > 0 && <span className="text-green-400 font-bold">${formatNumber(s.totalGenerated)}</span>}
                      </div>

                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-white/5 space-y-3 animate-slide-up">
                          <div className="flex gap-2">
                             <button onClick={(e) => { e.stopPropagation(); initiateMove(s, col.id, 'prev'); }} disabled={col.id === 'discovery'} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white disabled:opacity-0"><ArrowLeft size={14}/></button>
                             <button onClick={(e) => { e.stopPropagation(); setDossierSignal(s); }} className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2"><Maximize2 size={12}/> Dossier</button>
                             <button onClick={(e) => { e.stopPropagation(); handleHarvestClick(s); }} className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20"><DollarSign size={14}/></button>
                             <button onClick={(e) => { e.stopPropagation(); initiateMove(s, col.id, 'next'); }} disabled={col.id === 'delivered'} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white disabled:opacity-0"><ArrowRight size={14}/></button>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setKillSignal(s); }} className="w-full text-[10px] text-red-500/50 hover:text-red-500 flex items-center justify-center gap-1 py-1"><Skull size={10}/> TERMINATE SIGNAL</button>
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

      {/* OPERATING MANUAL BAR */}
      <div 
        onClick={() => setShowManual(true)}
        className="fixed bottom-0 left-0 right-0 h-10 bg-black/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-between px-6 cursor-pointer group z-50 hover:bg-zinc-900 transition-all"
      >
        <div className="flex items-center gap-4">
          <BookOpen size={14} className="text-gray-500 group-hover:text-green-400 transition-colors"/>
          <span className="text-[10px] font-bold tracking-[0.2em] text-gray-500 group-hover:text-gray-200">OPERATOR'S MANUAL V2.0 // SYSTEM READY</span>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-[9px] font-mono text-gray-700">LVL_{analytics.winRate > 50 ? 'ELITE' : 'OPERATIVE'}</span>
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"/>
        </div>
      </div>

    </div>
  );
};
