import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// CONTEXTS & HOOKS
import { useUser } from '../context/UserContext'; // Preserved for GhostMode
import { useLedger } from '../context/LedgerContext';
import { useFinancialStats } from '../hooks/useFinancialStats'; // The New Brain

// UI COMPONENTS
import { GlassCard } from '../components/ui/GlassCard';
import { GlassProgressBar } from '../components/ui/GlassProgressBar';
import { GlassButton } from '../components/ui/GlassButton';
import { MetricCard } from '../components/ui/MetricCard'; // Preserved
import { Naira } from '../components/ui/Naira';
import { RunwayWeather } from '../components/layout/RunwayWeather'; // Preserved
import { formatNumber } from '../utils/format';

// CHARTS
import { CashFlowChart } from '../components/dashboard/CashFlowChart'; // New Chart
import { ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'; // Preserved for visuals

// ICONS
import { 
  Clock, AlertTriangle, ArrowRight, Activity, ShieldCheck, 
  BarChart3, Wallet, Heart, Zap, TrendingUp, TrendingDown, 
  ArrowDownLeft, ArrowUpRight 
} from 'lucide-react';

export const Dashboard = () => {
  const navigate = useNavigate();
  
  // 1. LEGACY STATE (Visuals)
  const { isGhostMode } = useUser();
  const [time, setTime] = useState(new Date());

  // 2. NEW LOGIC (Data)
  const { runwayMonths, history } = useLedger();
  const { 
    netFlow, inflow, outflow, burnDelta, chartData, allocation 
  } = useFinancialStats();

  // 3. LEDGER STATE
  const [activityFilter, setActivityFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');

  // Clock Effect
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- DERIVED VALUES ---
  const totalNetWorth = allocation.liquid + allocation.reserved + allocation.generosity + allocation.idle;
  
  // Visual Data for the "Pie Chart" background effect
  const allocationData = [
    { name: 'Ops', value: allocation.liquid, color: '#10b981' }, // Green
    { name: 'Defense', value: allocation.reserved, color: '#3b82f6' }, // Blue
    { name: 'Idle', value: allocation.idle, color: '#eab308' }, // Yellow
  ].filter(d => d.value > 0);

  // Filter Logic for Mini-Ledger
  const filteredActivity = history.filter(log => {
    if (activityFilter === 'ALL') return true;
    if (activityFilter === 'IN') return log.type === 'DROP' || log.type === 'TRIAGE_SESSION';
    if (activityFilter === 'OUT') return log.type === 'SPEND' || log.type === 'GENEROSITY' || log.type === 'TRANSFER';
    return true;
  }).slice(0, 5);

  return (
    <RunwayWeather months={runwayMonths}>
      <div className={`p-4 md:p-8 space-y-8 pb-20 max-w-7xl mx-auto transition-all duration-1000 ${isGhostMode ? 'grayscale contrast-125' : ''}`}>

        {/* --- HEADER: SYSTEM CLOCK --- */}
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

        {/* --- ALERT: UNALLOCATED CAPITAL (Legacy Visual + New Logic) --- */}
        {allocation.idle > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between animate-pulse shadow-[0_0_20px_rgba(234,179,8,0.2)] gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-500"><AlertTriangle size={24}/></div>
              <div>
                <h3 className="font-bold text-white text-lg">Unallocated Capital Detected</h3>
                <p className="text-sm text-yellow-500/80">Funds are sitting idle in the Holding Pen.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="font-mono font-bold text-yellow-500 text-xl flex items-center justify-end gap-1">
                <Naira/>{formatNumber(allocation.idle)}
              </div>
              <GlassButton size="sm" onClick={() => navigate('/triage')} className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500 hover:text-black">
                Triage Now <ArrowRight size={14} className="ml-1"/>
              </GlassButton>
            </div>
          </div>
        )}

        {/* --- DECK A: HUD METRICS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Runway (Standard) */}
          <MetricCard 
            title="Liquid Runway" 
            value={<div className="flex items-center gap-1"><Naira/>{formatNumber(allocation.liquid)}</div>} 
            subValue={`${runwayMonths === Infinity ? '∞' : runwayMonths.toFixed(1)} Months`} 
            icon={<Activity size={20}/>} 
          />

          {/* Card 2: Net Flow (Hybrid) */}
          <MetricCard 
             title="Net Flow (Mo)"
             value={
               <div className={`flex items-center gap-1 ${netFlow >= 0 ? 'text-white' : 'text-red-400'}`}>
                 {netFlow >= 0 ? '+' : ''}<Naira/>{formatNumber(netFlow)}
               </div>
             }
             subValue={
               <div className="flex gap-2">
                 <span className="text-green-400">In: {formatNumber(inflow)}</span>
                 <span className="text-gray-600">|</span>
                 <span className="text-red-400">Out: {formatNumber(outflow)}</span>
               </div>
             }
             icon={netFlow >= 0 ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}
          />

          {/* Card 3: Net Worth (Legacy Visual + New Data) */}
          <div className="relative">
            <MetricCard 
              title="Net Worth" 
              value={<div className="flex items-center gap-1"><Naira/>{formatNumber(totalNetWorth)}</div>} 
              subValue="Total System Value" 
              icon={<ShieldCheck size={20}/>} 
              isPrivate 
            />
            {/* Background Pie Chart Effect */}
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

        {/* --- DECK B: RUNWAY COCKPIT (Legacy Shell + New Data) --- */}
        <GlassCard className="p-0 overflow-hidden relative group h-48">
          <div className="absolute inset-0 p-8 z-10 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  Runway Health
                  <button onClick={() => navigate('/analytics')} className="text-gray-500 hover:text-white transition-colors"><BarChart3 size={14}/></button>
                </h3>
                {/* INJECTED NEW DATA: Burn Velocity */}
                <div className="text-sm mt-1 flex items-center gap-2">
                   <span className="text-gray-400">Burn Velocity:</span>
                   {burnDelta > 0 ? (
                      <span className="text-red-400 font-mono text-xs">▲ {burnDelta.toFixed(1)}% vs Last Month</span>
                    ) : (
                      <span className="text-green-400 font-mono text-xs">▼ {Math.abs(burnDelta).toFixed(1)}% vs Last Month</span>
                    )}
                </div>
              </div>
              <div className={`text-4xl font-mono font-bold ${runwayMonths < 3 ? 'text-red-500' : runwayMonths < 6 ? 'text-orange-500' : 'text-green-500'}`}>
                {runwayMonths === Infinity ? '∞' : runwayMonths.toFixed(1)} Mo
              </div>
            </div>
            <GlassProgressBar value={runwayMonths} max={12} color={runwayMonths < 3 ? 'danger' : runwayMonths < 6 ? 'warning' : 'success'} size="lg" showPercentage={false} />
          </div>

          {/* Background Area Chart (Purely Visual) */}
          <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBurn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="expenses" stroke="#fff" fill="url(#colorBurn)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* --- DECK C: TACTICAL GRID (New Components + Old Layout) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* LEFT: Cash Flow Chart (New) */}
           <div className="lg:col-span-2">
              <GlassCard className="p-6 h-full min-h-[300px]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Activity size={16} className="text-purple-400"/> Cash Flow Trend
                  </h3>
                  {/* Legend */}
                  <div className="flex gap-3 text-xs text-gray-400">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"/> In</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"/> Out</div>
                  </div>
                </div>
                <div className="h-64 w-full">
                   <CashFlowChart data={chartData} />
                </div>
              </GlassCard>
           </div>

           {/* RIGHT: Asset Stack (New Logic, Old Styling) */}
           <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Asset Allocation</h3>

              {/* Stack Item 1: Operations */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><Wallet size={18}/></div>
                     <div>
                       <div className="text-sm font-bold text-white">Operations</div>
                       <div className="text-[10px] text-gray-500">Liquid Cash</div>
                     </div>
                  </div>
                  <div className="font-mono font-bold text-white"><Naira/>{formatNumber(allocation.liquid)}</div>
              </div>

              {/* Stack Item 2: Defense */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg"><ShieldCheck size={18}/></div>
                     <div>
                       <div className="text-sm font-bold text-white">Defense</div>
                       <div className="text-[10px] text-gray-500">Vault + Buffer</div>
                     </div>
                  </div>
                  <div className="font-mono font-bold text-white"><Naira/>{formatNumber(allocation.reserved)}</div>
              </div>

              {/* Stack Item 3: Generosity */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-pink-500/20 text-pink-400 rounded-lg"><Heart size={18}/></div>
                     <div>
                       <div className="text-sm font-bold text-white">Generosity</div>
                       <div className="text-[10px] text-gray-500">Wallet Balance</div>
                     </div>
                  </div>
                  <div className="font-mono font-bold text-white"><Naira/>{formatNumber(allocation.generosity)}</div>
              </div>

              {/* Stack Item 4: Signals */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg"><Zap size={18}/></div>
                     <div>
                       <div className="text-sm font-bold text-white">Signals</div>
                       <div className="text-[10px] text-gray-500">Total Generated</div>
                     </div>
                  </div>
                  <div className="font-mono font-bold text-white"><Naira/>{formatNumber(allocation.signals)}</div>
              </div>
           </div>
        </div>

        {/* --- DECK D: MINI-LEDGER (Hybrid) --- */}
        <GlassCard className="p-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent System Events</h3>
             
             {/* New Filter Toggles */}
             <div className="flex gap-2">
                <button onClick={() => setActivityFilter('ALL')} className={`px-3 py-1 text-xs rounded-lg transition-colors border ${activityFilter === 'ALL' ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-transparent hover:border-white/20'}`}>All</button>
                <button onClick={() => setActivityFilter('IN')} className={`px-3 py-1 text-xs rounded-lg transition-colors border ${activityFilter === 'IN' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-white/5 text-gray-400 border-transparent hover:border-white/20'}`}>Inflow</button>
                <button onClick={() => setActivityFilter('OUT')} className={`px-3 py-1 text-xs rounded-lg transition-colors border ${activityFilter === 'OUT' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-white/5 text-gray-400 border-transparent hover:border-white/20'}`}>Outflow</button>
             </div>
          </div>

          <div className="space-y-3">
            {filteredActivity.length === 0 ? (
               <div className="text-center py-8 text-gray-600 text-sm">No recent activity detected.</div>
            ) : (
              filteredActivity.map(log => {
                const isIncome = log.type === 'DROP' || log.type === 'TRIAGE_SESSION';
                const isSpend = log.type === 'SPEND' || log.type === 'GENEROSITY' || log.type === 'TRANSFER';
                
                return (
                  <div key={log.id} className="flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isIncome ? 'bg-emerald-500/10 text-emerald-500' : isSpend ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                         {isIncome ? <ArrowDownLeft size={16}/> : isSpend ? <ArrowUpRight size={16}/> : <Activity size={16}/>}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm group-hover:text-gray-200 transition-colors">{log.title}</div>
                        <div className="text-xs text-gray-500">{new Date(log.date).toLocaleDateString()} • {log.type}</div>
                      </div>
                    </div>
                    <div className={`font-mono text-sm font-bold flex items-center gap-1 ${isIncome ? 'text-emerald-400' : isSpend ? 'text-red-400' : 'text-white'}`}>
                      {isIncome ? '+' : isSpend ? '-' : ''}
                      {log.amount ? <><Naira/>{formatNumber(Math.abs(log.amount))}</> : '-'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/5 text-center">
             <button onClick={() => navigate('/ledger')} className="text-xs text-gray-500 hover:text-white transition-colors uppercase tracking-wider font-bold">
                View Full Ledger
             </button>
          </div>
        </GlassCard>

      </div>
    </RunwayWeather>
  );
};
