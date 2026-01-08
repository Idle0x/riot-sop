import { useFinancials } from '../../context/FinancialContext';
import { GlassCard } from '../ui/GlassCard';
import { GlassProgressBar } from '../ui/GlassProgressBar';
import { Naira } from '../ui/Naira';
import { Target, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ActiveGoalsWidget = () => {
  const { goals } = useFinancials();
  const navigate = useNavigate();

  // Filter: Not completed, Sort by Priority (Ascending), Take top 3
  const activeGoals = goals
    .filter(g => !g.isCompleted)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);

  if (activeGoals.length === 0) return null;

  return (
    <GlassCard className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Target size={18} className="text-accent-success"/> Active Missions
        </h3>
        <button onClick={() => navigate('/roadmap')} className="text-xs text-gray-500 hover:text-white">View All</button>
      </div>

      <div className="flex-1 space-y-4">
        {activeGoals.map(g => (
          <div key={g.id}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white font-bold">{g.title}</span>
              <span className="text-gray-500"><Naira/>{new Intl.NumberFormat().format(g.currentAmount)} / {new Intl.NumberFormat().format(g.targetAmount)}</span>
            </div>
            <GlassProgressBar value={g.currentAmount} max={g.targetAmount} size="sm" showPercentage={false} />
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
