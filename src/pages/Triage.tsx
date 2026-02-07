import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useLedger } from '../context/LedgerContext';
import { useExchangeRate } from '../hooks/useExchangeRate';

// UI COMPONENTS
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
  Wallet, RefreshCw, History, X, AlertOctagon, FileText, BookOpen, HelpCircle 
} from 'lucide-react';

export const Triage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const { 
    runwayMonths, goals, signals, unallocatedCash, history,
    updateAccount, commitAction, updateSignal, fundGoal 
  } = useLedger();

  // --- STATE ---
  const { rate, setRate, loading: isFetchingRate, error: rateError, fetchLiveRate } = useExchangeRate(); 
  const [step, setStep] = useState(1);
  const [showHistory, setShowHistory] = useState(false); 

  // --- MANUAL MODAL STATE ---
  const [showManual, setShowManual] = useState(false);
  const [manualChapter, setManualChapter] = useState<string | undefined>(undefined);

  const [amountUSD, setAmountUSD] = useState('');
  const [costBasisUSD, setCostBasisUSD] = useState('0'); 
  const [selectedSignalId, setSelectedSignalId] = useState('');
  
  const [taxProvision, setTaxProvision] = useState(0); 
  const [ventureTax, setVentureTax] = useState(0);
  const [vaultTax, setVaultTax] = useState(10); 

  const [generosity, setGenerosity] = useState('0');
  const [runwayAlloc, setRunwayAlloc] = useState('0'); 
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  // --- SILENCE PROTOCOL ---
  const BIG_DROP_THRESHOLD = 10000;
  const [showSilenceProtocol, setShowSilenceProtocol] = useState(false);
  const [silenceChecks, setSilenceChecks] = useState({ silence: false, time: false, clarity: false });

  useEffect(() => {
    const paramAmount = searchParams.get('amount');
    const paramSource = searchParams.get('source');
    if (paramAmount) setAmountUSD(paramAmount);
    if (paramSource) {
      const found = signals.find(s => s.id === paramSource || s.title === paramSource);
      if (found) setSelectedSignalId(found.id);
    }
  }, [searchParams, signals]);

  // --- MATH ---
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
    let remaining = chargeableProfit;
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
  const isBigDrop = dropUSD >= BIG_DROP_THRESHOLD;

  const handleFetchRate = async () => { await fetchLiveRate(); };

  // Trigger Manual with correct chapter
  const openManualTo = (chapterId: string) => {
    setManualChapter(chapterId);
    setShowManual(true);
  };

  const autoDistribute = () => {
    const activeGoals = goals.filter(g => !g.isCompleted);
    if (activeGoals.length === 0) return;
    const split = Math.floor(Math.max(0, availableForGoals) / activeGoals.length);
    const newAlloc: Record<string, number> = {};
    activeGoals.forEach(g => newAlloc[g.id] = split);
    setAllocations(newAlloc);
  };

  const handleNextStep = () => {
      if (isBigDrop && (!silenceChecks.silence || !silenceChecks.time || !silenceChecks.clarity)) {
          setShowSilenceProtocol(true);
          return;
      }
      setStep(2);
  };

  const handleCommit = () => {
    const timestamp = new Date().toISOString();
    const signal = signals.find(s => s.id === selectedSignalId);
    
    if (dropUSD > 0) {
      const snapshot = signal ? {
          phase: signal.phase,
          hoursLogged: signal.hoursLogged || 0,
          efficiency: (signal.hoursLogged || 0) > 0 ? dropUSD / (signal.hoursLogged || 1) : 0,
          sector: signal.sector
      } : undefined;

      commitAction({
        date: timestamp,
        type: 'TRIAGE_SESSION',
        title: isBigDrop ? `BIG DROP: $${formatNumber(dropUSD)}` : `Income Drop: $${formatNumber(dropUSD)}`,
        description: `Source: ${signal?.title || 'External'} @ ₦${rateVal}/$`,
        amount: grossNGN,
        linkedSignalId: selectedSignalId || undefined,
        tags: isBigDrop ? ['big_drop', 'protocol_verified'] : [],
        metadata: snapshot
      });

      if (signal) {
          updateSignal({ ...signal, totalGenerated: (signal.totalGenerated || 0) + dropUSD, updatedAt: timestamp });
      }
    }

    if (dropUSD > 0) updateAccount('holding', grossNGN); 
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
    if (genAmount > 0) {
        updateAccount('generosity', genAmount);
        commitAction({ date: timestamp, type: 'TRANSFER', title: 'Funded Generosity Wallet', amount: genAmount, tags: ['generosity_fund'] });
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

  const triageHistory = history.filter(h => h.type === 'TRIAGE_SESSION');

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 pb-20 space-y-8 animate-fade-in relative">

      {/* --- MANUAL MODAL (Fixed TS Props) --- */}
      <OperatorsManual 
        isOpen={showManual} 
        onClose={() => setShowManual(false)} 
        initialChapterId={manualChapter} 
      />
      
      {/* --- SILENCE PROTOCOL --- */}
      {showSilenceProtocol && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
              <div className="w-full max-w-md bg-zinc-900 border border-red-500/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                  <div className="text-center mb-6">
                      <AlertOctagon size={48} className="mx-auto text-red-500 mb-4 animate-pulse"/>
                      <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Silence Protocol</h2>
                      <p className="text-red-400 font-mono mt-2 text-sm">HIGH VALUE ASSET DETECTED ($10k+)</p>
                  </div>
                  <div className="space-y-4 mb-8">
                      <p className="text-gray-400 text-sm text-center">You are about to deploy significant capital. Verify your state of mind.</p>
                      <label className="flex items-start gap-3 p-3 bg-white/5 rounded-lg cursor-pointer border border-transparent hover:border-red-500/30 transition-colors">
                          <input type="checkbox" checked={silenceChecks.silence} onChange={() => setSilenceChecks(prev => ({...prev, silence: !prev.silence}))} className="mt-1 accent-red-500"/>
                          <span className="text-sm text-gray-300">I have engaged the Silence Protocol. No one knows.</span>
                      </label>
                      <label className="flex items-start gap-3 p-3 bg-white/5 rounded-lg cursor-pointer border border-transparent hover:border-red-500/30 transition-colors">
                          <input type="checkbox" checked={silenceChecks.time} onChange={() => setSilenceChecks(prev => ({...prev, time: !prev.time}))} className="mt-1 accent-red-500"/>
                          <span className="text-sm text-gray-300">I have waited the cooling period. Not acting on dopamine.</span>
                      </label>
                      <label className="flex items-start gap-3 p-3 bg-white/5 rounded-lg cursor-pointer border border-transparent hover:border-red-500/30 transition-colors">
                          <input type="checkbox" checked={silenceChecks.clarity} onChange={() => setSilenceChecks(prev => ({...prev, clarity: !prev.clarity}))} className="mt-1 accent-red-500"/>
                          <span className="text-sm text-gray-300">I have reviewed The Constitution.</span>
                      </label>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => openManualTo('manifesto')} className="flex-1 py-3 bg-white/10 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors">
                          <FileText size={16}/> View Protocol
                      </button>
                      <button 
                          onClick={() => {
                              if (silenceChecks.silence && silenceChecks.time && silenceChecks.clarity) {
                                  setShowSilenceProtocol(false);
                                  setStep(2);
                              }
                          }}
                          disabled={!silenceChecks.silence || !silenceChecks.time || !silenceChecks.clarity}
                          className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
                      >
                          Proceed
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- HISTORY MODAL --- */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
          <GlassCard className="w-full max-w-md max-h-[70vh] flex flex-col relative">
            <button onClick={() => setShowHistory(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><History size={20}/> Triage History</h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {triageHistory.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-8">No triage sessions recorded yet.</div>
              ) : (
                triageHistory.map(log => (
                  <div key={log.id} className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-white text-sm">{log.title}</span>
                      <span className="text-[10px] text-gray-400">{new Date(log.date).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-gray-500">{log.description}</div>
                    <div className="text-right font-mono text-green-400 text-sm mt-1">
                      <Naira/>{formatNumber(log.amount || 0)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="flex justify-between items-start">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-white">The Accountant</h1>
          <p className={`text-sm font-bold uppercase tracking-wider ${state === 'critical' ? 'text-red-500' : 'text-green-500'}`}>{state.toUpperCase()} STATE DETECTED</p>
        </div>
        <button onClick={() => setShowHistory(true)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <History size={20}/>
        </button>
      </div>

      <GlassCard className="p-6">
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <GlassInput label="Drop (USD)" type="number" value={amountUSD} onChange={(e) => setAmountUSD(e.target.value)} autoFocus />
              <div className="relative">
                <GlassInput label="Rate (NGN/USD)" type="number" value={rate} onChange={(e) => setRate(e.target.value)} className={rateError ? 'border-red-500/50' : ''}/>
                <button onClick={handleFetchRate} disabled={isFetchingRate} className="absolute right-2 top-8 text-[10px] bg-white/10 px-2 py-1 rounded text-accent-info hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center gap-1">
                  {isFetchingRate ? <RefreshCw size={10} className="animate-spin"/> : 'FETCH LIVE'}
                </button>
              </div>
            </div>
            <GlassInput label="Cost Basis (USD)" type="number" value={costBasisUSD} onChange={(e) => setCostBasisUSD(e.target.value)} icon={<Lock size={14}/>}/>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Signal Source</label>
              <select className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-white/30 transition-colors" value={selectedSignalId} onChange={(e) => setSelectedSignalId(e.target.value)}>
                <option value="">External / Non-Signal</option>
                {signals.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>

            <div className="space-y-4 pt-2">
                <div className="p-4 bg-slate-500/10 rounded-xl border border-slate-500/20">
                    <div className="flex justify-between mb-2">
                        <span className="flex items-center gap-2 font-bold text-slate-400"><ShieldCheck size={16}/> Tax Shield (NTA 2026)</span>
                        <button onClick={() => openManualTo('protocol_z')} className="text-[10px] text-slate-500 hover:text-white bg-white/5 px-2 py-1 rounded hover:bg-white/10 flex items-center gap-1">
                           <BookOpen size={10}/> Why?
                        </button>
                    </div>
                    <div className="flex justify-between mb-2"><span className="font-mono text-slate-300 text-xs">Rate: {taxProvision}%</span></div>
                    <input type="range" min="0" max="25" value={taxProvision} onChange={(e) => setTaxProvision(Number(e.target.value))} className="w-full accent-slate-500 cursor-pointer"/>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex justify-between mb-2">
                        <span className="flex items-center gap-2 font-bold text-red-500"><Flame size={16}/> Venture Tax</span>
                        <button onClick={() => openManualTo('filters')} className="text-[10px] text-gray-500 hover:text-white bg-white/5 px-2 py-1 rounded hover:bg-white/10 flex items-center gap-1">
                           <HelpCircle size={10}/> Strategy
                        </button>
                    </div>
                    <input type="range" min="0" max="20" value={ventureTax} onChange={(e) => setVentureTax(Number(e.target.value))} className="w-full accent-red-500 cursor-pointer"/>
                </div>

                <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <div className="flex justify-between mb-2">
                        <span className="flex items-center gap-2 font-bold text-blue-400"><Landmark size={16}/> The Vault</span>
                        <button onClick={() => openManualTo('engine')} className="text-[10px] text-blue-400/50 hover:text-blue-200 bg-blue-500/5 px-2 py-1 rounded hover:bg-blue-500/20 flex items-center gap-1">
                           <BookOpen size={10}/> Rules
                        </button>
                    </div>
                    <input type="range" min="0" max="50" value={vaultTax} onChange={(e) => setVaultTax(Number(e.target.value))} className="w-full accent-blue-500 cursor-pointer"/>
                </div>
            </div>

            <GlassButton className="w-full" onClick={handleNextStep}>Next: Allocation <ArrowRight size={16} className="ml-2"/></GlassButton>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
               <button onClick={() => setStep(1)} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-white transition-colors"><ArrowLeft size={16}/></button>
               <h2 className="text-lg font-bold text-white">Allocation Strategy</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="text-xs text-gray-500 uppercase">Net Deployable</div>
                <div className="font-mono font-bold text-white"><Naira/>{formatNumber(netFunds)}</div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <div className="text-xs text-blue-500 uppercase">Vault Stashed</div>
                <div className="font-mono font-bold text-white"><Naira/>{formatNumber(vaultAmount)}</div>
              </div>
            </div>

            <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
              <div className="font-bold text-green-400 flex items-center gap-2 mb-2"><Wallet size={16}/> Runway Top-up</div>
              <GlassInput value={runwayAlloc} onChange={(e) => setRunwayAlloc(e.target.value)} className="text-right font-mono" placeholder="0" />
            </div>

            <div className={`p-4 rounded-xl border ${isGenerosityLocked ? 'bg-red-500/5 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
              <div className="flex justify-between mb-2 font-bold text-white">
                <span className="flex items-center gap-2"><Heart size={16} className="text-accent-info"/> Generosity</span>
                <span className="text-xs font-mono text-gray-500">Cap: <Naira/>{formatNumber(dynamicGenCap)}</span>
              </div>
              <GlassInput value={generosity} onChange={(e) => setGenerosity(e.target.value)} className="text-right" placeholder="0" disabled={isGenerosityLocked}/>
            </div>

            <div className="bg-black/20 p-4 rounded-xl border border-white/10 h-64 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xs font-bold text-gray-400 uppercase">Goals</h3>
                 <button onClick={autoDistribute} className="text-xs text-accent-success hover:underline flex items-center gap-1"><Wand2 size={12}/> Auto-Fill</button>
              </div>
              {goals.filter(g => !g.isCompleted).map(g => (
                <div key={g.id} className="mb-3">
                  <div className="flex justify-between text-xs mb-1 text-white">
                    <span>{g.title}</span>
                    <span className="text-gray-500 font-mono">Need: <Naira/>{formatNumber(g.targetAmount - g.currentAmount)}</span>
                  </div>
                  <input type="number" disabled={isCritical} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm" placeholder="0" value={allocations[g.id] || ''} onChange={(e) => setAllocations({...allocations, [g.id]: parseFloat(e.target.value) || 0})} />
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <span className="text-gray-400 text-sm">Remaining</span>
              <span className={`font-mono font-bold ${remaining < 0 ? 'text-red-500' : 'text-green-500'}`}><Naira/>{formatNumber(remaining)}</span>
            </div>
            <GlassButton className="w-full" disabled={remaining < 0 || genAmount > 300000} onClick={handleCommit}>
              <CheckCircle2 size={16} className="mr-2"/> Commit Triage
            </GlassButton>
          </div>
        )}
      </GlassCard>
      {/* FINAL GUARD: NOTHING BELOW THIS POINT */}
    </div>
  );
};
