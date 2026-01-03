import { useState } from 'react';
import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassProgressBar } from '../components/ui/GlassProgressBar';
import { CreditCard, RefreshCw } from 'lucide-react';
import { Naira } from '../components/ui/Naira';
import { cn } from '../utils/cn';

export const Budget = () => {
  const { budgetCategories, logExpense, resetMonthlyBudget } = useFinancials();
  
  // UI State
  const [isLogging, setIsLogging] = useState(false);
  const [selectedCat, setSelectedCat] = useState(budgetCategories[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');

  const formatNGN = (val: number) => new Intl.NumberFormat('en-NG').format(val);

  const handleSpend = () => {
    if (!amount || !desc) return;
    logExpense(parseFloat(amount), selectedCat, desc);
    setIsLogging(false);
    setAmount('');
    setDesc('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">OpEx Monitor</h1>
          <p className="text-gray-400">Monthly Operating Expenses</p>
        </div>
        <GlassButton onClick={() => setIsLogging(!isLogging)}>
          <CreditCard className="w-4 h-4 mr-2" />
          Log Expense
        </GlassButton>
      </div>

      {/* EXPENSE LOGGING FORM */}
      {isLogging && (
        <GlassCard className="p-6 border-accent-warning/30">
          <h3 className="font-bold text-white mb-4">Log New Expense</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
              <select 
                className="w-full bg-black/20 border border-glass-border rounded-xl p-3 text-white"
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
              >
                {budgetCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <GlassInput 
              label="Amount (₦)" 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              autoFocus 
            />
          </div>
          <GlassInput 
            label="Description" 
            placeholder="e.g. Chicken Republic, Spectranet Sub..." 
            value={desc} 
            onChange={(e) => setDesc(e.target.value)} 
            className="mb-4"
          />
          <div className="flex justify-end gap-2">
            <GlassButton variant="ghost" onClick={() => setIsLogging(false)}>Cancel</GlassButton>
            <GlassButton onClick={handleSpend} disabled={!amount || !desc}>Confirm Spend</GlassButton>
          </div>
        </GlassCard>
      )}

      {/* BUDGET GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgetCategories.map(cat => {
          const percent = Math.min(100, (cat.spent / cat.limit) * 100);
          const isOver = cat.spent > cat.limit;
          
          return (
            <GlassCard key={cat.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-white">{cat.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <span className={cn("font-bold", isOver ? "text-accent-danger" : "text-white")}>
                      <Naira />{formatNGN(cat.spent)}
                    </span>
                    <span>/</span>
                    <span><Naira />{formatNGN(cat.limit)}</span>
                  </div>
                </div>
                <div className={cn("text-xl font-mono font-bold", isOver ? "text-accent-danger" : "text-accent-success")}>
                  {percent.toFixed(0)}%
                </div>
              </div>

              <GlassProgressBar 
                value={cat.spent} 
                max={cat.limit} 
                color={isOver ? 'danger' : percent > 80 ? 'warning' : 'success'} 
                showPercentage={false}
              />
            </GlassCard>
          );
        })}
      </div>

      {/* MONTHLY ACTIONS */}
      <div className="flex justify-center pt-8 opacity-50 hover:opacity-100 transition-opacity">
        <button 
          onClick={() => { if(confirm("Start new month? This resets 'Spent' to 0.")) resetMonthlyBudget(); }}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-white"
        >
          <RefreshCw size={12} /> Reset Monthly Cycle
        </button>
      </div>

    </div>
  );
};