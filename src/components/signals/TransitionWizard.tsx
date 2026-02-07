import { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { type Signal, type SignalPhase } from '../../types';
import { Clock, ShieldCheck } from 'lucide-react';

interface Props {
  signal: Signal;
  targetPhase: SignalPhase;
  onConfirm: (notes: string, addedHours: number) => void;
  onClose: () => void;
}

export const TransitionWizard = ({ signal, targetPhase, onConfirm, onClose }: Props) => {
  const [notes, setNotes] = useState('');
  const [overhead, setOverhead] = useState(false);
  const recordedHours = signal.hoursLogged || 0;
  const overheadAmount = overhead ? Math.ceil(recordedHours * 0.10) : 0; 

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
      <GlassCard className="w-full max-w-md p-6 border-white/20">
        <div className="mb-6 border-b border-white/10 pb-4">
          <div className="text-xs text-gray-500 uppercase font-bold mb-1">Promoting Signal</div>
          <h2 className="text-xl font-bold text-white">To <span className="text-accent-success capitalize">{targetPhase}</span></h2>
        </div>
        <div className="space-y-6">
          <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
             <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 text-blue-400"><Clock size={16}/> <span className="text-sm font-bold">Time Reconciliation</span></div>
                <div className="text-right"><div className="text-2xl font-mono font-bold text-white">{recordedHours}h</div><div className="text-[10px] text-gray-400">Recorded Sessions</div></div>
             </div>
             <div className="flex items-center justify-between pt-3 border-t border-blue-500/20">
                <div className="text-xs text-gray-300">Add 10% Unlogged Overhead?</div>
                <button onClick={() => setOverhead(!overhead)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${overhead ? 'bg-blue-500 text-white' : 'bg-black/40 text-gray-500'}`}>{overhead ? `+${overheadAmount}h Added` : 'No Buffer'}</button>
             </div>
          </div>
          <textarea className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white h-24 outline-none resize-none" placeholder="Reason for promotion..." value={notes} onChange={e => setNotes(e.target.value)} autoFocus/>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 text-gray-500 hover:text-white text-sm">Cancel</button>
            <GlassButton onClick={() => onConfirm(notes, overheadAmount)} className="flex-1"><ShieldCheck size={16} className="mr-2"/> Confirm Move</GlassButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
