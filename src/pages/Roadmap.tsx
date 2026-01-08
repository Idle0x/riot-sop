import { useState } from 'react';
import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassProgressBar } from '../components/ui/GlassProgressBar';
import { Naira } from '../components/ui/Naira';
import { Target, CheckCircle2 } from 'lucide-react';

export const Roadmap = () => {
  const { goals } = useFinancials();
  const [viewMode, setViewMode] = useState<'FOCUS' | 'ROADMAP'>('FOCUS');
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedGoals(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Group goals by Phase
  const phases = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6+'];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-20 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Master Roadmap</h1>
        <div className="flex bg-black/20 p-1 rounded-lg border border-white/10">
          <button 
            onClick={() => setViewMode('FOCUS')}
            className={`px-4 py-2 text-xs font-bold rounded ${viewMode === 'FOCUS' ? 'bg-white text-black' : 'text-gray-500'}`}
          >
            Focus View
          </button>
          <button 
            onClick={() => setViewMode('ROADMAP')}
            className={`px-4 py-2 text-xs font-bold rounded ${viewMode === 'ROADMAP' ? 'bg-white text-black' : 'text-gray-500'}`}
          >
            Full Life
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {phases.map(phase => {
          const phaseGoals = goals.filter(g => g.phase === phase);
          // Focus View Logic: Hide future phases if previous not mostly done
          if (viewMode === 'FOCUS' && !['P0','P1','P2'].includes(phase)) return null;
          if (phaseGoals.length === 0) return null;

          return (
            <div key={phase} className="relative">
              <div className="flex items-center gap-4 mb-4 opacity-50">
                <div className="h-px flex-1 bg-white/20"></div>
                <span className="font-mono text-xs font-bold text-white uppercase">{phase}</span>
                <div className="h-px flex-1 bg-white/20"></div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {phaseGoals.map(goal => (
                  <GlassCard key={goal.id} className="p-0 overflow-hidden">
                    <div 
                      className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => toggleExpand(goal.id)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          {goal.isCompleted ? <CheckCircle2 className="text-green-500"/> : <Target className="text-gray-500"/>}
                          <div>
                            <h3 className="font-bold text-white text-lg">{goal.title}</h3>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              Priority {goal.priority} 
                              {goal.subGoals && <span className="bg-white/10 px-1.5 rounded text-white">{goal.subGoals.length} Sub-goals</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-white"><Naira/>{new Intl.NumberFormat().format(goal.currentAmount)}</div>
                          <div className="text-xs text-gray-500">of <Naira/>{new Intl.NumberFormat().format(goal.targetAmount)}</div>
                        </div>
                      </div>

                      <GlassProgressBar 
                        value={goal.currentAmount} 
                        max={goal.targetAmount} 
                        color={goal.isCompleted ? 'success' : 'info'} 
                        size="md" 
                      />
                    </div>

                    {/* SUB-GOAL CHUNKING (Accordion) */}
                    {expandedGoals[goal.id] && goal.subGoals && (
                      <div className="bg-black/20 border-t border-white/10 p-4 space-y-3 animate-slide-down">
                        {goal.subGoals.map(sub => (
                          <div key={sub.id} className="flex items-center gap-3 text-sm">
                            <div className={`w-4 h-4 rounded-full border ${sub.isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-600'}`}/>
                            <span className={sub.isCompleted ? 'text-gray-500 line-through' : 'text-gray-300'}>{sub.title}</span>
                            <span className="ml-auto font-mono text-xs text-gray-500"><Naira/>{new Intl.NumberFormat().format(sub.targetAmount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </GlassCard>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
