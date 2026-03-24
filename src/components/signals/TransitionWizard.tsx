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
  const overheadAmount = overhead ? Math.ceil(Math.max(1, recordedHours * 0.10)) : 0; 

  const direction = useMemo(() => {
    const currentIdx = PHASE_ORDER.indexOf(signal.phase);
    const targetIdx = PHASE_ORDER.indexOf(targetPhase);
    return targetIdx >= currentIdx ? 'forward' : 'backward';
  }, [signal.phase, targetPhase]);

  const isRegress = direction === 'backward';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <GlassCard className={`w-full max-w-md p-5 md:p-6 border-white/20 relative overflow-hidden ${isRegress ? 'shadow-[0_0_40px_rgba(249,115,22,0.15)]' : 'shadow-[0_0_40px_rgba(34,197,94,0.15)]'}`}>

        {/* Background Accent */}
        <div className={`absolute top-0 left-0 w-full h-1 ${isRegress ? 'bg-orange-500' : 'bg-green-500'}`} />

        <div className="mb-4 md:mb-6 border-b border-white/10 pb-3 md:pb-4">
          <div className="flex justify-between items-center mb-1.5 md:mb-2">
             <div className={`text-[10px] md:text-xs uppercase font-bold flex items-center gap-1.5 ${isRegress ? 'text-orange-500' : 'text-green-500'}`}>
                {isRegress ? <><AlertTriangle size={12} className="md:w-3.5 md:h-3.5"/> Regressing Signal</> : <><ShieldCheck size={12} className="md:w-3.5 md:h-3.5"/> Promoting Signal</>}
             </div>
             <div className="text-[8px] md:text-[10px] text-gray-500 font-mono tracking-widest font-bold">PHASE SHIFT</div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 text-lg md:text-xl font-bold text-white">
             <span className="text-gray-500 truncate max-w-[120px] md:max-w-none">{signal.phase}</span>
             {isRegress ? <ArrowLeft size={16} className="text-orange-500 shrink-0"/> : <ArrowRight size={16} className="text-green-500 shrink-0"/>}
             <span className="capitalize text-white truncate max-w-[120px] md:max-w-none">{targetPhase}</span>
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          <div className={`p-3 md:p-4 rounded-lg md:rounded-xl border ${isRegress ? 'bg-orange-500/10 border-orange-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
             <div className="flex justify-between items-start mb-2.5 md:mb-3">
                <div className={`flex items-center gap-1.5 md:gap-2 ${isRegress ? 'text-orange-400' : 'text-blue-400'}`}>
                    <Clock size={14} className="md:w-4 md:h-4"/> <span className="text-xs md:text-sm font-bold uppercase tracking-wider">Close Chapter Log</span>
                </div>
                <div className="text-right">
                    <div className="text-xl md:text-2xl font-mono font-bold text-white leading-none mb-1">{recordedHours}h</div>
                    <div className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase">Total Hours Logged</div>
                </div>
             </div>

             <div className={`flex items-center justify-between pt-2.5 md:pt-3 border-t ${isRegress ? 'border-orange-500/20' : 'border-blue-500/20'}`}>
                <div className="text-[10px] md:text-xs text-gray-300 font-bold">
                    {isRegress ? "Add 'Pivot Overhead' (10%)?" : "Add 'Wrap-up Overhead' (10%)?"}
                </div>
                <button 
                    onClick={() => setOverhead(!overhead)} 
                    className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg text-[9px] md:text-xs font-bold transition-colors shadow-sm ${overhead ? (isRegress ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white') : 'bg-black/60 text-gray-400 hover:text-white border border-white/5'}`}
                >
                    {overhead ? `+${overheadAmount}h Added` : 'No Buffer'}
                </button>
             </div>
          </div>

          <textarea 
            className="w-full bg-black/40 border border-white/10 rounded-lg md:rounded-xl p-3 md:p-4 text-xs md:text-sm text-white h-20 md:h-24 outline-none resize-none focus:border-white/30 transition-colors" 
            placeholder={isRegress ? "Why are we moving back? (Blockers, Pivot, etc.)" : "Reason for promotion..."} 
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
            autoFocus
          />

          <div className="flex gap-2 md:gap-3 pt-1 md:pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 md:py-3 rounded-lg md:rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 text-xs md:text-sm font-bold transition-colors">Cancel</button>
            <GlassButton 
                onClick={() => onConfirm(notes, overheadAmount)} 
                className="flex-1 text-xs md:text-sm py-2.5 md:py-3"
                variant={isRegress ? 'danger' : 'primary'}
            >
                {isRegress ? 'Confirm Regression' : 'Confirm Move'}
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
