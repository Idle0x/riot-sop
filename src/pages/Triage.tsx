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
  Wallet, RefreshCw, History, X, AlertOctagon, FileText, BookOpen 
} from 'lucide-react';

export const Triage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const { 
    runwayMonths, goals, signals, unallocatedCash, history,
    updateAccount, commitAction, updateSignal, fundGoal 
  } = useLedger();

  const { rate, setRate, loading: isFetchingRate, error: rateError, fetchLiveRate } = useExchangeRate(); 

  const [step, setStep] = useState(1);
  const [showHistory, setShowHistory] = useState(false); 
  
  // Manual Modal State
  const [showManual, setShowManual] = useState(false);
  const [manualChapter, setManualChapter] = useState<string | undefined>(undefined);

  // Inputs
  const [amountUSD, setAmountUSD] = useState('');
  const [costBasisUSD, setCostBasisUSD] = useState('0'); 
  const [selectedSignalId, setSelectedSignalId] = useState('');
  
  // Tax Sliders
  const [taxProvision, setTaxProvision] = useState(0); 
  const [ventureTax, setVentureTax] = useState(0);
  const [vaultTax, setVaultTax] = useState(10); 

  // Allocation Inputs
  const [generosity, setGenerosity] = useState('0');
  const [runwayAlloc, setRunwayAlloc] = useState('0'); 
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  // Silence Protocol
  const BIG_DROP_THRESHOLD = 10000;
  const [showSilenceProtocol, setShowSilenceProtocol] = useState(false);
  const [silenceChecks, setSilenceChecks] = useState({ silence: false, time: false, clarity: false });

  // ... (Auto-fill, Math Engine, and Commit Logic remain the same as previous) ...
  // Re-implementing simplified for brevity, assume Math Engine is here
  
  const dropUSD = parseFloat(amountUSD) || 0;
  const sourceFunds = (dropUSD * (parseFloat(rate) || 0)) || unallocatedCash;
  const isBigDrop = dropUSD >= BIG_DROP_THRESHOLD;

  const openProtocol = () => {
    setManualChapter('protocol_z'); // Target Chapter VII
    setShowManual(true);
  };

  const handleNextStep = () => {
      if (isBigDrop && (!silenceChecks.silence || !silenceChecks.time || !silenceChecks.clarity)) {
          setShowSilenceProtocol(true);
          return;
      }
      setStep(2);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 pb-20 space-y-8 animate-fade-in relative">
      
      {/* ... (History Modal & Silence Protocol Modal codes from previous turn) ... */}

      {/* --- MANUAL MODAL --- */}
      <OperatorsManual isOpen={showManual} onClose={() => setShowManual(false)} initialChapterId={manualChapter} />

      <GlassCard className="p-6">
        
        {/* STEP 1: INGESTION */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            {/* ... USD Input & Rate Input ... */}
            <div className="grid grid-cols-2 gap-4">
              <GlassInput label="Drop (USD)" type="number" value={amountUSD} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmountUSD(e.target.value)} autoFocus />
              <div className="relative">
                <GlassInput label="Rate (NGN/USD)" type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
                <button onClick={fetchLiveRate} className="absolute right-2 top-8 text-[10px] bg-white/10 px-2 py-1 rounded text-accent-info">{isFetchingRate ? <RefreshCw size={10} className="animate-spin"/> : 'FETCH LIVE'}</button>
              </div>
            </div>

            {/* ... Cost Basis & Signal Select ... */}

            {/* TAX SLIDERS WITH MANUAL LINK */}
            <div className="space-y-4 pt-2">
                <div className="p-4 bg-slate-500/10 rounded-xl border border-slate-500/20">
                    <div className="flex justify-between mb-2">
                        <span className="flex items-center gap-2 font-bold text-slate-400"><ShieldCheck size={16}/> Tax Shield (NTA 2026)</span>
                        <button onClick={openProtocol} className="text-[10px] flex items-center gap-1 text-slate-500 hover:text-white transition-colors bg-white/5 px-2 py-1 rounded hover:bg-white/10"><BookOpen size={10}/> View Protocol</button>
                    </div>
                    <input type="range" min="0" max="25" value={taxProvision} onChange={(e) => setTaxProvision(Number(e.target.value))} className="w-full accent-slate-500 cursor-pointer"/>
                </div>
                {/* ... Venture & Vault Sliders ... */}
            </div>

            <GlassButton className="w-full" onClick={handleNextStep}>Next: Allocation <ArrowRight size={16} className="ml-2"/></GlassButton>
          </div>
        )}

        {/* STEP 2: ALLOCATION */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
             {/* ... Allocation UI (Runway, Generosity, Goals) ... */}
             <div className="flex items-center gap-4 border-b border-white/10 pb-4">
               <button onClick={() => setStep(1)} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-white"><ArrowLeft size={16}/></button>
               <h2 className="text-lg font-bold text-white">Allocation Strategy</h2>
             </div>
             {/* ... (Rest of Allocation Logic) ... */}
          </div>
        )}
      </GlassCard>
    </div>
  );
};
