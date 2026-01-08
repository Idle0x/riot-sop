import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';
import { GlassProgressBar } from '../components/ui/GlassProgressBar';
import { Naira } from '../components/ui/Naira';
import { getFinancialState } from '../utils/finance';
import { 
  ArrowRight, ShieldAlert, Zap, Heart, Target, 
  CheckCircle2, AlertTriangle, Flame 
} from 'lucide-react';
import { cn } from '../utils/cn';

export const Triage = () => {
  const navigate = useNavigate();
  const { 
    runwayMonths, goals, signals, 
    performTriage, commitAction 
  } = useFinancials();

  // --- STATE ---
  const [step, setStep] = useState(1);
  const [amountUSD, setAmountUSD] = useState('');
  const [rate, setRate] = useState('1500'); // Default, could fetch from API later
  const [selectedSignalId, setSelectedSignalId] = useState('');
  
  // Venture Tax (The Burn)
  const [ventureTaxPercent, setVentureTaxPercent] = useState(0); // 0-10%

  // Allocations
  const [generosity, setGenerosity] = useState('0');
  const [goalAllocations, setGoalAllocations] = useState<Record<string, number>>({});

  // --- CALCULATIONS ---
  const dropAmountUSD = parseFloat(amountUSD) || 0;
  const exchangeRate = parseFloat(rate) || 0;
  const grossDropNGN = dropAmountUSD * exchangeRate;

  // 1. Venture Tax (Burn)
  const ventureTaxAmount = grossDropNGN * (ventureTaxPercent / 100);
  
  // 2. Net After Burn
  const netAfterBurn = grossDropNGN - ventureTaxAmount;

  // 3. Buffer (10% of NET or GROSS? SOP says 10% of Drop. Let's use Net to be safe, or Gross for strictness. Using Gross for Safety.)
  const bufferAmount = grossDropNGN * 0.10;

  // 4. Generosity
  const generosityAmount = parseFloat(generosity) || 0;
  const GENEROSITY_CAP = 300000;
  const isCapBreached = generosityAmount > GENEROSITY_CAP;

  // 5. Available for Goals
  const availableForGoals = netAfterBurn - bufferAmount - generosityAmount;
  const totalAllocated = Object.values(goalAllocations).reduce((a, b) => a + b, 0);
  const remaining = availableForGoals - totalAllocated;

  // --- LOGIC ENGINE (The Accountant) ---
  const financialState = getFinancialState(runwayMonths);
  
  const getAdvice = () => {
    switch (financialState) {
      case 'dry':
      case 'critical': // < 3 Months
        return {
          text: "CRITICAL STATE. Focus 100% on Runway/Buffer. No Generosity. No High Risk.",
          color: "text-accent-danger",
          maxRisk: 0,
          recGenerosity: 0
        };
      case 'building': // 3-6 Months
        return {
          text: "STABILIZING. Cap Generosity at ₦50k. Max 5% High Risk.",
          color: "text-accent-warning",
          maxRisk: 5,
          recGenerosity: 50000
        };
      case 'secure': // 6-12 Months
        return {
          text: "HEALTHY. Maximize Goal Allocation. 10% High Risk allowed.",
          color: "text-accent-success",
          maxRisk: 10,
          recGenerosity: 100000
        };
      case 'freedom': // 12+ Months
        return {
          text: "FREEDOM. You can deploy heavy capital to P5+ or External Investments.",
          color: "text-accent-info",
          maxRisk: 10,
          recGenerosity: 300000
        };
      default:
        return { text: "Analyze Logic...", color: "text-gray-400", maxRisk: 5, recGenerosity: 0 };
    }
  };

  const advice = getAdvice();

  // --- HANDLERS ---
  const handleAutoFill = () => {
    // Simple waterfall fill for active goals
    let moneyLeft = availableForGoals;
    const newAllocations: Record<string, number> = {};
    const activeGoals = goals.filter(g => !g.isCompleted && g.phase !== 'P6+').sort((a, b) => a.priority - b.priority);

    for (const goal of activeGoals) {
      if (moneyLeft <= 0) break;
      const needed = goal.targetAmount - goal.currentAmount;
      const toAdd = Math.min(needed, moneyLeft);
      if (toAdd > 0) {
        newAllocations[goal.id] = toAdd;
        moneyLeft -= toAdd;
      }
    }
    setGoalAllocations(newAllocations);
  };

  const handleCommit = () => {
    // 1. Perform Financial Ops (Update Context)
    performTriage(dropAmountUSD, {
      ventureTax: ventureTaxAmount,
      buffer: bufferAmount,
      generosity: generosityAmount,
      goals: goalAllocations,
      signalId: selectedSignalId
    });

    // 2. Log History
    const signalName = signals.find(s => s.id === selectedSignalId)?.title || 'Unknown Source';
    
    // Log the Drop
    commitAction({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: 'DROP',
      title: `Incoming Drop: $${dropAmountUSD}`,
      amount: grossDropNGN,
      description: `Source: ${signalName}. Tax: ${ventureTaxPercent}%.`,
      linkedSignalId: selectedSignalId || undefined
    });

    // Log the Burn (if any)
    if (ventureTaxAmount > 0) {
      commitAction({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        type: 'SPEND', // or a new type 'RISK_BURN'
        title: 'Venture Tax Burned',
        amount: ventureTaxAmount,
        description: 'High-risk allocation (Crypto/DeFi plays). Considered lost.',
        tags: ['risk', 'burn']
      });
    }

    navigate('/');
  };

  const formatNGN = (val: number) => new Intl.NumberFormat('en-NG').format(val);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-20 p-4 md:p-0">
      
      {/* HEADER */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">The Accountant</h1>
        <p className={`text-sm font-bold tracking-wider uppercase ${advice.color}`}>
          Status: {financialState.toUpperCase()} • {advice.text}
        </p>
      </div>

      <GlassCard className="p-6 md:p-8 min-h-[500px] flex flex-col relative overflow-hidden">
        
        {/* STEP 1: INPUT */}
        {step === 1 && (
          <div className="space-y-6 flex-1">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassInput 
                label="Drop Amount (USD)" 
                type="number" 
                value={amountUSD} 
                onChange={(e) => setAmountUSD(e.target.value)} 
                autoFocus
              />
              <GlassInput 
                label="Exchange Rate (₦/$)" 
                type="number" 
                value={rate} 
                onChange={(e) => setRate(e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500">Source Signal</label>
              <select 
                className="w-full bg-black/20 border border-glass-border rounded-xl p-3 text-white"
                value={selectedSignalId}
                onChange={(e) => setSelectedSignalId(e.target.value)}
              >
                <option value="">Select Source...</option>
                {signals.map(s => (
                  <option key={s.id} value={s.id}>{s.title} ({s.sector})</option>
                ))}
              </select>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-glass-border">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-accent-danger font-bold">
                  <Flame size={16} /> Venture Tax (Burn)
                </div>
                <span className="font-mono text-accent-danger">{ventureTaxPercent}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="1"
                value={ventureTaxPercent}
                onChange={(e) => setVentureTaxPercent(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-danger"
              />
              <p className="text-xs text-gray-500 mt-2">
                Immediate deduction for high-risk plays. {ventureTaxPercent > advice.maxRisk && <span className="text-accent-danger font-bold">WARNING: Exceeds recommended {advice.maxRisk}% limit.</span>}
              </p>
            </div>

            <div className="mt-auto pt-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Gross Value</span>
                <span className="text-white font-mono"><Naira />{formatNGN(grossDropNGN)}</span>
              </div>
              {ventureTaxAmount > 0 && (
                 <div className="flex justify-between text-sm text-accent-danger mb-4">
                  <span>Less: Venture Tax</span>
                  <span className="font-mono">- <Naira />{formatNGN(ventureTaxAmount)}</span>
                </div>
              )}
              
              <GlassButton className="w-full" size="lg" onClick={() => setStep(2)} disabled={!amountUSD}>
                Next: Allocation <ArrowRight size={16} className="ml-2" />
              </GlassButton>
            </div>
          </div>
        )}

        {/* STEP 2: ALLOCATION */}
        {step === 2 && (
          <div className="space-y-6 flex-1 flex flex-col">
            
            {/* Top Stats */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-white/5 rounded-xl border border-glass-border">
                <div className="text-xs text-gray-500 uppercase">Net to Deploy</div>
                <div className="font-mono font-bold text-white"><Naira />{formatNGN(netAfterBurn)}</div>
              </div>
              <div className="p-3 bg-accent-warning/10 rounded-xl border border-accent-warning/30">
                <div className="text-xs text-accent-warning uppercase">Buffer (10%)</div>
                <div className="font-mono font-bold text-white"><Naira />{formatNGN(bufferAmount)}</div>
              </div>
            </div>

            {/* Generosity Input */}
            <div className={cn("p-4 rounded-xl border transition-all", isCapBreached ? "bg-accent-danger/10 border-accent-danger" : "bg-white/5 border-glass-border")}>
              <div className="flex justify-between items-center mb-2">
                <label className="flex items-center gap-2 text-sm font-bold text-white">
                  <Heart size={16} className="text-accent-info" /> Generosity
                </label>
                {isCapBreached && <span className="text-xs font-bold text-accent-danger flex items-center gap-1"><AlertTriangle size={12}/> CAP EXCEEDED</span>}
              </div>
              <GlassInput 
                value={generosity} 
                onChange={(e) => setGenerosity(e.target.value)}
                placeholder="0"
                className="text-right font-mono"
              />
              <p className="text-xs text-gray-500 mt-2">Max Cap: <Naira />300,000. Recommended: <Naira />{formatNGN(advice.recGenerosity)}</p>
            </div>

            {/* Goal Filler */}
            <div className="flex-1 bg-black/20 rounded-xl border border-glass-border p-4 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm font-bold text-gray-400">Roadmap Funding</div>
                <button onClick={handleAutoFill} className="text-xs text-accent-success font-bold hover:underline flex items-center gap-1">
                   <Zap size={12} /> Auto-Fill
                </button>
              </div>
              
              <div className="overflow-y-auto space-y-3 pr-2 flex-1">
                 {/* Only showing Active/Incomplete Goals for clarity */}
                 {goals.filter(g => !g.isCompleted).map(goal => {
                   const allocated = goalAllocations[goal.id] || 0;
                   const needed = goal.targetAmount - goal.currentAmount;
                   return (
                     <div key={goal.id} className="flex items-center gap-3">
                       <div className="flex-1">
                         <div className="flex justify-between text-xs mb-1">
                           <span className="text-white font-bold">{goal.title}</span>
                           <span className="text-gray-500">Need: <Naira/>{formatNGN(needed)}</span>
                         </div>
                         <GlassProgressBar value={goal.currentAmount + allocated} max={goal.targetAmount} size="sm" showPercentage={false} />
                       </div>
                       <input 
                         type="number" 
                         className="w-24 bg-black/40 border border-glass-border rounded-lg p-2 text-right text-sm text-white focus:border-accent-success outline-none"
                         placeholder="0"
                         value={allocated || ''}
                         onChange={(e) => setGoalAllocations({...goalAllocations, [goal.id]: parseFloat(e.target.value) || 0})}
                       />
                     </div>
                   );
                 })}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-glass-border">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-400">Remaining Unallocated</span>
                <span className={cn("font-mono font-bold text-lg", remaining < 0 ? "text-accent-danger" : remaining > 0 ? "text-accent-warning" : "text-accent-success")}>
                  <Naira />{formatNGN(remaining)}
                </span>
              </div>
              
              <div className="flex gap-4">
                <GlassButton variant="secondary" onClick={() => setStep(1)}>Back</GlassButton>
                <GlassButton 
                  className="flex-1" 
                  disabled={isCapBreached || remaining < 0} 
                  onClick={handleCommit}
                >
                  <CheckCircle2 size={16} className="mr-2" /> Commit to Ledger
                </GlassButton>
              </div>
            </div>

          </div>
        )}

      </GlassCard>
    </div>
  );
};
