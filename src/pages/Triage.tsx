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

// UTILS
import { getFinancialState, calculateGenerosityCap } from '../utils/finance';
import { formatNumber } from '../utils/format';

// ICONS
import { 
  ArrowRight, ArrowLeft, Flame, Heart, AlertTriangle, 
  CheckCircle2, Lock, Wand2, Landmark, ShieldCheck, 
  RefreshCw, History, X, AlertOctagon,
  Server, Cpu, Activity, Info
} from 'lucide-react';

// --- UPGRADED DIRECTION-AWARE TOOLTIP COMPONENT ---
interface TooltipProps {
  content: string;
  position?: 'top' | 'bottom';
  align?: 'center' | 'left' | 'right';
}

const InfoTooltip = ({ content, position = 'top', align = 'center' }: TooltipProps) => {
  const posClass = position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2';
  const arrowVerticalClass = position === 'top' ? 'top-full border-t-black/95' : 'bottom-full border-b-black/95';

  let alignClass = '';
  let arrowHorizontalClass = '';

  if (align === 'center') {
    alignClass = 'left-1/2 -translate-x-1/2';
    arrowHorizontalClass = 'left-1/2 -translate-x-1/2';
  } else if (align === 'left') {
    alignClass = 'left-0 -ml-2'; 
    arrowHorizontalClass = 'left-4';
  } else if (align === 'right') {
    alignClass = 'right-0 -mr-2';
    arrowHorizontalClass = 'right-4';
  }

  return (
    <div className="group relative inline-block ml-1.5 align-middle z-[100]">
      <Info size={12} className="text-gray-500 md:w-3.5 md:h-3.5 group-hover:text-blue-400 cursor-help transition-colors" />
      <div className={`absolute ${alignClass} ${posClass} w-56 md:w-64 p-2.5 md:p-3 bg-black/95 border border-white/20 text-[10px] md:text-[11px] text-gray-300 rounded-lg md:rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-95 group-hover:scale-100 text-left font-normal tracking-wide leading-relaxed z-[100]`}>
        {content}
        <div className={`absolute ${arrowHorizontalClass} border-4 border-transparent ${arrowVerticalClass}`} />
      </div>
    </div>
  );
};

