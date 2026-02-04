import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext'; // NEW
import { useLedger } from '../context/LedgerContext'; // NEW
import { useMonthlyReconciliation } from '../hooks/useMonthlyReconciliation'; // NEW
import { formatCurrency } from '../utils/format'; // NEW UTILITY

import { MetricCard } from '../components/ui/MetricCard';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassProgressBar } from '../components/ui/GlassProgressBar';
import { GlassButton } from '../components/ui/GlassButton';
import { ActiveGoalsWidget } from '../components/dashboard/ActiveGoalsWidget';
import { BudgetBurnWidget } from '../components/dashboard/BudgetBurnWidget';
import { RunwayWeather } from '../components/layout/RunwayWeather';
import { MonthlyCheckpointModal } from '../components/modals/MonthlyCheckpointModal';

import { Clock, AlertTriangle, ArrowRight, Lock, Activity, ShieldCheck } from 'lucide-react';

export const Dashboard = () => {
  const { isGhostMode } = useUser();
  const { 
    accounts, goals, runwayMonths, totalLiquid, 
    unallocatedCash, history, isSyncing 
  } = useLedger();

  // Initialize The New Simulation Engine
  const { showModal, monthsMissed, pendingBurn, confirmReconciliation } = useMonthlyReconciliation();

  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate Locked Assets
  const buffer = accounts.find(a => a.type === 'buffer')?.balance || 0;
  const lockedGoals = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalLocked = buffer + lockedGoals;
  const netWorth = totalLiquid + totalLocked + unallocatedCash;

  if (isSyncing) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Syncing with Cloud...</div>;
  }

  return (
    <RunwayWeather months={runwayMonths}>
      <div className={`p-4 md:p-8 space-y-8 pb-20 max-w-7xl mx-auto transition-all duration-1000 ${isGhostMode ? 'grayscale contrast-125' : ''}`}>

        {/* NEW: Monthly Checkpoint Modal */}
        {showModal && (
          <MonthlyCheckpointModal 
            monthsMissed={monthsMissed}
            burnAmount={pendingBurn}
            currentBalance={totalLiquid}
            onConfirm={confirmReconciliation}
          />
        )}

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 text-gray-500 font-mono text-xs mb-1">
              <Clock size={12} />
              {time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tighter tabular-nums">
              {time.toLocaleTimeString()}
            </h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <div className={`h-2 w-2 rounded-full animate-pulse ${isGhostMode ? 'bg-red-500' : 'bg-green-500'}`} />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              {isGhostMode ? 'GHOST MODE' : 'SYSTEM ONLINE'}
            </span>
          </div>
        </div>

        {/* UNALLOCATED CAPITAL (Zero Floor Applied) */}
        {unallocatedCash > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 p-6 rounded-2xl flex items-center justify-between animate-pulse shadow-[0_0_20px_rgba(234,179,8,0.2)]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-500"><AlertTriangle size={24}/></div>
              <div>
                <h3 className="font-bold text-white text-lg">Unallocated Capital Detected</h3>
                <p className="text-sm text-yellow-500/80">Money is sitting idle in the Holding Pen.</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-yellow-500 text-xl">{formatCurrency(unallocatedCash)}</div>
              <GlassButton size="sm" onClick={() => navigate('/triage')} className="mt-2 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500 hover:text-black">
                Triange Now <ArrowRight size={14} className="ml-1"/>
              </GlassButton>
            </div>
          </div>
        )}

        {/* ASSETS (All using formatCurrency) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
            title="Liquid Runway" 
            value={formatCurrency(totalLiquid)} 
            subValue={`${runwayMonths.toFixed(1)} Months`} 
            icon={<Activity size={20}/>} 
          />
          <MetricCard 
            title="Locked Assets" 
            value={formatCurrency(totalLocked)} 
            subValue="Buffer & Goals" 
            icon={<Lock size={20}/>} 
          />
          <MetricCard 
            title="Net Worth" 
            value={formatCurrency(netWorth)} 
            subValue="Total System Value" 
            icon={<ShieldCheck size={20}/>} 
            isPrivate 
          />
        </div>

        {/* MAIN VISUALIZER */}
        <GlassCard className="p-8">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="font-bold text-white text-lg">Runway Health</h3>
              <p className="text-sm text-gray-400">Based on Active Budgets</p>
            </div>
            <div className={`text-4xl font-mono font-bold ${runwayMonths < 3 ? 'text-red-500' : runwayMonths < 6 ? 'text-orange-500' : 'text-green-500'}`}>
              {runwayMonths.toFixed(2)} Mo
            </div>
          </div>
          <GlassProgressBar value={runwayMonths} max={12} color={runwayMonths < 3 ? 'danger' : runwayMonths < 6 ? 'warning' : 'success'} size="lg" showPercentage={false} />
        </GlassCard>

        {/* WIDGET GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-64">
           <ActiveGoalsWidget />
           <BudgetBurnWidget />
        </div>

        {/* RECENT HISTORY */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Recent System Events</h3>
          <div className="space-y-3">
            {history.slice(0, 3).map(log => (
              <div key={log.id} className="flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg text-gray-400"><Clock size={16}/></div>
                  <div>
                    <div className="font-bold text-white text-sm">{log.title}</div>
                    <div className="text-xs text-gray-500">{new Date(log.date).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="font-mono text-sm text-white">
                  {log.amount ? formatCurrency(log.amount) : '-'}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </RunwayWeather>
  );
};
