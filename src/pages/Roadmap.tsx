import { useState } from 'react';
import { useLedger } from '../context/LedgerContext'; 
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { GlassProgressBar } from '../components/ui/GlassProgressBar';
import { formatNumber } from '../utils/format'; 
import { GoalArchitect } from '../components/roadmap/GoalArchitect';
import { Naira } from '../components/ui/Naira';
import { type Goal, type Phase } from '../types';
import { Target, CheckCircle2, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

export const Roadmap = () => {
  const { goals, addGoal, deleteGoal } = useLedger(); 
  const [viewMode, setViewMode] = useState<'FOCUS' | 'ROADMAP'>('FOCUS');
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});
  const [isArchitectOpen, setIsArchitectOpen] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedGoals(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateGoal = (goalData: Partial<Goal>) => {
    addGoal({
      title: goalData.title || 'New Goal',
      phase: goalData.phase || 'P1',
      targetAmount: goalData.targetAmount || 0,
      currentAmount: 0,
      isCompleted: false,
      priority: 99,
      type: goalData.type || 'single',
      subGoals: goalData.subGoals || []
    } as any);
    setIsArchitectOpen(false);
  };

  const handleDelete = (goal: Goal) => {
    if (confirm(`Delete blueprint: "${goal.title}"?`)) {
      let reclaim = false;
      if (goal.currentAmount > 0) {
        reclaim = confirm(`This goal currently holds ₦${formatNumber(goal.currentAmount)}.\n\nClick OK to RECLAIM funds back to Holding.\nClick CANCEL to permanently BURN the funds.`);
      }
      deleteGoal(goal.id, reclaim);
    }
  };

  const phases: Phase[] = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6+'];

  return (
    <div className="max-w-4xl mx-auto p-3 md:p-8 space-y-5 md:space-y-8 pb-16 md:pb-20 animate-fade-in">

      {isArchitectOpen && <GoalArchitect onClose={() => setIsArchitectOpen(false)} onSave={handleCreateGoal} />}

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 md:gap-4">
        <div>
           <h1 className="text-xl md:text-3xl font-bold text-white">Master Roadmap</h1>
           <p className="text-gray-400 text-xs md:text-sm mt-0.5 md:mt-1">Design and fund your life architecture.</p>
        </div>

        <div className="flex gap-2 md:gap-4">
           <div className="flex bg-black/20 p-1 rounded-lg md:rounded-xl border border-white/10 h-fit">
            <button 
              onClick={() => setViewMode('FOCUS')}
              className={`px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-bold rounded md:rounded-lg transition-colors ${viewMode === 'FOCUS' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
            >
              Focus
            </button>
            <button 
              onClick={() => setViewMode('ROADMAP')}
              className={`px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-bold rounded md:rounded-lg transition-colors ${viewMode === 'ROADMAP' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
            >
              Full Life
            </button>
          </div>
          <GlassButton size="sm" onClick={() => setIsArchitectOpen(true)} className="text-[10px] md:text-xs px-2.5 md:px-4 py-1.5 md:py-2">
            <Plus size={14} className="md:w-4 md:h-4 mr-1 md:mr-2"/> Architect
          </GlassButton>
        </div>
      </div>

      <div className="space-y-5 md:space-y-8">
        {phases.map(phase => {
          const phaseGoals = goals
            .filter(g => g.phase === phase)
            .sort((a, b) => a.priority - b.priority);

          if (viewMode === 'FOCUS' && !['P0','P1','P2'].includes(phase) && phaseGoals.every(g => g.isCompleted)) return null;
          if (phaseGoals.length === 0 && viewMode === 'FOCUS') return null;

          return (
            <div key={phase} className="relative">
              <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4 opacity-50">
                <div className="h-px flex-1 bg-white/20"></div>
                <span className="font-mono text-[10px] md:text-xs font-bold text-white uppercase bg-black/20 px-1.5 md:px-2 py-0.5 md:py-1 rounded border border-white/10">{phase}</span>
                <div className="h-px flex-1 bg-white/20"></div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:gap-4">
                {phaseGoals.length === 0 ? (
                   <div className="text-center py-3 md:py-4 text-[10px] md:text-xs text-gray-600 italic">No blueprints for this phase yet.</div>
                ) : phaseGoals.map(goal => (
                  <GlassCard key={goal.id} className={`p-0 overflow-hidden ${goal.isCompleted ? 'border-green-500/30' : ''}`}>
                    <div 
                      className="p-3.5 md:p-6 cursor-pointer hover:bg-white/5 transition-colors relative group"
                      onClick={() => toggleExpand(goal.id)}
                    >
                      <div className="flex justify-between items-start mb-3 md:mb-4 pr-6 md:pr-0">
                        <div className="flex items-start md:items-center gap-2.5 md:gap-3">
                          <div className="mt-0.5 md:mt-0">
                            {goal.isCompleted ? <CheckCircle2 className="text-green-500 w-4 h-4 md:w-6 md:h-6"/> : <Target className="text-gray-500 w-4 h-4 md:w-6 md:h-6"/>}
                          </div>
                          <div>
                            <h3 className={`font-bold text-sm md:text-lg flex items-center flex-wrap gap-1.5 md:gap-2 ${goal.isCompleted ? 'text-green-400' : 'text-white'}`}>
                              {goal.title}
                              {goal.type === 'container' && <span className="text-[8px] md:text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30 font-mono mt-0.5 md:mt-0 shrink-0">PROJECT</span>}
                            </h3>
                            <div className="text-[9px] md:text-xs text-gray-500 flex items-center gap-2 mt-0.5 md:mt-1">
                              {goal.subGoals.length > 0 && <span className="bg-white/10 px-1.5 py-0.5 rounded text-white">{goal.subGoals.length} Steps</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`font-mono font-bold text-xs md:text-base ${goal.isCompleted ? 'text-green-400' : 'text-white'}`}>
                              <Naira/>{formatNumber(goal.currentAmount)}
                          </div>
                          <div className="text-[8px] md:text-[10px] text-gray-500 mt-0.5">of <Naira/>{formatNumber(goal.targetAmount)}</div>
                        </div>
                      </div>

                      <GlassProgressBar 
                        value={goal.currentAmount} 
                        max={goal.targetAmount} 
                        color={goal.isCompleted ? 'success' : 'info'} 
                        size="sm" 
                      />

                      <div className="absolute top-3.5 md:top-6 right-3.5 md:right-6 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                         {expandedGoals[goal.id] ? <ChevronUp size={16} className="md:w-5 md:h-5 text-gray-400"/> : <ChevronDown size={16} className="md:w-5 md:h-5 text-gray-400"/>}
                      </div>
                    </div>

                    {expandedGoals[goal.id] && (
                      <div className="bg-black/20 border-t border-white/10 p-3 md:p-4 space-y-2 md:space-y-3 animate-slide-down">
                        {goal.subGoals.length > 0 ? (
                          goal.subGoals.map((sub, idx) => (
                            <div key={idx} className="flex items-center gap-2.5 md:gap-3 text-[11px] md:text-sm p-1.5 md:p-2 rounded hover:bg-white/5">
                              <div className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border flex items-center justify-center shrink-0 ${sub.isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-600'}`}>
                                {sub.isCompleted && <CheckCircle2 size={8} className="md:w-[10px] md:h-[10px] text-black"/>}
                              </div>
                              <span className={`truncate pr-2 ${sub.isCompleted ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{sub.title}</span>
                              <div className="ml-auto flex items-center gap-2 md:gap-4 shrink-0">
                                <span className="font-mono text-[9px] md:text-xs text-gray-500"><Naira/>{formatNumber(sub.targetAmount)}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] md:text-xs text-gray-500 italic text-center py-1.5 md:py-2">Single funding target. No sub-steps.</div>
                        )}

                        <div className="flex justify-end pt-3 md:pt-4 border-t border-white/5 gap-2">
                           <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(goal); }} 
                              className="text-[10px] md:text-xs text-red-500 hover:text-red-400 flex items-center gap-1 border border-red-500/20 px-2.5 py-1.5 md:px-3 rounded hover:bg-red-500/10 transition-colors"
                           >
                             <Trash2 size={10} className="md:w-3 md:h-3"/> Delete Blueprint
                           </button>
                        </div>
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
