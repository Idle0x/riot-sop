import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Context & Hooks
import { useUser } from '../context/UserContext';
import { useLedger } from '../context/LedgerContext';
import { useExchangeRate } from '../hooks/useExchangeRate';

// UI Components
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';
import { Naira } from '../components/ui/Naira';

// Utilities
import { getFinancialState, calculateGenerosityCap } from '../utils/finance';
import { formatNumber } from '../utils/format';

// Icons
import { 
  ArrowRight, ArrowLeft, Flame, Heart, AlertTriangle, 
  CheckCircle2, Lock, Wand2, Landmark, ShieldCheck, 
  Wallet, RefreshCw, History, X 
} from 'lucide-react';

export const Triage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const { 
    runwayMonths, goals, signals, unallocatedCash, history,
    updateAccount, commitAction, updateSignal, fundGoal 
  } = useLedger();

  const { rate, setRate, fetchLiveRate } = useExchangeRate(); 

  // --- UI STATE ---
  const [step, setStep] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const [isFetchingRate, setIsFetchingRate] = useState(false);

  // --- STEP 1: INCOME INPUT ---
  const [amountUSD, setAmountUSD] = useState('');
  const [costBasisUSD, setCostBasisUSD] = useState('0'); 
  const [selectedSignalId, setSelectedSignalId] = useState('');
  const [taxProvision, setTaxProvision] = useState(0); 
  const [ventureTax, setVentureTax] = useState(0);
  const [vaultTax, setVaultTax] = useState(10); 

  // --- STEP 2: ALLOCATION ---
  const [generosity, setGenerosity] = useState('0');
  const [recipientName, setRecipientName] = useState(''); 
  const [recipientTier, setRecipientTier] = useState('T3');
  const [runwayAlloc, setRunwayAlloc] = useState('0'); 
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  // --- AUTO-FILL LOGIC ---
  useEffect(() => {
    const paramAmount = searchParams.get('amount');
    const paramSource = searchParams.get('source');
    if (paramAmount) setAmountUSD(paramAmount);
    if (paramSource) {
      const found = signals.find(s => s.title === paramSource);
      if (found) setSelectedSignalId(found.id);
    }
  }, [searchParams, signals]);

  // --- MATH ENGINE ---
  const dropUSD = parseFloat(amountUSD) || 0;
  const costUSD = parseFloat(costBasisUSD) || 0;
  const rateVal = parseFloat(rate) || 0;
  const grossNGN = dropUSD * rateVal;
  const sourceFunds = dropUSD > 0 ? grossNGN : unallocatedCash;

  // NTA 2026 TAX CALCULATION (RESTORED)
  const calculateTaxEstimate = (profit: number) => {
    const annualRent = user?.annualRent || 0;
    const rentRelief = Math.min(500000, annualRent * 0.20);
    const chargeableProfit = Math.max(0, profit - rentRelief);
    let tax = 0;
    let remaining = chargeableProfit;

    remaining -= 800000; // Band 1
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
  const remaining = netFunds - genAmount - runwayAmount - goalSum;

  const state = getFinancialState(runwayMonths);
  const isCritical = runwayMonths < 3; 
  const dynamicGenCap = calculateGenerosityCap(runwayMonths);
  const isGenerosityLocked = dynamicGenCap === 0;
  const isOverCap = genAmount > dynamicGenCap;

  // --- ACTIONS ---
  const handleFetchRate = async () => {
    setIsFetchingRate(true);
    await fetchLiveRate();
    setIsFetchingRate(false);
  };

  const autoDistribute = () => {
    const activeGoals = goals.filter(g => !g.isCompleted);
    if (activeGoals.length === 0) return;
    const available = Math.max(0, netFunds - genAmount - runwayAmount);
    const split = Math.floor(available / activeGoals.length);
    const newAlloc: Record<string, number> = {};
    activeGoals.forEach(g => newAlloc[g.id] = split);
    setAllocations(newAlloc);
  };

  const handleCommit = () => {
    const timestamp = new Date().toISOString();
    const signal = signals.find(s => s.id === selectedSignalId);
    
    // 1. CREATE MASTER AUDIT LOG (NEW)
    if (dropUSD > 0) {
      commitAction({
        date: timestamp,
        type: 'TRIAGE_SESSION',
        title: `Income Drop: $${formatNumber(dropUSD)}`,
        description: `Source: ${signal?.title || 'External'} | Rate: ₦${rateVal}`,
        amount: grossNGN,
        linkedSignalId: selectedSignalId
      });
      if (signal) updateSignal({ ...signal, totalGenerated: signal.totalGenerated + dropUSD, updatedAt: timestamp });
    }

    // 2. EXECUTE TRANSFERS
    if (dropUSD > 0) updateAccount('holding', grossNGN); 
    updateAccount('holding', -sourceFunds); 

    if (taxAmount > 0) {
      updateAccount('vault', taxAmount); 
      commitAction({ date: timestamp, type: 'TRANSFER', title: 'Tax Shield Stashed', amount: taxAmount, tags: ['tax_nta2026'] });
    }
    if (ventureAmount > 0) {
      commitAction({ date: timestamp, type: 'SPEND', title: 'Venture Tax Burned', amount: ventureAmount, tags: ['risk'] });
    }
    if (vaultAmount > 0) {
      updateAccount('vault', vaultAmount);
      commitAction({ date: timestamp, type: 'TRANSFER', title: 'Vault Deposit', amount: vaultAmount, tags: ['wealth_defense'] });
    }

    if (genAmount > 0) {
        updateAccount('generosity', genAmount);
        commitAction({ 
            date: timestamp, type: 'TRANSFER', title: 'Generosity Wallet Fund', 
            amount: genAmount, description: `Reserved for ${recipientName || 'Unspecified'} [${recipientTier}]`, tags: ['generosity'] 
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

    if (remaining > 0) updateAccount('holding', remaining);
    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 pb-20 space-y-8 animate-fade-in relative">
      
      {/* --- HISTORY OVERLAY (NEW) --- */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
          <GlassCard className="w-full max-w-md max-h-[70vh] flex flex-col relative border-white/10">
            <button onClick={() => setShowHistory(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X/></button>
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><History/> Triage History</h3>
              <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
                {history.filter(h => h.type === 'TRIAGE_SESSION').map(log => (
                  <div key={log.id} className="p-4 bg-white/5 border border-white/5 rounded-xl">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-white text-sm">{log.title}</span>
                      <span className="text-[10px] text-gray-500 font-mono">{new Date(log.date).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">{log.description}</div>
                    <div className="text-right font-mono text-green-400 font-bold"><Naira/>{formatNumber(log.amount || 0)}</div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="flex justify-between items-center">
        <div className="flex-1 text-center">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">The Accountant</h1>
          <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-1 ${state === 'critical' ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
            System State: {state}
          </p>
        </div>
        <button onClick={() => setShowHistory(true)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 transition-all hover:scale-110">
          <History size={20}/>
        </button>
      </div>

      <GlassCard className="p-8 border-white/10">
        {step === 1 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <GlassInput label="Income Drop (USD)" type="number" value={amountUSD} onChange={(e) => setAmountUSD(e.target.value)} autoFocus />
              <div className="relative">
                <GlassInput label="Exchange Rate" type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
                <button onClick={handleFetchRate} disabled={isFetchingRate} className="absolute right-2 top-8 text-[9px] font-black bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md uppercase tracking-widest hover:bg-blue-500/40 transition-colors">
                  {isFetchingRate ? '...' : 'Fetch'}
                </button>
              </div>
            </div>

            <GlassInput label="Cost Basis (USD)" type="number" value={costBasisUSD} onChange={(e) => setCostBasisUSD(e.target.value)} icon={<Lock size={14}/>}/>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Signal Attribution</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-white/30 transition-all" value={selectedSignalId} onChange={(e) => setSelectedSignalId(e.target.value)}>
                <option value="">External / Unlinked</option>
                {signals.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>

            {/* TAX SLIDERS */}
            <div className="grid grid-cols-1 gap-4">
                <div className="p-5 bg-slate-500/5 rounded-2xl border border-slate-500/20 group">
                    <div className="flex justify-between mb-3">
                        <span className="flex items-center gap-2 font-black text-[10px] uppercase text-slate-400 tracking-widest"><ShieldCheck size={14}/> Tax Shield</span>
                        <span className="font-mono text-white">{taxProvision}%</span>
                    </div>
                    <input type="range" min="0" max="25" value={taxProvision} onChange={(e) => setTaxProvision(Number(e.target.value))} className="w-full accent-slate-500 h-1.5 rounded-lg appearance-none bg-white/5 cursor-pointer"/>
                    <div className="flex justify-between mt-3">
                       <span className="text-[9px] font-bold text-gray-600 uppercase">Estimated Liability: {estTaxPercent.toFixed(1)}%</span>
                       <button onClick={() => setTaxProvision(Math.round(estTaxPercent))} className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-white transition-colors">Apply Est.</button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/20">
                    <div className="flex justify-between items-center mb-2 font-black text-[9px] uppercase tracking-widest text-red-500">
                      <span className="flex items-center gap-1"><Flame size={12}/> Venture Tax</span>
                      <span>{ventureTax}%</span>
                    </div>
                    <input type="range" min="0" max="20" value={ventureTax} onChange={(e) => setVentureTax(Number(e.target.value))} className="w-full accent-red-500 h-1 appearance-none bg-white/5 rounded-full cursor-pointer"/>
                  </div>
                  <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/20">
                    <div className="flex justify-between items-center mb-2 font-black text-[9px] uppercase tracking-widest text-blue-400">
                      <span className="flex items-center gap-1"><Landmark size={12}/> Vault</span>
                      <span>{vaultTax}%</span>
                    </div>
                    <input type="range" min="0" max="50" value={vaultTax} onChange={(e) => setVaultTax(Number(e.target.value))} className="w-full accent-blue-400 h-1 appearance-none bg-white/5 rounded-full cursor-pointer"/>
                  </div>
                </div>
            </div>

            <GlassButton className="w-full h-14 uppercase tracking-[0.2em] font-black" onClick={() => setStep(2)}>
              Proceed to Allocation <ArrowRight size={18} className="ml-2"/>
            </GlassButton>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-4 border-b border-white/5 pb-6">
               <button onClick={() => setStep(1)} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-white transition-all"><ArrowLeft size={18}/></button>
               <h2 className="text-xl font-black text-white uppercase tracking-tighter">Asset Allocation</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Net Deployable</div>
                <div className="font-mono font-bold text-white text-lg"><Naira/>{formatNumber(netFunds)}</div>
              </div>
              <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-center">
                <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Vault Storage</div>
                <div className="font-mono font-bold text-blue-400 text-lg"><Naira/>{formatNumber(vaultAmount)}</div>
              </div>
            </div>

            {/* RUNWAY & GENEROSITY */}
            <div className="space-y-4">
              <div className="p-5 bg-green-500/5 rounded-2xl border border-green-500/10">
                <div className="flex items-center gap-2 font-black text-[10px] uppercase text-green-500 tracking-widest mb-4"><Wallet size={14}/> Operational Runway</div>
                <GlassInput value={runwayAlloc} onChange={(e) => setRunwayAlloc(e.target.value)} className="text-right font-mono text-xl font-bold" placeholder="0" />
              </div>

              <div className={`p-5 rounded-2xl border transition-all ${isGenerosityLocked ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/10'}`}>
                <div className="flex justify-between items-center mb-4">
                  <span className="flex items-center gap-2 font-black text-[10px] uppercase text-white tracking-widest"><Heart size={14} className={isGenerosityLocked ? 'text-gray-600' : 'text-pink-500'}/> Generosity Fund</span>
                  <span className={`text-[10px] font-black ${isOverCap ? 'text-red-500 animate-pulse' : 'text-gray-500'} uppercase`}>Max: <Naira/>{formatNumber(dynamicGenCap)}</span>
                </div>
                {isGenerosityLocked ? (
                  <div className="text-[10px] text-red-400 uppercase font-black text-center py-4 border border-dashed border-red-500/20 rounded-xl">Giving Disabled: Critical Runway</div>
                ) : (
                  <div className="space-y-4">
                    <GlassInput value={generosity} onChange={(e) => setGenerosity(e.target.value)} className="text-right font-mono text-xl font-bold" placeholder="0" />
                    {genAmount > 0 && (
                      <div className="grid grid-cols-3 gap-3 animate-fade-in">
                        <input className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold text-white placeholder-gray-600" placeholder="Recipient" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
                        <select className="bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] font-black text-white uppercase" value={recipientTier} onChange={(e) => setRecipientTier(e.target.value)}>
                          <option value="T1">Family</option>
                          <option value="T2">Close</option>
                          <option value="T3">Outer</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* GOALS GRID */}
            <div className="bg-black/40 p-6 rounded-2xl border border-white/5 h-64 overflow-y-auto relative">
              {isCritical && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6">
                  <Lock className="text-red-500 mb-4" size={40}/>
                  <h3 className="font-black text-white uppercase tracking-widest">Growth Locked</h3>
                  <p className="text-[10px] text-red-500 font-bold uppercase mt-2">All funds must route to Runway Extension</p>
                </div>
              )}
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Strategic Goals</h3>
                 <button onClick={autoDistribute} className="text-[10px] font-black text-green-400 flex items-center gap-2 hover:text-white transition-colors uppercase"><Wand2 size={12}/> Auto-Fill</button>
              </div>
              <div className="space-y-4">
                {goals.filter(g => !g.isCompleted).map(g => (
                  <div key={g.id} className="group">
                    <div className="flex justify-between text-[10px] font-bold mb-2">
                      <span className="text-gray-300 uppercase tracking-tighter">{g.title}</span>
                      <span className="text-gray-600 font-mono">Needed: {formatNumber(g.targetAmount - g.currentAmount)}</span>
                    </div>
                    <input type="number" disabled={isCritical} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-mono text-sm outline-none focus:border-green-500/50 disabled:opacity-20 transition-all" placeholder="0" value={allocations[g.id] || ''} onChange={(e) => setAllocations({...allocations, [g.id]: parseFloat(e.target.value) || 0})} />
                  </div>
                ))}
              </div>
            </div>

            {/* FOOTER COMMIT */}
            <div className="flex justify-between items-end pt-6 border-t border-white/5">
              <div>
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] block mb-1">Unallocated Change</span>
                <span className={`font-mono text-xl font-bold ${remaining < 0 ? 'text-red-500' : 'text-green-400'}`}><Naira/>{formatNumber(remaining)}</span>
              </div>
              <GlassButton disabled={remaining < 0} onClick={handleCommit} className="px-10 h-14 bg-green-500 text-black hover:bg-green-400 font-black uppercase tracking-widest">
                Commit <CheckCircle2 size={18} className="ml-2"/>
              </GlassButton>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
