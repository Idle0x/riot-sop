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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-6 animate-fade-in">
      <GlassCard className="max-w-md w-full p-8 text-center border-accent-success/30">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-accent-success/10 text-accent-success animate-pulse">
            <Power size={48} />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mb-2">Fiscal Checkpoint</h2>
        <p className="text-gray-400 mb-6">
          System detected a new month. 
          <br/>You were away for <span className="text-white font-bold">{monthsMissed} month(s)</span>.
        </p>

        <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Planned Burn:</span>
            <span className="text-white font-mono">{formatCurrency(burnAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Available Liquid:</span>
            <span className={isInsolvent ? "text-red-500 font-mono" : "text-green-500 font-mono"}>
              {formatCurrency(currentBalance)}
            </span>
          </div>
          <div className="h-px bg-white/10 my-2" />
          <div className="flex justify-between font-bold">
            <span className="text-white">Action:</span>
            {isInsolvent ? (
              <span className="text-yellow-500 flex items-center gap-1">
                <AlertTriangle size={14}/> Skip (0 Balance)
              </span>
            ) : (
              <span className="text-red-400">Deduct Burn</span>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-6 italic">
          "The Sovereign System never creates debt you didn't approve."
        </p>

        <GlassButton className="w-full" size="lg" onClick={onConfirm}>
          {isInsolvent ? "Acknowledge & Continue" : "Execute Monthly Burn"}
        </GlassButton>
      </GlassCard>
    </div>
  );
};
