import { useState } from 'react';
import { useFinancialStats } from '../hooks/useFinancialStats';
import { useLedger } from '../context/LedgerContext';

import { GlassCard } from '../components/ui/GlassCard';
import { MetricCard } from '../components/ui/MetricCard';
import { Naira } from '../components/ui/Naira';

import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  BarChart, Bar, LineChart, Line, Legend, PieChart, Pie, Cell, ComposedChart
} from 'recharts';

import { 
  Activity, TrendingUp, TrendingDown, Target, ShieldCheck, 
  Wallet, Zap, Crosshair, BarChart3, Clock, PieChart as PieIcon 
} from 'lucide-react';

type TabMode = 'flow' | 'sovereignty' | 'allocation' | 'signals';

export const Analytics = () => {
  const [timeframe, setTimeframe] = useState('30D');
  const [activeTab, setActiveTab] = useState<TabMode>('flow');

  const { 
    trueInflow, trueOutflow, trueNetFlow, inflowDelta, outflowDelta, 
    chartData, topMerchants, allocation 
  } = useFinancialStats(timeframe);

  const { goals, signals, runwayMonths } = useLedger();

  // Calculate Signal Intelligence metrics
  const activeSignals = signals?.filter(s => s.status === 'ACTIVE') || [];
  const harvestedSignals = signals?.filter(s => s.status === 'HARVESTED') || [];
  const graveyardSignals = signals?.filter(s => s.status === 'GRAVEYARD') || [];
  const totalSignalYield = harvestedSignals.reduce((sum, s) => sum + (s.actualYield || 0), 0);

  const allocationPieData = [
    { name: 'Ops (Liquid)', value: allocation.liquid, color: '#10b981' }, 
    { name: 'Defense (Vault)', value: allocation.reserved, color: '#3b82f6' }, 
    { name: 'Holding (Idle)', value: allocation.idle, color: '#eab308' }, 
    { name: 'Missions (Goals)', value: allocation.goals, color: '#a855f7' }, 
    { name: 'Generosity', value: allocation.generosity, color: '#ec4899' }, 
  ].filter(d => d.value > 0);

  return (
    <div className="p-4 md:p-8 space-y-8 pb-20 max-w-7xl mx-auto animate-fade-in">
      
      {/* 1. UNIVERSAL TIME MACHINE (MASTER CONTROL) */}
      <GlassCard className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-4 z-30 shadow-2xl border-white/20 bg-black/80 backdrop-blur-xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          <button onClick={() => setActiveTab('flow')} className={`px-4 py-2 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'flow' ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
            <Activity size={16}/> True Flow
          </button>
          <button onClick={() => setActiveTab('sovereignty')} className={`px-4 py-2 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'sovereignty' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
            <ShieldCheck size={16}/> Sovereignty
          </button>
          <button onClick={() => setActiveTab('allocation')} className={`px-4 py-2 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'allocation' ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
            <PieIcon size={16}/> Allocation
          </button>
          <button onClick={() => setActiveTab('signals')} className={`px-4 py-2 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'signals' ? 'bg-yellow-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
            <Zap size={16}/> Signals
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/10 pt-4 md:pt-0">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest">
            <Clock size={14}/> Period:
          </div>
          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-white/10 border border-white/20 text-white text-sm rounded-lg px-4 py-2 outline-none focus:border-blue-500 cursor-pointer font-bold"
          >
            <option value="7D">Last 7 Days</option>
            <option value="30D">Last 30 Days</option>
            <option value="3M">Last 3 Months</option>
            <option value="6M">Last 6 Months</option>
            <option value="1Y">Trailing Year (12M)</option>
            <option value="MAX">All Time</option>
          </select>
        </div>
      </GlassCard>

      {/* ------------------------------------------------------------------------- */}
      {/* TAB A: TRUE FLOW & VELOCITY */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'flow' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard 
              title="True Income (Filtered)" 
              value={<div className="flex items-center gap-1 text-emerald-400"><Naira/>{trueInflow.toLocaleString()}</div>}
              subValue={
                <span className={`flex items-center gap-1 ${inflowDelta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {inflowDelta >= 0 ? '▲' : '▼'} {Math.abs(inflowDelta).toFixed(1)}% vs prev period
                </span>
              }
              icon={<TrendingUp size={20} className="text-emerald-500"/>}
            />
            <MetricCard 
              title="True Burn (Filtered)" 
              value={<div className="flex items-center gap-1 text-red-400"><Naira/>{trueOutflow.toLocaleString()}</div>}
              subValue={
                <span className={`flex items-center gap-1 ${outflowDelta <= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {outflowDelta > 0 ? '▲' : '▼'} {Math.abs(outflowDelta).toFixed(1)}% vs prev period {outflowDelta <= 0 && '(Good)'}
                </span>
              }
              icon={<TrendingDown size={20} className="text-red-500"/>}
            />
            <MetricCard 
              title="Net True Flow" 
              value={<div className={`flex items-center gap-1 ${trueNetFlow >= 0 ? 'text-white' : 'text-red-500'}`}>{trueNetFlow < 0 ? '-' : '+'}<Naira/>{Math.abs(trueNetFlow).toLocaleString()}</div>}
              subValue="Excludes internal sweeps & identity transfers"
              icon={<Activity size={20} className={trueNetFlow >= 0 ? 'text-blue-500' : 'text-red-500'}/>}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="lg:col-span-2 p-6 h-[400px] flex flex-col">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Cash Flow Trajectory</h3>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="date" stroke="#666" tick={{fontSize: 12}} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                    <YAxis stroke="#666" tick={{fontSize: 12}} tickFormatter={(val) => `₦${(val/1000).toFixed(0)}k`} />
                    <RechartsTooltip contentStyle={{backgroundColor: '#111', borderColor: '#333', borderRadius: '8px'}} itemStyle={{color: '#fff'}} />
                    <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorInc)" />
                    <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="p-6 h-[400px] flex flex-col">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Target size={14} className="text-red-500"/> Merchant Concentration
              </h3>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {topMerchants.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm mt-10">No clear merchant data in this period.</div>
                ) : (
                  topMerchants.map((m, i) => (
                    <div key={m.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-white font-bold truncate pr-4">{i + 1}. {m.name}</span>
                        <span className="text-red-400 font-mono">₦{m.total.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5">
                        <div className="bg-red-500/50 h-1.5 rounded-full" style={{ width: `${(m.total / topMerchants[0].total) * 100}%` }}></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB B: SOVEREIGNTY (Wealth vs Runway) */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'sovereignty' && (
        <div className="space-y-6 animate-fade-in">
          <GlassCard className="p-6 h-[500px] flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck size={20} className="text-indigo-500"/> The Master Timeline
                </h3>
                <p className="text-xs text-gray-400 mt-1">Dual-Axis mapping: Total System Wealth vs. Survival Duration.</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white">Current Runway: {runwayMonths === Infinity ? '∞' : runwayMonths.toFixed(1)} Months</div>
              </div>
            </div>
            
            <div className="flex-1 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}> {/* Note: This uses chartData as a visual placeholder until daily_snapshots API is wired */}
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="date" stroke="#666" tick={{fontSize: 12}} />
                  <YAxis yAxisId="left" stroke="#8b5cf6" tick={{fontSize: 12}} tickFormatter={(val) => `₦${(val/1000).toFixed(0)}k`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{fontSize: 12}} />
                  <RechartsTooltip contentStyle={{backgroundColor: '#111', borderColor: '#333'}} />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="income" name="Net Worth Trend (Proxy)" fill="#8b5cf6" stroke="#8b5cf6" fillOpacity={0.1} />
                  <Line yAxisId="right" type="stepAfter" dataKey="expense" name="Runway Months (Proxy)" stroke="#10b981" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
              <div className="text-center p-6 border border-indigo-500/30 bg-indigo-500/10 rounded-2xl max-w-md">
                <Activity className="mx-auto text-indigo-400 mb-3 animate-pulse" size={32}/>
                <h4 className="text-white font-bold mb-2">Heartbeat Engine Active</h4>
                <p className="text-sm text-gray-400">The Database is now taking immutable daily snapshots. Your historical Net Worth and Runway curves will automatically populate here over the coming days.</p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB C: CAPITAL ALLOCATION */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'allocation' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <GlassCard className="p-6 flex flex-col items-center justify-center h-[400px]">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 w-full text-left">System Distribution</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocationPieData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value" stroke="none">
                    {allocationPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => `₦${value.toLocaleString()}`} contentStyle={{backgroundColor: '#111', borderColor: '#333', borderRadius: '8px'}} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </GlassCard>

            <div className="space-y-6 h-[400px] overflow-y-auto scrollbar-hide">
              <GlassCard className="p-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Crosshair size={14} className="text-purple-500"/> Active War Room Missions
                </h3>
                <div className="space-y-4">
                  {goals.filter(g => !g.isCompleted).length === 0 ? (
                    <p className="text-sm text-gray-500">No active capital missions.</p>
                  ) : (
                    goals.filter(g => !g.isCompleted).map(goal => (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white font-bold">{goal.title}</span>
                          <span className="text-purple-400 font-mono">{(goal.currentAmount / goal.targetAmount * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}></div>
                        </div>
                        <div className="text-[10px] text-gray-500 text-right">₦{goal.currentAmount.toLocaleString()} / ₦{goal.targetAmount.toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>

              <GlassCard className="p-6 border-yellow-500/20 bg-yellow-500/5">
                <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Wallet size={14}/> Holding Pen (Idle)
                </h3>
                <div className="text-3xl font-mono font-bold text-white mb-1"><Naira/>{allocation.idle.toLocaleString()}</div>
                <p className="text-xs text-yellow-500/80">Capital awaiting deployment. Route this to Operations, Defense, or Missions to prevent inflation decay.</p>
              </GlassCard>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB D: SIGNAL INTELLIGENCE (ROI) */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'signals' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <MetricCard title="Active Signals" value={activeSignals.length} subValue="Currently deployed" icon={<Activity size={16} className="text-blue-500"/>} />
             <MetricCard title="Harvested" value={harvestedSignals.length} subValue="Successfully closed" icon={<TrendingUp size={16} className="text-emerald-500"/>} />
             <MetricCard title="Graveyard" value={graveyardSignals.length} subValue="Failed / Abandoned" icon={<TrendingDown size={16} className="text-red-500"/>} />
             <MetricCard title="Total Yield" value={<><Naira/>{totalSignalYield.toLocaleString()}</>} subValue="Lifetime profit generated" icon={<Zap size={16} className="text-yellow-500"/>} />
          </div>

          <GlassCard className="p-6 h-[400px] flex flex-col">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Yield Trajectory</h3>
            <div className="flex-1 w-full flex items-center justify-center text-gray-500 border-2 border-dashed border-white/5 rounded-xl">
               {totalSignalYield > 0 ? (
                 <div className="text-center">
                    <Zap size={48} className="mx-auto text-yellow-500/50 mb-4"/>
                    <p className="text-white font-bold">Signal ROI Tracking Enabled</p>
                    <p className="text-sm mt-2">Yields will plot here as you harvest more signals.</p>
                 </div>
               ) : (
                 <p>Harvest a Signal to generate the ROI curve.</p>
               )}
            </div>
          </GlassCard>
        </div>
      )}

    </div>
  );
};
