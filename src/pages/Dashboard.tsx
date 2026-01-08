import { useState, useEffect } from 'react';
import { useFinancials } from '../context/FinancialContext';
import { MetricCard } from '../components/ui/MetricCard';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassProgressBar } from '../components/ui/GlassProgressBar';
import { GlassButton } from '../components/ui/GlassButton';
import { Naira } from '../components/ui/Naira';
import { 
  Wallet, ShieldCheck, Lock, AlertTriangle, 
  Clock, ArrowRight, Activity 
} from 'lucide-react';
import { RunwayWeather } from '../components/layout/RunwayWeather';

export const Dashboard = () => {
  const { 
    accounts, goals, runwayMonths, totalLiquid, 
    budgets, history, isGhostMode 
  } = useFinancials();

  // --- INFINITE CLOCK ---
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- DERIVED METRICS ---
  const bufferBalance = accounts.find(a => a.id === 'buffer')?.balance || 0;
  const lockedInGoals = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalLocked = bufferBalance + lockedInGoals;
  
  // UNALLOCATED LOGIC (The Leaky Bucket)
  // Assuming 'Holding Pen' is where unallocated money sits
  const unallocated = accounts.find(a => a.id === 'holding')?.balance || 0;

  // FORMATTERS
  const formatNum = (val: number) => new Intl.NumberFormat('en-US').format(val);

  return (
    <RunwayWeather months={runwayMonths}>
      <div className="space-y-8 animate-fade-in pb-20 p-4 md:p-8">

        {/* --- HEADER: CLOCK & STATUS --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 text-gray-400 text-xs font-mono mb-1">
              <Clock size={12} />
              <span>{time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight tabular-nums">
              {time.toLocaleTimeString()}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full animate-pulse ${runwayMonths < 3 ? 'bg-accent-danger' : 'bg-accent-success'}`} />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              System {isGhostMode ? 'DORMANT' : 'ONLINE'}
            </span>
          </div>
        </div>

        {/* --- ALERT: UNALLOCATED CAPITAL --- */}
        {unallocated > 0 && (
          <div className="bg-accent-warning/10 border border-accent-warning/30 p-4 rounded-xl flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-accent-warning" size={24} />
              <div>
                <h3 className="font-bold text-white">Unallocated Capital Detected</h3>
                <p className="text-xs text-gray-400">You have idle money in the Holding Pen.</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-accent-warning text-lg">
                ${formatNum(unallocated)}
              </div>
              <GlassButton size="sm" variant="ghost" className="text-accent-warning hover:text-white">
                Triange Now <ArrowRight size={14} className="ml-1"/>
              </GlassButton>
            </div>
          </div>
        )}

        {/* --- ASSET CLASS BREAKDOWN --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. LIQUID RUNWAY (The Real Number) */}
          <MetricCard 
            title="Liquid Runway"
            value={<div className="flex items-center gap-1"><Naira />{formatNum(totalLiquid)}</div>}
            subValue={`${runwayMonths.toFixed(1)} Months Survival`}
            icon={<Activity size={20} />}
            trend={{ value: 0, isPositive: true }} // TODO: Add real trend logic
          />

          {/* 2. LOCKED ASSETS (Buffer + Goals) */}
          <MetricCard 
            title="Locked Assets"
            value={<div className="flex items-center gap-1"><Naira />{formatNum(totalLocked)}</div>}
            subValue="Buffer & Funded Goals"
            icon={<Lock size={20} />}
          />

          {/* 3. BUFFER VAULT (Specific Focus) */}
          <MetricCard 
            title="Buffer Vault"
            value={<div className="flex items-center gap-1"><Naira />{formatNum(bufferBalance)}</div>}
            subValue="Emergency Use Only"
            icon={<ShieldCheck size={20} />}
            isPrivate
          />
        </div>

        {/* --- RUNWAY VISUALIZER --- */}
        <GlassCard className="p-8 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Runway Health</h3>
                <p className="text-sm text-gray-400">Based on active budgets (Auto-Burn Active)</p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-mono font-bold ${
                  runwayMonths < 3 ? 'text-accent-danger' : 
                  runwayMonths < 6 ? 'text-accent-warning' : 'text-accent-success'
                }`}>
                  {runwayMonths.toFixed(2)} Mo
                </div>
              </div>
            </div>

            <GlassProgressBar 
              value={runwayMonths} 
              max={12} 
              label="Freedom Target: 12 Months" 
              color={runwayMonths < 3 ? 'danger' : runwayMonths < 6 ? 'warning' : 'success'} 
              size="lg"
              showPercentage={false}
            />

            <div className="mt-6 grid grid-cols-4 text-center text-xs text-gray-500 font-mono">
              <div className="border-t border-gray-800 pt-2">CRITICAL<br/>(0-3 mo)</div>
              <div className="border-t border-gray-800 pt-2">BUILDING<br/>(3-6 mo)</div>
              <div className="border-t border-gray-800 pt-2">SECURE<br/>(6-12 mo)</div>
              <div className="border-t border-gray-800 pt-2">FREEDOM<br/>(12+ mo)</div>
            </div>
          </div>
        </GlassCard>

        {/* --- RECENT ACTIVITY (The Black Box Preview) --- */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-400 uppercase tracking-wider text-xs">Recent System Events</h3>
            <button className="text-xs text-accent-info hover:text-white transition-colors">View Universal Log</button>
          </div>
          
          <div className="space-y-2">
            {history.slice(0, 3).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 bg-glass border border-glass-border rounded-xl">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg bg-white/5 text-gray-400`}>
                    <Clock size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{log.title}</div>
                    <div className="text-xs text-gray-500">{new Date(log.date).toLocaleString()}</div>
                  </div>
                </div>
                <div className="font-mono text-sm text-white">
                  {log.amount ? <><Naira />{formatNum(log.amount)}</> : ''}
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-center py-8 text-gray-600 text-sm">System initialized. Waiting for events...</div>
            )}
          </div>
        </div>

      </div>
    </RunwayWeather>
  );
};
