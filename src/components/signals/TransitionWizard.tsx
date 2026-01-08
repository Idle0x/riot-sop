import { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { type Signal, type SignalPhase } from '../../types';
import { ArrowRight, Clock } from 'lucide-react';

interface Props {
  signal: Signal;
  targetPhase: SignalPhase;
  onConfirm: (notes: string, addedHours: number) => void;
  onClose: () => void;
}

export const TransitionWizard = ({ signal, targetPhase, onConfirm, onClose }: Props) => {
  const [notes, setNotes] = useState('');
  const [hours, setHours] = useState('0');

  const getPrompt = () => {
    switch(targetPhase) {
      case 'validation': return "Does it pass the 5-minute filter? Is the GitHub real?";
      case 'contribution': return "What is your Entry Strategy? (Node / Code / Content)?";
      case 'delivered': return "Where is the Proof of Work? Paste asset link.";
      default: return "Context for this move?";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <GlassCard className="w-full max-w-md p-6">
        <div className="mb-6">
          <div className="text-xs text-gray-500 uppercase font-bold mb-1">Promoting Signal</div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {signal.title} <ArrowRight size={16} className="text-gray-600"/> <span className="text-accent-success capitalize">{targetPhase}</span>
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-accent-info uppercase block mb-2">{getPrompt()}</label>
            <textarea 
              className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white h-24 focus:border-accent-info/50 outline-none transition-colors"
              placeholder="Log your reasoning..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-2">
              <Clock size={12}/> Time spent in {signal.phase}?
            </label>
            <div className="flex gap-2">
              {[0, 1, 2, 5, 10].map(h => (
                <button 
                  key={h}
                  onClick={() => setHours(h.toString())}
                  className={`flex-1 py-2 rounded-lg border text-xs font-bold ${
                    hours === h.toString() ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-white/10'
                  }`}
                >
                  +{h}h
                </button>
              ))}
            </div>
            <input 
               type="number" 
               className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white mt-2"
               placeholder="Custom Amount"
               value={hours}
               onChange={e => setHours(e.target.value)}
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-3 text-gray-500 hover:text-white text-sm">Cancel</button>
            <GlassButton onClick={() => onConfirm(notes, parseFloat(hours) || 0)} className="flex-1">
              Confirm Move
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
