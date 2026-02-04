import { useLedger } from '../../context/LedgerContext';
import { GlassCard } from '../ui/GlassCard';
import { GlassProgressBar } from '../ui/GlassProgressBar';
import { EmptyState } from '../ui/EmptyState';
import { formatNumber } from '../../utils/format';
import { Naira } from '../ui/Naira';
import { Target, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ActiveGoalsWidget = () => {
  const { goals } = useLedger();
  const navigate = useNavigate();

  // Filter: Not completed, Sort by Priority (Ascending), Take top 3
  const activeGoals = goals
    .filter(g => !g.isCompleted)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);

  return (
    <GlassCard className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Target size={18} className="text-accent-success"/> Active Missions
        </h3>
        {activeGoals.length > 0 && (
          <button onClick={() => navigate('/roadmap')} className="text-xs text-gray-500 hover:text-white transition-colors">
            View All
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {activeGoals.length === 0 ? (
          <EmptyState 
            icon={<Target size={24} />}
            title="No Active Missions"
            description="You have no financial targets set. Define your first goal."
            actionLabel="Create Goal"
            onAction={() => navigate('/roadmap')}
          />
        ) : (
          <div className="space-y-4 w-full">
            {activeGoals.map(g => (
              <div key={g.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white font-bold">{g.title}</span>
                  <span className="text-gray-500 flex items-center gap-1">
                    <Naira/>{formatNumber(g.currentAmount)} / {formatNumber(g.targetAmount)}
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
