import { useState } from 'react';
import { useLedger } from '../context/LedgerContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';
import { GlassProgressBar } from '../components/ui/GlassProgressBar';
import { Naira } from '../components/ui/Naira';
import { formatNumber } from '../utils/format';
import { Trash2, Calendar, RefreshCcw, Plus, X } from 'lucide-react';

export const Budget = () => {
  const { 
    budgets, addBudget, updateAccount, updateBudgetSpent, 
    commitAction, deleteBudget 
  } = useLedger();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [freq, setFreq] = useState<'monthly'|'one-time'>('monthly');

  const [isSpendModalOpen, setIsSpendModalOpen] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState('');
  const [spendAmount, setSpendAmount] = useState('');
  const [spendNote, setSpendNote] = useState('');

  const handleAdd = () => {
    addBudget({
      name,
      amount: parseFloat(amount),
      spent: 0,
      frequency: freq,
      category: 'General',
      autoDeduct: true
    });
    setName(''); setAmount('');
  };

  const handleSpend = () => {
    const val = parseFloat(spendAmount);
    if (!val) return;

    // 1. Deduct from Money
    updateAccount('payroll', -val);

    // 2. Track against Budget (if category selected)
    if (selectedBudgetId) {
        updateBudgetSpent(selectedBudgetId, val);
    }

    // 3. Log History
    const budgetName = selectedBudgetId 
        ? budgets.find(b => b.id === selectedBudgetId)?.name 
        : 'Uncategorized';
        
    commitAction({
        date: new Date().toISOString(),
        type: 'SPEND',
        title: budgetName || 'Expense',
        amount: val,
        description: spendNote
    });

    setIsSpendModalOpen(false);
    setSpendAmount('');
    setSpendNote('');
    setSelectedBudgetId('');
  };

  const resetBudgetCycle = () => {
    alert("In Cloud V2, Budget Cycles reset automatically via the Monthly Checkpoint!");
  };

  const activeBudgets = budgets;
  const totalMonthly = activeBudgets.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-20">

      {isSpendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
          <GlassCard className="w-full max-w-md p-6 relative">
            <button onClick={() => setIsSpendModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
            <h2 className="text-2xl font-bold text-white mb-6">Log Expense</h2>

            <div className="space-y-4">
               <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                 <select 
                   className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white mt-1"
                   value={selectedBudgetId}
                   onChange={(e) => setSelectedBudgetId(e.target.value)}
                 >
                   <option value="">Uncategorized (General Burn)</option>
                   {budgets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                 </select>
               </div>
               <GlassInput label="Amount" type="number" value={spendAmount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSpendAmount(e.target.value)} autoFocus />
               <GlassInput label="Note" value={spendNote} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSpendNote(e.target.value)} />
               <GlassButton className="w-full" onClick={handleSpend} disabled={!spendAmount}>Confirm Spend</GlassButton>
            </div>
          </GlassCard>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">OpEx Monitor</h1>
          <p className="text-gray-400 flex items-center gap-1">Total Monthly Burn: <span className="text-white font-mono flex items-center gap-1"><Naira/>{formatNumber(totalMonthly)}</span></p>
        </div>
        <div className="flex gap-2">
           <GlassButton size="sm" variant="secondary" onClick={() => resetBudgetCycle()}>
             <RefreshCcw size={14} className="mr-2"/> New Month
           </GlassButton>
           <GlassButton size="sm" onClick={() => setIsSpendModalOpen(true)}>
             <Plus size={14} className="mr-2"/> Log Expense
           </GlassButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <GlassCard className="p-6 h-fit">
          <h3 className="font-bold text-white mb-4">Add Spending Protocol</h3>
          <div className="space-y-4">
            <GlassInput label="Name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
            <GlassInput label="Limit (NGN)" type="number" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} />

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

        <div className="space-y-3">
          {activeBudgets.map(b => (
            <GlassCard key={b.id} className="p-4" hoverEffect>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    {b.name}
                    {b.frequency === 'one-time' && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 rounded">1x</span>}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                     <span className="text-white flex items-center"><Naira/>{formatNumber(b.spent || 0)}</span> / <span className="flex items-center"><Naira/>{formatNumber(b.amount)}</span>
                  </div>
                </div>
                <button 
                    onClick={() => deleteBudget(b.id)} 
                    className="text-gray-600 hover:text-red-500"
                >
                    <Trash2 size={16}/>
                </button>
              </div>
              <GlassProgressBar 
                value={b.spent || 0} 
                max={b.amount} 
                color={(b.spent || 0) > b.amount ? 'danger' : (b.spent || 0) > (b.amount * 0.8) ? 'warning' : 'success'} 
                size="sm"
              />
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};
