import { useState, useMemo } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { type Signal, type SignalPhase } from '../../types';
import { Clock, ShieldCheck, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';

interface Props {
  signal: Signal;
  targetPhase: SignalPhase;
  onConfirm: (notes: string, addedHours: number) => void;
  onClose: () => void;
}

const PHASE_ORDER: SignalPhase[] = ['discovery', 'validation', 'contribution', 'delivered', 'harvested', 'graveyard'];

export const TransitionWizard = ({ signal, targetPhase, onConfirm, onClose }: Props) => {
  const [notes, setNotes] = useState('');
  const [overhead, setOverhead] = useState(false);
  
  const recordedHours = signal.hoursLogged || 0;
  // Overhead calculation: 10% buffer
  const overheadAmount = overhead ? Math.ceil(Math.max(1, recordedHours * 0.10)) : 0; 

  // Detect Direction
  const direction = useMemo(() => {
    const currentIdx = PHASE_ORDER.indexOf(signal.phase);
    const targetIdx = PHASE_ORDER.indexOf(targetPhase);
    return targetIdx >= currentIdx ? 'forward' : 'backward';
  }, [signal.phase, targetPhase]);

  const isRegress = direction === 'backward';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
      <GlassCard className={`w-full max-w-md p-6 border-white/20 relative overflow-hidden ${isRegress ? 'shadow-[0_0_30px_rgba(249,115,22,0.1)]' : 'shadow-[0_0_30px_rgba(34,197,94,0.1)]'}`}>
        
        {/* Background Accent */}
        <div className={`absolute top-0 left-0 w-full h-1 ${isRegress ? 'bg-orange-500' : 'bg-green-500'}`} />

        <div className="mb-6 border-b border-white/10 pb-4">
          <div className="flex justify-between items-center mb-1">
             <div className={`text-xs uppercase font-bold flex items-center gap-1 ${isRegress ? 'text-orange-500' : 'text-green-500'}`}>
                {isRegress ? <><AlertTriangle size={12}/> Regressing Signal</> : <><ShieldCheck size={12}/> Promoting Signal</>}
             </div>
             <div className="text-[10px] text-gray-500 font-mono">PHASE SHIFT</div>
          </div>
          <div className="flex items-center gap-3 text-xl font-bold text-white">
             <span className="text-gray-500">{signal.phase}</span>
             {isRegress ? <ArrowLeft size={16} className="text-orange-500"/> : <ArrowRight size={16} className="text-green-500"/>}
             <span className="capitalize text-white">{targetPhase}</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`p-4 rounded-xl border ${isRegress ? 'bg-orange-500/10 border-orange-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
             <div className="flex justify-between items-start mb-3">
                <div className={`flex items-center gap-2 ${isRegress ? 'text-orange-400' : 'text-blue-400'}`}>
                    <Clock size={16}/> <span className="text-sm font-bold">Close Chapter Log</span>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-white">{recordedHours}h</div>
                    <div className="text-[10px] text-gray-400">Total Hours Logged</div>
                </div>
             </div>
             
             <div className={`flex items-center justify-between pt-3 border-t ${isRegress ? 'border-orange-500/20' : 'border-blue-500/20'}`}>
                <div className="text-xs text-gray-300">
                    {isRegress ? "Add 'Pivot Overhead' (10%)?" : "Add 'Wrap-up Overhead' (10%)?"}
                </div>
                <button 
                    onClick={() => setOverhead(!overhead)} 
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${overhead ? (isRegress ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white') : 'bg-black/40 text-gray-500 hover:text-white'}`}
                >
                    {overhead ? `+${overheadAmount}h Added` : 'No Buffer'}
                </button>
             </div>
          </div>

          <textarea 
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white h-24 outline-none resize-none focus:border-white/30 transition-colors" 
            placeholder={isRegress ? "Why are we moving back? (Blockers, Pivot, etc.)" : "Reason for promotion..."} 
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
            autoFocus
          />

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 text-gray-500 hover:text-white text-sm font-bold transition-colors">Cancel</button>
            <GlassButton 
                onClick={() => onConfirm(notes, overheadAmount)} 
                className="flex-1"
                variant={isRegress ? 'danger' : 'primary'} // Assuming 'danger' variant exists, otherwise defaults usually look okay or use style
            >
                {isRegress ? 'Confirm Regression' : 'Confirm Move'}
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
