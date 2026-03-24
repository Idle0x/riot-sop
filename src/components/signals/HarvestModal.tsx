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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
      <GlassCard className={`w-full max-w-md p-5 md:p-6 relative transition-all duration-500 ${isHighAlpha ? 'border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.2)] bg-yellow-950/5' : 'border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.1)]'}`}>
        <button onClick={onClose} className="absolute top-3 md:top-4 right-3 md:right-4 text-gray-500 hover:text-white p-1"><X size={18} className="md:w-5 md:h-5"/></button>
        
        <div className="text-center mb-6 md:mb-8">
          <div className={`inline-flex p-3 md:p-4 rounded-full mb-2 md:mb-3 border ${isHighAlpha ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
            {isHighAlpha ? <Zap size={24} className="md:w-8 md:h-8 animate-pulse"/> : <DollarSign size={24} className="md:w-8 md:h-8"/>}
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-0.5 md:mb-1 tracking-tight">Harvest Alpha</h2>
          <p className="text-[10px] md:text-sm text-gray-400 font-bold">Secure gains from <span className="text-white">{signal.title}</span>.</p>
        </div>

        <div className="space-y-4 md:space-y-6">
          <GlassInput 
            label="Realized Profit (USD)" 
            type="number" 
            placeholder="0.00" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            autoFocus 
            className="text-xl md:text-2xl font-bold text-center h-14 md:h-16 tracking-tight"
          />
          
          {val > 0 && (
             <div className={`flex justify-between items-center p-2.5 md:p-3 rounded-lg md:rounded-xl border animate-fade-in ${isHighAlpha ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-white/5 border-white/10'}`}>
                <div className="flex items-center gap-2 md:gap-3">
                   <div className="p-1.5 md:p-2 bg-blue-500/10 rounded-md md:rounded-lg text-blue-400"><TrendingUp size={14} className="md:w-4 md:h-4"/></div>
                   <div>
                     <div className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-wider">Efficiency Rating</div>
                     <div className="text-[8px] md:text-[10px] text-gray-500 font-mono">Based on {hours}h logged</div>
                   </div>
                </div>
                <div className={`text-lg md:text-xl font-mono font-bold flex items-baseline gap-0.5 ${isHighAlpha ? 'text-yellow-400' : 'text-white'}`}>
                    ${formatNumber(efficiency)}<span className="text-[9px] md:text-xs text-gray-500">/hr</span>
                </div>
             </div>
          )}

          <GlassButton className="w-full text-xs md:text-sm py-2.5 md:py-3 mt-2" onClick={() => val > 0 && onConfirm(val)} disabled={!amount}>
             Secure Funds in Triage <ArrowRight size={14} className="ml-1.5 md:ml-2 md:w-4 md:h-4"/>
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};
