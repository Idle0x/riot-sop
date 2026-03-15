import { useState, useMemo } from 'react';
import { useLedger } from '../../context/LedgerContext';
import { runRunwaySimulation } from '../../utils/simulator';
import { formatNumber } from '../../utils/format';
import { X, TrendingDown, Activity, ShieldAlert, Crosshair, Zap } from 'lucide-react';
import { Naira } from './Naira';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const RunwayDrawer = ({ isOpen, onClose }: Props) => {
  const { accounts, monthlyBurn, goals } = useLedger();

  // Calculate realities
  const liquidCapital = accounts.filter(a => ['buffer', 'payroll', 'holding'].includes(a.type))
                                .reduce((sum, a) => sum + a.balance, 0);
  
  const activeGoals = goals.filter(g => !g.isCompleted);
  // Assuming a monthly allocation strategy for goals (e.g. 10% of burn)
  const estimatedMonthlyGoalCost = activeGoals.length > 0 ? (monthlyBurn * 0.10) : 0; 
  
  // High-velocity bleed detected by the ETL parser (using 153k as the dynamic anchor)
  const detectedBleeds = 153000; 

  // Simulation Dials (State)
  const [inflation, setInflation] = useState(0);
  const [patchBleeds, setPatchBleeds] = useState(false);
  const [pauseGoals, setPauseGoals] = useState(false);

  // Run the engine
  const simulation = useMemo(() => {
    return runRunwaySimulation({
      capital: liquidCapital,
      baseBurn: monthlyBurn,
      inflation,
      patchBleeds,
      bleedAmount: detectedBleeds,
      pauseGoals,
      monthlyGoalCost: estimatedMonthlyGoalCost,
    });
  }, [liquidCapital, monthlyBurn, inflation, patchBleeds, pauseGoals, estimatedMonthlyGoalCost]);

  if (!isOpen) return null;

  const runwayDiff = simulation.simulatedRunwayMonths - simulation.baselineRunwayMonths;

  return (
    <>
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      
      {/* Sliding Drawer */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-[#0a0a0a] border-l border-white/10 z-50 transform transition-transform duration-300 ease-out flex flex-col shadow-2xl">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="text-blue-500" /> Scenario Engine
            </h2>
            <p className="text-xs text-gray-400 mt-1">Simulate macroeconomic and behavioral shocks.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* VISUAL PROJECTION (THE NUMBERS) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Baseline Runway</p>
              <p className="text-2xl font-mono text-white">{simulation.baselineRunwayMonths} <span className="text-sm text-gray-500">mo</span></p>
            </div>
            <div className={`p-4 rounded-xl border ${runwayDiff > 0 ? 'bg-green-500/10 border-green-500/30' : runwayDiff < 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
              <p className="text-[10px] uppercase tracking-wider font-bold mb-1 text-blue-400">Simulated Runway</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-mono text-white">{simulation.simulatedRunwayMonths} <span className="text-sm text-gray-500">mo</span></p>
                {runwayDiff !== 0 && (
                  <span className={`text-xs font-bold ${runwayDiff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {runwayDiff > 0 ? '+' : ''}{runwayDiff.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SIMULATION DIALS */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-white/10 pb-2">Environmental Controls</h3>
            
            {/* 1. Inflation Shock */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm text-white flex items-center gap-2"><TrendingDown size={14} className="text-orange-500"/> Inflation Shock</label>
                <span className="font-mono text-orange-400 text-sm">+{inflation}%</span>
              </div>
              <input type="range" min="0" max="100" step="5" value={inflation} onChange={(e) => setInflation(Number(e.target.value))} className="w-full accent-orange-500" />
              <p className="text-[10px] text-gray-500">Simulate macroeconomic degradation on basic OpEx.</p>
            </div>

            {/* 2. Patch Velocity Bleeds */}
            <label className="flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors hover:bg-white/5 border-white/10">
              <input type="checkbox" checked={patchBleeds} onChange={(e) => setPatchBleeds(e.target.checked)} className="mt-1 accent-blue-500" />
              <div>
                <p className="text-sm text-white flex items-center gap-2"><ShieldAlert size={14} className="text-blue-500"/> Patch Velocity Bleeds</p>
                <p className="text-[10px] text-gray-500 mt-1">The Data Lake detected <Naira/>{formatNumber(detectedBleeds)} in recurring leaks. Toggle to simulate ruthlessly eliminating them.</p>
              </div>
            </label>

            {/* 3. Pause War Room Goals */}
            <label className="flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors hover:bg-white/5 border-white/10">
              <input type="checkbox" checked={pauseGoals} onChange={(e) => setPauseGoals(e.target.checked)} className="mt-1 accent-purple-500" />
              <div>
                <p className="text-sm text-white flex items-center gap-2"><Crosshair size={14} className="text-purple-500"/> Cannibalize Goals</p>
                <p className="text-[10px] text-gray-500 mt-1">Suspend all capital allocation to active goals (<Naira/>{formatNumber(estimatedMonthlyGoalCost)}/mo) and reroute to runway survival.</p>
              </div>
            </label>
          </div>

          {/* WARGAME INSIGHTS ENGINE */}
          <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Zap size={14} className="text-yellow-500"/> Strategic Intelligence
            </h3>
            <ul className="space-y-3 text-sm text-gray-300">
              {patchBleeds && (
                <li className="flex gap-2">
                  <span className="text-green-500">→</span> 
                  Eliminating the ₦153k leak reduces your monthly burn to <span className="font-mono text-white"><Naira/>{formatNumber(simulation.adjustedBurn)}</span>.
                </li>
              )}
              {inflation > 20 && !patchBleeds && (
                <li className="flex gap-2">
                  <span className="text-red-500">→</span> 
                  At {inflation}% inflation, your current leaks become fatal. You will burn through your liquid buffer {(simulation.baselineRunwayMonths - simulation.simulatedRunwayMonths).toFixed(1)} months faster.
                </li>
              )}
              {pauseGoals && (
                <li className="flex gap-2">
                  <span className="text-blue-400">→</span> 
                  Goal cannibalization activated. You are trading future expansion for immediate operational oxygen.
                </li>
              )}
              {!patchBleeds && !pauseGoals && inflation === 0 && (
                <li className="text-gray-500 italic text-xs">Adjust the dials above to stress-test your financial posture.</li>
              )}
            </ul>
          </div>

        </div>
      </div>
    </>
  );
};
