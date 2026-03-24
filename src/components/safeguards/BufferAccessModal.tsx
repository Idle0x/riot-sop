import { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { GlassInput } from '../ui/GlassInput';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, reason: string) => void;
}

export const BufferAccessModal = ({ isOpen, onClose, onConfirm }: Props) => {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [confirmPhrase, setConfirmPhrase] = useState('');

  if (!isOpen) return null;

  const phrase = "I AM DEPLOYING EMERGENCY CAPITAL";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
      <GlassCard className="w-full max-w-md p-5 md:p-6 border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.15)] relative">
        <button onClick={onClose} className="absolute top-3 md:top-4 right-3 md:right-4 text-gray-500 hover:text-white p-1"><X size={18}/></button>

        <div className="text-center mb-5 md:mb-6">
          <div className="inline-block p-3 md:p-4 bg-red-500/10 rounded-full text-red-500 mb-2 md:mb-3 animate-pulse border border-red-500/20">
            <AlertTriangle size={24} className="md:w-8 md:h-8"/>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-0.5">Emergency Protocol</h2>
          <p className="text-red-400 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em]">High Friction Zone</p>
        </div>

        {step === 1 && (
          <div className="space-y-4 md:space-y-5">
            <p className="text-gray-300 text-center text-xs md:text-sm font-bold px-4">Is this a medical emergency or safety threat?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <button onClick={onClose} className="p-3 md:p-4 rounded-lg md:rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 text-xs md:text-sm font-bold transition-colors">No, it's a "want"</button>
              <button onClick={() => setStep(2)} className="p-3 md:p-4 rounded-lg md:rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold text-xs md:text-sm transition-colors">Yes, Emergency</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 md:space-y-4 animate-fade-in">
            <GlassInput label="Amount Needed" type="number" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} autoFocus />
            <GlassInput label="Justification Log" placeholder="Describe the crisis..." value={reason} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)} />
            <GlassButton className="w-full mt-2 md:mt-4 text-xs md:text-sm py-2.5 md:py-3" disabled={!amount || !reason} onClick={() => setStep(3)}>Proceed to Authentication</GlassButton>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 md:space-y-4 animate-fade-in">
            <p className="text-[10px] md:text-xs text-red-400 uppercase font-bold text-center tracking-widest">Final Verification</p>
            <p className="text-[11px] md:text-sm text-gray-400 text-center font-bold">Type the phrase exactly:</p>
            <div className="bg-black/40 border border-white/5 p-2.5 md:p-3 rounded-lg text-center font-mono text-[10px] md:text-xs text-red-500 select-all font-bold tracking-tight">{phrase}</div>
            <input 
              value={confirmPhrase} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPhrase(e.target.value)} 
              placeholder="Type phrase here..."
              className="w-full bg-black/20 border-b border-gray-800 py-2 md:py-3 text-center font-mono text-xs md:text-sm text-white focus:outline-none focus:border-red-500/50 transition-all"
              autoFocus
            />
            <GlassButton 
              variant="danger" 
              className="w-full text-xs md:text-sm py-2.5 md:py-3 mt-2" 
              disabled={confirmPhrase !== phrase} 
              onClick={() => onConfirm(parseFloat(amount), reason)}
            >
              Unlock Buffer Vault
            </GlassButton>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
