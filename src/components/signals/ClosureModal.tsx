import { useState, useMemo } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { type Signal } from '../../types';
import { Skull, Trophy, Ban, AlertTriangle, X, Flame, Calendar } from 'lucide-react';

interface Props {
  signal: Signal;
  onConfirm: (outcome: any) => void;
  onClose: () => void;
}

export const ClosureModal = ({ signal, onConfirm, onClose }: Props) => {
  const [reason, setReason] = useState<'retired_winner' | 'failure' | 'rejected' | null>(null);
  const [note, setNote] = useState('');

  const stats = useMemo(() => {
    const created = new Date(signal.createdAt).getTime();
    const daysAlive = Math.ceil((new Date().getTime() - created) / (1000 * 60 * 60 * 24));
    return { daysAlive, hours: signal.hoursLogged || 0 };
  }, [signal]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
      <GlassCard className="w-full max-w-md p-0 border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.15)] flex flex-col max-h-[90vh]">
        <div className="p-4 md:p-6 border-b border-white/10 flex justify-between items-start bg-red-950/10 shrink-0">
          <div className="min-w-0 pr-4">
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2 mb-0.5 md:mb-1">
                  <Skull className="text-red-500 shrink-0" size={18}/> Project Closure
              </h2>
              <p className="text-[10px] md:text-xs text-gray-400 truncate">
                  Terminate Asset: <span className="text-white font-bold">{signal.title}</span>
              </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1 shrink-0"><X size={18}/></button>
        </div>
        
        <div className="p-4 md:p-6 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-5 md:mb-6">
            <div className="p-2.5 md:p-3 bg-white/5 rounded-lg md:rounded-xl border border-white/10 text-center">
                <div className="text-[8px] md:text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center justify-center gap-1"><Flame size={10} className="text-red-500"/> Total Burn</div>
                <div className="text-lg md:text-xl font-mono font-bold text-red-400">{stats.hours}h</div>
            </div>
            <div className="p-2.5 md:p-3 bg-white/5 rounded-lg md:rounded-xl border border-white/10 text-center">
                <div className="text-[8px] md:text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center justify-center gap-1"><Calendar size={10} className="text-blue-500"/> Life Span</div>
                <div className="text-lg md:text-xl font-mono font-bold text-white">{stats.daysAlive}d</div>
            </div>
          </div>
          
          <p className="text-[11px] md:text-sm text-gray-300 mb-3 md:mb-4 text-center font-bold">Why is this ending?</p>
          
          <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-6">
            {['rejected', 'failure', 'retired_winner'].map(r => (
               <button key={r} onClick={() => setReason(r as any)} className={`p-2.5 md:p-4 rounded-lg md:rounded-xl border flex flex-col items-center justify-center gap-1.5 md:gap-2 transition-all ${reason === r ? 'bg-white/10 border-white text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10 hover:text-gray-300'}`}>
                  {r === 'failure' ? <Skull size={18}/> : r === 'rejected' ? <Ban size={18}/> : <Trophy size={18}/>}
                  <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-center leading-tight">
                      {r === 'retired_winner' ? 'RETIRED WINNER' : r}
                  </span>
               </button>
            ))}
          </div>
          
          {reason && (
            <div className="animate-fade-in space-y-3 md:space-y-4">
              <div className="p-2.5 md:p-3 rounded-lg text-[10px] md:text-xs border bg-red-500/5 border-red-500/20 text-red-400 font-bold flex items-start gap-2">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5"/>
                  <div>This will log a permanent outcome in the graveyard.</div>
              </div>
              <textarea 
                  className="w-full bg-black/40 border border-white/10 rounded-lg md:rounded-xl p-3 text-xs md:text-sm text-white h-20 md:h-24 outline-none focus:border-red-500/50 transition-colors resize-none" 
                  placeholder="Final autopsy notes (Why did it fail/succeed?)..." 
                  value={note} 
                  onChange={e => setNote(e.target.value)} 
                  autoFocus
              />
              <GlassButton className="w-full text-xs md:text-sm py-2.5 md:py-3 mt-1" onClick={() => onConfirm({ status: reason, reason: note, finalRoi: signal.totalGenerated })} disabled={!note} variant="danger">
                  Confirm Permanent Closure
              </GlassButton>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
