import { useState } from 'react';
import { DollarSign, ArrowRight, ShieldCheck, Heart, AlertTriangle } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';
import { GlassProgressBar } from '../components/ui/GlassProgressBar';
import { cn } from '../utils/cn';

export const Triage = () => {
  const [step, setStep] = useState(1);
  
  // Form State
  const [amountUSD, setAmountUSD] = useState<string>('');
  const [rate, setRate] = useState<string>('1500'); // Default dummy rate
  const [generosity, setGenerosity] = useState<string>('0');

  // Derived Values
  const dropAmount = parseFloat(amountUSD) || 0;
  const exchangeRate = parseFloat(rate) || 0;
  const amountNGN = dropAmount * exchangeRate;
  
  // CALCULATIONS (The Manual Logic)
  const bufferAmount = amountNGN * 0.10; // 10% Fixed
  const generosityAmount = parseFloat(generosity) || 0;
  
  // Rule Enforcement
  const GENEROSITY_CAP = 300000;
  const isCapBreached = generosityAmount > GENEROSITY_CAP;
  
  const remainingForGoals = amountNGN - bufferAmount - generosityAmount;
  const isNegative = remainingForGoals < 0;

  // Formatting Helper
  const formatNGN = (val: number) => 
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Triage Protocol</h1>
        <p className="text-gray-400">Step {step} of 3: {step === 1 ? 'Input Data' : step === 2 ? 'The Split' : 'Goal Allocation'}</p>
      </div>

      {/* Progress Stepper */}
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
        
        {/* STEP 1: INPUT */}
        {step === 1 && (
          <div className="space-y-8 flex-1">
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

            {dropAmount > 0 && (
              <div className="p-4 bg-accent-info/5 border border-accent-info/20 rounded-xl text-center">
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

        {/* STEP 2: THE SPLIT */}
        {step === 2 && (
          <div className="space-y-8 flex-1">
            
            <div className="space-y-6">
              {/* Buffer (Auto) */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-glass-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-warning/10 text-accent-warning rounded-lg">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-white">Buffer Vault (10%)</div>
                    <div className="text-xs text-gray-500">Automatic deduction</div>
                  </div>
                </div>
                <div className="font-mono font-bold text-accent-warning">
                  -{formatNGN(bufferAmount)}
                </div>
              </div>

              {/* Generosity (Input) */}
              <div className={cn(
                "p-4 rounded-xl border transition-all duration-300",
                isCapBreached ? "bg-accent-danger/5 border-accent-danger/30" : "bg-white/5 border-glass-border"
              )}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent-info/10 text-accent-info rounded-lg">
                      <Heart size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-white">Generosity</div>
                      <div className="text-xs text-gray-500">Max Cap: ₦300,000</div>
                    </div>
                  </div>
                  <div className="w-32">
                    <GlassInput 
                      className={cn("text-right h-10", isCapBreached && "text-accent-danger border-accent-danger")}
                      placeholder="0"
                      value={generosity}
                      onChange={(e) => setGenerosity(e.target.value)}
                    />
                  </div>
                </div>
                
                {isCapBreached && (
                  <div className="flex items-center gap-2 text-xs text-accent-danger font-bold animate-pulse">
                    <AlertTriangle size={12} />
                    CAP BREACHED. REDUCE AMOUNT IMMEDIATELY.
                  </div>
                )}
              </div>

              {/* The Result: Roadmap Fund */}
              <div className="mt-8">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold uppercase text-gray-400">Available for Roadmap</span>
                  <span className={cn("text-2xl font-mono font-bold", isNegative ? "text-accent-danger" : "text-accent-success")}>
                    {formatNGN(remainingForGoals)}
                  </span>
                </div>
                <GlassProgressBar 
                  value={remainingForGoals} 
                  max={amountNGN} 
                  color={isNegative ? "danger" : "success"}
                  showPercentage={false}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 mt-auto">
              <GlassButton variant="secondary" onClick={() => setStep(1)}>Back</GlassButton>
              <GlassButton 
                className="flex-1" 
                disabled={isCapBreached || isNegative}
                onClick={() => setStep(3)}
              >
                Proceed to Allocation
              </GlassButton>
            </div>
          </div>
        )}

        {/* STEP 3: PLACEHOLDER (Next Phase) */}
        {step === 3 && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Allocation Engine Ready</h2>
            <p className="text-gray-400">
              You have <span className="text-accent-success font-mono font-bold">{formatNGN(remainingForGoals)}</span> ready to deploy.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              (Goal Slider Logic connects here in next step)
            </p>
            <GlassButton variant="secondary" className="mt-8" onClick={() => setStep(2)}>Back</GlassButton>
          </div>
        )}

      </GlassCard>
    </div>
  );
};
