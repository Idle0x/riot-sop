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
    <GlassCard className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Flame size={18} className="text-accent-danger"/> Top Burners
        </h3>
        {topBurners.length > 0 && (
          <button onClick={() => navigate('/budget')} className="text-xs text-gray-500 hover:text-white transition-colors">
            Manage
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {topBurners.length === 0 ? (
          <EmptyState 
            icon={<Flame size={24} />}
            title="No Burn Limits"
            description="You haven't set any monthly budgets. Protect your runway."
            actionLabel="Add Budget"
            onAction={() => navigate('/budget')}
          />
        ) : (
          <div className="space-y-3 w-full">
            {topBurners.map(b => (
              <div key={b.id} className="flex justify-between items-center p-2 rounded bg-white/5 border border-white/5">
                 <div className="flex items-center gap-2">
                   <div className="w-1 h-8 bg-accent-danger/50 rounded-full"/>
                   <div>
                     <div className="text-xs font-bold text-white">{b.name}</div>
                     <div className="text-[10px] text-gray-500 uppercase">{b.frequency}</div>
                   </div>
                 </div>
                 <div className="text-right">
                    <div className="text-sm font-mono text-white flex items-center justify-end gap-1">
                      <Naira />{formatNumber(b.amount)}
                    </div>
                    <div className="text-[10px] text-gray-500">Cap</div>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
};
