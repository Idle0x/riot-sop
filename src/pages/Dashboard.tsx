import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useUser } from '../context/UserContext'; 
import { useLedger } from '../context/LedgerContext';
import { useFinancialStats } from '../hooks/useFinancialStats'; 

import { GlassCard } from '../components/ui/GlassCard';
import { GlassProgressBar } from '../components/ui/GlassProgressBar';
import { GlassButton } from '../components/ui/GlassButton';
import { MetricCard } from '../components/ui/MetricCard'; 
import { Naira } from '../components/ui/Naira';
import { RunwayWeather } from '../components/layout/RunwayWeather'; 
import { formatNumber } from '../utils/format';

import { CashFlowChart } from '../components/dashboard/CashFlowChart'; 
import { ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

import { ActionCenter } from '../components/ActionCenter';
import { RunwayDrawer } from '../components/ui/RunwayDrawer'; 

import { 
  Clock, AlertTriangle, ArrowRight, Activity, ShieldCheck, 
  BarChart3, Wallet, Heart, Zap, TrendingUp, TrendingDown, 
  ArrowDownLeft, ArrowUpRight, Target, Box
} from 'lucide-react';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isGhostMode } = useUser();
  const [time, setTime] = useState(new Date());

  const [showActionCenter, setShowActionCenter] = useState(false);
  const [showRunwayDrawer, setShowRunwayDrawer] = useState(false); 

  const [chartTimeframe, setChartTimeframe] = useState('1M');

  const { runwayMonths, history, telemetry } = useLedger();
  const { netFlow, inflow, outflow, leakOutflow, burnDelta, chartData, allocation } = useFinancialStats(chartTimeframe);

  const [activityFilter, setActivityFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalNetWorth = allocation.liquid + allocation.reserved + allocation.generosity + allocation.idle + allocation.goals;

  const burnCap = user?.burnCap || 0;
  const burnRatio = burnCap > 0 ? (outflow / burnCap) * 100 : 0;

  const currentDay = time.getDate();
  const daysInMonth = new Date(time.getFullYear(), time.getMonth() + 1, 0).getDate();
  const expectedBurnSoFar = burnCap > 0 ? (burnCap / daysInMonth) * currentDay : 0;
  const pacingDiff = outflow - expectedBurnSoFar;
  const isOverPacing = pacingDiff > 0;

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const activeBleedCategories = Array.from(new Set(
      telemetry
        .filter(t => t.highVelocityFlag && t.date.startsWith(currentMonthKey))
        .map(t => t.categoryGroup || 'Uncategorized')
  ));

  const allocationData = [
    { name: 'Ops', value: allocation.liquid, color: '#10b981' }, 
    { name: 'Defense', value: allocation.reserved, color: '#3b82f6' }, 
    { name: 'Idle', value: allocation.idle, color: '#eab308' }, 
    { name: 'Missions', value: allocation.goals, color: '#a855f7' }, 
    { name: 'Generosity', value: allocation.generosity, color: '#ec4899' }, 
  ].filter(d => d.value > 0);

  const filteredActivity = history.filter(log => {
    if (activityFilter === 'ALL') return true;
    if (activityFilter === 'IN') return log.type === 'DROP' || log.type === 'TRIAGE_SESSION';
    if (activityFilter === 'OUT') return log.type === 'SPEND' || log.type === 'GENEROSITY' || log.type === 'TRANSFER';
    return true;
  }).slice(0, 5);

  return (
    <RunwayWeather months={runwayMonths}>
      <div className={`p-3 md:p-8 space-y-4 md:space-y-8 pb-16 md:pb-20 max-w-7xl mx-auto transition-all duration-1000 ${isGhostMode ? 'grayscale contrast-125' : ''}`}>

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-2 md:gap-4">
          <div>
            <div className="flex items-center gap-1.5 md:gap-2 text-gray-500 font-mono text-[10px] md:text-xs mb-0.5 md:mb-1">
              <Clock size={10} className="md:w-3 md:h-3" />
              {time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tighter tabular-nums">
              {time.toLocaleTimeString()}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-white/5 border border-white/10 w-fit">
            <div className={`h-1.5 w-1.5 md:h-2 md:w-2 rounded-full animate-pulse ${isGhostMode ? 'bg-red-500' : 'bg-green-500'}`} />
            <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-gray-400">
              {isGhostMode ? 'GHOST MODE' : 'SYSTEM ONLINE'}
            </span>
          </div>
        </div>

        {/* ALERT QUEUE */}
        <div className="space-y-3 md:space-y-4">
            {allocation.idle > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/50 p-4 md:p-6 rounded-xl md:rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-[0_0_20px_rgba(234,179,8,0.1)] gap-3 md:gap-4">
                <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 bg-yellow-500/20 rounded-lg md:rounded-xl text-yellow-500 shrink-0"><AlertTriangle size={18} className="md:w-6 md:h-6"/></div>
                <div>
                    <h3 className="font-bold text-white text-sm md:text-lg">Unallocated Capital</h3>
                    <p className="text-[10px] md:text-sm text-yellow-500/80 mt-0.5">Funds are sitting idle in the Holding Pen.</p>
                </div>
                </div>
                <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                <div className="font-mono font-bold text-yellow-500 text-lg md:text-xl flex items-center gap-1">
                    <Naira/>{formatNumber(allocation.idle)}
                </div>
                <GlassButton size="sm" onClick={() => navigate('/triage')} className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500 hover:text-black text-[10px] md:text-sm px-3 md:px-4 py-1.5 md:py-2">
                    Triage <ArrowRight size={12} className="md:w-3.5 md:h-3.5 ml-1"/>
                </GlassButton>
                </div>
            </div>
            )}

            {leakOutflow > 0 && (
            <>
                <button 
                    onClick={() => setShowActionCenter(!showActionCenter)}
                    className="w-full text-left bg-red-500/10 border border-red-500/50 p-4 md:p-6 rounded-xl md:rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between shadow-[0_0_20px_rgba(239,68,68,0.15)] gap-3 md:gap-4 hover:bg-red-500/20 transition-all cursor-pointer group animate-fade-in"
                >
                    <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                      <div className="p-2 md:p-3 bg-red-500/20 rounded-lg md:rounded-xl text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors animate-pulse shrink-0"><Zap size={18} className="md:w-6 md:h-6"/></div>
                      <div className="flex-1">
                          <h3 className="font-bold text-white text-sm md:text-lg flex items-center justify-between md:justify-start gap-2">
                            System Leak Detected <ArrowRight size={14} className={`md:w-4 md:h-4 text-red-400 transition-transform ${showActionCenter ? 'rotate-90' : 'md:opacity-0 md:group-hover:opacity-100'}`}/>
                          </h3>
                          <p className="text-[10px] md:text-sm text-red-400 mt-0.5">High-frequency micro-transactions draining liquidity.</p>
                          <div className="flex flex-wrap gap-1.5 md:gap-2 mt-1.5 md:mt-2">
                              {activeBleedCategories.map(cat => (
                                  <span key={cat} className="text-[8px] md:text-[10px] bg-red-500/20 border border-red-500/30 text-red-300 px-1.5 md:px-2 py-0.5 rounded uppercase font-bold">
                                      {cat}
                                  </span>
                              ))}
                          </div>
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col justify-between items-center md:items-end w-full md:w-auto gap-2 mt-2 md:mt-0">
                        <div className="text-[9px] md:text-xs text-gray-400 uppercase tracking-widest font-bold group-hover:text-red-300 transition-colors">
                          {showActionCenter ? 'Close Action Center' : 'Click to Resolve'}
                        </div>
                        <div className="font-mono font-bold text-red-500 text-lg md:text-2xl flex items-center gap-1">
                            -<Naira/>{formatNumber(leakOutflow)}
                        </div>
                    </div>
                </button>

                {showActionCenter && (
                    <div className="animate-fade-in -mt-1 md:-mt-2">
                        <ActionCenter />
                    </div>
                )}
            </>
            )}
        </div>

        {/* HUD METRICS */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          <MetricCard 
            title="Liquid Runway" 
            value={<div className="flex items-center gap-0.5 md:gap-1"><Naira/>{formatNumber(allocation.liquid)}</div>} 
            subValue={`${runwayMonths === Infinity ? '∞' : runwayMonths.toFixed(1)} Months`} 
            icon={<Activity size={16} className="md:w-5 md:h-5"/>} 
          />
          <MetricCard 
             title="Net Flow (Mo)"
             value={
               <div className={`flex items-center gap-0.5 md:gap-1 ${netFlow >= 0 ? 'text-white' : 'text-red-400'}`}>
                 {netFlow >= 0 ? '+' : ''}<Naira/>{formatNumber(netFlow)}
               </div>
             }
             subValue={
               <div className="flex flex-wrap gap-1 md:gap-2">
                 <span className="text-green-400">In: {formatNumber(inflow)}</span>
                 <span className="text-gray-600 hidden sm:inline">|</span>
                 <span className="text-red-400">Out: {formatNumber(outflow)}</span>
               </div>
             }
             icon={netFlow >= 0 ? <TrendingUp size={16} className="md:w-5 md:h-5"/> : <TrendingDown size={16} className="md:w-5 md:h-5"/>}
          />
          <div className="col-span-2 md:col-span-1 relative">
            <MetricCard 
              title="Net Worth" 
              value={<div className="flex items-center gap-0.5 md:gap-1"><Naira/>{formatNumber(totalNetWorth)}</div>} 
              subValue="Total System Value" 
              icon={<ShieldCheck size={16} className="md:w-5 md:h-5"/>} 
              isPrivate 
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 opacity-50 pointer-events-none">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocationData} dataKey="value" innerRadius={12} outerRadius={20} stroke="none">
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
        <GlassCard className="p-0 overflow-hidden relative group h-40 md:h-48">
          <div className="absolute inset-0 p-4 md:p-8 z-10 flex flex-row justify-between items-start md:items-center">
            <div>
                <div className="flex items-center gap-2 md:gap-3">
                  <h3 className="font-bold text-white text-sm md:text-lg flex items-center gap-1.5 md:gap-2">
                    Runway
                    <button onClick={() => navigate('/analytics')} className="text-gray-500 hover:text-white transition-colors" title="View Analytics"><BarChart3 size={12} className="md:w-3.5 md:h-3.5"/></button>
                  </h3>
                  <button 
                    onClick={() => setShowRunwayDrawer(true)} 
                    className="text-[8px] md:text-[10px] bg-blue-500/20 text-blue-400 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full flex items-center gap-1 hover:bg-blue-500/40 border border-blue-500/30 transition-colors uppercase font-bold tracking-widest"
                  >
                    <Activity size={8} className="md:w-[10px] md:h-[10px]"/> Simulate
                  </button>
                </div>

                <button 
                  onClick={() => setShowRunwayDrawer(true)}
                  className={`text-3xl md:text-5xl font-mono font-bold mt-1 md:mt-2 text-left hover:scale-105 origin-left transition-transform cursor-pointer ${runwayMonths < 3 ? 'text-red-500' : runwayMonths < 6 ? 'text-orange-500' : 'text-green-500'}`}
                  title="Click to open Scenario Simulator"
                >
                  {runwayMonths === Infinity ? '∞' : runwayMonths.toFixed(1)} <span className="text-sm md:text-lg text-gray-500">Mo</span>
                </button>
                <div className="mt-1 md:mt-2 w-32 md:w-48">
                   <GlassProgressBar value={runwayMonths} max={12} color={runwayMonths < 3 ? 'danger' : runwayMonths < 6 ? 'warning' : 'success'} size="sm" showPercentage={false} />
                </div>
            </div>

            <div className="text-right pointer-events-none">
                <div className="text-[9px] md:text-sm text-gray-400 uppercase font-bold tracking-widest mb-0.5 md:mb-1">Burn Velocity</div>
                <div className="text-lg md:text-2xl font-mono font-bold text-white flex items-center justify-end gap-1">
                   <Naira/>{formatNumber(outflow)} <span className="text-[10px] md:text-sm text-gray-500">/ <Naira/>{formatNumber(burnCap)}</span>
                </div>

                <div className="flex flex-col items-end mt-1 md:mt-2 text-[9px] md:text-xs gap-1 md:gap-1.5">
                   <div className="flex items-center gap-1.5 md:gap-2">
                       <span className={`${burnRatio > 100 ? 'text-red-500' : 'text-gray-400'}`}>
                          {burnRatio.toFixed(0)}% <span className="hidden sm:inline">of Cap Used</span>
                       </span>
                       <span className="text-gray-600">•</span>
                       {burnDelta > 0 ? (
                          <span className="text-red-400 font-mono">▲ {burnDelta.toFixed(1)}% <span className="hidden sm:inline">Velocity</span></span>
                        ) : (
                          <span className="text-green-400 font-mono">▼ {Math.abs(burnDelta).toFixed(1)}% <span className="hidden sm:inline">Velocity</span></span>
                        )}
                   </div>

                   {burnCap > 0 && (
                     <div className={`font-mono font-bold px-1.5 py-0.5 rounded text-[8px] md:text-[10px] uppercase tracking-wider mt-0.5 ${isOverPacing ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {isOverPacing ? 'Over' : 'Under'} Pacing <Naira/>{formatNumber(Math.abs(pacingDiff))}
                     </div>
                   )}
                </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 md:h-32 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBurn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="expense" stroke="#fff" fill="url(#colorBurn)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* TACTICAL GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
           <div className="lg:col-span-2">
              <GlassCard className="p-4 md:p-6 h-full min-h-[260px] md:min-h-[300px] flex flex-col">
                <div className="flex justify-between items-center mb-4 md:mb-6">
                  <h3 className="font-bold text-white flex items-center gap-1.5 md:gap-2 text-xs md:text-base">
                    <Activity size={14} className="md:w-4 md:h-4 text-purple-400"/> Cash Flow <span className="hidden sm:inline">(Ledger + Lake)</span>
                  </h3>
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="hidden md:flex gap-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"/> In</div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"/> Out</div>
                    </div>
                    <select 
                      value={chartTimeframe}
                      onChange={(e) => setChartTimeframe(e.target.value)}
                      className="bg-black/40 border border-white/10 text-white text-[10px] md:text-xs rounded px-1.5 md:px-2 py-1 md:py-1.5 outline-none focus:border-white/30 cursor-pointer font-bold"
                    >
                      <option value="24H">24 Hours</option>
                      <option value="3D">3 Days</option>
                      <option value="7D">7 Days</option>
                      <option value="1M">1 Month</option>
                      <option value="3M">3 Months</option>
                      <option value="6M">6 Months</option>
                      <option value="1Y">1 Year</option>
                      <option value="5Y">5 Years</option>
                      <option value="MAX">All-Time</option>
                    </select>
                  </div>
                </div>

                <div className="flex-1 w-full min-h-[180px] md:min-h-[250px]">
                   <CashFlowChart data={chartData} />
                </div>
              </GlassCard>
           </div>

           <div className="space-y-2 md:space-y-4">
              <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Asset Allocation</h3>
              <div className="p-2.5 md:p-4 bg-white/5 rounded-lg md:rounded-xl border border-white/5 flex justify-between items-center hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2.5 md:gap-3">
                     <div className="p-1.5 md:p-2 bg-blue-500/20 text-blue-400 rounded-md md:rounded-lg"><Wallet size={14} className="md:w-[18px] md:h-[18px]"/></div>
                     <div><div className="text-xs md:text-sm font-bold text-white">Operations</div><div className="text-[8px] md:text-[10px] text-gray-500">Liquid Cash</div></div>
                  </div>
                  <div className="font-mono font-bold text-white text-xs md:text-base"><Naira/>{formatNumber(allocation.liquid)}</div>
              </div>
              <div className="p-2.5 md:p-4 bg-white/5 rounded-lg md:rounded-xl border border-white/5 flex justify-between items-center hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2.5 md:gap-3">
                     <div className="p-1.5 md:p-2 bg-indigo-500/20 text-indigo-400 rounded-md md:rounded-lg"><ShieldCheck size={14} className="md:w-[18px] md:h-[18px]"/></div>
                     <div><div className="text-xs md:text-sm font-bold text-white">Defense</div><div className="text-[8px] md:text-[10px] text-gray-500">Vault + Buffer</div></div>
                  </div>
                  <div className="font-mono font-bold text-white text-xs md:text-base"><Naira/>{formatNumber(allocation.reserved)}</div>
              </div>

              <div className="p-2.5 md:p-4 bg-white/5 rounded-lg md:rounded-xl border border-white/5 flex justify-between items-center hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2.5 md:gap-3">
                     <div className="p-1.5 md:p-2 bg-purple-500/20 text-purple-400 rounded-md md:rounded-lg"><Target size={14} className="md:w-[18px] md:h-[18px]"/></div>
                     <div><div className="text-xs md:text-sm font-bold text-white">Missions</div><div className="text-[8px] md:text-[10px] text-gray-500">War Room Capital</div></div>
                  </div>
                  <div className="font-mono font-bold text-white text-xs md:text-base"><Naira/>{formatNumber(allocation.goals)}</div>
              </div>

              <div className="p-2.5 md:p-4 bg-white/5 rounded-lg md:rounded-xl border border-white/5 flex justify-between items-center hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2.5 md:gap-3">
                     <div className="p-1.5 md:p-2 bg-yellow-500/20 text-yellow-400 rounded-md md:rounded-lg"><Box size={14} className="md:w-[18px] md:h-[18px]"/></div>
                     <div><div className="text-xs md:text-sm font-bold text-white">Holding</div><div className="text-[8px] md:text-[10px] text-gray-500">Unallocated Funds</div></div>
                  </div>
                  <div className="font-mono font-bold text-white text-xs md:text-base"><Naira/>{formatNumber(allocation.idle)}</div>
              </div>

              <div className="p-2.5 md:p-4 bg-white/5 rounded-lg md:rounded-xl border border-white/5 flex justify-between items-center hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2.5 md:gap-3">
                     <div className="p-1.5 md:p-2 bg-pink-500/20 text-pink-400 rounded-md md:rounded-lg"><Heart size={14} className="md:w-[18px] md:h-[18px]"/></div>
                     <div><div className="text-xs md:text-sm font-bold text-white">Generosity</div><div className="text-[8px] md:text-[10px] text-gray-500">Wallet Balance</div></div>
                  </div>
                  <div className="font-mono font-bold text-white text-xs md:text-base"><Naira/>{formatNumber(allocation.generosity)}</div>
              </div>
           </div>
        </div>

        {/* SYSTEM EVENTS */}
        <GlassCard className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 md:gap-4 mb-4 md:mb-6">
             <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">Recent System Events</h3>
             <div className="flex gap-1.5 md:gap-2">
                <button onClick={() => setActivityFilter('ALL')} className={`px-2.5 py-1 md:px-3 text-[9px] md:text-xs font-bold rounded-lg transition-colors border ${activityFilter === 'ALL' ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-transparent hover:border-white/20'}`}>All</button>
                <button onClick={() => setActivityFilter('IN')} className={`px-2.5 py-1 md:px-3 text-[9px] md:text-xs font-bold rounded-lg transition-colors border ${activityFilter === 'IN' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-white/5 text-gray-400 border-transparent hover:border-white/20'}`}>Inflow</button>
                <button onClick={() => setActivityFilter('OUT')} className={`px-2.5 py-1 md:px-3 text-[9px] md:text-xs font-bold rounded-lg transition-colors border ${activityFilter === 'OUT' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-white/5 text-gray-400 border-transparent hover:border-white/20'}`}>Outflow</button>
             </div>
          </div>

          <div className="space-y-2 md:space-y-3">
            {filteredActivity.length === 0 ? (
               <div className="text-center py-6 md:py-8 text-gray-600 text-xs md:text-sm font-bold">No recent activity detected.</div>
            ) : (
              filteredActivity.map(log => {
                const isIncome = log.type === 'DROP' || log.type === 'TRIAGE_SESSION';
                const isSpend = log.type === 'SPEND' || log.type === 'GENEROSITY' || log.type === 'TRANSFER';

                return (
                  <div key={log.id} className="flex justify-between items-center p-3 md:p-4 border rounded-lg md:rounded-xl hover:bg-white/10 transition-colors group bg-white/5 border-white/5">
                    <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
                      <div className={`p-1.5 md:p-2 rounded-md md:rounded-lg shrink-0 ${isIncome ? 'bg-emerald-500/10 text-emerald-500' : isSpend ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                         {isIncome ? <ArrowDownLeft size={14} className="md:w-4 md:h-4"/> : isSpend ? <ArrowUpRight size={14} className="md:w-4 md:h-4"/> : <Activity size={14} className="md:w-4 md:h-4"/>}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white text-[11px] md:text-sm flex items-center gap-1.5 md:gap-2 truncate">
                           {log.title}
                        </div>
                        <div className="text-[9px] md:text-xs text-gray-500 truncate mt-0.5">
                            {new Date(log.date).toLocaleDateString()} • {log.description || log.type}
                        </div>
                      </div>
                    </div>
                    <div className={`font-mono text-[11px] md:text-sm font-bold flex items-center gap-0.5 md:gap-1 shrink-0 pl-2 ${isIncome ? 'text-emerald-400' : isSpend ? 'text-red-400' : 'text-white'}`}>
                      {isIncome ? '+' : isSpend ? '-' : ''}
                      {log.amount ? <><Naira/>{formatNumber(Math.abs(log.amount))}</> : '-'}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-white/5 text-center">
             <button onClick={() => navigate('/ledger')} className="text-[10px] md:text-xs text-gray-500 hover:text-white transition-colors uppercase tracking-wider font-bold">
                View Full Ledger
             </button>
          </div>
        </GlassCard>
      </div>

      <RunwayDrawer 
        isOpen={showRunwayDrawer} 
        onClose={() => setShowRunwayDrawer(false)} 
      />
    </RunwayWeather>
  );
};
