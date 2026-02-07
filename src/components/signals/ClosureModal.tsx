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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
      <GlassCard className="w-full max-w-lg p-0 border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
        <div className="p-6 border-b border-white/10 flex justify-between items-start bg-red-950/10">
          <div><h2 className="text-xl font-bold text-white flex items-center gap-2"><Skull className="text-red-500" size={20}/> Project Closure</h2><p className="text-xs text-gray-400 mt-1">Terminate Asset: <span className="text-white font-bold">{signal.title}</span></p></div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20}/></button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center"><div className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center justify-center gap-1"><Flame size={10} className="text-red-500"/> Total Burn</div><div className="text-xl font-mono font-bold text-red-400">{stats.hours}h</div></div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center"><div className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center justify-center gap-1"><Calendar size={10} className="text-blue-500"/> Life Span</div><div className="text-xl font-mono font-bold text-white">{stats.daysAlive}d</div></div>
          </div>
          <p className="text-sm text-gray-300 mb-4 text-center font-bold">Why is this ending?</p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {['rejected', 'failure', 'retired_winner'].map(r => (
               <button key={r} onClick={() => setReason(r as any)} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${reason === r ? 'bg-white/10 border-white text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'}`}>
                  {r === 'failure' ? <Skull size={20}/> : r === 'rejected' ? <Ban size={20}/> : <Trophy size={20}/>}
                  <span className="text-[10px] font-bold uppercase">{r.replace('_', ' ')}</span>
               </button>
            ))}
          </div>
          {reason && (
            <div className="animate-fade-in space-y-4">
              <div className="p-3 rounded-lg text-xs border bg-white/5 border-white/10 text-gray-400"><AlertTriangle size={12} className="inline mr-2 -mt-0.5"/>This will log a permanent outcome.</div>
              <textarea className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white h-24 outline-none" placeholder="Final autopsy notes..." value={note} onChange={e => setNote(e.target.value)} autoFocus/>
              <GlassButton className="w-full" onClick={() => onConfirm({ status: reason, reason: note, finalRoi: signal.totalGenerated })} disabled={!note} variant="danger">Confirm Closure</GlassButton>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
