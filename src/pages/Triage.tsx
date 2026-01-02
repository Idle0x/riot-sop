import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  ArrowRight, 
  ShieldCheck, 
  Heart, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  Briefcase // New Icon
} from 'lucide-react';
import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';
import { GlassProgressBar } from '../components/ui/GlassProgressBar';
import { cn } from '../utils/cn';

export const Triage = () => {
  const navigate = useNavigate();
  const { goals, projects, updateGoalAmount, addTransaction } = useFinancials(); // Pull projects
  
  const [step, setStep] = useState(1);
  
  // --- STATE: STEP 1 (Input) ---
  const [amountUSD, setAmountUSD] = useState<string>('');
  const [rate, setRate] = useState<string>('1500');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(''); // New State
  
  // --- STATE: STEP 2 (Logic) ---
  const [generosity, setGenerosity] = useState<string>('0');
  
  // --- STATE: STEP 3 (Allocation) ---
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  // --- CALCULATIONS ---
  const dropAmount = parseFloat(amountUSD) || 0;
  const exchangeRate = parseFloat(rate) || 0;
  const amountNGN = dropAmount * exchangeRate;
  
  const bufferAmount = amountNGN * 0.10;
  const generosityAmount = parseFloat(generosity) || 0;
  const GENEROSITY_CAP = 300000;
  const isCapBreached = generosityAmount > GENEROSITY_CAP;
  
  const totalAvailableForGoals = amountNGN - bufferAmount - generosityAmount;
  
  const totalAllocated = Object.values(allocations).reduce((a, b) => a + b, 0);
  const remainingToAllocate = totalAvailableForGoals - totalAllocated;
  const isOverAllocated = remainingToAllocate < 0;
  const isNegativeFlow = totalAvailableForGoals < 0;

  const formatNGN = (val: number) => 
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(val);

  // --- AUTO-FILL ---
  const autoFill = () => {
    let moneyLeft = totalAvailableForGoals;
    const newAllocations: Record<string, number> = {};
    const activeGoals = goals.filter(g => !g.isCompleted).sort((a, b) => a.priority - b.priority);

    for (const goal of activeGoals) {
      if (moneyLeft <= 0) break;
      const needed = goal.targetAmount - goal.currentAmount;
      const toAdd = Math.min(needed, moneyLeft);
      if (toAdd > 0) {
        newAllocations[goal.id] = toAdd;
        moneyLeft -= toAdd;
      }
    }
    setAllocations(newAllocations);
  };

  // --- COMMIT ---
  const handleFinalize = () => {
    const date = new Date().toISOString();
    
    // Find project name for description if selected
    const projectSource = projects.find(p => p.id === selectedProjectId)?.name || 'Unknown Source';

    // 1. Log Drop with Link
    addTransaction({
      id: crypto.randomUUID(),
      date,
      amount: dropAmount,
      currency: 'USD',
      type: 'drop',
      description: `Income from ${projectSource}`,
      projectId: selectedProjectId || undefined, // The Neural Link
    });

    // 2. Allocations
    Object.entries(allocations).forEach(([goalId, amount]) => {
      if (amount > 0) {
        updateGoalAmount(goalId, amount);
        addTransaction({
          id: crypto.randomUUID(),
          date,
          amount: amount,
          currency: 'NGN',
          type: 'allocation',
          description: `Allocation to goal`,
          relatedGoalId: goalId
        });
      }
    });

    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-20">
      
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Triage Protocol</h1>
        <p className="text-gray-400">Step {step} of 3</p>
      </div>

      <div className="flex justify-between items-center px-12 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-glass-border -z-10" />
        {[1, 2, 3].map((s) => (
          <div key={s} className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 bg-bg-primary",
            step >= s ? "border-accent-success text-accent-success shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "border-glass-border text-gray-600"
          )}>
            {s}
          </div>
        ))}
      </div>

      <GlassCard className="p-8 min-h-[500px] flex flex-col">
        
        {/* === STEP 1: INPUT === */}
        {step === 1 && (
          <div className="space-y-8 flex-1 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassInput 
                label="Drop Amount (USD)"
                icon={<DollarSign size={16} />}
                type="number"
                placeholder="0.00"
                value={amountUSD}
                onChange={(e) => setAmountUSD(e.target.value)}
                autoFocus
              />
              <GlassInput 
                label="Exchange Rate (₦/$)"
                type="number"
                placeholder="1500"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div>

            {/* NEW: SOURCE SELECTOR */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">
                Source Project (Signal)
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <Briefcase size={16} />
                </div>
                <select
                  className="w-full bg-black/20 border border-glass-border rounded-xl py-3 pl-11 pr-4 text-white appearance-none focus:outline-none focus:border-accent-success/50 transition-all cursor-pointer"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  <option value="" className="bg-bg-primary text-gray-500">Select Source...</option>
                  <option value="other" className="bg-bg-primary">Other / Unlinked</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id} className="bg-bg-primary">
                      {p.name} ({p.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {dropAmount > 0 && (
              <div className="p-4 bg-accent-info/5 border border-accent-info/20 rounded-xl text-center mt-auto">
                <span className="text-gray-400 text-sm">Total Value in Naira</span>
                <div className="text-3xl font-mono font-bold text-white mt-1">
                  {formatNGN(amountNGN)}
                </div>
              </div>
            )}

            <div className="pt-8 mt-auto">
              <GlassButton 
                className="w-full" 
                size="lg"
                disabled={!dropAmount || !exchangeRate}
                onClick={() => setStep(2)}
              >
                Analyze Logic <ArrowRight className="ml-2 h-4 w-4" />
              </GlassButton>
            </div>
          </div>
        )}

        {/* STEP 2 & 3 remain functionally identical, just re-rendered inside this new component structure */}
        {step === 2 && (
          <div className="space-y-8 flex-1 flex flex-col">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-glass-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-warning/10 text-accent-warning rounded-lg"><ShieldCheck size={20} /></div>
                  <div><div className="font-bold text-white">Buffer Vault (10%)</div><div className="text-xs text-gray-500">Automatic deduction</div></div>
                </div>
                <div className="font-mono font-bold text-accent-warning">-{formatNGN(bufferAmount)}</div>
              </div>

              <div className={cn("p-4 rounded-xl border transition-all", isCapBreached ? "bg-accent-danger/5 border-accent-danger/30" : "bg-white/5 border-glass-border")}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent-info/10 text-accent-info rounded-lg"><Heart size={20} /></div>
                    <div><div className="font-bold text-white">Generosity</div><div className="text-xs text-gray-500">Max Cap: ₦300,000</div></div>
                  </div>
                  <GlassInput className={cn("text-right h-10 w-32", isCapBreached && "text-accent-danger border-accent-danger")} placeholder="0" value={generosity} onChange={(e) => setGenerosity(e.target.value)} />
                </div>
                {isCapBreached && <div className="flex items-center gap-2 text-xs text-accent-danger font-bold animate-pulse"><AlertTriangle size={12} /> CAP BREACHED.</div>}
              </div>

              <div className="mt-8">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold uppercase text-gray-400">Available for Roadmap</span>
                  <span className={cn("text-2xl font-mono font-bold", isNegativeFlow ? "text-accent-danger" : "text-accent-success")}>{formatNGN(totalAvailableForGoals)}</span>
                </div>
                <GlassProgressBar value={totalAvailableForGoals} max={amountNGN} color={isNegativeFlow ? "danger" : "success"} showPercentage={false} />
              </div>
            </div>
            <div className="flex gap-4 pt-4 mt-auto">
              <GlassButton variant="secondary" onClick={() => setStep(1)}>Back</GlassButton>
              <GlassButton className="flex-1" disabled={isCapBreached || isNegativeFlow} onClick={() => setStep(3)}>Proceed</GlassButton>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-glass-border sticky top-0 z-10 backdrop-blur-md">
              <div>
                <div className="text-xs text-gray-400 uppercase font-bold">Unallocated</div>
                <div className={cn("font-mono font-bold text-xl", isOverAllocated ? "text-accent-danger" : "text-white")}>{formatNGN(remainingToAllocate)}</div>
              </div>
              <GlassButton size="sm" onClick={autoFill} variant="secondary"><Sparkles className="w-4 h-4 mr-2 text-accent-success" /> Auto-Fill</GlassButton>
            </div>
            <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2">
              {goals.filter(g => !g.isCompleted).map((goal) => {
                const allocated = allocations[goal.id] || 0;
                const remainingNeeded = goal.targetAmount - goal.currentAmount;
                const progress = ((goal.currentAmount + allocated) / goal.targetAmount) * 100;
                return (
                  <div key={goal.id} className="p-4 rounded-xl border border-glass-border bg-black/20 hover:border-white/20 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-white/10 text-gray-300">{goal.phase}</span>
                          <h4 className="font-bold text-white">{goal.title}</h4>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Need: {formatNGN(remainingNeeded)}</div>
                      </div>
                      <GlassInput type="number" placeholder="0" className="text-right h-10 w-32 bg-black/40" value={allocated || ''} onChange={(e) => setAllocations(prev => ({...prev, [goal.id]: parseFloat(e.target.value) || 0}))} />
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-accent-success transition-all duration-500" style={{ width: `${progress}%` }} /></div>
                  </div>
                );
              })}
            </div>
            <div className="pt-4 mt-auto flex gap-4">
              <GlassButton variant="secondary" onClick={() => setStep(2)}>Back</GlassButton>
              <GlassButton className="flex-1" disabled={isOverAllocated || remainingToAllocate < 0} onClick={handleFinalize}><CheckCircle2 className="w-4 h-4 mr-2" /> Commit to Ledger</GlassButton>
            </div>
          </div>
        )}

      </GlassCard>
    </div>
  );
};
