import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Context & Hooks
import { useUser } from '../context/UserContext';
import { useLedger } from '../context/LedgerContext';
import { useFinancialStats } from '../hooks/useFinancialStats';
import { useSystemEngine } from '../hooks/useSystemEngine';

// Formatting & UI Components
import { formatNumber } from '../utils/format';
import { Naira } from '../components/ui/Naira';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { GlassProgressBar } from '../components/ui/GlassProgressBar';
import { MetricCard } from '../components/ui/MetricCard';

// Dashboard Widgets
import { CashFlowChart } from '../components/dashboard/CashFlowChart';
import { ActiveGoalsWidget } from '../components/dashboard/ActiveGoalsWidget';
import { BudgetBurnWidget } from '../components/dashboard/BudgetBurnWidget';
import { RunwayWeather } from '../components/layout/RunwayWeather';
import { MonthlyCheckpointModal } from '../components/modals/MonthlyCheckpointModal';

// Icons
import { 
  Clock, AlertTriangle, ArrowRight, Lock, Activity, ShieldCheck, 
  BarChart3, TrendingUp, TrendingDown, Wallet, Heart, Zap, 
  ArrowDownLeft, ArrowUpRight 
} from 'lucide-react';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { isGhostMode } = useUser();
  const { runwayMonths, history, isSyncing } = useLedger();
  const { showModal, monthsMissed, pendingBurn, confirmReconciliation } = useSystemEngine();
  const { netFlow, inflow, outflow, burnDelta, chartData, allocation } = useFinancialStats();

  const [time, setTime] = useState(new Date());
  const [activityFilter, setActivityFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalNetWorth = allocation.liquid + allocation.reserved + allocation.generosity + allocation.idle;

  const filteredActivity = history.filter(log => {
    if (activityFilter === 'ALL') return true;
    if (activityFilter === 'IN') return log.type === 'DROP' || log.type === 'TRIAGE_SESSION';
    if (activityFilter === 'OUT') return log.type === 'SPEND' || log.type === 'GENEROSITY' || log.type === 'TRANSFER';
    return true;
  }).slice(0, 5);

  if (isSyncing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500 gap-4">
        <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em]">Syncing Systems...</span>
      </div>
    );
  }

  return (
    <RunwayWeather months={runwayMonths}>
      <div className={`p-4 md:p-8 space-y-8 pb-20 max-w-7xl mx-auto transition-all duration-1000 ${isGhostMode ? 'grayscale contrast-125' : ''}`}>
        
        {showModal && (
          <MonthlyCheckpointModal 
            monthsMissed={monthsMissed}
            burnAmount={pendingBurn}
            currentBalance={allocation.liquid}
            onConfirm={confirmReconciliation}
          />
        )}

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 text-gray-500 font-mono text-[10px] uppercase tracking-widest mb-1">
              <Clock size={12} />
              {time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter tabular-nums uppercase italic">
              {time.toLocaleTimeString()}
            </h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <div className={`h-2 w-2 rounded-full animate-pulse ${isGhostMode ? 'bg-red-500' : 'bg-green-500'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {isGhostMode ? 'GHOST MODE' : 'SYSTEM ONLINE'}
              </span>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase text-gray-600 font-black tracking-[0.2em]">Net Worth</div>
              <div className="text-xl font-mono font-bold text-white"><Naira/>{formatNumber(totalNetWorth)}</div>
            </div>
          </div>
        </div>

        {/* UNALLOCATED CAPITAL ALERT */}
        {allocation.idle > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 p-6 rounded-2xl flex items-center justify-between animate-pulse shadow-[0_0_20px_rgba(234,179,8,0.1)]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-500"><AlertTriangle size={24}/></div>
              <div>
                <h3 className="font-black text-white text-lg uppercase tracking-tight">Idle Capital Detected</h3>
                <p className="text-sm text-yellow-500/80 font-bold">Unallocated funds sitting in Holding Pen.</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-yellow-500 text-xl flex items-center justify-end gap-1">
                <Naira/>{formatNumber(allocation.idle)}
              </div>
              <GlassButton size="sm" onClick={() => navigate('/triage')} className="mt-2 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500 hover:text-black font-black uppercase tracking-widest">
                Triage <ArrowRight size={14} className="ml-1"/>
              </GlassButton>
            </div>
          </div>
        )}

        {/* HUD: METRIC DECK */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
            title="Monthly Net Flow" 
            value={<div className={`flex items-center gap-1 ${netFlow >= 0 ? 'text-white' : 'text-red-400'}`}><Naira/>{formatNumber(netFlow)}</div>} 
            subValue={
              <div className="flex justify-between w-full text-[9px] font-bold uppercase">
                <span className="text-green-500">In: {formatNumber(inflow)}</span>
                <span className="text-red-500">Out: {formatNumber(outflow)}</span>
              </div>
            }
            icon={netFlow >= 0 ? <TrendingUp size={20} className="text-green-400"/> : <TrendingDown size={20} className="text-red-400"/>} 
          />

          <MetricCard 
            title="Burn Velocity" 
            value={<div className="flex items-center gap-1"><Naira/>{formatNumber(outflow)}</div>} 
            subValue={
              burnDelta > 0 
                ? <span className="text-red-500 font-bold uppercase">▲ {burnDelta.toFixed(1)}% vs Prev</span> 
                : <span className="text-green-500 font-bold uppercase">▼ {Math.abs(burnDelta).toFixed(1)}% vs Prev</span>
            } 
            icon={<Activity size={20} className="text-blue-400"/>} 
          />

          <MetricCard 
            title="Locked Assets" 
            value={<div className="flex items-center gap-1"><Naira/>{formatNumber(allocation.reserved)}</div>} 
            subValue={<span className="uppercase text-[9px] font-bold tracking-widest">Vault + Buffer Stack</span>}
            icon={<Lock size={20} className="text-indigo-400"/>} 
          />
        </div>

        {/* RUNWAY COCKPIT */}
        <GlassCard className="p-0 overflow-hidden relative group h-48 border-white/10">
          <div className="absolute inset-0 p-8 z-10 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-white text-lg flex items-center gap-2 uppercase tracking-tighter">
                  Survival Horizon
                  <button onClick={() => navigate('/analytics')} className="text-gray-600 hover:text-white transition-colors"><BarChart3 size={14}/></button>
                </h3>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">System Endurance</p>
              </div>
              <div className={`text-4xl font-mono font-bold ${runwayMonths < 3 ? 'text-red-500' : runwayMonths < 6 ? 'text-orange-500' : 'text-green-500'}`}>
                {runwayMonths === Infinity ? '∞' : runwayMonths.toFixed(2)} Mo
              </div>
            </div>
            <GlassProgressBar 
              value={runwayMonths} 
              max={12} 
              color={runwayMonths < 3 ? 'danger' : runwayMonths < 6 ? 'warning' : 'success'} 
              size="lg" 
              showPercentage={false} 
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-32 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
             <CashFlowChart data={chartData} />
          </div>
        </GlassCard>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <GlassCard className="p-6">
              <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                <h3 className="font-black text-white flex items-center gap-2 text-sm uppercase tracking-widest">
                  <Activity size={18} className="text-purple-400"/> 
                  Cash Flow Intelligence
                </h3>
              </div>
              <div className="h-64">
                <CashFlowChart data={chartData} />
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ActiveGoalsWidget />
              <BudgetBurnWidget />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Asset Stack</h3>
              {[
                { label: 'Operations', sub: 'Liquid Cash', val: allocation.liquid, icon: <Wallet/>, color: 'blue' },
                { label: 'Defense', sub: 'Vault + Buffer', val: allocation.reserved, icon: <ShieldCheck/>, color: 'indigo' },
                { label: 'Generosity', sub: 'Wallet Balance', val: allocation.generosity, icon: <Heart/>, color: 'pink' },
                { label: 'Signals', sub: 'Total Generated', val: allocation.signals, icon: <Zap/>, color: 'yellow' }
              ].map((item, idx) => (
                <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-${item.color}-500/10 text-${item.color}-400 rounded-xl`}>
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-xs font-black text-white uppercase tracking-tight">{item.label}</div>
                      <div className="text-[9px] text-gray-600 font-bold uppercase">{item.sub}</div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-white text-sm"><Naira/>{formatNumber(item.val)}</div>
                </div>
              ))}
            </div>

            <GlassCard className="p-6 border-white/5">
              <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                <h3 className="font-black text-white text-[10px] uppercase tracking-widest">Recent Activity</h3>
                <div className="flex gap-1">
                  {['ALL', 'IN', 'OUT'].map((f) => (
                    <button 
                      key={f}
                      onClick={() => setActivityFilter(f as any)}
                      className={`px-2 py-1 text-[8px] font-black rounded uppercase transition-all ${activityFilter === f ? 'bg-white text-black' : 'bg-white/5 text-gray-600 hover:text-white'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {filteredActivity.length === 0 ? (
                  <div className="text-center py-6 text-gray-700 text-[9px] font-black uppercase tracking-widest">Empty Ledger</div>
                ) : (
                  filteredActivity.map(log => {
                    const isIncome = log.type === 'DROP' || log.type === 'TRIAGE_SESSION';
                    const isSpend = log.type === 'SPEND' || log.type === 'GENEROSITY';
                    return (
                      <div key={log.id} className="flex justify-between items-center p-2 hover:bg-white/5 rounded-xl transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-full ${isIncome ? 'bg-green-500/10 text-green-500' : isSpend ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                            {isIncome ? <ArrowDownLeft size={12}/> : isSpend ? <ArrowUpRight size={12}/> : <Activity size={12}/>}
                          </div>
                          <div className="truncate">
                            <div className="text-[11px] font-bold text-white group-hover:text-blue-400 transition-colors truncate w-24">{log.title}</div>
                            <div className="text-[8px] text-gray-600 font-black uppercase">{new Date(log.date).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className={`font-mono font-bold text-[11px] ${isIncome ? 'text-green-500' : isSpend ? 'text-red-500' : 'text-white'}`}>
                          {isIncome ? '+' : isSpend ? '-' : ''}<Naira/>{formatNumber(log.amount ?? 0)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <button onClick={() => navigate('/ledger')} className="w-full mt-4 pt-3 border-t border-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 hover:text-white transition-colors">
                Audit Full Ledger
              </button>
            </GlassCard>
          </div>
        </div>
      </div>
    </RunwayWeather>
  );
};
