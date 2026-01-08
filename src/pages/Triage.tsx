import { useState } from 'react';
import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';
import { Naira } from '../components/ui/Naira';
import { getFinancialState } from '../utils/finance';
import { ArrowRight, Flame, Heart, AlertTriangle, CheckCircle2, Lock, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Triage = () => {
  const navigate = useNavigate();
  const { 
    runwayMonths, goals, signals, unallocatedCash,
    updateAccount, commitAction, updateSignal 
  } = useFinancials();

  const [step, setStep] = useState(1);
  const [amountUSD, setAmountUSD] = useState('');
  const [rate, setRate] = useState('1500');
  const [selectedSignalId, setSelectedSignalId] = useState('');
  const [ventureTax, setVentureTax] = useState(0);
  const [generosity, setGenerosity] = useState('0');
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [impulseLock, setImpulseLock] = useState(false);

  // Calculations
  const dropUSD = parseFloat(amountUSD) || 0;
  const rateVal = parseFloat(rate) || 0;
  const grossNGN = dropUSD * rateVal;
  const sourceFunds = dropUSD > 0 ? grossNGN : unallocatedCash;

  const taxAmount = sourceFunds * (ventureTax / 100);
  const netFunds = sourceFunds - taxAmount;
  const bufferAmount = netFunds * 0.10;
  const genAmount = parseFloat(generosity) || 0;
  const availableForGoals = netFunds - bufferAmount - genAmount;
  const allocatedSum = Object.values(allocations).reduce((a, b) => a + b, 0);
  const remaining = availableForGoals - allocatedSum;

  const state = getFinancialState(runwayMonths);
  const isCritical = runwayMonths < 3; // GUARDRAIL LOGIC

  const autoDistribute = () => {
    // Distribute weighted by priority (Simplified: Equal split for MVP)
    const activeGoals = goals.filter(g => !g.isCompleted);
    if (activeGoals.length === 0) return;
    
    const split = Math.floor(availableForGoals / activeGoals.length);
    const newAlloc: Record<string, number> = {};
    activeGoals.forEach(g => newAlloc[g.id] = split);
    setAllocations(newAlloc);
  };

  const handleCommit = () => {
    const timestamp = new Date().toISOString();

    if (dropUSD > 0) updateAccount('holding', grossNGN);
    updateAccount('holding', -sourceFunds);

    if (taxAmount > 0) commitAction({ id: crypto.randomUUID(), date: timestamp, type: 'SPEND', title: 'Venture Tax Burned', amount: taxAmount, tags: ['risk'] });
    
    // Buffer & Generosity
    updateAccount('buffer', bufferAmount);
    if (genAmount > 0) updateAccount('payroll', genAmount);

    // Goal Processing (In real app, update Goal objects. Here we log it)
    Object.entries(allocations).forEach(([goalId, amount]) => {
       if (amount > 0) {
          // In a full implementation, you'd call updateGoal() to increment currentAmount
          commitAction({ id: crypto.randomUUID(), date: timestamp, type: 'GOAL_FUND', title: 'Goal Allocation', amount, linkedGoalId: goalId });
       }
    });

    // Remainder handling
    if (impulseLock) {
       // Lock logic would go here (e.g., move to 'Locked Holding' account)
       commitAction({ id: crypto.randomUUID(), date: timestamp, type: 'SYSTEM_EVENT', title: 'Funds Locked (72h)', amount: remaining, description: 'Impulse Protocol Active' });
    } else if (remaining > 0) {
       updateAccount('payroll', remaining);
    }

    // Signal ROI
    const signal = signals.find(s => s.id === selectedSignalId);
    if (signal && dropUSD > 0) {
      updateSignal({ ...signal, totalGenerated: signal.totalGenerated + dropUSD, updatedAt: timestamp });
    }

    commitAction({
      id: crypto.randomUUID(), date: timestamp, type: 'TRIAGE',
      title: `Triaged ${dropUSD > 0 ? 'Drop' : 'Unallocated'}`,
      amount: sourceFunds,
      linkedSignalId: selectedSignalId
    });

    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 pb-20 space-y-8 animate-fade-in">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">The Accountant</h1>
        <p className={`text-sm font-bold uppercase tracking-wider ${state === 'critical' ? 'text-red-500' : 'text-green-500'}`}>{state.toUpperCase()} STATE DETECTED</p>
      </div>

      <GlassCard className="p-6">
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <GlassInput label="Drop (USD)" type="number" value={amountUSD} onChange={e => setAmountUSD(e.target.value)} autoFocus />
              <GlassInput label="Rate" type="number" value={rate} onChange={e => setRate(e.target.value)} />
            </div>
            
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Signal Source</label>
              <select className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white" value={selectedSignalId} onChange={e => setSelectedSignalId(e.target.value)}>
                <option value="">Select Source...</option>
                {signals.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex justify-between mb-2">
                <span className="flex items-center gap-2 font-bold text-red-500"><Flame size={16}/> Venture Tax</span>
                <span className="font-mono text-red-500">{ventureTax}%</span>
              </div>
              <input type="range" min="0" max="20" value={ventureTax} onChange={e => setVentureTax(Number(e.target.value))} className="w-full accent-red-500"/>
            </div>

            <GlassButton className="w-full" onClick={() => setStep(2)}>Next: Allocation <ArrowRight size={16} className="ml-2"/></GlassButton>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="text-xs text-gray-500 uppercase">Net Deployable</div>
                <div className="font-mono font-bold text-white"><Naira/>{new Intl.NumberFormat().format(netFunds)}</div>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                <div className="text-xs text-yellow-500 uppercase">Buffer (10%)</div>
                <div className="font-mono font-bold text-white"><Naira/>{new Intl.NumberFormat().format(bufferAmount)}</div>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${genAmount > 300000 ? 'bg-red-500/10 border-red-500' : 'bg-white/5 border-white/10'}`}>
              <div className="flex justify-between mb-2">
                <span className="flex items-center gap-2 font-bold text-white"><Heart size={16}/> Generosity</span>
                {genAmount > 300000 && <span className="text-xs font-bold text-red-500 flex items-center gap-1"><AlertTriangle size={12}/> CAP EXCEEDED</span>}
              </div>
              <GlassInput value={generosity} onChange={e => setGenerosity(e.target.value)} className="text-right" placeholder="0" />
            </div>

            {/* GOAL ALLOCATOR */}
            <div className="bg-black/20 p-4 rounded-xl border border-white/10 h-64 overflow-y-auto relative">
              {isCritical && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4">
                  <Lock className="text-red-500 mb-2" size={32}/>
                  <h3 className="font-bold text-white">Allocation Locked</h3>
                  <p className="text-sm text-red-400">Runway is Critical (&lt;3 Months). All funds must go to Buffer/Survival.</p>
                </div>
              )}
              
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xs font-bold text-gray-400 uppercase">Goals</h3>
                 <button onClick={autoDistribute} className="text-xs text-accent-success flex items-center gap-1 hover:underline"><Wand2 size={12}/> Auto-Fill</button>
              </div>

              {goals.filter(g => !g.isCompleted).map(g => (
                <div key={g.id} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white">{g.title}</span>
                    <span className="text-gray-500">Need: <Naira/>{new Intl.NumberFormat().format(g.targetAmount - g.currentAmount)}</span>
                  </div>
                  <input 
                    type="number" 
                    disabled={isCritical}
                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm disabled:opacity-50"
                    placeholder="Allocation"
                    value={allocations[g.id] || ''}
                    onChange={e => setAllocations({...allocations, [g.id]: parseFloat(e.target.value) || 0})}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl">
               <input type="checkbox" checked={impulseLock} onChange={e => setImpulseLock(e.target.checked)} className="accent-blue-500 w-5 h-5"/>
               <div className="text-sm">
                 <span className="text-white font-bold">Impulse Lock Protocol</span>
                 <p className="text-xs text-gray-500">Lock remaining funds for 72 hours.</p>
               </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <span className="text-gray-400 text-sm">Remaining</span>
              <span className={`font-mono font-bold ${remaining < 0 ? 'text-red-500' : 'text-green-500'}`}><Naira/>{new Intl.NumberFormat().format(remaining)}</span>
            </div>

            <GlassButton className="w-full" disabled={remaining < 0 || genAmount > 300000} onClick={handleCommit}>
              <CheckCircle2 size={16} className="mr-2"/> Commit Triage
            </GlassButton>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
