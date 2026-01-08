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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
      <GlassCard className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Goal Architect</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20}/></button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
               <GlassInput label="Goal Name" value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} autoFocus />
            </div>
            <div>
               <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Phase</label>
               <select 
                 className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white"
                 value={phase}
                 onChange={(e) => setPhase(e.target.value as Phase)}
               >
                 {['P0','P1','P2','P3','P4','P5'].map(p => <option key={p} value={p}>{p}</option>)}
               </select>
            </div>
          </div>

          <div className="flex gap-4 p-1 bg-white/5 rounded-xl">
            <button 
              onClick={() => setType('single')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 ${type === 'single' ? 'bg-white text-black' : 'text-gray-500'}`}
            >
              <Target size={14}/> Single Item
            </button>
            <button 
              onClick={() => setType('container')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 ${type === 'container' ? 'bg-white text-black' : 'text-gray-500'}`}
            >
              <Layers size={14}/> Container Project
            </button>
          </div>

          {type === 'single' ? (
            <GlassInput label="Target Amount (NGN)" type="number" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} />
          ) : (
            <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
               <div className="flex justify-between items-end mb-2">
                 <h3 className="text-sm font-bold text-white">Breakdown</h3>
                 <span className="text-xs text-accent-success font-mono">Total: {new Intl.NumberFormat().format(totalTarget)}</span>
               </div>
               
               <div className="space-y-2">
                 {subGoals.map((s, i) => (
                   <div key={i} className="flex justify-between text-xs text-gray-300 bg-black/20 p-2 rounded">
                     <span>{s.title}</span>
                     <span>{new Intl.NumberFormat().format(s.targetAmount || 0)}</span>
                   </div>
                 ))}
               </div>

               <div className="flex gap-2 mt-4">
                 <input className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white" placeholder="Item Name (e.g. Rent)" value={tempSubName} onChange={(e) => setTempSubName(e.target.value)} />
                 <input className="w-24 bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white" type="number" placeholder="Amt" value={tempSubAmount} onChange={(e) => setTempSubAmount(e.target.value)} />
                 <button onClick={addSubGoal} className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20"><Plus size={16}/></button>
               </div>
            </div>
          )}

          <GlassButton className="w-full" onClick={handleSave} disabled={!title || totalTarget <= 0}>
            Create Goal Blueprint
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};
