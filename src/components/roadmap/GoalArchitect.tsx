import { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { GlassInput } from '../ui/GlassInput';
import { type Goal, type SubGoal, type Phase } from '../../types';
import { X, Plus, Layers, Target } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSave: (goal: Partial<Goal>) => void;
}

export const GoalArchitect = ({ onClose, onSave }: Props) => {
  const [title, setTitle] = useState('');
  const [phase, setPhase] = useState<Phase>('P1');
  const [type, setType] = useState<'single' | 'container'>('single');
  const [amount, setAmount] = useState('');

  const [subGoals, setSubGoals] = useState<Partial<SubGoal>[]>([]);
  const [tempSubName, setTempSubName] = useState('');
  const [tempSubAmount, setTempSubAmount] = useState('');

  const addSubGoal = () => {
    if (!tempSubName || !tempSubAmount) return;
    setSubGoals([...subGoals, { 
      id: crypto.randomUUID(), 
      title: tempSubName, 
      targetAmount: parseFloat(tempSubAmount), 
      currentAmount: 0, 
      isCompleted: false 
    }]);
    setTempSubName('');
    setTempSubAmount('');
  };

  const totalTarget = type === 'single' 
    ? parseFloat(amount) || 0 
    : subGoals.reduce((sum, s) => sum + (s.targetAmount || 0), 0);

  const handleSave = () => {
    onSave({
      title,
      phase,
      type,
      targetAmount: totalTarget,
      currentAmount: 0,
      isCompleted: false,
      priority: 99,
      subGoals: type === 'container' ? subGoals as SubGoal[] : []
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-3 animate-fade-in">
      <GlassCard className="w-full max-w-lg p-4 md:p-6 max-h-[90vh] overflow-y-auto border-white/20 shadow-2xl flex flex-col">
        <div className="flex justify-between items-center mb-4 md:mb-6 shrink-0">
          <h2 className="text-lg md:text-xl font-bold text-white">Goal Architect</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1"><X size={18}/></button>
        </div>

        <div className="space-y-4 md:space-y-6 flex-1 overflow-y-auto pr-1 scrollbar-hide">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div className="sm:col-span-2">
               <GlassInput label="Goal Name" value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} autoFocus />
            </div>
            <div>
               <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-1 md:mb-2 block">Phase</label>
               <select 
                 className="w-full bg-black/20 border border-white/10 rounded-lg md:rounded-xl p-2.5 md:p-3 text-xs md:text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                 value={phase}
                 onChange={(e) => setPhase(e.target.value as Phase)}
               >
                 {['P0','P1','P2','P3','P4','P5'].map(p => <option key={p} value={p}>{p}</option>)}
               </select>
            </div>
          </div>

          <div className="flex gap-2 md:gap-4 p-1 bg-white/5 rounded-lg md:rounded-xl border border-white/5">
            <button 
              onClick={() => setType('single')}
              className={`flex-1 py-1.5 md:py-2 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold flex items-center justify-center gap-1.5 md:gap-2 transition-colors ${type === 'single' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
            >
              <Target size={12} className="md:w-3.5 md:h-3.5"/> Single Item
            </button>
            <button 
              onClick={() => setType('container')}
              className={`flex-1 py-1.5 md:py-2 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold flex items-center justify-center gap-1.5 md:gap-2 transition-colors ${type === 'container' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
            >
              <Layers size={12} className="md:w-3.5 md:h-3.5"/> Container Project
            </button>
          </div>

          {type === 'single' ? (
            <GlassInput label="Target Amount (NGN)" type="number" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} />
          ) : (
            <div className="space-y-3 md:space-y-4 p-3 md:p-4 bg-white/5 rounded-lg md:rounded-xl border border-white/10">
               <div className="flex justify-between items-end mb-1 md:mb-2">
                 <h3 className="text-xs md:text-sm font-bold text-white">Breakdown</h3>
                 <span className="text-[10px] md:text-xs text-accent-success font-mono font-bold">Total: {new Intl.NumberFormat().format(totalTarget)}</span>
               </div>

               <div className="space-y-1.5 md:space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
                 {subGoals.map((s, i) => (
                   <div key={i} className="flex justify-between text-[10px] md:text-xs text-gray-300 bg-black/20 p-2 border border-white/5 rounded font-bold">
                     <span className="truncate pr-2">{s.title}</span>
                     <span className="font-mono shrink-0">{new Intl.NumberFormat().format(s.targetAmount || 0)}</span>
                   </div>
                 ))}
                 {subGoals.length === 0 && <div className="text-[10px] text-gray-500 italic text-center py-4">No items added yet.</div>}
               </div>

               <div className="flex gap-2 mt-2 md:mt-4 pt-2 md:pt-4 border-t border-white/5">
                 <input className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2 text-[10px] md:text-xs text-white focus:outline-none focus:border-white/30 min-w-0" placeholder="Item Name" value={tempSubName} onChange={(e) => setTempSubName(e.target.value)} />
                 <input className="w-20 md:w-24 bg-black/20 border border-white/10 rounded-lg p-2 text-[10px] md:text-xs text-white focus:outline-none focus:border-white/30 shrink-0" type="number" placeholder="Amt" value={tempSubAmount} onChange={(e) => setTempSubAmount(e.target.value)} />
                 <button onClick={addSubGoal} className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors shrink-0 flex items-center justify-center border border-transparent hover:border-white/20"><Plus size={14}/></button>
               </div>
            </div>
          )}
        </div>
        
        <div className="pt-4 md:pt-6 mt-2 shrink-0">
            <GlassButton className="w-full text-xs md:text-sm py-2.5 md:py-3" onClick={handleSave} disabled={!title || totalTarget <= 0}>
                Create Goal Blueprint
            </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};
