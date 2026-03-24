import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLedger } from '../context/LedgerContext';
import { useFinancialStats } from '../hooks/useFinancialStats'; 
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';
import { GlassProgressBar } from '../components/ui/GlassProgressBar';
import { Naira } from '../components/ui/Naira';
import { formatNumber } from '../utils/format';
import { Trash2, RefreshCcw, Plus, X, Zap, ArrowRight } from 'lucide-react';

export const Budget = () => {
  const navigate = useNavigate(); 
  const { 
    budgets, telemetry, addBudget, updateAccount, updateBudgetSpent, 
    commitAction, deleteBudget, triggerJournalPrompt 
  } = useLedger();

  const { leakOutflow } = useFinancialStats();

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
      category: name, 
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

    const targetBudget = budgets.find(b => b.id === selectedBudgetId);
    const budgetName = targetBudget?.name || 'Uncategorized';

    commitAction({
        date: new Date().toISOString(),
        type: 'SPEND',
        title: budgetName,
        amount: val,
        description: spendNote
    });

    if (targetBudget) {
        triggerJournalPrompt({
           type: 'BUDGET_SPEND',
           data: {
              amount: val,
              budgetName: targetBudget.name,
              limit: targetBudget.amount,
              spentBefore: targetBudget.spent || 0
           }
        });
    }

    setIsSpendModalOpen(false);
    setSpendAmount('');
    setSpendNote('');
    setSelectedBudgetId('');
  };

  const resetBudgetCycle = () => {
    alert("In Cloud V2, Budget Cycles reset automatically via the Monthly Checkpoint!");
  };

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const telemetryThisMonth = telemetry.filter(t => t.date.startsWith(currentMonthKey) && t.type === 'SPEND');

  const activeBudgetsWithTelemetry = budgets.map(b => {
      const autoSpent = telemetryThisMonth
         .filter(t => t.categoryGroup.toLowerCase().includes(b.category.toLowerCase()) || t.categoryGroup.toLowerCase().includes(b.name.toLowerCase()))
         .reduce((sum, t) => sum + t.amount, 0);

      return { ...b, totalSpent: (b.spent || 0) + autoSpent };
  });

  const totalMonthly = activeBudgetsWithTelemetry.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="max-w-4xl mx-auto p-3 md:p-8 space-y-5 md:space-y-8 pb-16 md:pb-20 animate-fade-in">

      {isSpendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
          <GlassCard className="w-full max-w-md p-4 md:p-6 relative">
            <button onClick={() => setIsSpendModalOpen(false)} className="absolute top-3 md:top-4 right-3 md:right-4 text-gray-500 hover:text-white"><X size={18}/></button>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Log Expense</h2>
            <div className="space-y-3 md:space-y-4">
               <div>
                 <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Category</label>
                 <select 
                   className="w-full bg-black/20 border border-white/10 rounded-lg md:rounded-xl p-2.5 md:p-3 text-xs md:text-sm text-white mt-1 outline-none focus:border-white/30"
                   value={selectedBudgetId}
                   onChange={(e) => setSelectedBudgetId(e.target.value)}
                 >
                   <option value="">Uncategorized (General Burn)</option>
                   {budgets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                 </select>
               </div>
               <GlassInput label="Amount" type="number" value={spendAmount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSpendAmount(e.target.value)} autoFocus />
               <GlassInput label="Note" value={spendNote} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSpendNote(e.target.value)} />
               <GlassButton className="w-full text-xs md:text-sm py-2.5 md:py-3" onClick={handleSpend} disabled={!spendAmount}>Confirm Spend</GlassButton>
            </div>
          </GlassCard>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-3 md:gap-4">
        <div className="flex-1">
          <h1 className="text-xl md:text-3xl font-bold text-white">OpEx Monitor</h1>
          <div className="flex flex-wrap gap-2 md:gap-4 mt-1 md:mt-2">
             <p className="text-gray-400 text-[10px] md:text-sm flex items-center gap-1 font-bold">
                Planned Cap: <span className="text-white font-mono flex items-center gap-0.5"><Naira/>{formatNumber(totalMonthly)}</span>
             </p>
             {leakOutflow > 0 && (
                <p className="text-red-400 text-[10px] md:text-sm flex items-center gap-1 border-l border-red-500/30 pl-2 md:pl-4 font-bold">
                   <Zap size={12} className="md:w-3.5 md:h-3.5"/> Leakage: <span className="font-mono flex items-center gap-0.5"><Naira/>{formatNumber(leakOutflow)}</span>
                </p>
             )}
          </div>
        </div>
        <div className="flex gap-2">
           <GlassButton size="sm" variant="secondary" onClick={() => resetBudgetCycle()} className="text-[10px] md:text-xs px-2 md:px-4">
             <RefreshCcw size={12} className="md:w-3.5 md:h-3.5 mr-1.5 md:mr-2"/> New Month
           </GlassButton>
           <GlassButton size="sm" onClick={() => setIsSpendModalOpen(true)} className="text-[10px] md:text-xs px-2 md:px-4">
             <Plus size={12} className="md:w-3.5 md:h-3.5 mr-1.5 md:mr-2"/> Log Expense
           </GlassButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        <GlassCard className="p-4 md:p-6 h-fit">
          <h3 className="font-bold text-white mb-3 md:mb-4 text-sm md:text-base">Add Spending Protocol</h3>
          <div className="space-y-3 md:space-y-4">
            <GlassInput label="Name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
            <GlassInput label="Limit (NGN)" type="number" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} />

            <div className="flex gap-2">
              <button 
                onClick={() => setFreq('monthly')}
                className={`flex-1 p-2 border rounded-md md:rounded-lg text-[10px] md:text-xs font-bold transition-colors ${freq === 'monthly' ? 'bg-white text-black' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/20'}`}
              >
                Recurring
              </button>
              <button 
                onClick={() => setFreq('one-time')}
                className={`flex-1 p-2 border rounded-md md:rounded-lg text-[10px] md:text-xs font-bold transition-colors ${freq === 'one-time' ? 'bg-white text-black' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/20'}`}
              >
                One-Time
              </button>
            </div>

            <GlassButton className="w-full text-xs md:text-sm py-2.5 md:py-3 mt-1" onClick={handleAdd} disabled={!name || !amount}>Add to Burn</GlassButton>
          </div>
        </GlassCard>

        <div className="space-y-2 md:space-y-3">
          {activeBudgetsWithTelemetry.map(b => (
            <GlassCard key={b.id} className="p-3 md:p-4" hoverEffect>
              <div className="flex justify-between items-start md:items-center mb-2">
                <div>
                  <div className="font-bold text-white flex items-center gap-2 text-sm md:text-base">
                    {b.name}
                  </div>
                  <div className="text-[10px] md:text-xs text-gray-500 flex items-center gap-1 font-bold mt-0.5">
                     <span className="text-white flex items-center"><Naira/>{formatNumber(b.totalSpent)}</span> / <span className="flex items-center"><Naira/>{formatNumber(b.amount)}</span>
                  </div>
                </div>
                <button 
                    onClick={() => deleteBudget(b.id)} 
                    className="text-gray-600 hover:text-red-500 transition-colors p-1"
                >
                    <Trash2 size={14} className="md:w-4 md:h-4"/>
                </button>
              </div>
              <GlassProgressBar 
                value={b.totalSpent} 
                max={b.amount} 
                color={b.totalSpent > b.amount ? 'danger' : b.totalSpent > (b.amount * 0.8) ? 'warning' : 'success'} 
                size="sm"
              />
            </GlassCard>
          ))}

          {leakOutflow > 0 && (
             <button 
                onClick={() => navigate('/analytics?view=leaks')}
                className="w-full text-left p-3 md:p-4 border border-red-500/50 bg-red-500/10 rounded-xl md:rounded-2xl flex justify-between items-center hover:bg-red-500/20 transition-all group cursor-pointer mt-2"
             >
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-red-400 flex items-center gap-1.5 md:gap-2 text-xs md:text-sm truncate">
                    <Zap size={14}/> Unbudgeted System Leakage
                  </div>
                  <div className="text-[9px] md:text-[10px] text-gray-400 mt-1 flex items-center gap-1 group-hover:text-red-300 transition-colors font-bold truncate">
                     Click to view forensic matrix <ArrowRight size={10}/>
                  </div>
                </div>
                <div className="font-mono font-bold text-red-500 flex items-center gap-0.5 md:gap-1 text-lg md:text-xl shrink-0">
                   <Naira/>{formatNumber(leakOutflow)}
                </div>
             </button>
          )}
        </div>
      </div>
    </div>
  );
};