export const Triage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const { 
    runwayMonths, goals, signals, unallocatedCash, history, accounts, monthlyBurn,
    updateAccount, commitAction, updateSignal, fundGoal, triggerJournalPrompt 
  } = useLedger();

  const { rate, setRate, loading: isFetchingRate, error: rateError, fetchLiveRate } = useExchangeRate(); 

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
  const [chaosBufferAlloc, setChaosBufferAlloc] = useState('0'); 
  const [coldStorageAlloc, setColdStorageAlloc] = useState('0'); 

  const [allocations, setAllocations] = useState<Record<string, number>>({});

  const BIG_DROP_THRESHOLD = 10000; 
  const [showSilenceProtocol, setShowSilenceProtocol] = useState(false);
  const [silenceChecks, setSilenceChecks] = useState({
    silence: false, 
    time: false,    
    clarity: false  
  });

  useEffect(() => {
    const paramAmount = searchParams.get('amount');
    const paramSource = searchParams.get('source');

    if (paramAmount) setAmountUSD(paramAmount);
    if (paramSource) {
      const found = signals.find(s => s.id === paramSource || s.title === paramSource);
      if (found) setSelectedSignalId(found.id);
    }
  }, [searchParams, signals]);

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
  const opExAmount = parseFloat(runwayAlloc) || 0;
  const bufferAmount = parseFloat(chaosBufferAlloc) || 0;
  const coldAmount = parseFloat(coldStorageAlloc) || 0;
  const goalSum = Object.values(allocations).reduce((a, b) => a + b, 0);

  const allocatedTotal = genAmount + opExAmount + bufferAmount + coldAmount + goalSum;
  const remaining = netFunds - allocatedTotal;

  const state = getFinancialState(runwayMonths);
  const isCritical = runwayMonths < 3; 
  const dynamicGenCap = calculateGenerosityCap(runwayMonths);
  const isGenerosityLocked = dynamicGenCap === 0;
  const isOverCap = genAmount > dynamicGenCap;
  const isBigDrop = dropUSD >= BIG_DROP_THRESHOLD;

  const handleFetchRate = async () => {
    await fetchLiveRate();
  };

  const autoDistributeGoals = () => {
    const activeGoals = goals.filter(g => !g.isCompleted);
    if (activeGoals.length === 0) return;
    const available = Math.max(0, remaining);
    const split = Math.floor(available / activeGoals.length);
    const newAlloc: Record<string, number> = {};
    activeGoals.forEach(g => newAlloc[g.id] = split);
    setAllocations(newAlloc);
  };

  const executeHardForkRouter = () => {
    setAllocations({});
    let pool = netFunds - genAmount;
    const targetOpEx = Math.min(pool, monthlyBurn);
    setRunwayAlloc(targetOpEx.toString());
    pool -= targetOpEx;
    const holdingBal = accounts.find(a => a.type === 'holding')?.balance || 0;
    const targetBuffer = Math.max(0, 100000 - holdingBal);
    const toBuffer = Math.min(pool, targetBuffer);
    setChaosBufferAlloc(toBuffer.toString());
    pool -= toBuffer;
    setColdStorageAlloc(Math.max(0, pool).toString());
  };

  const handleNextStep = () => {
      if (isBigDrop && (!silenceChecks.silence || !silenceChecks.time || !silenceChecks.clarity)) {
          setShowSilenceProtocol(true);
          return;
      }
      setStep(2);
  };

  const handleCommit = () => {
    if (Math.abs(remaining) > 1) {
        alert("Zero-Based Routing Error: You must allocate exactly 100% of the funds before committing. Remaining balance must be zero.");
        return;
    }

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
          updateSignal({ 
              ...signal, 
              totalGenerated: (signal.totalGenerated || 0) + dropUSD, 
              updatedAt: timestamp 
          });
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
      commitAction({ date: timestamp, type: 'TRANSFER', title: 'Vault Pre-Tax Deposit', amount: vaultAmount, tags: ['wealth_defense'] });
    }

    if (genAmount > 0) {
        updateAccount('generosity', genAmount);
        commitAction({ date: timestamp, type: 'TRANSFER', title: 'Funded Generosity Wallet', amount: genAmount, description: 'Allocated for future giving', tags: ['generosity_fund'] });
    }

    if (opExAmount > 0) {
        updateAccount('payroll', opExAmount); 
        commitAction({ date: timestamp, type: 'TRANSFER', title: 'Tier 2: Runway Extension', amount: opExAmount, tags: ['operations'] });
    }

    if (bufferAmount > 0) {
        updateAccount('holding', bufferAmount); 
        commitAction({ date: timestamp, type: 'TRANSFER', title: 'Tier 1: Chaos Buffer Funded', amount: bufferAmount, tags: ['liquidity'] });
    }

    if (coldAmount > 0) {
        updateAccount('vault', coldAmount); 
        commitAction({ date: timestamp, type: 'TRANSFER', title: 'Tier 3: Cold Storage Secured', amount: coldAmount, tags: ['wealth_building'] });
    }

    Object.entries(allocations).forEach(([goalId, amount]) => {
       if (amount > 0) {
         updateAccount('buffer', amount);
         fundGoal(goalId, amount); 
         commitAction({ date: timestamp, type: 'GOAL_FUND', title: 'Goal Allocation', amount, linkedGoalId: goalId });
       }
    });

    if (dropUSD > 0) {
        triggerJournalPrompt({
            type: 'TRIAGE_DROP',
            data: {
                amountNGN: grossNGN,
                amountUSD: dropUSD,
                opExRouted: opExAmount,
                bufferRouted: bufferAmount,
                coldRouted: coldAmount + vaultAmount
            }
        });
    }

    navigate('/');
  };

  const triageHistory = history.filter(h => h.type === 'TRIAGE_SESSION');

  return (
    <div className="max-w-4xl mx-auto p-3 md:p-8 pb-16 md:pb-20 space-y-5 md:space-y-8 animate-fade-in relative">

      {/* --- SILENCE PROTOCOL --- */}
      {showSilenceProtocol && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
              <div className="w-full max-w-md bg-zinc-900 border border-red-500/50 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                  <div className="text-center mb-5 md:mb-6">
                      <AlertOctagon className="w-8 h-8 md:w-12 md:h-12 mx-auto text-red-500 mb-3 md:mb-4 animate-pulse"/>
                      <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest">Silence Protocol</h2>
                      <p className="text-red-400 font-mono mt-1.5 md:mt-2 text-[10px] md:text-sm">HIGH VALUE ASSET DETECTED ($10k+)</p>
                  </div>
                  <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                      <p className="text-gray-400 text-xs md:text-sm text-center">You are about to deploy significant capital. The algorithm requires you to verify your state of mind.</p>
                      <label className="flex items-start gap-2.5 md:gap-3 p-2.5 md:p-3 bg-white/5 rounded-lg cursor-pointer border border-transparent hover:border-red-500/30 transition-colors">
                          <input type="checkbox" checked={silenceChecks.silence} onChange={() => setSilenceChecks(prev => ({...prev, silence: !prev.silence}))} className="mt-1 accent-red-500"/>
                          <span className="text-xs md:text-sm text-gray-300">I have engaged the Silence Protocol. I have told absolutely no one about this drop.</span>
                      </label>
                      <label className="flex items-start gap-2.5 md:gap-3 p-2.5 md:p-3 bg-white/5 rounded-lg cursor-pointer border border-transparent hover:border-red-500/30 transition-colors">
                          <input type="checkbox" checked={silenceChecks.time} onChange={() => setSilenceChecks(prev => ({...prev, time: !prev.time}))} className="mt-1 accent-red-500"/>
                          <span className="text-xs md:text-sm text-gray-300">I have waited the mandatory cooling period. I am not acting on dopamine.</span>
                      </label>
                      <label className="flex items-start gap-2.5 md:gap-3 p-2.5 md:p-3 bg-white/5 rounded-lg cursor-pointer border border-transparent hover:border-red-500/30 transition-colors">
                          <input type="checkbox" checked={silenceChecks.clarity} onChange={() => setSilenceChecks(prev => ({...prev, clarity: !prev.clarity}))} className="mt-1 accent-red-500"/>
                          <span className="text-xs md:text-sm text-gray-300">I have reviewed my Constitution and remember who I am building this for.</span>
                      </label>
                  </div>
                  <div className="flex gap-3">
                      <button 
                          onClick={() => {
                              if (silenceChecks.silence && silenceChecks.time && silenceChecks.clarity) {
                                  setShowSilenceProtocol(false);
                                  setStep(2);
                              }
                          }}
                          disabled={!silenceChecks.silence || !silenceChecks.time || !silenceChecks.clarity}
                          className="w-full py-2.5 md:py-3 bg-red-600 text-white rounded-lg md:rounded-xl text-xs md:text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
                      >
                          Proceed to Allocation
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- HISTORY MODAL --- */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
          <GlassCard className="w-full max-w-md max-h-[70vh] flex flex-col relative p-4 md:p-6">
            <button onClick={() => setShowHistory(false)} className="absolute top-3 md:top-4 right-3 md:right-4 text-gray-500 hover:text-white"><X size={18}/></button>
            <h3 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 flex items-center gap-2"><History size={18}/> Triage History</h3>
            <div className="flex-1 overflow-y-auto space-y-2.5 md:space-y-3 pr-2">
              {triageHistory.length === 0 ? (
                <div className="text-gray-500 text-xs md:text-sm text-center py-6 md:py-8">No triage sessions recorded yet.</div>
              ) : (
                triageHistory.map(log => (
                  <div key={log.id} className="p-2.5 md:p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-white text-xs md:text-sm">{log.title}</span>
                      <span className="text-[9px] md:text-[10px] text-gray-400">{new Date(log.date).toLocaleDateString()}</span>
                    </div>
                    <div className="text-[11px] md:text-xs text-gray-500">{log.description}</div>
                    <div className="text-right font-mono text-green-400 text-xs md:text-sm mt-1">
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
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center justify-center">
            The Accountant 
            <InfoTooltip position="bottom" content="This is the intake funnel. All incoming capital or unallocated idle funds must be explicitly routed through this engine before they can be deployed." />
          </h1>
          <p className={`text-[10px] md:text-sm font-bold uppercase tracking-wider ${state === 'critical' ? 'text-red-500' : 'text-green-500'}`}>
            {state.toUpperCase()} STATE DETECTED
          </p>
        </div>
        <button onClick={() => setShowHistory(true)} className="p-1.5 md:p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <History className="w-4 h-4 md:w-5 md:h-5"/>
        </button>
      </div>

      <GlassCard className="p-3.5 md:p-6">

        {/* --- STEP 1: INGESTION --- */}
        {step === 1 && (
          <div className="space-y-4 md:space-y-6 animate-fade-in max-w-2xl mx-auto">

            <div className="bg-white/5 border border-white/10 rounded-lg md:rounded-xl p-3 md:p-4 mb-2 md:mb-4">
               <h3 className="text-xs md:text-sm font-bold text-white mb-1.5 md:mb-2 flex items-center">
                 Phase 1: Capital Ingestion
                 <InfoTooltip position="bottom" align="left" content="Record the raw incoming capital and the exchange rate. The system automatically calculates your Gross NGN." />
               </h3>
               <p className="text-[9px] md:text-[10px] text-gray-400">If triaging existing idle funds, leave USD at 0. The engine will automatically pull from your Holding Pen.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div>
                 <GlassInput label="Drop (USD)" type="number" value={amountUSD} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmountUSD(e.target.value)} autoFocus />
              </div>
              <div className="relative">
                <GlassInput 
                  label="Rate (NGN/USD)" 
                  type="number" 
                  value={rate} 
                  onChange={(e) => setRate(e.target.value)} 
                  className={rateError ? 'border-red-500/50' : ''}
                />
                <button 
                  onClick={handleFetchRate}
                  disabled={isFetchingRate}
                  className="absolute right-2 top-7 md:top-8 text-[9px] md:text-[10px] bg-white/10 px-1.5 py-1 md:px-2 rounded text-accent-info hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {isFetchingRate ? <RefreshCw size={10} className="animate-spin"/> : 'FETCH LIVE'}
                </button>
              </div>
            </div>

            {rateError && (
               <div className="text-[9px] md:text-[10px] text-red-400 flex items-center gap-1 justify-end -mt-2 md:-mt-3">
                  <AlertTriangle size={10}/> {rateError}
               </div>
            )}

            <div>
               <div className="flex items-center mb-1">
                  <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Cost Basis (USD)</span>
                  <InfoTooltip align="left" content="Rule: Deduct any capital initially risked to execute this signal. Taxes are only calculated on pure profit." />
               </div>
               <GlassInput type="number" value={costBasisUSD} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCostBasisUSD(e.target.value)} icon={<Lock size={12} className="md:w-3.5 md:h-3.5"/>}/>
            </div>

            <div>
              <div className="flex items-center mb-1">
                 <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Signal Source</label>
                 <InfoTooltip align="left" content="Rule: Link this capital to a specific War Room mission. This allows the system to accurately calculate the Alpha Yield (ROI) of your efforts." />
              </div>
              <select 
                  className="w-full bg-black/20 border border-white/10 rounded-lg md:rounded-xl p-2.5 md:p-3 text-white text-xs md:text-sm focus:outline-none focus:border-white/30 transition-colors" 
                  value={selectedSignalId} 
                  onChange={(e) => setSelectedSignalId(e.target.value)}
              >
                <option value="">External / Non-Signal</option>
                {signals.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>

            {/* Tax Sliders */}
            <div className="space-y-3 md:space-y-4 pt-1 md:pt-2">
                <h4 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-white/10 pb-1.5 md:pb-2">Pre-Distribution Deductions</h4>

                {/* 1. Tax Shield */}
                <div className="p-3 md:p-4 bg-slate-500/10 rounded-lg md:rounded-xl border border-slate-500/20">
                    <div className="flex justify-between mb-1.5 md:mb-2">
                        <span className="flex items-center font-bold text-slate-400 text-xs md:text-sm">
                          <ShieldCheck size={14} className="md:w-4 md:h-4 mr-1.5 md:mr-2"/> Tax Shield (NTA)
                          <InfoTooltip align="left" content="Rule: Legally minimize tax burden using the 20% Rent Shield provision. Never evade, always optimize. Funds are pushed to the Vault." />
                        </span>
                    </div>
                    <div className="flex justify-between mb-1.5 md:mb-2">
                         <span className="font-mono text-slate-300 text-[10px] md:text-xs">Rate: {taxProvision}%</span>
                    </div>
                    <input type="range" min="0" max="25" value={taxProvision} onChange={(e) => setTaxProvision(Number(e.target.value))} className="w-full accent-slate-500 cursor-pointer h-1.5 md:h-2"/>
                    <div className="flex justify-between mt-1.5 md:mt-2">
                       <span className="text-[9px] md:text-[10px] text-gray-500">Legal Est: {estTaxPercent.toFixed(1)}%</span>
                       <button onClick={() => setTaxProvision(Math.round(estTaxPercent))} className="text-[9px] md:text-[10px] text-accent-info hover:underline">Apply Est.</button>
                    </div>
                </div>

                {/* 2. Venture Tax */}
                <div className="p-3 md:p-4 bg-white/5 rounded-lg md:rounded-xl border border-white/10">
                    <div className="flex justify-between mb-1.5 md:mb-2">
                        <span className="flex items-center font-bold text-red-500 text-xs md:text-sm">
                           <Flame size={14} className="md:w-4 md:h-4 mr-1.5 md:mr-2"/> Venture Tax
                           <InfoTooltip align="left" content="Rule: Self-imposed penalty on high-risk, high-reward plays. Forces you to burn a percentage directly to build anti-fragility." />
                        </span>
                    </div>
                    <div className="flex justify-between mb-1.5 md:mb-2">
                         <span className="font-mono text-red-500 text-[10px] md:text-xs">{ventureTax}%</span>
                    </div>
                    <input type="range" min="0" max="20" value={ventureTax} onChange={(e) => setVentureTax(Number(e.target.value))} className="w-full accent-red-500 cursor-pointer h-1.5 md:h-2"/>
                </div>

                {/* 3. The Pre-Tax Vault */}
                <div className="p-3 md:p-4 bg-blue-500/10 rounded-lg md:rounded-xl border border-blue-500/20">
                    <div className="flex justify-between mb-1.5 md:mb-2">
                        <span className="flex items-center font-bold text-blue-400 text-xs md:text-sm">
                           <Landmark size={14} className="md:w-4 md:h-4 mr-1.5 md:mr-2"/> Pre-Tax Cold Storage
                           <InfoTooltip align="left" content="Rule #1: Pay yourself first. This money is severed from operations immediately and pushed to the Vault before any routing begins." />
                        </span>
                    </div>
                    <div className="flex justify-between mb-1.5 md:mb-2">
                        <span className="font-mono text-blue-400 text-[10px] md:text-xs">{vaultTax}%</span>
                    </div>
                    <input type="range" min="0" max="50" value={vaultTax} onChange={(e) => setVaultTax(Number(e.target.value))} className="w-full accent-blue-500 cursor-pointer h-1.5 md:h-2"/>
                </div>
            </div>

            <GlassButton className="w-full text-xs md:text-sm py-2.5 md:py-3" onClick={handleNextStep}>Next: Structural Routing <ArrowRight size={14} className="md:w-4 md:h-4 ml-1.5 md:ml-2"/></GlassButton>
          </div>
        )}

        {/* --- STEP 2: ARCHITECTURE ROUTING --- */}
        {step === 2 && (
          <div className="space-y-4 md:space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 md:pb-4">
               <div className="flex items-center gap-2 md:gap-4">
                 <button onClick={() => setStep(1)} className="p-1.5 md:p-2 bg-white/5 rounded-lg hover:bg-white/10 text-white transition-colors">
                    <ArrowLeft className="w-4 h-4 md:w-5 md:h-5"/>
                 </button>
                 <div>
                    <h2 className="text-sm md:text-lg font-bold text-white flex items-center">
                      System Architecture Routing
                      <InfoTooltip position="bottom" align="left" content="Zero-Based Budgeting Phase. Every single Naira remaining in the Net Deployable pool must be assigned a specific job." />
                    </h2>
                    {isBigDrop && (
                      <span className="text-[8px] md:text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 md:px-2 py-0.5 rounded border border-yellow-500/50 font-mono mt-0.5 md:mt-1 inline-block">
                          ⚠ BIG DROP MODE: STRICT ADHERENCE
                      </span>
                    )}
                 </div>
               </div>

               <button 
                  onClick={executeHardForkRouter} 
                  className="bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 text-[10px] md:text-xs font-bold px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg flex items-center gap-1.5 md:gap-2 transition-all"
               >
                  <Server size={12} className="md:w-3.5 md:h-3.5"/> 
                  <span className="hidden md:inline">Execute Hard Fork Auto-Router</span>
                  <span className="md:hidden">Auto-Route</span>
                  <InfoTooltip position="bottom" align="right" content="Action: Automatically caps OpEx to your exact monthly burn, tops up the Chaos Buffer to ₦100k, and aggressively dumps all remaining funds into Cold Storage." />
               </button>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 text-center">
              <div className="p-2 md:p-3 bg-white/5 rounded-lg md:rounded-xl border border-white/10">
                <div className="text-[10px] md:text-xs text-gray-500 uppercase flex justify-center items-center">
                  Net Deployable 
                  <InfoTooltip position="bottom" content="Total NGN available for routing after all taxes and Vault pre-sweeps have been deducted." />
                </div>
                <div className="font-mono font-bold text-white flex items-center justify-center gap-1 mt-1 text-base md:text-lg"><Naira/>{formatNumber(netFunds)}</div>
              </div>
              <div className="p-2 md:p-3 bg-blue-500/10 rounded-lg md:rounded-xl border border-blue-500/20">
                <div className="text-[10px] md:text-xs text-blue-500 uppercase flex justify-center items-center">
                  Vault Pre-Stashed 
                  <InfoTooltip position="bottom" content="Capital already secured in Tier 3 via the sliders on the previous screen. Untouchable." />
                </div>
                <div className="font-mono font-bold text-white flex items-center justify-center gap-1 mt-1 text-base md:text-lg"><Naira/>{formatNumber(vaultAmount)}</div>
              </div>
            </div>

            {/* THE TRI-TIER ARCHITECTURE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {/* Tier 1: Buffer */}
                <div className="p-3 md:p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg md:rounded-xl relative">
                    <div className="flex items-center mb-2 md:mb-3 text-orange-400 font-bold text-xs md:text-sm">
                        <Cpu size={14} className="md:w-4 md:h-4 mr-1.5 md:mr-2"/> Tier 1: Chaos Buffer
                        <InfoTooltip align="left" content="Rule: Keep at ₦100k minimum. Never use for OpEx. Only for unplannable shocks (medical, urgent repairs)." />
                    </div>
                    <GlassInput 
                        value={chaosBufferAlloc} 
                        onChange={(e) => setChaosBufferAlloc(e.target.value)} 
                        className="text-right font-mono text-sm md:text-base" 
                        placeholder="0" 
                    />
                    <p className="text-[9px] md:text-[10px] text-gray-500 mt-1.5 md:mt-2">Liquid emergency cache to absorb unplannable shocks.</p>
                </div>

                {/* Tier 2: OpEx */}
                <div className="p-3 md:p-4 bg-green-500/5 border border-green-500/20 rounded-lg md:rounded-xl relative">
                    <div className="flex items-center mb-2 md:mb-3 text-green-400 font-bold text-xs md:text-sm">
                        <Activity size={14} className="md:w-4 md:h-4 mr-1.5 md:mr-2"/> Tier 2: Batched OpEx
                        <InfoTooltip content="Rule: Must not exceed Monthly Burn limit. Funds standard runway and active protocols (Payroll account)." />
                    </div>
                    <GlassInput 
                        value={runwayAlloc} 
                        onChange={(e) => setRunwayAlloc(e.target.value)} 
                        className="text-right font-mono text-sm md:text-base" 
                        placeholder="0" 
                    />
                    <p className="text-[9px] md:text-[10px] text-gray-500 mt-1.5 md:mt-2">Operating expenses to sustain your monthly Burn Velocity.</p>
                </div>

                {/* Tier 3: Cold Storage */}
                <div className="p-3 md:p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg md:rounded-xl relative">
                    <div className="flex items-center mb-2 md:mb-3 text-blue-400 font-bold text-xs md:text-sm">
                        <Server size={14} className="md:w-4 md:h-4 mr-1.5 md:mr-2"/> Tier 3: Cold Storage
                        <InfoTooltip align="right" content="Rule: The primary wealth engine. Everything left over after OpEx and Buffer is secured here." />
                    </div>
                    <GlassInput 
                        value={coldStorageAlloc} 
                        onChange={(e) => setColdStorageAlloc(e.target.value)} 
                        className="text-right font-mono text-sm md:text-base" 
                        placeholder="0" 
                    />
                    <p className="text-[9px] md:text-[10px] text-gray-500 mt-1.5 md:mt-2">Strictly severed wealth engine. Pushed directly to Vault.</p>
                </div>
            </div>

            {/* Generosity */}
            <div className={`p-3 md:p-4 rounded-lg md:rounded-xl border transition-colors ${isGenerosityLocked ? 'bg-red-500/5 border-red-500/30' : isOverCap ? 'bg-red-500/10 border-red-500' : 'bg-white/5 border-white/10'}`}>
              <div className="flex justify-between mb-1.5 md:mb-2">
                <span className="flex items-center font-bold text-white text-xs md:text-sm">
                  <Heart size={14} className={`md:w-4 md:h-4 mr-1.5 md:mr-2 ${isGenerosityLocked ? 'text-gray-500' : 'text-accent-info'}`}/> 
                  Generosity Wallet
                  <InfoTooltip align="left" content="Rule: If Runway < 3 Months, this is LOCKED. Your oxygen mask comes first. If > 3 Months, dynamically capped by runway health." />
                </span>
                {isGenerosityLocked ? (
                    <span className="text-[10px] md:text-xs font-bold text-red-500 flex items-center gap-1"><Lock size={10} className="md:w-3 md:h-3"/> LOCKED</span>
                ) : (
                    <span className={`text-[10px] md:text-xs font-bold ${isOverCap ? 'text-red-500' : 'text-gray-500'} flex items-center gap-1`}>Cap: <Naira/>{formatNumber(dynamicGenCap)}</span>
                )}
              </div>

              {isGenerosityLocked ? (
                  <div className="text-[10px] md:text-xs text-red-400 italic text-center py-1.5 md:py-2">"My security comes first." (Runway &lt; 3mo)</div>
              ) : (
                  <>
                      <GlassInput value={generosity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGenerosity(e.target.value)} className="text-right mb-2 md:mb-3 text-sm md:text-base" placeholder="0" />
                      <div className="text-[9px] md:text-[10px] text-gray-500 text-right">Funding for Black Tax, charity, and peer-to-peer transfers.</div>
                      {isOverCap && <div className="mt-1 md:mt-2 text-[9px] md:text-[10px] text-red-400 flex items-center gap-1 justify-end"><AlertTriangle size={10}/> Exceeds Cap</div>}
                  </>
              )}
            </div>

            {/* Goals */}
            <div className="bg-black/20 p-3 md:p-4 rounded-lg md:rounded-xl border border-white/10 max-h-56 md:max-h-64 overflow-y-auto relative">
              {isCritical && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4">
                  <Lock className="text-red-500 mb-1.5 md:mb-2 w-6 h-6 md:w-8 md:h-8" />
                  <h3 className="font-bold text-white text-sm md:text-base">Allocation Locked</h3>
                  <p className="text-xs md:text-sm text-red-400">Runway is Critical (&lt;3 Months).</p>
                </div>
              )}

              <div className="flex justify-between items-center mb-3 md:mb-4">
                 <h3 className="text-[10px] md:text-xs font-bold text-gray-400 uppercase flex items-center">
                    Strategic Goals
                    <InfoTooltip align="left" content="Rule: War Room missions. Capital deployed here is locked and cannot be used for OpEx or generic savings." />
                 </h3>
                 <button onClick={autoDistributeGoals} className="text-[10px] md:text-xs text-accent-success flex items-center gap-1 hover:underline"><Wand2 size={10} className="md:w-3 md:h-3"/> Auto-Fill</button>
              </div>

              {goals.filter(g => !g.isCompleted).map(g => (
                <div key={g.id} className="mb-2 md:mb-3">
                  <div className="flex justify-between text-[10px] md:text-xs mb-1">
                    <span className="text-white truncate pr-2">{g.title}</span>
                    <span className="text-gray-500 flex items-center gap-1 shrink-0">Need: <Naira/>{formatNumber(g.targetAmount - g.currentAmount)}</span>
                  </div>
                  <input 
                    type="number" 
                    disabled={isCritical}
                    className="w-full bg-black/40 border border-white/10 rounded p-1.5 md:p-2 text-white text-xs md:text-sm disabled:opacity-50 focus:border-white/30 focus:outline-none transition-colors"
                    placeholder="Allocation"
                    value={allocations[g.id] || ''}
                    onChange={(e) => setAllocations({...allocations, [g.id]: parseFloat(e.target.value) || 0})}
                  />
                </div>
              ))}
              {goals.filter(g => !g.isCompleted).length === 0 && (
                  <div className="text-[10px] md:text-xs text-gray-500 text-center py-3 md:py-4">No active strategic goals to fund.</div>
              )}
            </div>

            {/* Zero-Based Summary */}
            <div className={`flex justify-between items-center p-3 md:p-4 border rounded-lg md:rounded-xl transition-colors ${Math.abs(remaining) < 1 ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
              <div className="flex flex-col">
                <span className="text-white font-bold text-xs md:text-sm flex items-center">
                  Unallocated Capital
                  <InfoTooltip position="top" align="left" content="Every single Naira must be assigned a job. Remaining capital must be exactly zero before committing." />
                </span>
                <span className="text-[9px] md:text-[10px] text-gray-400 mt-0.5 md:mt-1">Zero-Based Routing requires exactly 0.</span>
              </div>
              <span className={`font-mono font-bold flex items-center gap-0.5 md:gap-1 text-lg md:text-xl ${Math.abs(remaining) < 1 ? 'text-green-500' : 'text-red-500'}`}>
                {remaining > 0 ? '+' : ''}<Naira/>{formatNumber(remaining)}
              </span>
            </div>

            <GlassButton 
                className="w-full text-xs md:text-sm py-2.5 md:py-3" 
                disabled={Math.abs(remaining) > 1 || genAmount > 300000} 
                onClick={handleCommit}
            >
              <CheckCircle2 size={14} className="md:w-4 md:h-4 mr-1.5 md:mr-2"/> Commit Zero-Based Triage
            </GlassButton>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
