import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { formatCurrency } from '../../utils/format';
import { Power, AlertTriangle } from 'lucide-react';

interface Props {
  monthsMissed: number;
  burnAmount: number;
  currentBalance: number;
  onConfirm: () => void;
}

export const MonthlyCheckpointModal = ({ monthsMissed, burnAmount, currentBalance, onConfirm }: Props) => {
  const isInsolvent = currentBalance < burnAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
      <GlassCard className="max-w-md w-full p-5 md:p-8 text-center border-accent-success/30">
        <div className="flex justify-center mb-4 md:mb-6">
          <div className="p-3 md:p-4 rounded-full bg-accent-success/10 text-accent-success animate-pulse">
            <Power size={32} className="md:w-12 md:h-12" />
          </div>
        </div>

        <h2 className="text-xl md:text-3xl font-bold text-white mb-1.5 md:mb-2">Fiscal Checkpoint</h2>
        <p className="text-[11px] md:text-sm text-gray-400 mb-4 md:mb-6 font-bold">
          System detected a new month. 
          <br/>Away for <span className="text-white font-bold">{monthsMissed} month(s)</span>.
        </p>

        <div className="bg-white/5 rounded-xl p-3 md:p-4 mb-4 md:mb-6 space-y-2 md:space-y-3 border border-white/5">
          <div className="flex justify-between items-center text-xs md:text-sm font-bold">
            <span className="text-gray-400">Planned Burn:</span>
            <span className="text-white font-mono">{formatCurrency(burnAmount)}</span>
          </div>
          <div className="flex justify-between items-center text-xs md:text-sm font-bold">
            <span className="text-gray-400">Available Liquid:</span>
            <span className={isInsolvent ? "text-red-500 font-mono" : "text-green-500 font-mono"}>
              {formatCurrency(currentBalance)}
            </span>
          </div>
          <div className="h-px bg-white/10 my-2 md:my-3" />
          <div className="flex justify-between items-center font-bold text-[11px] md:text-sm">
            <span className="text-white">Action:</span>
            {isInsolvent ? (
              <span className="text-yellow-500 flex items-center gap-1 uppercase tracking-wider text-[9px] md:text-xs">
                <AlertTriangle size={12}/> Skip (0 Balance)
              </span>
            ) : (
              <span className="text-red-400 uppercase tracking-wider text-[9px] md:text-xs">Deduct Burn</span>
            )}
          </div>
        </div>

        <p className="text-[10px] md:text-xs text-gray-500 mb-4 md:mb-6 italic font-bold">
          "The Sovereign System never creates debt you didn't approve."
        </p>

        <GlassButton className="w-full text-xs md:text-sm py-2.5 md:py-3" size="lg" onClick={onConfirm}>
          {isInsolvent ? "Acknowledge & Continue" : "Execute Monthly Burn"}
        </GlassButton>
      </GlassCard>
    </div>
  );
};
