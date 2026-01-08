import { useState } from 'react';
import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { DrillModeModal } from '../components/signals/DrillModeModal'; 
import { type Signal, type SignalPhase } from '../types';
import { Clock, DollarSign, ArrowRight, Copy, Zap } from 'lucide-react';

export const Signals = () => {
  const { signals, updateSignal, commitAction } = useFinancials();
  const [isDrillOpen, setIsDrillOpen] = useState(false);

  const columns: { id: SignalPhase; label: string; color: string }[] = [
    { id: 'discovery', label: 'Discovery', color: 'bg-blue-500' },
    { id: 'validation', label: 'Validation', color: 'bg-yellow-500' },
    { id: 'contribution', label: 'Contribution', color: 'bg-purple-500' },
    { id: 'delivered', label: 'Delivered', color: 'bg-green-500' },
  ];

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
      title: 'New Vetted Project', // User would rename this later
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

  const copyProofOfWork = () => {
    const delivered = signals.filter(s => s.phase === 'delivered' || s.phase === 'harvested');
    const md = delivered.map(s => `- **${s.title}** (${s.sector}): Delivered with ${s.confidence}/10 confidence. Generated $${s.totalGenerated}.`).join('\n');
    navigator.clipboard.writeText("# Proof of Work\n" + md);
    alert("Proof of Work copied to clipboard!");
  };

  // ROI Logic
  const getHourlyRate = (s: Signal) => {
    if (s.hoursLogged === 0) return 0;
    return (s.totalGenerated / s.hoursLogged).toFixed(0);
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col p-4 md:p-8 pb-20">
      
      {isDrillOpen && <DrillModeModal onClose={() => setIsDrillOpen(false)} onSave={handleCreateFromDrill} />}

      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-3xl font-bold text-white">Hunter-Creator Radar</h1>
           <p className="text-gray-400 text-sm">Manage Deal Flow & Output</p>
        </div>
        <div className="flex gap-2">
          <GlassButton size="sm" variant="secondary" onClick={copyProofOfWork}>
             <Copy size={16} className="mr-2"/> Export PoW
          </GlassButton>
          <GlassButton size="sm" onClick={() => setIsDrillOpen(true)}>
             <Zap size={16} className="mr-2"/> Drill Mode
          </GlassButton>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => (
          <div key={col.id} className="min-w-[300px] flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <div className={`w-2 h-2 rounded-full ${col.color}`}/>
              <span className="font-bold text-xs uppercase text-gray-400">{col.label}</span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto">
              {signals.filter(s => s.phase === col.id).map(s => (
                <GlassCard key={s.id} className="p-4 hover:border-white/30 cursor-pointer group">
                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300">{s.sector}</span>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1"><Clock size={10}/> {s.hoursLogged}h</span>
                  </div>
                  
                  <h4 className="font-bold text-white text-sm mb-2">{s.title}</h4>

                  <div className="flex gap-2 text-[10px] mb-2">
                    <span className={`${s.confidence > 7 ? 'text-green-500' : 'text-orange-500'}`}>{s.confidence.toFixed(1)}/10 Conf</span>
                    
                    {/* ROI Display */}
                    {s.totalGenerated > 0 && s.hoursLogged > 0 && (
                       <span className="text-green-400 font-mono">${getHourlyRate(s)}/hr</span>
                    )}
                  </div>

                  {s.totalGenerated > 0 && (
                    <div className="bg-green-500/10 text-green-500 text-xs font-bold p-2 rounded flex items-center gap-1 justify-center mb-2">
                      <DollarSign size={12}/> ${s.totalGenerated}
                    </div>
                  )}

                  {/* Quick Move */}
                  <div className="pt-2 border-t border-white/10 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => moveSignal(s, 'graveyard')} className="text-[10px] text-gray-500 hover:text-red-500 mr-auto">Archive</button>
                     <button onClick={() => moveSignal(s, 'contribution')} className="text-[10px] text-white hover:underline flex items-center gap-1">Next <ArrowRight size={10}/></button>
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
