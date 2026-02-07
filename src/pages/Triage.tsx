import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useLedger } from '../context/LedgerContext';
import { useExchangeRate } from '../hooks/useExchangeRate';

// COMPONENTS
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';
import { Naira } from '../components/ui/Naira';
import { OperatorsManual } from '../components/signals/OperatorsManual';

// UTILS
import { getFinancialState, calculateGenerosityCap } from '../utils/finance';
import { formatNumber } from '../utils/format';

// ICONS
import { 
  ArrowRight, ArrowLeft, Flame, Heart, AlertTriangle, 
  CheckCircle2, Lock, Wand2, Landmark, ShieldCheck, 
  Wallet, RefreshCw, History, X, AlertOctagon, HelpCircle, BookOpen
} from 'lucide-react';

export const Triage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const { 
    runwayMonths, goals, signals, unallocatedCash, history,
    updateAccount, commitAction, updateSignal, fundGoal 
  } = useLedger();

  // --- STATE 1: EXCHANGE RATE ---
  const { rate, setRate, loading: isFetchingRate, error: rateError, fetchLiveRate } = useExchangeRate(); 

  // --- STATE 2: MANUAL TRIGGER ---
  const [showManual, setShowManual] = useState(false);
  const [manualChapter, setManualChapter] = useState<string | undefined>(undefined);

  // --- STATE 3: FORM DATA ---
  const [step, setStep] = useState(1);
  const [showHistory, setShowHistory] = useState(false); 

  const [amountUSD, setAmountUSD] = useState('');
  const [costBasisUSD, setCostBasisUSD] = useState('0'); 
  const [selectedSignalId, setSelectedSignalId] = useState('');
  
  const [taxProvision, setTaxProvision] = useState(0); 
  const [ventureTax, setVentureTax] = useState(0);
  const [vaultTax, setVaultTax] = useState(10); 

  const [generosity, setGenerosity] = useState('0');
  const [runwayAlloc, setRunwayAlloc] = useState('0'); 
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  const BIG_DROP_THRESHOLD = 10000;
  const [showSilenceProtocol, setShowSilenceProtocol] = useState(false);
  const [silenceChecks, setSilenceChecks] = useState({ silence: false, time: false, clarity: false });

  // --- AUTO-FILL ---
  useEffect(() => {
    const paramAmount = searchParams.get('amount');
    const paramSource = searchParams.get('source');
    if (paramAmount) setAmountUSD(paramAmount);
    if (paramSource) {
      const found = signals.find(s => s.id === paramSource || s.title === paramSource);
      if (found) setSelectedSignalId(found.id);
    }
  }, [searchParams, signals]);

  // --- MATH ENGINE ---
  const dropUSD = parseFloat(amountUSD) || 0;
  const costUSD = parseFloat(costBasisUSD) || 0;
  const rateVal = parseFloat(rate) || 0;
  const grossNGN = dropUSD * rateVal;
  const sourceFunds = dropUSD > 0 ? grossNGN : unallocatedCash;
  const profitNGN = Math.max(0, (dropUSD - costUSD) * rateVal);
  
  const calculateTaxEstimate = (profit: number) => {
    const annualRent = user?.annualRent || 0;
    const rentRelief = Math.min(500000, annualRent * 0.20);
    const chargeableProfit = Math.max(0, profit - rentRelief);
    let tax = 0;
    let rem = chargeableProfit;
    if (rem > 800000) {
      rem -= 800000;
      const b2 = Math.min(rem, 2200000); tax += b2 * 0.15; rem -= b2;
      const b3 = Math.min(rem, 9000000); tax += b3 * 0.18; rem -= b3;
    }
    return profit > 0 ? (tax / profit) * 100 : 0;
  };
  
  const estTaxPercent = calculateTaxEstimate(profitNGN);
  const taxAmount = sourceFunds * (taxProvision / 100);
  const ventureAmount = sourceFunds * (ventureTax / 100);
  const vaultAmount = sourceFunds * (vaultTax / 100);
  const netFunds = sourceFunds - taxAmount - ventureAmount - vaultAmount;
  const genAmount = parseFloat(generosity) || 0;
  const runwayAmount = parseFloat(runwayAlloc) || 0;
  const goalSum = Object.values(allocations).reduce((a, b) => a + b, 0);
  const remaining = (netFunds - genAmount - runwayAmount) - goalSum;

  const state = getFinancialState(runwayMonths);
  const isCritical = runwayMonths < 3; 
  const dynamicGenCap = calculateGenerosityCap(runwayMonths);
  const isGenerosityLocked = dynamicGenCap === 0;
  const isOverCap = genAmount > dynamicGenCap;
  const isBigDrop = dropUSD >= BIG_DROP_THRESHOLD;

  // --- HANDLERS ---
  const openManualTo = (chapterId: string) => {
    setManualChapter(chapterId);
    setShowManual(true);
  };

  const handleNextStep = () => {
    if (isBigDrop && (!silenceChecks.silence || !silenceChecks.time || !silenceChecks.clarity)) {
      setShowSilenceProtocol(true);
      return;
    }
    setStep(2);
  };

  const autoDistribute = () => {
    const activeGoals = goals.filter(g => !g.isCompleted);
    if (activeGoals.length === 0) return;
    const split = Math.floor(Math.max(0, netFunds - genAmount - runwayAmount) / activeGoals.length);
    const newAlloc: Record<string, number> = {};
    activeGoals.forEach(g => newAlloc[g.id] = split);
    setAllocations(newAlloc);
  };

  const handleCommit = () => {
    const timestamp = new Date().toISOString();
    const signal = signals.find(s => s.id === selectedSignalId);
    
    if (dropUSD > 0) {
      commitAction({
        date: timestamp,
        type: 'TRIAGE_SESSION',
        title: isBigDrop ? `BIG DROP: $${formatNumber(dropUSD)}` : `Income Drop: $${formatNumber(dropUSD)}`,
        description: `Source: ${signal?.title || 'External'} @ ₦${rateVal}/$`,
        amount: grossNGN,
        linkedSignalId: selectedSignalId || undefined,
        tags: isBigDrop ? ['big_drop', 'protocol_verified'] : []
      });
      if (signal) updateSignal({ ...signal, totalGenerated: (signal.totalGenerated || 0) + dropUSD, updatedAt: timestamp });
      updateAccount('holding', grossNGN); 
    }

    updateAccount('holding', -sourceFunds); 
    if (taxAmount > 0) { updateAccount('vault', taxAmount); commitAction({ date: timestamp, type: 'TRANSFER', title: 'Tax Shield Stashed', amount: taxAmount, tags: ['tax_nta2026'] }); }
    if (ventureAmount > 0) commitAction({ date: timestamp, type: 'SPEND', title: 'Venture Tax Burned', amount: ventureAmount, tags: ['risk'] });
    if (vaultAmount > 0) { updateAccount('vault', vaultAmount); commitAction({ date: timestamp, type: 'TRANSFER', title: 'Vault Deposit', amount: vaultAmount, tags: ['wealth_defense'] }); }
    if (genAmount > 0) { updateAccount('generosity', genAmount); commitAction({ date: timestamp, type: 'TRANSFER', title: 'Funded Generosity', amount: genAmount }); }
    if (runwayAmount > 0) { updateAccount('payroll', runwayAmount); commitAction({ date: timestamp, type: 'TRANSFER', title: 'Runway Extension', amount: runwayAmount }); }

    Object.entries(allocations).forEach(([goalId, amount]) => {
       if (amount > 0) { updateAccount('buffer', amount); fundGoal(goalId, amount); commitAction({ date: timestamp, type: 'GOAL_FUND', title: 'Goal Allocation', amount, linkedGoalId: goalId }); }
    });

    if (remaining > 0) updateAccount('holding', remaining);
    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 pb-20 space-y-8 animate-fade-in relative">
      
      {/* THE MODAL OVERLAY */}
      <OperatorsManual isOpen={showManual} onClose={() => setShowManual(false)} initialChapterId={manualChapter} />

      {/* SILENCE PROTOCOL */}
      {showSilenceProtocol && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
              <div className="w-full max-w-md bg-zinc-900 border border-red-500/50 rounded-2xl p-6 shadow-2xl">
                  <div className="text-center mb-6">
                      <AlertOctagon size={48} className="mx-auto text-red-500 mb-4 animate-pulse"/>
                      <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Silence Protocol</h2>
                      <p className="text-red-400 font-mono mt-2 text-sm">HIGH VALUE ASSET DETECTED ($10k+)</p>
                  </div>
                  <div className="space-y-4 mb-8">
                      <label className="flex items-start gap-3 p-3 bg-white/5 rounded-lg cursor-pointer"><input type="checkbox" checked={silenceChecks.silence} onChange={() => setSilenceChecks(p => ({...p, silence: !p.silence}))} className="mt-1 accent-red-500"/><span className="text-sm text-gray-300">I have told absolutely no one.</span></label>
                      <label className="flex items-start gap-3 p-3 bg-white/5 rounded-lg cursor-pointer"><input type="checkbox" checked={silenceChecks.time} onChange={() => setSilenceChecks(p => ({...p, time: !p.time}))} className="mt-1 accent-red-500"/><span className="text-sm text-gray-300">I have waited the cooling period.</span></label>
                      <label className="flex items-start gap-3 p-3 bg-white/5 rounded-lg cursor-pointer"><input type="checkbox" checked={silenceChecks.clarity} onChange={() => setSilenceChecks(p => ({...p, clarity: !p.clarity}))} className="mt-1 accent-red-500"/><span className="text-sm text-gray-300">I have reviewed my Constitution.</span></label>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => openManualTo('manifesto')} className="flex-1 py-3 bg-white/10 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/20">
                          <BookOpen size={16}/> Protocol
                      </button>
                      <button 
                          onClick={() => { if (silenceChecks.silence && silenceChecks.time && silenceChecks.clarity) { setShowSilenceProtocol(false); setStep(2); }}}
                          disabled={!silenceChecks.silence || !silenceChecks.time || !silenceChecks.clarity}
                          className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                      >
                          Proceed
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-white">The Accountant</h1>
          <p className={`text-sm font-bold uppercase tracking-wider ${state === 'critical' ? 'text-red-500' : 'text-green-500'}`}>{state.toUpperCase()} STATE</p>
        </div>
        <button onClick={() => setShowHistory(true)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white"><History size={20}/></button>
      </div>

      <GlassCard className="p-6">
        {step === 1 ? (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <GlassInput label="Drop (USD)" type="number" value={amountUSD} onChange={(e:any) => setAmountUSD(e.target.value)} autoFocus />
              <div className="relative">
                <GlassInput label="Rate (NGN/USD)" type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
                <button onClick={fetchLiveRate} className="absolute right-2 top-8 text-[10px] bg-white/10 px-2 py-1 rounded text-blue-400 hover:bg-white/20">
                   {isFetchingRate ? '...' : 'LIVE'}
                </button>
              </div>
            </div>

            <GlassInput label="Cost Basis (USD)" type="number" value={costBasisUSD} onChange={(e:any) => setCostBasisUSD(e.target.value)} icon={<Lock size={14}/>}/>

            <div className="space-y-4 pt-2">
                {/* Tax Shield */}
                <div className="p-4 bg-slate-500/10 rounded-xl border border-slate-500/20">
                    <div className="flex justify-between mb-2">
                        <span className="flex items-center gap-2 font-bold text-slate-400"><ShieldCheck size={16}/> Tax Shield (NTA 2026)</span>
                        <button onClick={() => openManualTo('protocol_z')} className="text-[10px] text-slate-500 flex items-center gap-1 hover:text-white"><HelpCircle size={10}/> Why?</button>
                    </div>
                    <input type="range" min="0" max="25" value={taxProvision} onChange={(e) => setTaxProvision(Number(e.target.value))} className="w-full accent-slate-500 cursor-pointer"/>
                    <div className="flex justify-between mt-2">
                       <span className="text-[10px] text-gray-500">Legal Est: {estTaxPercent.toFixed(1)}%</span>
                       <button onClick={() => setTaxProvision(Math.round(estTaxPercent))} className="text-[10px] text-blue-400 hover:underline">Apply</button>
                    </div>
                </div>

                {/* Venture Tax */}
                <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/20">
                    <div className="flex justify-between mb-2">
                        <span className="flex items-center gap-2 font-bold text-red-500"><Flame size={16}/> Venture Tax</span>
                        <button onClick={() => openManualTo('filters')} className="text-[10px] text-red-900 flex items-center gap-1 hover:text-red-500"><HelpCircle size={10}/> Help</button>
                    </div>
                    <input type="range" min="0" max="20" value={ventureTax} onChange={(e) => setVentureTax(Number(e.target.value))} className="w-full accent-red-500 cursor-pointer"/>
                </div>

                {/* Vault */}
                <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <div className="flex justify-between mb-2">
                        <span className="flex items-center gap-2 font-bold text-blue-400"><Landmark size={16}/> The Vault</span>
                        <button onClick={() => openManualTo('engine')} className="text-[10px] text-blue-900 flex items-center gap-1 hover:text-blue-400"><BookOpen size={10}/> Logic</button>
                    </div>
                    <input type="range" min="0" max="50" value={vaultTax} onChange={(e) => setVaultTax(Number(e.target.value))} className="w-full accent-blue-500 cursor-pointer"/>
                </div>
            </div>
            
            <GlassButton className="w-full" onClick={handleNextStep}>Next: Allocation <ArrowRight size={16} className="ml-2"/></GlassButton>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
               <button onClick={() => setStep(1)} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-white transition-colors"><ArrowLeft size={16}/></button>
               <h2 className="text-lg font-bold text-white">Allocation Strategy</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                <div className="text-[10px] text-gray-500 uppercase">Deployable</div>
                <div className="font-mono font-bold text-white"><Naira/>{formatNumber(netFunds)}</div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-center">
                <div className="text-[10px] text-blue-500 uppercase">Vaulted</div>
                <div className="font-mono font-bold text-white"><Naira/>{formatNumber(vaultAmount + taxAmount)}</div>
              </div>
            </div>

            <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
              <span className="flex items-center gap-2 font-bold text-green-400 mb-2"><Wallet size={16}/> Runway Top-up</span>
              <GlassInput value={runwayAlloc} onChange={(e:any) => setRunwayAlloc(e.target.value)} className="text-right font-mono" placeholder="0" />
            </div>

            <div className={`p-4 rounded-xl border ${isGenerosityLocked ? 'bg-red-500/5 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
              <div className="flex justify-between mb-2">
                <span className="flex items-center gap-2 font-bold text-white"><Heart size={16} className="text-blue-400"/> Generosity</span>
                <span className="text-[10px] text-gray-500">Cap: <Naira/>{formatNumber(dynamicGenCap)}</span>
              </div>
              {isGenerosityLocked ? <div className="text-xs text-red-400 italic text-center">Locked: Survival Mode</div> : <GlassInput value={generosity} onChange={(e:any) => setGenerosity(e.target.value)} className="text-right" placeholder="0" />}
            </div>

            <div className="bg-black/20 p-4 rounded-xl border border-white/10 h-64 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xs font-bold text-gray-400 uppercase">Goals</h3>
                 <button onClick={autoDistribute} className="text-xs text-green-500 flex items-center gap-1 hover:underline"><Wand2 size={12}/> Auto-Fill</button>
              </div>
              {goals.filter(g => !g.isCompleted).map(g => (
                <div key={g.id} className="mb-3">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-white">{g.title}</span>
                    <span className="text-gray-500">Need: <Naira/>{formatNumber(g.targetAmount - g.currentAmount)}</span>
                  </div>
                  <input type="number" disabled={isCritical} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm disabled:opacity-50" placeholder="0" value={allocations[g.id] || ''} onChange={(e) => setAllocations({...allocations, [g.id]: parseFloat(e.target.value) || 0})}/>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <span className="text-gray-400 text-sm font-bold">REMAINING</span>
              <span className={`font-mono font-bold ${remaining < 0 ? 'text-red-500' : 'text-green-500'}`}><Naira/>{formatNumber(remaining)}</span>
            </div>

            <GlassButton className="w-full" disabled={remaining < 0} onClick={handleCommit}>
              <CheckCircle2 size={16} className="mr-2"/> Commit Triage
            </GlassButton>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
