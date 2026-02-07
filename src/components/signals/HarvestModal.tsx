import { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassInput } from '../ui/GlassInput';
import { GlassButton } from '../ui/GlassButton';
import { X, DollarSign, ArrowRight, TrendingUp, Zap } from 'lucide-react';
import { formatNumber } from '../../utils/format';
import { type Signal } from '../../types';

interface Props {
  signal: Signal;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

export const HarvestModal = ({ signal, onClose, onConfirm }: Props) => {
  const [amount, setAmount] = useState('');
  const val = parseFloat(amount) || 0;
  const hours = signal.hoursLogged || 1;
  const efficiency = val / hours;
  const isHighAlpha = efficiency > 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
      <GlassCard className={`w-full max-w-md p-6 relative transition-all duration-500 ${isHighAlpha ? 'border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.2)]' : 'border-green-500/30'}`}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
        <div className="text-center mb-8">
          <div className={`inline-flex p-4 rounded-full mb-3 ${isHighAlpha ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/10 text-green-500'}`}>{isHighAlpha ? <Zap size={32} className="animate-pulse"/> : <DollarSign size={32}/>}</div>
          <h2 className="text-2xl font-bold text-white">Harvest Alpha</h2>
          <p className="text-sm text-gray-400">Secure gains from <span className="text-white font-bold">{signal.title}</span>.</p>
        </div>
        <div className="space-y-6">
          <GlassInput label="Realized Profit (USD)" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus className="text-2xl font-bold text-center h-16"/>
          {val > 0 && (
             <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10 animate-fade-in">
                <div className="flex items-center gap-2">
                   <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><TrendingUp size={16}/></div>
                   <div className="text-xs text-gray-400">Efficiency Rating<br/><span className="text-[10px] text-gray-600">Based on {hours}h logged</span></div>
                </div>
                <div className={`text-xl font-mono font-bold ${isHighAlpha ? 'text-yellow-400' : 'text-white'}`}>${formatNumber(efficiency)}<span className="text-xs text-gray-500">/hr</span></div>
             </div>
          )}
          <GlassButton className="w-full" onClick={() => val > 0 && onConfirm(val)} disabled={!amount}>Secure Funds in Triage <ArrowRight size={16} className="ml-2"/></GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};
