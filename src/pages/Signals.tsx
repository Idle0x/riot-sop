import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLedger } from '../context/LedgerContext';
import { supabase } from '../lib/supabase';

import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { Naira } from '../components/ui/Naira';
import { DrillModeModal } from '../components/signals/DrillModeModal'; 
import { SignalDossierModal } from '../components/signals/SignalDossierModal';

import { formatNumber } from '../utils/format';
import { type Signal, type SignalPhase } from '../types';

import { 
  Zap, Maximize2, Skull, Trophy, Archive, Clock, 
  ArrowRight, X, DollarSign, Target, TrendingUp 
} from 'lucide-react';

export const Signals = () => {
  const navigate = useNavigate();
  const { signals, updateSignal, addSignal, commitAction } = useLedger();

  const [isDrillOpen, setIsDrillOpen] = useState(false);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [dossierSignal, setDossierSignal] = useState<Signal | null>(null);
  const [killCandidate, setKillCandidate] = useState<Signal | null>(null);
  const [viewModal, setViewModal] = useState<'HARVESTED' | 'GRAVEYARD' | null>(null);

  const analytics = useMemo(() => {
    const totalSignals = signals.length;
    const wins = signals.filter(s => s.phase === 'delivered' || s.phase === 'harvested');
    const winRate = totalSignals > 0 ? (wins.length / totalSignals) * 100 : 0;
    const sectors: Record<string, { count: number, value: number }> = {};
    signals.forEach(s => {
      const sector = s.sector || 'General';
      if (!sectors[sector]) sectors[sector] = { count: 0, value: 0 };
      sectors[sector].count++;
      sectors[sector].value += (s.totalGenerated || 0);
    });
    const bestSector = Object.entries(sectors).sort((a, b) => b[1].value - a[1].value)[0];
    return { winRate, bestSector };
  }, [signals]);

  const getHourlyRate = (s: Signal) => {
    if (!s.hoursLogged || s.hoursLogged === 0) return 0;
    return (s.totalGenerated / s.hoursLogged);
  };

  const moveSignalQuick = (e: React.MouseEvent, signal: Signal, nextPhase: SignalPhase) => {
    e.stopPropagation();
    updateSignal({ ...signal, phase: nextPhase, updatedAt: new Date().toISOString() });
    commitAction({
      date: new Date().toISOString(),
      type: 'SIGNAL_UPDATE',
      title: `Phase Shift: ${signal.title}`,
      description: `Moved to ${nextPhase}`,
      linkedSignalId: signal.id
    });
  };

  const handleDossierUpdate = async (updatedSignal: Signal, logContent: string) => {
    updateSignal(updatedSignal);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('signal_logs').insert({
      signal_id: updatedSignal.id,
      user_id: user?.id,
      type: 'FIELD_REPORT',
      content: logContent
    });
    commitAction({
      date: new Date().toISOString(),
      type: 'SIGNAL_UPDATE',
      title: `Dossier Updated: ${updatedSignal.title}`,
      description: logContent,
      linkedSignalId: updatedSignal.id
    });
  };

  const initiateKill = (signal: Signal) => {
    if (signal.totalGenerated > 0) {
      setKillCandidate(signal);
    } else {
      updateSignal({ ...signal, phase: 'graveyard', updatedAt: new Date().toISOString() });
      commitAction({ date: new Date().toISOString(), type: 'SIGNAL_KILL', title: `Terminated: ${signal.title}`, description: 'Moved to graveyard', linkedSignalId: signal.id });
      setSelectedSignalId(null);
    }
  };

  const confirmKillDecision = (decision: 'GRAVEYARD' | 'HARVEST') => {
    if (!killCandidate) return;
    const isHarvest = decision === 'HARVEST';
    const phase = isHarvest ? 'harvested' : 'graveyard';
    updateSignal({ ...killCandidate, phase, updatedAt: new Date().toISOString() });
    commitAction({ 
      date: new Date().toISOString(), 
      type: isHarvest ? 'SIGNAL_HARVEST' : 'SIGNAL_KILL', 
      title: `${isHarvest ? 'Harvested' : 'Killed'}: ${killCandidate.title}`, 
      linkedSignalId: killCandidate.id,
      amount: killCandidate.totalGenerated
    });
    setKillCandidate(null);
    setSelectedSignalId(null);
    if (isHarvest) navigate(`/triage?source=${encodeURIComponent(killCandidate.title)}&amount=${killCandidate.totalGenerated}`);
  };

  const activeColumns: { id: SignalPhase; label: string; color: string }[] = [
    { id: 'discovery', label: 'Discovery', color: 'bg-blue-500' },
    { id: 'validation', label: 'Validation', color: 'bg-yellow-500' },
    { id: 'contribution', label: 'Contribution', color: 'bg-purple-500' },
    { id: 'delivered', label: 'Delivered', color: 'bg-green-500' },
  ];

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col p-4 md:p-8 pb-20" onClick={() => setSelectedSignalId(null)}>
      {isDrillOpen && (
        <DrillModeModal 
          onClose={() => setIsDrillOpen(false)} 
          onSave={(data) => {
            if (!data.title) return;
            addSignal({
              ...data,
              title: data.title,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              phase: 'discovery',
              totalGenerated: 0,
              hoursLogged: 0,
              sector: data.sector || 'General',
              confidence: data.confidence || 5,
              effort: data.effort || 'low',
              redFlags: [],
              proofOfWork: [],
              timeline: [],
              thesis: data.thesis || { alpha: '', catalyst: '', invalidation: '', expectedValue: 0 },
              research: data.research || { links: {}, token: { status: 'none' }, findings: '', pickReason: '', drillNotes: {} }
            } as Signal);
            setIsDrillOpen(false);
          }} 
        />
      )}
      {dossierSignal && <SignalDossierModal signal={dossierSignal} onClose={() => setDossierSignal(null)} onUpdate={handleDossierUpdate}/>}

      {killCandidate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
           <GlassCard className="max-w-md w-full p-6 border-white/20">
             <div className="flex items-center gap-3 mb-4 text-yellow-500">
               <Skull size={24} />
               <h2 className="text-xl font-bold text-white">Retire Signal</h2>
             </div>
             <p className="text-sm text-gray-300 mb-6 leading-relaxed">
               <strong className="text-white">{killCandidate.title}</strong> has generated <span className="text-green-400 font-mono"><Naira/>{formatNumber(killCandidate.totalGenerated)}</span>.
             </p>
             <div className="flex gap-3">
               <button onClick={() => confirmKillDecision('GRAVEYARD')} className="flex-1 p-4 rounded-xl border border-white/10 hover:bg-white/5 flex flex-col items-center gap-2 group transition-all">
                 <Skull className="text-gray-500 group-hover:text-red-500" />
                 <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Graveyard</span>
               </button>
               <button onClick={() => confirmKillDecision('HARVEST')} className="flex-1 p-4 rounded-xl border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 flex flex-col items-center gap-2 group transition-all">
                 <Trophy className="text-green-500" />
                 <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Harvest (Win)</span>
               </button>
             </div>
             <button onClick={() => setKillCandidate(null)} className="w-full mt-4 text-[10px] font-black text-gray-600 hover:text-white uppercase tracking-widest">Abort</button>
           </GlassCard>
        </div>
      )}

      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
          <GlassCard className="w-full max-w-4xl h-[80vh] flex flex-col relative border-white/10">
            <button onClick={() => setViewModal(null)} className="absolute top-6 right-6 text-gray-600 hover:text-white transition-colors"><X size={24}/></button>
            <div className="p-8">
              <div className="mb-8 flex items-center gap-3">
                {viewModal === 'HARVESTED' ? <Trophy className="text-yellow-500" size={28}/> : <Archive className="text-gray-500" size={28}/>}
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{viewModal === 'HARVESTED' ? 'Hall of Fame' : 'The Graveyard'}</h2>
              </div>
              <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-4">
                {signals.filter(s => viewModal === 'HARVESTED' ? (s.phase === 'harvested' || s.phase === 'delivered') : s.phase === 'graveyard').map(s => (
                  <div key={s.id} className="p-5 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center hover:bg-white/10">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-lg">{s.title}</span>
                        <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded font-black text-gray-500 uppercase tracking-widest">{s.sector}</span>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500 mt-2 font-mono">
                        <span className="flex items-center gap-1"><Clock size={12}/> {s.hoursLogged}h</span>
                        <span className="flex items-center gap-1 text-green-500"><Naira/>{formatNumber(s.totalGenerated)}</span>
                        {getHourlyRate(s) > 0 && <span className="text-blue-500">ROI: <Naira/>{formatNumber(getHourlyRate(s))}/hr</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-8">
        <div>
           <h1 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase italic">Deal Flow</h1>
           <div className="flex gap-6 text-[10px] uppercase tracking-[0.3em] font-black">
             <div className="flex items-center gap-2">
               <span className="text-gray-600">Win Rate:</span>
               <span className="text-green-500">{analytics.winRate.toFixed(1)}%</span>
             </div>
             {analytics.bestSector && (
               <div className="flex items-center gap-2 border-l border-white/5 pl-6">
                 <span className="text-gray-600">Alpha Sector:</span>
                 <span className="text-blue-400">{analytics.bestSector[0]} (<Naira/>{formatNumber(analytics.bestSector[1].value)})</span>
               </div>
             )}
           </div>
        </div>
        <div className="flex gap-2">
          <GlassButton size="sm" variant="secondary" onClick={() => setViewModal('GRAVEYARD')} className="border-white/5">
             <Archive size={14} className="mr-2"/> Graveyard
          </GlassButton>
          <GlassButton size="sm" variant="secondary" onClick={() => setViewModal('HARVESTED')} className="border-white/5">
             <Trophy size={14} className="mr-2"/> Archive
          </GlassButton>
          <GlassButton size="sm" onClick={(e) => { e.stopPropagation(); setIsDrillOpen(true); }} className="bg-white text-black hover:bg-gray-200">
             <Zap size={14} className="mr-2 fill-current"/> New Drill
          </GlassButton>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
        {activeColumns.map((col, idx) => (
          <div key={col.id} className="min-w-[320px] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${col.color}`}/>
                <span className="font-black text-[10px] uppercase text-gray-500 tracking-[0.2em]">{col.label}</span>
              </div>
              <span className="text-[10px] font-mono text-gray-700">{signals.filter(s => s.phase === col.id).length}</span>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto pb-20 pr-1">
              {signals.filter(s => s.phase === col.id).map(s => {
                const isSelected = selectedSignalId === s.id;
                const nextPhase = activeColumns[idx + 1]?.id;
                const roi = getHourlyRate(s);
                return (
                  <div key={s.id} onClick={(e) => { e.stopPropagation(); setSelectedSignalId(isSelected ? null : s.id); }}>
                    <GlassCard className={`p-5 cursor-pointer relative transition-all duration-500 ${isSelected ? 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.1)] scale-[1.02] z-10' : 'hover:border-white/20 group'}`}>
                      {s.totalGenerated > 0 && (
                        <div className="absolute -top-2 -left-2 z-20 bg-green-500 text-black text-[9px] font-black px-2 py-0.5 rounded shadow-lg uppercase">
                          <DollarSign size={8} className="inline mr-0.5"/> {formatNumber(s.totalGenerated)}
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[9px] bg-white/5 border border-white/5 px-2 py-0.5 rounded-full text-gray-500 font-black uppercase tracking-widest">{s.sector}</span>
                        <div className="flex items-center gap-2 text-gray-700">
                           <Clock size={10}/>
                           <span className="text-[10px] font-mono">{s.hoursLogged}h</span>
                        </div>
                      </div>
                      <h4 className="font-bold text-white text-md mb-3 leading-tight uppercase tracking-tight">{s.title}</h4>
                      <div className="flex items-center gap-4 text-[10px] mb-2 font-black uppercase tracking-tighter">
                        <span className={`${s.confidence > 7 ? 'text-green-500' : 'text-orange-500'} flex items-center gap-1`}>
                          <Target size={10}/> {s.confidence}/10
                        </span>
                        {roi > 0 && (
                          <span className="text-blue-500 flex items-center gap-1">
                            <TrendingUp size={10}/> <Naira/>{formatNumber(roi)}/hr
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                           <button onClick={(e) => { e.stopPropagation(); setDossierSignal(s); }} className="text-[10px] font-black text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg flex items-center gap-2 border border-white/10 uppercase tracking-widest">
                             <Maximize2 size={12}/> Dossier
                           </button>
                           <div className="flex items-center gap-3">
                             <button onClick={(e) => { e.stopPropagation(); initiateKill(s); }} className="text-gray-600 hover:text-red-500 p-1 transition-colors"><Skull size={16}/></button>
                             {nextPhase && (
                               <button onClick={(e) => moveSignalQuick(e, s, nextPhase)} className="text-white hover:text-blue-500 p-1 transition-colors"><ArrowRight size={18}/></button>
                             )}
                           </div>
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
