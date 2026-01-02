import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassProgressBar } from '../components/ui/GlassProgressBar';
import { CheckCircle2, Lock } from 'lucide-react';
import { cn } from '../utils/cn';

export const Roadmap = () => {
  const { goals } = useFinancials();

  // Group goals by Phase
  const phases = ['P1', 'P2', 'P3', 'P4', 'P5'];
  
  const formatMoney = (val: number, currency: string) => {
    return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'en-NG', { 
      style: 'currency', 
      currency: currency 
    }).format(val);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Master Roadmap</h1>
        <p className="text-gray-400">The trajectory from Security to Freedom</p>
      </div>

      <div className="space-y-8">
        {phases.map((phase) => {
          const phaseGoals = goals.filter(g => g.phase === phase);
          if (phaseGoals.length === 0) return null;

          // Check if previous phase is done (Logic for "Locking" next phases)
          // For now, we just render them visually.

          return (
            <div key={phase} className="relative">
              {/* Phase Label */}
              <div className="flex items-center gap-4 mb-4">
                <div className="h-px flex-1 bg-glass-border"></div>
                <span className="px-4 py-1 rounded-full bg-white/5 border border-glass-border text-sm font-bold text-accent-info">
                  PHASE {phase.replace('P', '')}
                </span>
                <div className="h-px flex-1 bg-glass-border"></div>
              </div>

              {/* Goals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {phaseGoals.map((goal) => (
                  <GlassCard 
                    key={goal.id} 
                    className={cn(
                      "p-6 transition-all duration-300",
                      goal.isCompleted ? "border-accent-success/30 bg-accent-success/5" : "hover:border-white/20"
                    )}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-white flex items-center gap-2">
                          {goal.title}
                          {goal.isCompleted && <CheckCircle2 size={16} className="text-accent-success" />}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">Priority {goal.priority}</p>
                      </div>
                      <div className="text-right">
                        <div className={cn("font-mono font-bold", goal.isCompleted ? "text-accent-success" : "text-white")}>
                          {formatMoney(goal.currentAmount, goal.currency)}
                        </div>
                        <div className="text-xs text-gray-500">
                          of {formatMoney(goal.targetAmount, goal.currency)}
                        </div>
                      </div>
                    </div>

                    <GlassProgressBar 
                      value={goal.currentAmount} 
                      max={goal.targetAmount} 
                      color={goal.isCompleted ? 'success' : 'info'}
                      size="sm"
                    />
                  </GlassCard>
                ))}
              </div>
            </div>
          );
        })}

        {/* Future/Locked Phases Placeholder */}
        <div className="opacity-50 grayscale select-none">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px flex-1 bg-glass-border"></div>
            <span className="flex items-center gap-2 px-4 py-1 rounded-full bg-white/5 border border-glass-border text-sm font-bold text-gray-500">
              <Lock size={12} /> PHASE 6+
            </span>
            <div className="h-px flex-1 bg-glass-border"></div>
          </div>
          <div className="text-center py-8 border border-dashed border-glass-border rounded-2xl">
            <p className="text-gray-600">Unlock previous phases to reveal future objectives.</p>
          </div>
        </div>

      </div>
    </div>
  );
};
