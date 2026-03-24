import { useLedger } from '../../context/LedgerContext';
import { GlassCard } from '../ui/GlassCard';
import { EmptyState } from '../ui/EmptyState';
import { Naira } from '../ui/Naira';
import { formatNumber } from '../../utils/format';
import { Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BudgetBurnWidget = () => {
  const { budgets } = useLedger();
  const navigate = useNavigate();

  const topBurners = budgets
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return (
    <GlassCard className="p-4 md:p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-3 md:mb-4">
        <h3 className="font-bold text-white flex items-center gap-1.5 md:gap-2 text-sm md:text-base">
          <Flame size={14} className="md:w-[18px] md:h-[18px] text-accent-danger"/> Top Burners
        </h3>
        {topBurners.length > 0 && (
          <button onClick={() => navigate('/budget')} className="text-[10px] md:text-xs text-gray-500 hover:text-white transition-colors font-bold uppercase tracking-wider">
            Manage
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {topBurners.length === 0 ? (
          <EmptyState 
            icon={<Flame size={20} className="md:w-6 md:h-6" />}
            title="No Burn Limits"
            description="You haven't set any monthly budgets. Protect your runway."
            actionLabel="Add Budget"
            onAction={() => navigate('/budget')}
          />
        ) : (
          <div className="space-y-2 md:space-y-3 w-full">
            {topBurners.map(b => (
              <div key={b.id} className="flex justify-between items-center p-2 md:p-2.5 rounded bg-white/5 border border-white/5">
                 <div className="flex items-center gap-2 min-w-0">
                   <div className="w-1 h-6 md:h-8 bg-accent-danger/50 rounded-full shrink-0"/>
                   <div className="min-w-0 pr-2">
                     <div className="text-[11px] md:text-xs font-bold text-white truncate">{b.name}</div>
                     <div className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold">{b.frequency}</div>
                   </div>
                 </div>
                 <div className="text-right shrink-0 pl-2">
                    <div className="text-xs md:text-sm font-mono font-bold text-white flex items-center justify-end gap-0.5 md:gap-1">
                      <Naira />{formatNumber(b.amount)}
                    </div>
                    <div className="text-[8px] md:text-[10px] text-gray-500 font-bold uppercase">Cap</div>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
};
