import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useLedger } from '../context/LedgerContext';
import { useExchangeRate } from '../hooks/useExchangeRate'; 
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';
import { Naira } from '../components/ui/Naira';
import { getFinancialState, calculateGenerosityCap } from '../utils/finance';
import { formatNumber } from '../utils/format';
import { ArrowRight, ArrowLeft, Flame, Heart, AlertTriangle, CheckCircle2, Lock, Wand2, Landmark, ShieldCheck, Wallet, RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const Triage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const { 
    runwayMonths, goals, signals, unallocatedCash,
    updateAccount, commitAction, updateSignal, fundGoal 
  } = useLedger();

  const { rate, setRate, fetchLiveRate } = useExchangeRate(); 
  const [isFetchingRate, setIsFetchingRate] = useState(false);

  const [step, setStep] = useState(1);
  const [amountUSD, setAmountUSD] = useState('');
  const [costBasisUSD, setCostBasisUSD] = useState('0'); 
  const [selectedSignalId, setSelectedSignalId] = useState('');

  // AUTO-FILL
  useEffect(() => {
    const paramAmount = searchParams.get('amount');
    const paramSource = searchParams.get('source');

    if (paramAmount) setAmountUSD(paramAmount);
    if (paramSource) {
      const found = signals.find(s => s.title === paramSource);
      if (found) setSelectedSignalId(found.id);
    }
  }, [searchParams, signals]);

  const [taxProvision, setTaxProvision] = useState(0); 
  const [ventureTax, setVentureTax] = useState(0);
  const [vaultTax, setVaultTax] = useState(10); 

  // STEP 2 STATES
  const [generosity, setGenerosity] = useState('0');
  const [runwayAlloc, setRunwayAlloc] = useState('0'); 
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  // --- MATH ENGINE ---
  const dropUSD = parseFloat(amountUSD) || 0;
  const costUSD = parseFloat(costBasisUSD) || 0;
  const rateVal = parseFloat(rate) || 0;

  const grossNGN = dropUSD * rateVal;
  const sourceFunds = dropUSD > 0 ? grossNGN : unallocatedCash;

  const handleFetchRate = async () => {
    setIsFetchingRate(true);
    await fetchLiveRate();
    setIsFetchingRate(false);
  };

  const calculateTaxEstimate = (profit: number) => {
    const annualRent = user?.annualRent || 0;
    const rentRelief = Math.min(500000, annualRent * 0.20);
    const chargeableProfit = Math.max(0, profit - rentRelief);

    let tax = 0;
    let remaining = chargeableProfit;

    // NTA 2026 Bands
    remaining -= 800000;
    if (remaining > 0) {
      const band2 = Math.min(remaining, 2200000);
      tax += band2 * 0.15;
      remaining -= band2;
    }
    if (remaining > 0) {
      const band3 = Math.min(remaining, 9000000);
      tax += band3 * 0.18;
      remaining -= band3;
    }
    return profit > 0 ? (tax / profit) * 100 : 0;
  };

  const profitNGN = Math.max(0, (dropUSD - costUSD) * rateVal);
  const estTaxPercent = calculateTaxEstimate(profitNGN);

  const taxAmount = sourceFunds * (taxProvision / 100);
  const ventureAmount = sourceFunds * (ventureTax / 100);
  const vaultAmount = sourceFunds * (vaultTax / 100);

  const netFunds = sourceFunds - taxAmount - ventureAmount - vaultAmount;

  const genAmount = parseFloat(generosity) || 0;
  const runwayAmount = parseFloat(runwayAlloc) || 0;
  const goalSum = Object.values(allocations).reduce((a, b) => a + b, 0);

  const availableForGoals = netFunds - genAmount - runwayAmount;
  const remaining = availableForGoals - goalSum;

  const state = getFinancialState(runwayMonths);
  const isCritical = runwayMonths < 3; 
  const dynamicGenCap = calculateGenerosityCap(runwayMonths);
  const isGenerosityLocked = dynamicGenCap === 0;
  const isOverCap = genAmount > dynamicGenCap;

  const autoDistribute = () => {
    const activeGoals = goals.filter(g => !g.isCompleted);
    if (activeGoals.length === 0) return;
    const split = Math.floor(Math.max(0, availableForGoals) / activeGoals.length);
    const newAlloc: Record<string, number> = {};
    activeGoals.forEach(g => newAlloc[g.id] = split);
    setAllocations(newAlloc);
  };

  const handleCommit = () => {
    const timestamp = new Date().toISOString();

    if (dropUSD > 0) {
        updateAccount('holding', grossNGN); 
    }
    updateAccount('holding', -sourceFunds); 

    if (taxAmount > 0) {
      updateAccount('vault', taxAmount); 
      commitAction({ date: timestamp, type: 'TRANSFER', title: 'Tax Shield Stashed', amount: taxAmount, tags: ['tax_nta2026'] });
    }
    if (ventureAmount > 0) commitAction({ date: timestamp, type: 'SPEND', title: 'Venture Tax Burned', amount: ventureAmount, tags: ['risk'] });
    if (vaultAmount > 0) {
      updateAccount('vault', vaultAmount);
      commitAction({ date: timestamp, type: 'TRANSFER', title: 'Vault Deposit', amount: vaultAmount, tags: ['wealth_defense'] });
    }

    // --- NEW: GENEROSITY TRANSFER ---
    if (genAmount > 0) {
        // Move from Holding -> Generosity Account
        updateAccount('generosity', genAmount);
        commitAction({ 
            date: timestamp, type: 'TRANSFER', title: 'Funded Generosity Wallet', 
            amount: genAmount, description: 'Allocated for future giving', tags: ['generosity_fund'] 
        });
    }

    if (runwayAmount > 0) {
        updateAccount('payroll', runwayAmount); 
        commitAction({ date: timestamp, type: 'TRANSFER', title: 'Runway Extension', amount: runwayAmount, tags: ['operations'] });
    }

    Object.entries(allocations).forEach(([goalId, amount]) => {
       if (amount > 0) {
         updateAccount('buffer', amount);
         fundGoal(goalId, amount); 
         commitAction({ date: timestamp, type: 'GOAL_FUND', title: 'Goal Allocation', amount, linkedGoalId: goalId });
       }
    });

    if (remaining > 0) {
       updateAccount('holding', remaining);
    }

    const signal = signals.find(s => s.id === selectedSignalId);
    if (signal && dropUSD > 0) updateSignal({ ...signal, totalGenerated: signal.totalGenerated + dropUSD, updatedAt: timestamp });

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
              <GlassInput label="Drop (USD)" type="number" value={amountUSD} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmountUSD(e.target.value)} autoFocus />
              <div className="relative">
                <GlassInput 
                  label="Rate (NGN/USD)" 
                  type="number" 
                  value={rate} 
                  onChange={(e) => setRate(e.target.value)} 
                />
                <button 
                  onClick={handleFetchRate}
                  disabled={isFetchingRate}
                  className="absolute right-2 top-8 text-[10px] bg-white/10 px-2 py-1 rounded text-accent-info hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {isFetchingRate ? <RefreshCw size={10} className="animate-spin"/> : 'FETCH'}
                </button>
              </div>
            </div>

            <GlassInput label="Cost Basis (USD)" type="number" value={costBasisUSD} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCostBasisUSD(e.target.value)} icon={<Lock size={14}/>}/>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Signal Source</label>
              <select className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white" value={selectedSignalId} onChange={(e) => setSelectedSignalId(e.target.value)}>
                <option value="">Select Source...</option>
                {signals.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>

            <div className="space-y-4">
                {/* Tax Shield */}
                <div className="p-4 bg-slate-500/10 rounded-xl border border-slate-500/20">
                    <div className="flex justify-between mb-2">
                        <span className="flex items-center gap-2 font-bold text-slate-400"><ShieldCheck size={16}/> Tax Shield (NTA 2026)</span>
                        <span className="font-mono text-slate-300">{taxProvision}%</span>
                    </div>
                    <input type="range" min="0" max="25" value={taxProvision} onChange={(e) => setTaxProvision(Number(e.target.value))} className="w-full accent-slate-500"/>
                    <div className="flex justify-between mt-2">
                       <span className="text-[10px] text-gray-500">Legal Est: {estTaxPercent.toFixed(1)}%</span>
                       <button onClick={() => setTaxProvision(Math.round(estTaxPercent))} className="text-[10px] text-accent-info hover:underline">Apply Est.</button>
                    </div>
                </div>

                {/* Venture Tax */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex justify-between mb-2">
                        <span className="flex items-center gap-2 font-bold text-red-500"><Flame size={16}/> Venture Tax</span>
                        <span className="font-mono text-red-500">{ventureTax}%</span>
                    </div>
                    <input type="range" min="0" max="20" value={ventureTax} onChange={(e) => setVentureTax(Number(e.target.value))} className="w-full accent-red-500"/>
                </div>

                {/* Vault Tax */}
                <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <div className="flex justify-between mb-2">
                        <span className="flex items-center gap-2 font-bold text-blue-400"><Landmark size={16}/> The Vault</span>
                        <span className="font-mono text-blue-400">{vaultTax}%</span>
                    </div>
                    <input type="range" min="0" max="50" value={vaultTax} onChange={(e) => setVaultTax(Number(e.target.value))} className="w-full accent-blue-500"/>
                </div>
            </div>

            <GlassButton className="w-full" onClick={() => setStep(2)}>Next: Allocation <ArrowRight size={16} className="ml-2"/></GlassButton>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
               <button onClick={() => setStep(1)} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-white transition-colors">
                  <ArrowLeft size={16}/>
               </button>
               <h2 className="text-lg font-bold text-white">Allocation</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="text-xs text-gray-500 uppercase">Net Deployable</div>
                <div className="font-mono font-bold text-white flex items-center justify-center gap-1"><Naira/>{formatNumber(netFunds)}</div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <div className="text-xs text-blue-500 uppercase">Vault Stashed</div>
                <div className="font-mono font-bold text-white flex items-center justify-center gap-1"><Naira/>{formatNumber(vaultAmount)}</div>
              </div>
            </div>

            <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
              <div className="flex justify-between items-center mb-2">
                <span className="flex items-center gap-2 font-bold text-green-400"><Wallet size={16}/> Runway Top-up</span>
              </div>
              <GlassInput 
                value={runwayAlloc} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRunwayAlloc(e.target.value)} 
                className="text-right font-mono" 
                placeholder="0" 
              />
              <p className="text-[10px] text-gray-500 mt-2 text-right">Extends operational life (Payroll).</p>
            </div>

            <div className={`p-4 rounded-xl border transition-colors ${isGenerosityLocked ? 'bg-red-500/5 border-red-500/30' : isOverCap ? 'bg-red-500/10 border-red-500' : 'bg-white/5 border-white/10'}`}>
              <div className="flex justify-between mb-2">
                <span className="flex items-center gap-2 font-bold text-white"><Heart size={16} className={isGenerosityLocked ? 'text-gray-500' : 'text-accent-info'}/> Generosity Wallet</span>
                {isGenerosityLocked ? (
                    <span className="text-xs font-bold text-red-500 flex items-center gap-1"><Lock size={12}/> LOCKED</span>
                ) : (
                    <span className={`text-xs font-bold ${isOverCap ? 'text-red-500' : 'text-gray-500'} flex items-center gap-1`}>Cap: <Naira/>{formatNumber(dynamicCap)}</span>
                )}
              </div>

              {isGenerosityLocked ? (
                  <div className="text-xs text-red-400 italic text-center py-2">"My security comes first." (Runway &lt; 3mo)</div>
              ) : (
                  <>
                      <GlassInput value={generosity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGenerosity(e.target.value)} className="text-right mb-3" placeholder="0" />
                      <div className="text-[10px] text-gray-500 text-right">Funds will be moved to the Generosity Wallet for later distribution.</div>
                      {isOverCap && <div className="mt-2 text-[10px] text-red-400 flex items-center gap-1 justify-end"><AlertTriangle size={10}/> Exceeds Cap</div>}
                  </>
              )}
            </div>

            <div className="bg-black/20 p-4 rounded-xl border border-white/10 h-64 overflow-y-auto relative">
              {isCritical && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4">
                  <Lock className="text-red-500 mb-2" size={32}/>
                  <h3 className="font-bold text-white">Allocation Locked</h3>
                  <p className="text-sm text-red-400">Runway is Critical (&lt;3 Months).</p>
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
                    <span className="text-gray-500 flex items-center gap-1">Need: <Naira/>{formatNumber(g.targetAmount - g.currentAmount)}</span>
                  </div>
                  <input 
                    type="number" 
                    disabled={isCritical}
                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm disabled:opacity-50"
                    placeholder="Allocation"
                    value={allocations[g.id] || ''}
                    onChange={(e) => setAllocations({...allocations, [g.id]: parseFloat(e.target.value) || 0})}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <div className="flex flex-col">
                <span className="text-gray-400 text-sm">Remaining</span>
                <span className="text-[10px] text-gray-500">(Unallocated Holding)</span>
              </div>
              <span className={`font-mono font-bold flex items-center gap-1 ${remaining < 0 ? 'text-red-500' : 'text-green-500'}`}><Naira/>{formatNumber(remaining)}</span>
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
