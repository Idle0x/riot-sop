import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useLedger } from '../context/LedgerContext';
import { useSystemEngine } from '../hooks/useSystemEngine';
import { useAnalytics } from '../hooks/useAnalytics';
import { formatNumber } from '../utils/format'; 
import { Naira } from '../components/ui/Naira'; 

import { MetricCard } from '../components/ui/MetricCard';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassProgressBar } from '../components/ui/GlassProgressBar';
import { GlassButton } from '../components/ui/GlassButton';
import { ActiveGoalsWidget } from '../components/dashboard/ActiveGoalsWidget';
import { BudgetBurnWidget } from '../components/dashboard/BudgetBurnWidget';
import { RunwayWeather } from '../components/layout/RunwayWeather';
import { MonthlyCheckpointModal } from '../components/modals/MonthlyCheckpointModal';

import { Clock, AlertTriangle, ArrowRight, Lock, Activity, ShieldCheck, BarChart3 } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const Dashboard = () => {
  const { isGhostMode } = useUser();
  const { 
    accounts, goals, runwayMonths, totalLiquid, 
    unallocatedCash, history, isSyncing 
  } = useLedger();

  const { burnHistory } = useAnalytics();
  const { showModal, monthsMissed, pendingBurn, confirmReconciliation } = useSystemEngine();

  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const buffer = accounts.find(a => a.type === 'buffer')?.balance || 0;
  const lockedGoals = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalLocked = buffer + lockedGoals;
  const netWorth = totalLiquid + totalLocked + unallocatedCash;

  const allocationData = [
    { name: 'Liquid', value: totalLiquid, color: '#10b981' },
    { name: 'Locked', value: totalLocked, color: '#3b82f6' },
    { name: 'Idle', value: unallocatedCash, color: '#eab308' },
  ].filter(d => d.value > 0);

  if (isSyncing) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Syncing with Cloud...</div>;
  }

  return (
    <RunwayWeather months={runwayMonths}>
      <div className={`p-4 md:p-8 space-y-8 pb-20 max-w-7xl mx-auto transition-all duration-1000 ${isGhostMode ? 'grayscale contrast-125' : ''}`}>

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

        {/* UNALLOCATED CAPITAL */}
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
              <div className="font-mono font-bold text-yellow-500 text-xl flex items-center justify-end gap-1">
                <Naira/>{formatNumber(unallocatedCash)}
              </div>
              <GlassButton size="sm" onClick={() => navigate('/triage')} className="mt-2 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500 hover:text-black">
                Triange Now <ArrowRight size={14} className="ml-1"/>
              </GlassButton>
            </div>
          </div>
        )}

        {/* ASSETS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
            title="Liquid Runway" 
            value={<div className="flex items-center gap-1"><Naira/>{formatNumber(totalLiquid)}</div>} 
            subValue={`${runwayMonths.toFixed(1)} Months`} 
            icon={<Activity size={20}/>} 
          />
          <MetricCard 
            title="Locked Assets" 
            value={<div className="flex items-center gap-1"><Naira/>{formatNumber(totalLocked)}</div>} 
            subValue="Buffer & Goals" 
            icon={<Lock size={20}/>} 
          />
          <div className="relative">
            <MetricCard 
              title="Net Worth" 
              value={<div className="flex items-center gap-1"><Naira/>{formatNumber(netWorth)}</div>} 
              subValue="Total System Value" 
              icon={<ShieldCheck size={20}/>} 
              isPrivate 
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 opacity-50 pointer-events-none">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocationData} dataKey="value" innerRadius={15} outerRadius={24} stroke="none">
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RUNWAY COCKPIT */}
        <GlassCard className="p-0 overflow-hidden relative group h-48">
          <div className="absolute inset-0 p-8 z-10 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  Runway Health
                  <button onClick={() => navigate('/analytics')} className="text-gray-500 hover:text-white transition-colors"><BarChart3 size={14}/></button>
                </h3>
                <p className="text-sm text-gray-400">Survival Horizon</p>
              </div>
              <div className={`text-4xl font-mono font-bold ${runwayMonths < 3 ? 'text-red-500' : runwayMonths < 6 ? 'text-orange-500' : 'text-green-500'}`}>
                {runwayMonths.toFixed(2)} Mo
              </div>
            </div>
            <GlassProgressBar value={runwayMonths} max={12} color={runwayMonths < 3 ? 'danger' : runwayMonths < 6 ? 'warning' : 'success'} size="lg" showPercentage={false} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={burnHistory}>
                <defs>
                  <linearGradient id="colorBurn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="burn" stroke="#fff" fill="url(#colorBurn)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
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
              <div key={log.id} className="flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${log.type === 'SPEND' ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-gray-400'}`}>
                    <Clock size={16}/>
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{log.title}</div>
                    <div className="text-xs text-gray-500">{new Date(log.date).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="font-mono text-sm text-white flex items-center gap-1">
                  {log.amount ? <><Naira/>{formatNumber(Math.abs(log.amount))}</> : '-'}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </RunwayWeather>
  );
};
