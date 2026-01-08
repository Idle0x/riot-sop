import { useState } from 'react';
import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';
import { Naira } from '../components/ui/Naira';
import { getFinancialState } from '../utils/finance';
import { ArrowRight, Flame, Heart, AlertTriangle, CheckCircle2 } from 'lucide-react';
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

  // Calculations
  const dropUSD = parseFloat(amountUSD) || 0;
  const rateVal = parseFloat(rate) || 0;
  const grossNGN = dropUSD * rateVal;

  // Logic: Use Unallocated cash if drop is 0 (processing existing funds)
  const sourceFunds = dropUSD > 0 ? grossNGN : unallocatedCash;

  const taxAmount = sourceFunds * (ventureTax / 100);
  const netFunds = sourceFunds - taxAmount;
  const bufferAmount = netFunds * 0.10;
  const genAmount = parseFloat(generosity) || 0;
  const availableForGoals = netFunds - bufferAmount - genAmount;

  const allocatedSum = Object.values(allocations).reduce((a, b) => a + b, 0);
  const remaining = availableForGoals - allocatedSum;

  const state = getFinancialState(runwayMonths);
  const advice = {
    critical: { text: "CRITICAL. 0% Risk. Fill Runway.", color: "text-red-500", maxRisk: 0 },
    building: { text: "STABILIZING. Max 5% Risk.", color: "text-orange-500", maxRisk: 5 },
    secure: { text: "HEALTHY. 10% Risk Allowed.", color: "text-green-500", maxRisk: 10 },
    freedom: { text: "FREEDOM. Deploy Capital.", color: "text-purple-500", maxRisk: 20 },
    dry: { text: "DRY. EMERGENCY.", color: "text-red-500", maxRisk: 0 }
  }[state];

  const handleCommit = () => {
    const timestamp = new Date().toISOString();

    // 1. If new drop, add to Holding
    if (dropUSD > 0) {
      updateAccount('holding', grossNGN);
    }

    // 2. Execute Triage (Move from Holding)
    updateAccount('holding', -sourceFunds); // Remove total

    // Burn Tax
    if (taxAmount > 0) {
      commitAction({ id: crypto.randomUUID(), date: timestamp, type: 'SPEND', title: 'Venture Tax Burned', amount: taxAmount, tags: ['risk'] });
    }

    // Buffer
    updateAccount('buffer', bufferAmount);

    // Generosity (to Payroll for spending)
    if (genAmount > 0) updateAccount('payroll', genAmount);

    // Goals (to Goals locked)
    // Note: In real app, you'd add to goal.currentAmount here. 
    // For MVP we assume goals are tracked via logs or separate state update

    // Remainder to Payroll/Runway
    if (remaining > 0) updateAccount('payroll', remaining);

    // Log Logic
    const signal = signals.find(s => s.id === selectedSignalId);
    commitAction({
      id: crypto.randomUUID(), date: timestamp, type: 'TRIAGE',
      title: `Triaged ${dropUSD > 0 ? 'Drop' : 'Unallocated'}`,
      amount: sourceFunds,
      linkedSignalId: selectedSignalId,
      description: `Tax: ${ventureTax}%, Buffer: 10%`
    });

    // Update Signal ROI
    if (signal && dropUSD > 0) {
      updateSignal({ 
        ...signal, 
        totalGenerated: signal.totalGenerated + dropUSD,
        updatedAt: timestamp 
      });
    }

    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 pb-20 space-y-8 animate-fade-in">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">The Accountant</h1>
        <p className={`text-sm font-bold uppercase tracking-wider ${advice.color}`}>{state.toUpperCase()} • {advice.text}</p>
      </div>

      <GlassCard className="p-6">
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <GlassInput label="Drop (USD)" type="number" value={amountUSD} onChange={e => setAmountUSD(e.target.value)} autoFocus />
              <GlassInput label="Rate" type="number" value={rate} onChange={e => setRate(e.target.value)} />
            </div>

            {/* Source Recognition */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Signal Source</label>
              <select className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white" value={selectedSignalId} onChange={e => setSelectedSignalId(e.target.value)}>
                <option value="">Select Source...</option>
                {signals.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>

            {/* Venture Tax */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex justify-between mb-2">
                <span className="flex items-center gap-2 font-bold text-red-500"><Flame size={16}/> Venture Tax</span>
                <span className="font-mono text-red-500">{ventureTax}%</span>
              </div>
              <input type="range" min="0" max="20" value={ventureTax} onChange={e => setVentureTax(Number(e.target.value))} className="w-full accent-red-500"/>
              {ventureTax > advice.maxRisk && <p className="text-xs text-red-500 mt-2 font-bold">⚠️ Exceeds recommended {advice.maxRisk}% risk cap.</p>}
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

            {/* Generosity */}
            <div className={`p-4 rounded-xl border ${genAmount > 300000 ? 'bg-red-500/10 border-red-500' : 'bg-white/5 border-white/10'}`}>
              <div className="flex justify-between mb-2">
                <span className="flex items-center gap-2 font-bold text-white"><Heart size={16}/> Generosity</span>
                {genAmount > 300000 && <span className="text-xs font-bold text-red-500 flex items-center gap-1"><AlertTriangle size={12}/> CAP EXCEEDED</span>}
              </div>
              <GlassInput value={generosity} onChange={e => setGenerosity(e.target.value)} className="text-right" placeholder="0" />
            </div>

            {/* Goal Allocator (Simple MVP) */}
            <div className="bg-black/20 p-4 rounded-xl border border-white/10 h-64 overflow-y-auto">
              {goals.filter(g => !g.isCompleted).map(g => (
                <div key={g.id} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white">{g.title}</span>
                    <span className="text-gray-500">Need: <Naira/>{new Intl.NumberFormat().format(g.targetAmount - g.currentAmount)}</span>
                  </div>
                  <input 
                    type="number" 
                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-sm"
                    placeholder="Allocation"
                    value={allocations[g.id] || ''}
                    onChange={e => setAllocations({...allocations, [g.id]: parseFloat(e.target.value) || 0})}
                  />
                </div>
              ))}
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
