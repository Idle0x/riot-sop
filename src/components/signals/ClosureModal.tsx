import { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { type Signal } from '../../types';
import { Skull, Trophy, Ban, AlertTriangle } from 'lucide-react';

interface Props {
  signal: Signal;
  onConfirm: (outcome: any) => void;
  onClose: () => void;
}

export const ClosureModal = ({ signal, onConfirm, onClose }: Props) => {
  const [reason, setReason] = useState<'retired_winner' | 'failure' | 'rejected' | null>(null);
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    if (!reason) return;
    onConfirm({
      status: reason,
      reason: note,
      finalRoi: signal.totalGenerated // Snapshot the ROI
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
      <GlassCard className="w-full max-w-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Project Closure</h2>
        <p className="text-gray-400 text-sm mb-6">Why is <span className="text-white font-bold">{signal.title}</span> ending?</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <button 
            onClick={() => setReason('retired_winner')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
              reason === 'retired_winner' 
              ? 'bg-green-500/20 border-green-500 text-green-400' 
              : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'
            }`}
          >
            <Trophy size={24} />
            <span className="text-xs font-bold">Retired Winner</span>
          </button>

          <button 
            onClick={() => setReason('failure')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
              reason === 'failure' 
              ? 'bg-red-500/20 border-red-500 text-red-400' 
              : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'
            }`}
          >
            <Skull size={24} />
            <span className="text-xs font-bold">Rug / Failed</span>
          </button>

          <button 
            onClick={() => setReason('rejected')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
              reason === 'rejected' 
              ? 'bg-orange-500/20 border-orange-500 text-orange-400' 
              : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'
            }`}
          >
            <Ban size={24} />
            <span className="text-xs font-bold">Filter Reject</span>
          </button>
        </div>

        {reason && (
          <div className="animate-fade-in space-y-4">
            <div className={`p-3 rounded-lg text-xs border ${
                reason === 'retired_winner' ? 'bg-green-900/20 border-green-900 text-green-300' :
                reason === 'failure' ? 'bg-red-900/20 border-red-900 text-red-300' :
                'bg-orange-900/20 border-orange-900 text-orange-300'
            }`}>
               <AlertTriangle size={12} className="inline mr-2"/>
               {reason === 'retired_winner' && "This locks the ROI. It will count towards your Win Rate."}
               {reason === 'failure' && "Honesty check: Did you ignore red flags? Log it below."}
               {reason === 'rejected' && "Good filter. You saved time."}
            </div>

            <textarea 
              className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white h-24"
              placeholder="Final notes for the Graveyard..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />

            <GlassButton className="w-full" onClick={handleConfirm} disabled={!note}>
              Confirm Closure
            </GlassButton>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
