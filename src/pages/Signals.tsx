import { useState } from 'react';
import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { Signal, SignalPhase } from '../types';
import { Plus, ExternalLink, Clock, DollarSign, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';

export const Signals = () => {
  const { signals, updateSignal, commitAction } = useFinancials();
  
  // COLUMNS CONFIG
  const columns: { id: SignalPhase; label: string; color: string }[] = [
    { id: 'discovery', label: 'Discovery', color: 'bg-blue-500' },
    { id: 'validation', label: 'Validation', color: 'bg-yellow-500' },
    { id: 'contribution', label: 'Contribution', color: 'bg-purple-500' },
    { id: 'delivered', label: 'Delivered', color: 'bg-green-500' },
  ];

  // --- ACTIONS ---
  const handleMove = (signal: Signal, newPhase: SignalPhase) => {
    const updated = { ...signal, phase: newPhase, updatedAt: new Date().toISOString() };
    updateSignal(updated);
    commitAction({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: 'SIGNAL_UPDATE',
      title: `Moved ${signal.title} to ${newPhase}`,
      linkedSignalId: signal.id
    });
  };

  return (
    <div className="h-[calc(100vh-80px)] overflow-x-auto p-4 md:p-8 animate-fade-in pb-20">
      <div className="flex justify-between items-center mb-6 min-w-[1000px]">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Signal Radar</h1>
          <p className="text-gray-400">Hunter-Creator Deal Flow</p>
        </div>
        <GlassButton>
          <Plus size={16} className="mr-2" /> New Signal
        </GlassButton>
      </div>

      <div className="flex gap-6 min-w-[1000px] h-full">
        {columns.map(col => (
          <div key={col.id} className="w-80 flex flex-col gap-4">
            {/* Column Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-glass-border">
              <div className={`w-3 h-3 rounded-full ${col.color}`} />
              <span className="font-bold text-sm text-gray-300 uppercase tracking-wider">{col.label}</span>
              <span className="ml-auto text-xs text-gray-500">
                {signals.filter(s => s.phase === col.id).length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-2">
              {signals.filter(s => s.phase === col.id).map(signal => (
                <GlassCard key={signal.id} className="p-4 hover:border-white/20 cursor-pointer group relative">
                  {/* Sector Tag */}
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300 font-mono">
                      {signal.sector}
                    </span>
                    {signal.hoursLogged > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Clock size={10} /> {signal.hoursLogged}h
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-white mb-1">{signal.title}</h4>
                  
                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className={cn(
                      "font-bold", 
                      signal.confidence > 7 ? "text-accent-success" : 
                      signal.confidence > 4 ? "text-accent-warning" : "text-accent-danger"
                    )}>
                      {signal.confidence}/10 Conf
                    </span>
                    <span className="capitalize">{signal.effort} Effort</span>
                  </div>

                  {/* Red Flags Warning */}
                  {signal.redFlags.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-accent-danger bg-accent-danger/10 p-1.5 rounded mb-3">
                      <AlertTriangle size={10} />
                      {signal.redFlags.length} Red Flags Logged
                    </div>
                  )}

                  {/* ROI / Generated */}
                  {signal.totalGenerated > 0 && (
                    <div className="flex items-center gap-1 text-xs text-accent-success font-bold bg-accent-success/10 p-2 rounded justify-center mb-2">
                      <DollarSign size={12} />
                      Total: ${signal.totalGenerated}
                    </div>
                  )}

                  {/* Hover Actions (Simple Phase Move) */}
                  <div className="pt-2 border-t border-glass-border flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      className="text-[10px] text-gray-400 hover:text-white"
                      onClick={() => handleMove(signal, 'graveyard')} // Simplified
                    >
                      Archive
                    </button>
                    {/* Next Phase Logic would go here */}
                    <button className="text-[10px] text-accent-info hover:text-white flex items-center gap-1">
                      Details <ExternalLink size={10} />
                    </button>
                  </div>

                </GlassCard>
              ))}
              
              {/* Empty State */}
              {signals.filter(s => s.phase === col.id).length === 0 && (
                <div className="h-24 rounded-xl border border-dashed border-glass-border flex items-center justify-center text-xs text-gray-600">
                  Empty
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
