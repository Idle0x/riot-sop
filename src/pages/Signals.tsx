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
import { ClosureModal } from '../components/signals/ClosureModal'; 
import { TransitionWizard } from '../components/signals/TransitionWizard'; 
import { GraveyardVault } from '../components/signals/GraveyardVault'; 
import { OperatorsManual } from '../components/signals/OperatorsManual'; // THE CODEX

// UTILS
import { formatNumber } from '../utils/format';
import { getSectorStyle, generateAssetID } from '../utils/colors'; 
import { type Signal, type SignalPhase } from '../types';

// ICONS
import { 
  Zap, Maximize2, Skull, Trophy, Archive, Clock, 
  DollarSign, ArrowRight, Flame, Snowflake 
} from 'lucide-react';

export const Signals = () => {
  const navigate = useNavigate();
  const { signals, updateSignal, addSignal, commitAction } = useLedger();

  // --- STATE MANAGEMENT ---
  const [isDrillOpen, setIsDrillOpen] = useState(false);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null); 
  const [showGraveyard, setShowGraveyard] = useState(false);
  const [showManual, setShowManual] = useState(false); // Manual State

  // Active Modals
  const [dossierSignal, setDossierSignal] = useState<Signal | null>(null);       
  const [harvestSignal, setHarvestSignal] = useState<Signal | null>(null); 
  const [killSignal, setKillSignal] = useState<Signal | null>(null); 
  const [promoteSignal, setPromoteSignal] = useState<{signal: Signal, phase: SignalPhase} | null>(null);

  // --- ANALYTICS ---
  const analytics = useMemo(() => {
    const totalSignals = signals.length;
    const wins = signals.filter(s => s.phase === 'delivered' || s.phase === 'harvested');
    const winRate = totalSignals > 0 ? (wins.length / totalSignals) * 100 : 0;

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

  // --- NERVOUS SYSTEM (Manual Actions) ---
  const handleManualAction = (actionId: string) => {
    if (actionId === 'open_drill') setIsDrillOpen(true);
    if (actionId === 'open_triage') navigate('/triage');
  };

  // --- ACTIONS ---

  const handleDossierUpdate = async (updatedSignal: Signal, logContent: string) => {
    updateSignal(updatedSignal);
    
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

  // Phase Transition Handoff
  const initiateMove = (signal: Signal, currentPhase: SignalPhase) => {
    const nextIndex = activeColumns.findIndex(c => c.id === currentPhase) + 1;
    if (nextIndex < activeColumns.length) {
       const nextPhase = activeColumns[nextIndex].id;
       setPromoteSignal({ signal, phase: nextPhase });
    }
  };

  const confirmMove = (notes: string, addedHours: number) => {
    if (!promoteSignal) return;
    const { signal, phase } = promoteSignal;
    
    updateSignal({ 
        ...signal, 
        phase, 
        hoursLogged: (signal.hoursLogged || 0) + addedHours,
        updatedAt: new Date().toISOString() 
    });

    commitAction({
      date: new Date().toISOString(),
      type: 'SIGNAL_ADVANCE',
      title: `Advanced: ${signal.title}`,
      description: `To ${phase} | ${notes}`,
      linkedSignalId: signal.id
    });
    setPromoteSignal(null);
  };

  const confirmKill = (outcome: any) => {
    if (!killSignal) return;
    updateSignal({ 
        ...killSignal, 
        phase: 'graveyard', 
        outcome,
        updatedAt: new Date().toISOString() 
    });
    commitAction({ 
        date: new Date().toISOString(), 
        type: 'SIGNAL_KILL', 
        title: `Killed: ${killSignal.title}`, 
        description: `${outcome.status}: ${outcome.reason}`, 
        linkedSignalId: killSignal.id 
    });
    setKillSignal(null);
    setSelectedSignalId(null);
  };

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
      description: `Profit: $${formatNumber(amount)}`,
      linkedSignalId: harvestSignal.id,
      amount: amount
    });
    setHarvestSignal(null);
    navigate(`/triage?source=${encodeURIComponent(harvestSignal.title)}&amount=${amount}`);
  };

  const activeColumns: { id: SignalPhase; label: string; color: string }[] = [
    { id: 'discovery', label: 'Discovery', color: 'bg-blue-500' },
    { id: 'validation', label: 'Validation', color: 'bg-yellow-500' },
    { id: 'contribution', label: 'Contribution', color: 'bg-purple-500' },
    { id: 'delivered', label: 'Delivered', color: 'bg-green-500' },
  ];

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col p-4 md:p-8 pb-20" onClick={() => setSelectedSignalId(null)}>

      {/* --- MODAL MANAGER --- */}
      {isDrillOpen && <DrillModeModal onClose={() => setIsDrillOpen(false)} onSave={handleCreateFromDrill} />}
      {dossierSignal && <SignalDossierModal signal={dossierSignal} onClose={() => setDossierSignal(null)} onUpdate={handleDossierUpdate}/>}
      {harvestSignal && <HarvestModal signal={harvestSignal} onClose={() => setHarvestSignal(null)} onConfirm={handleHarvestConfirm} />}
      {killSignal && <ClosureModal signal={killSignal} onClose={() => setKillSignal(null)} onConfirm={confirmKill} />}
      {promoteSignal && <TransitionWizard signal={promoteSignal.signal} targetPhase={promoteSignal.phase} onClose={() => setPromoteSignal(null)} onConfirm={confirmMove} />}
      {showGraveyard && <GraveyardVault onClose={() => setShowGraveyard(false)} onRevive={(s) => { updateSignal({...s, phase: 'discovery'}); setShowGraveyard(false); }} />}
      <OperatorsManual isOpen={showManual} onClose={() => setShowManual(false)} onAction={handleManualAction} />

      {/* --- HEADER --- */}
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
                 <span className="font-mono font-bold text-blue-400">{analytics.bestSector[0]} (${formatNumber(analytics.bestSector[1].value)})</span>
               </div>
             )}
           </div>
        </div>

        <div className="flex gap-2">
          <GlassButton size="sm" variant="secondary" onClick={() => setShowGraveyard(true)}>
             <Archive size={16} className="mr-2"/> The Crypt
          </GlassButton>
          <GlassButton size="sm" onClick={(e) => { e.stopPropagation(); setIsDrillOpen(true); }}>
             <Zap size={16} className="mr-2"/> New Drill
          </GlassButton>
        </div>
      </div>

      {/* --- KANBAN BOARD --- */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-12">
        {activeColumns.map(col => (
          <div key={col.id} className="min-w-[300px] flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <div className={`w-2 h-2 rounded-full ${col.color}`}/>
              <span className="font-bold text-xs uppercase text-gray-400">{col.label}</span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pb-20">
              {signals.filter(s => s.phase === col.id).map(s => {
                const isSelected = selectedSignalId === s.id;
                const sectorStyle = getSectorStyle(s.sector);
                const assetID = generateAssetID(s.title, s.createdAt);

                // STATUS LOGIC
                const now = new Date().getTime();
                const lastActive = new Date(s.lastSessionAt || s.updatedAt).getTime();
                const daysInactive = (now - lastActive) / (1000 * 60 * 60 * 24);
                const isStale = daysInactive > 14;
                const isMissingIntel = !s.research.links.website || !s.research.findings || s.research.findings.length < 50;
                const isHot = !isStale && daysInactive < 3;

                return (
                  <div key={s.id} onClick={(e) => { e.stopPropagation(); setSelectedSignalId(isSelected ? null : s.id); }}>
                    <GlassCard 
                        className={`
                            p-4 cursor-pointer relative transition-all duration-300 border-l-4
                            ${sectorStyle.border} ${sectorStyle.shadow}
                            ${isStale ? 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0' : 'hover:bg-white/5'}
                            ${isSelected ? 'scale-[1.02] z-10 bg-white/10' : ''}
                        `}
                    >
                      <div className="absolute top-2 right-2 text-[10px] font-mono text-gray-600 tracking-wider opacity-50">
                          {assetID}
                      </div>

                      <div className="flex gap-1 absolute top-2 right-12">
                          {isHot && <Flame size={12} className="text-orange-500 animate-pulse" title="Hot Streak"/>}
                          {isStale && <Snowflake size={12} className="text-blue-300" title="Stale / Frozen"/>}
                          {isMissingIntel && <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse mt-1" title="Incomplete Data"/>}
                      </div>

                      {s.totalGenerated > 0 && (
                        <div className={`absolute top-2 left-3 z-20 ${sectorStyle.bg} ${sectorStyle.text} text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm`}>
                          ${formatNumber(s.totalGenerated)}
                        </div>
                      )}

                      <h4 className={`font-bold text-white text-sm mb-2 mt-4 truncate pr-8 ${isStale ? 'text-gray-400' : ''}`}>
                          {s.title}
                      </h4>

                      <div className="flex justify-between items-center text-[10px]">
                        <span className={`px-1.5 py-0.5 rounded font-mono ${sectorStyle.bg} ${sectorStyle.text}`}>
                           {s.sector}
                        </span>
                        <span className={`${isMissingIntel ? 'text-orange-400' : s.confidence > 7 ? 'text-green-500' : 'text-gray-500'}`}>
                           {s.confidence}/10 Conf
                        </span>
                      </div>

                      {isSelected && (
                        <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2 animate-fade-in">
                           <div className="flex justify-between items-center gap-2">
                             <button onClick={(e) => { e.stopPropagation(); setDossierSignal(s); }} className="flex-1 text-xs font-bold text-white bg-green-600/20 hover:bg-green-600/40 px-3 py-1.5 rounded-lg flex items-center justify-center gap-2 border border-green-500/30">
                               <Maximize2 size={12}/> Dossier
                             </button>
                             {col.id === 'delivered' ? (
                                <button onClick={(e) => { e.stopPropagation(); setHarvestSignal(s); }} className="text-xs font-bold text-green-400 hover:text-white bg-green-500/10 hover:bg-green-500/30 px-3 py-1.5 rounded-lg border border-green-500/20">
                                    <DollarSign size={14} />
                                </button>
                             ) : (
                                <button onClick={(e) => { e.stopPropagation(); initiateMove(s, col.id); }} className="text-xs font-bold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/30 px-3 py-1.5 rounded-lg border border-blue-500/20">
                                    <ArrowRight size={14} />
                                </button>
                             )}
                           </div>

                           <button onClick={(e) => { e.stopPropagation(); setKillSignal(s); }} className="text-[10px] text-red-500 hover:text-red-400 flex items-center justify-center gap-1 w-full pt-1">
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

      {/* --- THE BOTTOM DOCK --- */}
      <div 
        onClick={() => setShowManual(true)}
        className="fixed bottom-0 left-0 right-0 h-12 bg-black/80 backdrop-blur-md border-t border-white/10 flex items-center justify-between px-6 cursor-pointer hover:bg-black/90 transition-colors z-40 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
          <span className="text-xs font-bold tracking-widest text-gray-400 group-hover:text-white transition-colors">SIGNAL OPERATOR'S MANUAL [v2.0]</span>
        </div>
        <div className="text-[10px] text-gray-600 font-mono hidden md:block">
          SYSTEM_READY // CLICK_TO_INIT
        </div>
      </div>

    </div>
  );
};
