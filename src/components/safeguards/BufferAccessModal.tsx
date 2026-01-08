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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <GlassCard className="w-full max-w-md p-6 border-red-500/50 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>

        <div className="text-center mb-6">
          <div className="inline-block p-4 bg-red-500/10 rounded-full text-red-500 mb-3 animate-pulse">
            <AlertTriangle size={32}/>
          </div>
          <h2 className="text-2xl font-bold text-white">Emergency Protocol</h2>
          <p className="text-red-400 text-sm font-bold uppercase tracking-widest">High Friction Zone</p>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-gray-300 text-center">Is this a medical emergency or safety threat?</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={onClose} className="p-4 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400">No, it's a "want"</button>
              <button onClick={() => setStep(2)} className="p-4 rounded-xl border border-red-500/30 hover:bg-red-500/10 text-red-400 font-bold">Yes, Emergency</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <GlassInput label="Amount Needed" type="number" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} />
            <GlassInput label="Justification Log" placeholder="Describe the crisis..." value={reason} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)} />
            <GlassButton className="w-full mt-4" disabled={!amount || !reason} onClick={() => setStep(3)}>Proceed</GlassButton>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-xs text-red-400 uppercase font-bold text-center">Final Verification</p>
            <p className="text-sm text-gray-400 text-center">Type the phrase exactly:</p>
            <div className="bg-black/40 p-2 rounded text-center font-mono text-xs text-red-500 select-all">{phrase}</div>
            <GlassInput 
              value={confirmPhrase} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPhrase(e.target.value)} 
              placeholder="Type phrase here..."
              className="text-center border-red-500/50"
            />
            <GlassButton 
              variant="danger" 
              className="w-full" 
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
