import { useState } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput'; // We need to build this next
import { GlassButton } from '../components/ui/GlassButton'; // And this

export const Triage = () => {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">Triage Protocol</h1>
        <p className="text-gray-400">Deploy capital according to The Manual v1.6</p>
      </div>

      {/* Step Indicator */}
      <div className="flex justify-between items-center px-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
              ${step >= s ? 'bg-accent-success text-white' : 'bg-white/10 text-gray-500'}
            `}>
              {s}
            </div>
            <span className="text-sm text-gray-400">
              {s === 1 ? 'Input' : s === 2 ? 'Calculate' : 'Allocate'}
            </span>
          </div>
        ))}
      </div>

      {/* The Wizard Card */}
      <GlassCard className="p-8 min-h-[400px]">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Step 1: Incoming Drop</h2>
            
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Drop Amount (USD)
              </label>
              {/* Placeholder Input */}
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-black/20 border border-glass-border rounded-xl p-4 text-2xl font-mono text-white focus:border-accent-success outline-none transition-all"
                placeholder="0.00"
              />
            </div>

            <div className="pt-8">
              <button 
                onClick={() => setStep(2)}
                className="w-full bg-accent-success hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!amount}
              >
                Analyze Drop
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="text-center">
            <h2 className="text-xl font-bold">Step 2: Logic Engine</h2>
            <p className="text-gray-400 mt-4">Calculation logic coming in next step...</p>
            <button onClick={() => setStep(1)} className="mt-8 text-sm text-gray-500 hover:text-white">
              Back
            </button>
          </div>
        )}
      </GlassCard>

    </div>
  );
};
