import { useState } from 'react';
import { useLedger } from '../context/LedgerContext';
import { useFinancialStats } from '../hooks/useFinancialStats'; // NEW IMPORT
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';
import { GlassProgressBar } from '../components/ui/GlassProgressBar';
import { Naira } from '../components/ui/Naira';
import { formatNumber } from '../utils/format';
import { Trash2, RefreshCcw, Plus, X, Zap } from 'lucide-react';

export const Budget = () => {
  const { 
    budgets, addBudget, updateAccount, updateBudgetSpent, 
    commitAction, deleteBudget 
  } = useLedger();

  const { leakOutflow } = useFinancialStats(); // Pull true bleed metric

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [freq, setFreq] = useState<'monthly'|'one-time'>('monthly');
  const [subDay, setSubDay] = useState(''); 

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
      autoDeduct: true,
      subscriptionDay: subDay ? parseInt(subDay) : undefined 
    });
    setName(''); setAmount(''); setSubDay('');
  };

  const handleSpend = () => {
    const val = parseFloat(spendAmount);
    if (!val) return;
    updateAccount('payroll', -val);
    if (selectedBudgetId) updateBudgetSpent(selectedBudgetId, val);

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
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-20 animate-fade-in">

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

      {/* HEADER WITH TELEMETRY INJECTION */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">OpEx Monitor</h1>
          <div className="flex gap-4 mt-2">
             <p className="text-gray-400 text-sm flex items-center gap-1">
                Planned Cap: <span className="text-white font-mono font-bold flex items-center gap-1"><Naira/>{formatNumber(totalMonthly)}</span>
             </p>
             {leakOutflow > 0 && (
                <p className="text-red-400 text-sm flex items-center gap-1 border-l border-red-500/30 pl-4">
                   <Zap size={14}/> System Leakage: <span className="font-mono font-bold flex items-center gap-1"><Naira/>{formatNumber(leakOutflow)}</span>
                </p>
             )}
          </div>
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
        {/* ADD PROTOCOL */}
        <GlassCard className="p-6 h-fit">
          <h3 className="font-bold text-white mb-4">Add Spending Protocol</h3>
          <div className="space-y-4">
            <GlassInput label="Name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
            <GlassInput label="Limit (NGN)" type="number" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} />

            <div className="flex gap-2">
              <button 
                onClick={() => setFreq('monthly')}
                className={`flex-1 p-2 rounded-lg border text-xs font-bold ${freq === 'monthly' ? 'bg-white text-black' : 'bg-transparent text-gray-500 border-white/10'}`}
              >
                Recurring
              </button>
              <button 
                onClick={() => setFreq('one-time')}
                className={`flex-1 p-2 rounded-lg border text-xs font-bold ${freq === 'one-time' ? 'bg-white text-black' : 'bg-transparent text-gray-500 border-white/10'}`}
              >
                One-Time
              </button>
            </div>

            {freq === 'monthly' && (
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <GlassInput 
                  label="Subscription Day (Optional)" 
                  type="number" 
                  placeholder="e.g. 15 (for 15th of month)" 
                  value={subDay} 
                  onChange={(e) => setSubDay(e.target.value)} 
                />
                <p className="text-[10px] text-gray-500 mt-2">
                  System will track this as a fixed bill on this date.
                </p>
              </div>
            )}

            <GlassButton className="w-full" onClick={handleAdd} disabled={!name || !amount}>Add to Burn</GlassButton>
          </div>
        </GlassCard>

        {/* ACTIVE BUDGETS */}
        <div className="space-y-3">
          {activeBudgets.map(b => (
            <GlassCard key={b.id} className="p-4" hoverEffect>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    {b.name}
                    {b.frequency === 'one-time' && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 rounded">1x</span>}
                    {b.subscriptionDay && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 rounded border border-purple-500/30">Day {b.subscriptionDay}</span>}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                     <span className="text-white flex items-center"><Naira/>{formatNumber(b.spent || 0)}</span> / <span className="flex items-center"><Naira/>{formatNumber(b.amount)}</span>
                  </div>
                </div>
                <button 
                    onClick={() => deleteBudget(b.id)} 
                    className="text-gray-600 hover:text-red-500 transition-colors"
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

          {/* DYNAMIC LEAKAGE CARD */}
          {leakOutflow > 0 && (
             <GlassCard className="p-4 border-red-500/30 bg-red-950/10">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="font-bold text-red-400 flex items-center gap-2">
                      <Zap size={14}/> Unbudgeted System Leakage
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">High-frequency friction bleed.</div>
                  </div>
                  <div className="font-mono font-bold text-red-400 flex items-center gap-1">
                     <Naira/>{formatNumber(leakOutflow)}
                  </div>
                </div>
             </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};
