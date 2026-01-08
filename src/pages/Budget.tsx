import { useState } from 'react';
import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';
import { Naira } from '../components/ui/Naira';
import { Trash2, Calendar, RefreshCcw } from 'lucide-react';

export const Budget = () => {
  const { budgets, addBudget, dailyBurn, user } = useFinancials();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [freq, setFreq] = useState<'monthly'|'one-time'>('monthly');

  const handleAdd = () => {
    addBudget({
      id: crypto.randomUUID(),
      name,
      amount: parseFloat(amount),
      frequency: freq,
      category: 'General',
      autoDeduct: true
    });
    setName(''); setAmount('');
  };

  const activeBudgets = budgets; // In real app, filter expired
  const totalMonthly = activeBudgets.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">OpEx Monitor</h1>
          <p className="text-gray-400">Total Monthly Burn: <Naira/>{new Intl.NumberFormat().format(totalMonthly)}</p>
        </div>
        <div className={`text-right ${totalMonthly > user.burnCap ? 'text-red-500' : 'text-green-500'}`}>
          <div className="text-xs uppercase font-bold">Burn Cap Status</div>
          <div className="font-mono font-bold">{Math.round((totalMonthly/user.burnCap)*100)}% Used</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ADD FORM */}
        <GlassCard className="p-6 h-fit">
          <h3 className="font-bold text-white mb-4">Add Spending Protocol</h3>
          <div className="space-y-4">
            <GlassInput label="Name" value={name} onChange={e => setName(e.target.value)} />
            <GlassInput label="Amount (NGN)" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
            
            <div className="flex gap-2">
              <button 
                onClick={() => setFreq('monthly')}
                className={`flex-1 p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 ${freq === 'monthly' ? 'bg-white text-black' : 'bg-transparent text-gray-500 border-white/10'}`}
              >
                <RefreshCcw size={12}/> Recurring
              </button>
              <button 
                onClick={() => setFreq('one-time')}
                className={`flex-1 p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 ${freq === 'one-time' ? 'bg-white text-black' : 'bg-transparent text-gray-500 border-white/10'}`}
              >
                <Calendar size={12}/> One-Time
              </button>
            </div>
            
            <GlassButton className="w-full" onClick={handleAdd} disabled={!name || !amount}>Add to Burn</GlassButton>
          </div>
        </GlassCard>

        {/* LIST */}
        <div className="space-y-3">
          {activeBudgets.map(b => (
            <div key={b.id} className="flex justify-between items-center p-4 bg-white/5 border border-white/10 rounded-xl">
              <div>
                <div className="font-bold text-white flex items-center gap-2">
                  {b.name}
                  {b.frequency === 'one-time' && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 rounded">1x</span>}
                </div>
                <div className="text-xs text-gray-500"><Naira/>{new Intl.NumberFormat().format(b.amount)}</div>
              </div>
              <button className="text-gray-600 hover:text-red-500"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
