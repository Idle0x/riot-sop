import { useState, useEffect } from 'react';
import { useFinancials } from '../context/FinancialContext';
import { MetricCard } from '../components/ui/MetricCard';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassProgressBar } from '../components/ui/GlassProgressBar';
import { GlassButton } from '../components/ui/GlassButton';
import { Naira } from '../components/ui/Naira';
import { Clock, AlertTriangle, ArrowRight, Lock, Activity, ShieldCheck } from 'lucide-react';
import { RunwayWeather } from '../components/layout/RunwayWeather';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { 
    accounts, goals, runwayMonths, totalLiquid, 
    unallocatedCash, isGhostMode, history 
  } = useFinancials();
  const navigate = useNavigate();

  // Infinite Clock
  const [time, setTime] = useState(new Date());
  useEffect(() => setInterval(() => setTime(new Date()), 1000), []);

  const buffer = accounts.find(a => a.id === 'buffer')?.balance || 0;
  const lockedGoals = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalLocked = buffer + lockedGoals;
  const netWorth = totalLiquid + totalLocked + unallocatedCash;

  const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n);

  return (
    <RunwayWeather months={runwayMonths}>
      <div className="p-4 md:p-8 space-y-8 pb-20 max-w-7xl mx-auto">
        
        {/* HEADER: CLOCK & STATUS */}
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

        {/* UNALLOCATED CAPITAL WARNING */}
        {unallocatedCash > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 p-6 rounded-2xl flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-500"><AlertTriangle size={24}/></div>
              <div>
                <h3 className="font-bold text-white text-lg">Unallocated Capital Detected</h3>
                <p className="text-sm text-yellow-500/80">Money is sitting idle in the Holding Pen.</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-yellow-500 text-xl">${fmt(unallocatedCash)}</div>
              <GlassButton size="sm" onClick={() => navigate('/triage')} className="mt-2 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500 hover:text-black">
                Triange Now <ArrowRight size={14} className="ml-1"/>
              </GlassButton>
            </div>
          </div>
        )}

        {/* ASSET BREAKDOWN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
            title="Liquid Runway" 
            value={<><Naira/>{fmt(totalLiquid)}</>} 
            subValue={`${runwayMonths.toFixed(1)} Months`} 
            icon={<Activity size={20}/>} 
          />
          <MetricCard 
            title="Locked Assets" 
            value={<><Naira/>{fmt(totalLocked)}</>} 
            subValue="Buffer & Goals" 
            icon={<Lock size={20}/>} 
          />
          <MetricCard 
            title="Net Worth" 
            value={<><Naira/>{fmt(netWorth)}</>} 
            subValue="Total System Value" 
            icon={<ShieldCheck size={20}/>} 
            isPrivate 
          />
        </div>

        {/* RUNWAY VISUALIZER */}
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
          <div className="mt-4 grid grid-cols-4 text-center text-[10px] text-gray-600 font-mono tracking-widest uppercase">
            <div className="border-t border-gray-800 pt-2">Critical</div>
            <div className="border-t border-gray-800 pt-2">Building</div>
            <div className="border-t border-gray-800 pt-2">Secure</div>
            <div className="border-t border-gray-800 pt-2">Freedom</div>
          </div>
        </GlassCard>

        {/* RECENT HISTORY PREVIEW */}
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
                  {log.amount && <><Naira/>{fmt(log.amount)}</>}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </RunwayWeather>
  );
};
