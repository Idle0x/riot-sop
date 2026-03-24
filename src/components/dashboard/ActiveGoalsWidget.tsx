import { useLedger } from '../../context/LedgerContext';
import { GlassCard } from '../ui/GlassCard';
import { GlassProgressBar } from '../ui/GlassProgressBar';
import { EmptyState } from '../ui/EmptyState';
import { formatNumber } from '../../utils/format';
import { Naira } from '../ui/Naira';
import { Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ActiveGoalsWidget = () => {
  const { goals } = useLedger();
  const navigate = useNavigate();

  const activeGoals = goals
    .filter(g => !g.isCompleted)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);

  return (
    <GlassCard className="p-4 md:p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-3 md:mb-4">
        <h3 className="font-bold text-white flex items-center gap-1.5 md:gap-2 text-sm md:text-base">
          <Target size={14} className="md:w-[18px] md:h-[18px] text-accent-success"/> Active Missions
        </h3>
        {activeGoals.length > 0 && (
          <button onClick={() => navigate('/roadmap')} className="text-[10px] md:text-xs text-gray-500 hover:text-white transition-colors font-bold uppercase tracking-wider">
            View All
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {activeGoals.length === 0 ? (
          <EmptyState 
            icon={<Target size={20} className="md:w-6 md:h-6" />}
            title="No Active Missions"
            description="You have no financial targets set. Define your first goal."
            actionLabel="Create Goal"
            onAction={() => navigate('/roadmap')}
          />
        ) : (
          <div className="space-y-3 md:space-y-4 w-full">
            {activeGoals.map(g => (
              <div key={g.id}>
                <div className="flex justify-between text-[10px] md:text-xs mb-1">
                  <span className="text-white font-bold truncate pr-2">{g.title}</span>
                  <span className="text-gray-500 flex items-center gap-0.5 md:gap-1 shrink-0 font-bold">
                    <Naira/>{formatNumber(g.currentAmount)} <span className="hidden sm:inline">/ {formatNumber(g.targetAmount)}</span>
                  </span>
                </div>
                <GlassProgressBar value={g.currentAmount} max={g.targetAmount} size="sm" showPercentage={false} />
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
};
