import { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassInput } from '../ui/GlassInput';
import { GlassButton } from '../ui/GlassButton';
import { X, DollarSign, ArrowRight } from 'lucide-react';

interface Props {
  signalTitle: string;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

export const HarvestModal = ({ signalTitle, onClose, onConfirm }: Props) => {
  const [amount, setAmount] = useState('');

  const handleSubmit = () => {
    const val = parseFloat(amount);
    if (val > 0) onConfirm(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
      <GlassCard className="w-full max-w-md p-6 relative border-green-500/30">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
        
        <div className="text-center mb-6">
          <div className="inline-flex p-4 rounded-full bg-green-500/10 text-green-500 mb-3">
            <DollarSign size={32}/>
          </div>
          <h2 className="text-2xl font-bold text-white">Harvest Alpha</h2>
          <p className="text-sm text-gray-400">You won on <span className="text-white font-bold">{signalTitle}</span>.</p>
        </div>

        <div className="space-y-4">
          <GlassInput 
            label="Realized Profit (USD)" 
            type="number" 
            placeholder="0.00" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
          
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-gray-400">
            "Paper gains are vanity. Realized gains are sanity." <br/>
            <span className="text-accent-success">Proceed to Triage immediately.</span>
          </div>

          <GlassButton className="w-full" onClick={handleSubmit} disabled={!amount}>
            Secure the Bag <ArrowRight size={16} className="ml-2"/>
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};
