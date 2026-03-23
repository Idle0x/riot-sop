import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '../hooks/useAnalytics';
import { useFinancialStats } from '../hooks/useFinancialStats';
import { useUser } from '../context/UserContext';

import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { Naira } from '../components/ui/Naira';
import { formatNumber } from '../utils/format';

import { 
  Download, TrendingUp, PieChart as PieIcon, Target, Calendar, 
  Zap, AlertTriangle, ShieldCheck, Plus, X, BarChart2, 
  Search, Briefcase, Activity, Landmark, LineChart
} from 'lucide-react';

import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, ComposedChart, Line, CartesianGrid, Legend, PieChart, Pie
} from 'recharts';

const formatAxisAmount = (val: number) => {
  if (val === 0) return '0';
  if (val >= 1000000) return `${(val / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
  return val.toString();
};

const formatPeriodLabel = (p: string) => {
  if (p.includes('-') && p.length === 7) {
      const [y, m] = p.split('-');
      const d = new Date(parseInt(y), parseInt(m) - 1, 1);
      return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  }
  return p;
};

type AnalyticsTab = 'VELOCITY' | 'SOVEREIGNTY' | 'ALLOCATION' | 'INTELLIGENCE';
type ComparatorMetric = 'BURN' | 'INCOME' | 'NET_WORTH' | 'RUNWAY' | 'GOALS' | 'IDLE' | 'YIELD';

export const Analytics = () => {
  const { user } = useUser();
  const location = useLocation();
  const bleedSectionRef = useRef<HTMLDivElement>(null);
  const isInit = useRef(false);

  // Set defaults so CUSTOM dates do not crash the chart render immediately
  const [customStart, setCustomStart] = useState(() => {
     const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [masterTimeframe, setMasterTimeframe] = useState('1M');
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('VELOCITY');

  const [compMetric, setCompMetric] = useState<ComparatorMetric>('BURN');
  const [compMode, setCompMode] = useState<'ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'MIXED'>('ANNUAL');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [periodToAdd, setPeriodToAdd] = useState('');

  useEffect(() => {
      if (activeTab === 'VELOCITY') setCompMetric('BURN');
      else if (activeTab === 'SOVEREIGNTY') setCompMetric('NET_WORTH');
      else if (activeTab === 'ALLOCATION') setCompMetric('GOALS');
      else if (activeTab === 'INTELLIGENCE') setCompMetric('YIELD');
  }, [activeTab]);

  const { 
    burnHistory, categorySplit,
    monthlyStatement, ribbon, signalLeaderboard, signalFunnel,
    bleedForensics, topMerchants,
    getComparatorData, availablePeriods, filteredSnapshots
  } = useAnalytics(masterTimeframe, customStart, customEnd);

  const { 
    trueInflow, trueOutflow, trueNetFlow, inflowDelta, outflowDelta 
  } = useFinancialStats(masterTimeframe, customStart, customEnd);

  // EXACT TIMEFRAME NSR CALCULATION FOR TOP RIBBON
  const currentNSR = trueInflow > 0 ? ((trueInflow - trueOutflow) / trueInflow) * 100 : 0;
  const prevNSR = prevTrueInflow > 0 ? ((prevTrueInflow - prevTrueOutflow) / prevTrueInflow) * 100 : 0;
  const nsrDelta = currentNSR - prevNSR;

  const comparisonData = getComparatorData(selectedPeriods, compMode, compMetric as any);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('view') === 'leaks') {
        setActiveTab('VELOCITY');
        setTimeout(() => {
            bleedSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500); 
    }
  }, [location]);

  useEffect(() => {
    if (!isInit.current && availablePeriods.years.length > 0) {
        const curY = new Date().getFullYear().toString();
        const prevY = (new Date().getFullYear() - 1).toString();
        const defaults = [prevY, curY].filter(y => availablePeriods.years.includes(y));
        setSelectedPeriods(defaults.length ? defaults : [availablePeriods.years[0]]);
        isInit.current = true;
    }
  }, [availablePeriods]);

  const handleModeSwitch = (mode: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'MIXED') => {
      setCompMode(mode);
      setSelectedPeriods([]); 
      let initial: string[] = [];
      if (mode === 'ANNUAL' && availablePeriods.years.length) initial = [availablePeriods.years[0]];
      if (mode === 'MONTHLY' && availablePeriods.months.length) initial = [availablePeriods.months[0]];
      if (mode === 'QUARTERLY' && availablePeriods.quarters.length) initial = [availablePeriods.quarters[0]];
      if (initial.length) setSelectedPeriods(initial);
  };

  const periodOptions = (() => {
    switch (compMode) {
        case 'ANNUAL': return availablePeriods.years;
        case 'QUARTERLY': return availablePeriods.quarters;
        case 'MONTHLY': return availablePeriods.months;
        case 'MIXED': return [...availablePeriods.years, ...availablePeriods.quarters, ...availablePeriods.months];
        default: return [];
    }
  })();

  const addPeriod = () => {
      if (periodToAdd && !selectedPeriods.includes(periodToAdd)) {
          setSelectedPeriods([...selectedPeriods, periodToAdd]);
          setPeriodToAdd('');
      }
  };

  const removePeriod = (p: string) => setSelectedPeriods(selectedPeriods.filter(x => x !== p));
  const clearAll = () => setSelectedPeriods([]);

  const handleExport = () => {
    const data = JSON.stringify({ user }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `riot_sovereign_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-white/10 p-3 rounded-lg shadow-xl text-xs z-50">
          <p className="font-bold text-white mb-2">{label}</p>
          {payload.map((p: any, idx: number) => {
             const isRunway = p.name === 'Liquid Runway' || compMetric === 'RUNWAY';
             return (
              <p key={idx} style={{ color: p.color || '#fff' }} className="flex items-center gap-1">
                {p.name === 'value' ? 'Amount' : p.name}: 
                {typeof p.value === 'number' ? (
                   <span className="font-mono">
                     {isRunway ? `${p.value.toFixed(1)}mo` : <><Naira/>{formatNumber(p.value)}</>}
                   </span>
                ) : p.value}
              </p>
             );
          })}
        </div>
      );
    }
    return null;
  };

  const renderComparator = (allowedMetrics: {label: string, val: ComparatorMetric}[]) => (
    <GlassCard className="p-6 h-[450px] flex flex-col w-full">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
           <Calendar className="text-blue-400" size={20}/>
           <h3 className="font-bold text-white">Contextual Comparator</h3>
        </div>
        <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/10">
           {allowedMetrics.map(m => (
             <button
               key={m.val}
               onClick={() => setCompMetric(m.val)}
               className={`text-[10px] px-3 py-1.5 rounded transition-colors font-bold uppercase tracking-wider ${compMetric === m.val ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
             >
               {m.label}
             </button>
           ))}
        </div>
      </div>
      
      <div className="flex gap-2 mb-4">
         {['ANNUAL', 'QUARTERLY', 'MONTHLY', 'MIXED'].map((m) => (
             <button 
               key={m} 
               onClick={() => handleModeSwitch(m as any)} 
               className={`text-[10px] px-2 py-1.5 rounded border transition-colors flex-1 font-bold ${compMode === m ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-500 border-white/10 hover:border-white/30 hover:bg-white/5'}`}
             >
                 {m === 'MIXED' ? 'UNIVERSAL' : m}
             </button>
         ))}
      </div>

      <div className="flex gap-2 mb-4">
         <select 
           className="bg-black/40 border border-white/10 text-white text-xs rounded px-2 py-2 flex-1 focus:border-white/30 outline-none"
           value={periodToAdd}
           onChange={(e) => setPeriodToAdd(e.target.value)}
         >
            <option value="">
                {compMode === 'MIXED' ? 'Select period...' : `Add ${compMode.toLowerCase().slice(0, -2)}...`}
            </option>
            {periodOptions.map(p => (
                <option key={p} value={p}>{formatPeriodLabel(p)}</option>
            ))}
         </select>
         <button onClick={addPeriod} disabled={!periodToAdd} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded disabled:opacity-50 transition-colors"><Plus size={16}/></button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 min-h-[24px]">
         {selectedPeriods.map(p => (
             <div key={p} className="flex items-center gap-1 bg-blue-500/20 border border-blue-500/50 text-blue-300 text-[10px] px-2 py-1 rounded-full">
                {formatPeriodLabel(p)} <button onClick={() => removePeriod(p)} className="hover:text-white ml-1"><X size={10}/></button>
             </div>
         ))}
         {selectedPeriods.length > 0 && <button onClick={clearAll} className="text-[10px] text-gray-500 underline ml-auto hover:text-white">Clear</button>}
      </div>

      <div className="flex-1 min-h-0">
        {comparisonData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                    <XAxis dataKey="name" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => compMetric === 'RUNWAY' ? `${val}mo` : `₦${formatAxisAmount(val)}`} />
                    <Tooltip content={<CustomTooltip />}/>
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}>
                        {comparisonData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 border border-dashed border-white/5 rounded-xl">
                <BarChart2 size={32} className="mb-2 opacity-50"/>
                <span className="text-xs font-medium">No Periods Selected</span>
            </div>
        )}
      </div>
    </GlassCard>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-20 animate-fade-in">

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white tracking-tight">Intelligence Hub</h1>
           <p className="text-gray-400 text-sm">Forensic analysis of aggregated system & bank data.</p>
        </div>
        <div className="flex flex-col md:flex-row items-end md:items-center gap-3">
           
           {masterTimeframe === 'CUSTOM' && (
             <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="bg-transparent text-xs text-white outline-none px-2 [color-scheme:dark]" />
                <span className="text-gray-500 text-xs">to</span>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="bg-transparent text-xs text-white outline-none px-2 [color-scheme:dark]" />
             </div>
           )}

           <select 
              value={masterTimeframe}
              onChange={(e) => setMasterTimeframe(e.target.value)}
              className="bg-black/40 border border-white/20 text-white text-sm font-bold rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors cursor-pointer"
           >
              <option value="24H">Last 24 Hours</option>
              <option value="3D">Last 3 Days</option>
              <option value="7D">Last 7 Days</option>
              <option value="1M">1 Month</option>
              <option value="3M">3 Months</option>
              <option value="6M">6 Months</option>
              <option value="YTD">Year to Date (YTD)</option>
              <option value="1Y">1 Year</option>
              <option value="5Y">5 Years</option>
              <option value="MAX">Max (All-Time)</option>
              <option value="CUSTOM">Custom Range...</option>
           </select>
           <GlassButton size="sm" onClick={handleExport}>
             <Download size={16}/> <span className="hidden md:inline ml-2">Export Data Lake</span>
           </GlassButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4 relative overflow-hidden">
           <div className="flex items-center gap-2 mb-2 text-blue-400">
             <ShieldCheck size={16}/> <span className="text-xs font-bold uppercase">Net Savings Rate</span>
           </div>
           <div className="text-2xl font-mono font-bold text-white">{currentNSR.toFixed(1)}%</div>
           <div className={`text-[10px] mt-1 ${nsrDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
             {nsrDelta >= 0 ? '▲' : '▼'} {Math.abs(nsrDelta).toFixed(1)}% vs Prev Period
           </div>
        </GlassCard>

        <GlassCard className="p-4 relative overflow-hidden">
           <div className="flex items-center gap-2 mb-2 text-yellow-400">
             <Zap size={16}/> <span className="text-xs font-bold uppercase">Global Alpha Yield</span>
           </div>
           <div className="text-2xl font-mono font-bold text-white flex items-center gap-1">
             <Naira/>{formatNumber(ribbon.alphaYield)}<span className="text-sm text-gray-500 font-normal">/hr</span>
           </div>
           <div className="text-[10px] text-gray-500 mt-1">Total Signal ROI</div>
        </GlassCard>

        <GlassCard className="p-4 relative overflow-hidden border-red-500/30 bg-red-950/10">
           <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle size={16}/> 
                <span className="text-xs font-bold uppercase">Largest OpEx Leak</span>
              </div>
           </div>
           <div className="text-lg font-bold text-white flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2">
              <span className="truncate max-w-[120px]">{ribbon.largestLeak?.name || 'None'}</span>
              {ribbon.largestLeak && (
                 <>
                   <span className="hidden md:inline text-gray-600">•</span>
                   <span className="font-mono text-red-500"><Naira/>{formatNumber(ribbon.largestLeak.amount)}</span>
                 </>
              )}
           </div>
           <div className="text-[10px] text-red-400 mt-1">Selected Timeframe</div>
        </GlassCard>

        <GlassCard className="p-4 relative overflow-hidden">
           <div className="flex items-center gap-2 mb-2 text-green-400">
             <Target size={16}/> <span className="text-xs font-bold uppercase">Signal Win Rate</span>
           </div>
           <div className="text-2xl font-mono font-bold text-white">
             {signalLeaderboard.length > 0 ? ((signalLeaderboard.filter(s => s.profit > 0).length / signalLeaderboard.length) * 100).toFixed(0) : 0}%
           </div>
           <div className="text-[10px] text-gray-500 mt-1">Profitable vs Attempted</div>
        </GlassCard>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-white/10 pb-4 scrollbar-hide">
        {[
          { id: 'VELOCITY', icon: <Activity size={16}/>, label: 'Flow & Velocity' },
          { id: 'SOVEREIGNTY', icon: <LineChart size={16}/>, label: 'Runway Sovereignty' },
          { id: 'ALLOCATION', icon: <Landmark size={16}/>, label: 'Capital Allocation' },
          { id: 'INTELLIGENCE', icon: <Zap size={16}/>, label: 'Signal Intelligence' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AnalyticsTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'VELOCITY' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">True Income (Excl. Transfers)</div>
                <div className="text-2xl font-mono font-bold text-white"><Naira/>{formatNumber(trueInflow)}</div>
                <div className={`text-xs mt-1 font-bold ${inflowDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                   {inflowDelta >= 0 ? '▲' : '▼'} {Math.abs(inflowDelta).toFixed(1)}% vs Prev Period
                </div>
             </div>
             <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">True Burn (Excl. Transfers)</div>
                <div className="text-2xl font-mono font-bold text-white"><Naira/>{formatNumber(trueOutflow)}</div>
                <div className={`text-xs mt-1 font-bold ${outflowDelta <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                   {outflowDelta <= 0 ? '▼' : '▲'} {Math.abs(outflowDelta).toFixed(1)}% vs Prev Period
                </div>
             </div>
             <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-900/10">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">True Net Flow</div>
                <div className={`text-2xl font-mono font-bold ${trueNetFlow >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                   {trueNetFlow >= 0 ? '+' : '-'}<Naira/>{formatNumber(Math.abs(trueNetFlow))}
                </div>
                <div className="text-xs mt-1 text-gray-500 font-bold">Absolute Liquidity Generated</div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6 h-[450px]">
              <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-red-500" size={20}/>
                    <h3 className="font-bold text-white">Burn Velocity</h3>
                  </div>
              </div>
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={burnHistory}>
                  <defs>
                    <linearGradient id="colorBurn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#555" fontSize={10} tickLine={false} axisLine={false} minTickGap={30}/>
                  <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₦${formatAxisAmount(val)}`}/>
                  <Tooltip content={<CustomTooltip />}/>
                  <Area type="monotone" dataKey="burn" stroke="#ef4444" fillOpacity={1} fill="url(#colorBurn)" strokeWidth={2} name="Burn" />
                </AreaChart>
              </ResponsiveContainer>
            </GlassCard>

            {renderComparator([{label: 'True Burn', val: 'BURN'}, {label: 'True Income', val: 'INCOME'}])}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6 h-[400px]">
              <div className="flex items-center gap-2 mb-6">
                <PieIcon className="text-purple-400" size={20}/>
                <h3 className="font-bold text-white">Category Distribution</h3>
              </div>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={categorySplit} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" stroke="#555" fontSize={10} tickFormatter={(val) => `₦${formatAxisAmount(val)}`}/>
                  <YAxis dataKey="name" type="category" stroke="#fff" fontSize={10} width={100}/>
                  <Tooltip content={<CustomTooltip />}/>
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Spent" barSize={20}>
                    {categorySplit.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#8b5cf6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>

            <GlassCard className="p-6 h-[400px] flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="text-cyan-400" size={20}/>
                  <h3 className="font-bold text-white">Top Merchants (Vendor Concentration)</h3>
                </div>
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto flex-1 pr-2 relative">
                  <table className="w-full text-xs text-left text-gray-400">
                    <thead className="text-gray-500 border-b border-white/10 uppercase sticky top-0 bg-[#0a0a0a] z-10">
                      <tr>
                        <th className="py-2">Merchant</th>
                        <th className="py-2 text-center">Freq</th>
                        <th className="py-2 text-right">Total Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topMerchants.map((m, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3">
                             <div className="font-bold text-white">{m.merchant}</div>
                             <div className="text-[9px] text-cyan-500/80 uppercase font-normal">{m.category}</div>
                          </td>
                          <td className="py-3 text-center font-mono">{m.count}x</td>
                          <td className="py-3 text-right font-mono font-bold text-cyan-400">
                             <Naira/>{formatNumber(m.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {topMerchants.length === 0 && <div className="text-center py-12 italic text-gray-600">Upload bank statements to build merchant profile.</div>}
                </div>
            </GlassCard>
          </div>

          <GlassCard className="p-6 h-[400px]">
            <div className="flex flex-col mb-6">
              <h3 className="font-bold text-white flex items-center gap-2">
                 <Activity className="text-orange-400" size={20}/> Lifestyle Inflation Tracker
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Plots your rolling 30-day burn against your hard budget cap. If the orange area crosses the red line, you are bleeding out.
              </p>
            </div>
            <ResponsiveContainer width="100%" height="80%">
              {filteredSnapshots.length > 0 ? (
                <ComposedChart data={filteredSnapshots}>
                  <defs>
                    <linearGradient id="colorCreep" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="month" stroke="#777" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#777" fontSize={10} tickFormatter={(val) => `₦${formatAxisAmount(val)}`} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  
                  <Area type="monotone" dataKey="rollingBurn" fill="url(#colorCreep)" stroke="#f97316" strokeWidth={2} name="Trailing 30D Burn" />
                  <Line type="stepAfter" dataKey="budgetCap" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Total Budget Cap" />
                </ComposedChart>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-xl">
                    <Activity size={32} className="mb-2 opacity-50"/>
                    <span className="text-sm">Awaiting first nightly snapshot.</span>
                </div>
              )}
            </ResponsiveContainer>
          </GlassCard>

          <div ref={bleedSectionRef} id="bleed-forensics" className="pt-4">
            <GlassCard className="p-6 border-red-500/30 bg-red-950/10">
              <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6">
                 <div>
                    <h3 className="font-bold text-red-500 flex items-center gap-2 text-xl tracking-tight">
                      <Search size={22}/> Systemic Friction & Bleed Forensics
                    </h3>
                    <p className="text-xs text-red-400/80 mt-1">High-velocity records flagged by the circuit breaker.</p>
                 </div>
                 <div className="text-right">
                    <div className="text-[10px] text-gray-500 uppercase font-bold">Timeframe Damage</div>
                    <div className="text-2xl font-mono font-bold text-red-500">
                       <Naira/>{formatNumber(bleedForensics.reduce((sum, item) => sum + item.total, 0))}
                    </div>
                 </div>
              </div>

              <div className="overflow-x-auto max-h-[400px] overflow-y-auto pr-2 relative">
                <table className="w-full text-sm text-left">
                   <thead className="text-xs text-gray-500 border-b border-white/10 uppercase tracking-wider sticky top-0 bg-[#290808] z-10">
                      <tr>
                         <th className="py-3 font-bold">Culprit</th>
                         <th className="py-3 font-bold text-center">Frequency</th>
                         <th className="py-3 font-bold text-right">Total Damage</th>
                         <th className="py-3 font-bold text-right">Last Date</th>
                      </tr>
                   </thead>
                   <tbody>
                      {bleedForensics.map((bleed, idx) => (
                         <tr key={idx} className="border-b border-white/5 hover:bg-red-500/5 transition-colors">
                            <td className="py-4">
                               <div className="font-bold text-gray-200">{bleed.desc}</div>
                               <div className="text-[10px] text-red-400 uppercase font-normal">{bleed.category}</div>
                            </td>
                            <td className="py-4 text-center font-mono text-gray-300">{bleed.count}x</td>
                            <td className="py-4 text-right font-bold text-red-400 font-mono"><Naira/>{formatNumber(bleed.total)}</td>
                            <td className="py-4 text-right text-xs text-gray-500">{new Date(bleed.latestDate).toLocaleDateString()}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
                {bleedForensics.length === 0 && <div className="text-center py-12 text-green-500/80 font-mono">ZERO SYSTEMIC FRICTION DETECTED.</div>}
              </div>
            </GlassCard>
          </div>

          <GlassCard className="p-6">
             <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="text-blue-400" size={20}/> Macro Statements
               </h3>
             </div>
             <div className="overflow-x-auto max-h-[350px] overflow-y-auto pr-2">
               <table className="w-full text-xs text-left text-gray-400 relative">
                 <thead className="text-gray-500 border-b border-white/10 uppercase sticky top-0 bg-[#0a0a0a] z-10">
                   <tr>
                     <th className="py-2">Period</th>
                     <th className="py-2 text-right">Income</th>
                     <th className="py-2 text-right">Expense</th>
                     <th className="py-2 text-right">Net Flow</th>
                     <th className="py-2 text-right">NSR</th>
                   </tr>
                 </thead>
                 <tbody>
                   {monthlyStatement.map((m) => (
                     <tr key={m.month} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                       <td className="py-3 font-mono text-white">{m.month}</td>
                       <td className="py-3 text-right text-green-400"><Naira/>{formatNumber(m.income)}</td>
                       <td className="py-3 text-right text-red-400"><Naira/>{formatNumber(m.expense)}</td>
                       <td className={`py-3 text-right font-bold ${m.net >= 0 ? 'text-blue-400' : 'text-red-500'}`}>
                          {m.net >= 0 ? '+' : '-'}<Naira/>{formatNumber(Math.abs(m.net))}
                       </td>
                       <td className="py-3 text-right">{m.savingsRate.toFixed(1)}%</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
               {monthlyStatement.length === 0 && <div className="text-center py-4 italic text-gray-600">No statement data found.</div>}
             </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'SOVEREIGNTY' && (
        <div className="space-y-6 animate-fade-in">
          <GlassCard className="p-6 h-[500px]">
            <div className="flex flex-col mb-6">
              <h3 className="font-bold text-white flex items-center gap-2 text-xl">
                 <LineChart className="text-emerald-400" size={24}/> Historical Sovereignty Protocol
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                 Tracking the correlation between Total System Value (Net Worth) and Survival Duration (Runway). 
                 <br/><span className="text-yellow-500">*Chart updates dynamically as daily snapshots are collected.</span>
              </p>
            </div>
            
            <ResponsiveContainer width="100%" height="80%">
              {filteredSnapshots.length > 0 ? (
                <ComposedChart data={filteredSnapshots}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="month" stroke="#777" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#10b981" fontSize={10} tickFormatter={(val) => `₦${formatAxisAmount(val)}`} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={10} tickFormatter={(val) => `${val}mo`} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  
                  <Area yAxisId="left" type="monotone" dataKey="netWorth" fill="#10b981" fillOpacity={0.1} stroke="#10b981" strokeWidth={3} name="Total Net Worth" />
                  <Line yAxisId="right" type="monotone" dataKey="runway" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} name="Liquid Runway" />
                </ComposedChart>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-xl">
                    <LineChart size={32} className="mb-2 opacity-50"/>
                    <span className="text-sm">Database Syncing. Awaiting first nightly snapshot.</span>
                </div>
              )}
            </ResponsiveContainer>
          </GlassCard>

          {renderComparator([{label: 'Net Worth', val: 'NET_WORTH'}, {label: 'Liquid Runway', val: 'RUNWAY'}])}
        </div>
      )}

      {activeTab === 'ALLOCATION' && (
        <div className="space-y-6 animate-fade-in">
          <GlassCard className="p-6 h-[500px]">
            <div className="flex flex-col mb-6">
              <h3 className="font-bold text-white flex items-center gap-2 text-xl">
                 <Landmark className="text-purple-400" size={24}/> Capital Deployment History
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                 Visualizing how unallocated liquidity transitions into funded War Room goals and Generosity.
              </p>
            </div>
            <ResponsiveContainer width="100%" height="80%">
              {filteredSnapshots.length > 0 ? (
                <AreaChart data={filteredSnapshots}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="month" stroke="#777" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#777" fontSize={10} tickFormatter={(val) => `₦${formatAxisAmount(val)}`} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  
                  <Area type="monotone" dataKey="idle" stackId="1" stroke="#eab308" fill="#eab308" fillOpacity={0.3} name="Idle / Holding" />
                  <Area type="monotone" dataKey="goals" stackId="1" stroke="#a855f7" fill="#a855f7" fillOpacity={0.5} name="War Room Goals" />
                  <Area type="monotone" dataKey="generosity" stackId="1" stroke="#ec4899" fill="#ec4899" fillOpacity={0.7} name="Generosity" />
                </AreaChart>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-xl">
                    <Landmark size={32} className="mb-2 opacity-50"/>
                    <span className="text-sm">Database Syncing. Awaiting first nightly snapshot.</span>
                </div>
              )}
            </ResponsiveContainer>
          </GlassCard>

          {renderComparator([{label: 'War Room Goals', val: 'GOALS'}, {label: 'Idle Holding', val: 'IDLE'}])}
        </div>
      )}

      {activeTab === 'INTELLIGENCE' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="p-6 h-[350px]">
              <div className="flex items-center gap-2 mb-2">
                <PieIcon className="text-blue-400" size={20}/>
                <h3 className="font-bold text-white">Conversion Funnel</h3>
              </div>
              <ResponsiveContainer width="100%" height="90%">
                {signalFunnel.length > 0 ? (
                  <PieChart>
                    <Pie data={signalFunnel} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {signalFunnel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600">
                      <span className="text-xs">No Signal Data</span>
                  </div>
                )}
              </ResponsiveContainer>
            </GlassCard>

            <GlassCard className="p-6 h-[350px] lg:col-span-2">
              <div className="flex flex-col mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                   <TrendingUp className="text-green-400" size={20}/> Cumulative Yield Trajectory
                </h3>
                <p className="text-xs text-gray-400 mt-1">Total revenue generated from harvested signals over time.</p>
              </div>
              <ResponsiveContainer width="100%" height="80%">
                {filteredSnapshots.length > 0 ? (
                  <AreaChart data={filteredSnapshots}>
                    <defs>
                      <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="month" stroke="#777" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#10b981" fontSize={10} tickFormatter={(val) => `₦${formatAxisAmount(val)}`} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="signalYield" stroke="#10b981" fill="url(#colorYield)" strokeWidth={3} name="Total Harvested Revenue" />
                  </AreaChart>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-xl">
                      <span className="text-sm">Awaiting first nightly snapshot.</span>
                  </div>
                )}
              </ResponsiveContainer>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6 h-[450px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Zap className="text-yellow-400" size={20}/> Alpha Leaderboard
                </h3>
              </div>
              <div className="overflow-x-auto max-h-[350px] overflow-y-auto pr-2">
                <table className="w-full text-xs text-left text-gray-400 relative">
                  <thead className="text-gray-500 border-b border-white/10 uppercase sticky top-0 bg-[#0a0a0a] z-10">
                    <tr>
                      <th className="py-2">Signal</th>
                      <th className="py-2 text-right">Profit</th>
                      <th className="py-2 text-right">Hours</th>
                      <th className="py-2 text-right text-yellow-500">Yield/Hr</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signalLeaderboard.map((s) => (
                      <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3">
                          <div className="font-bold text-white">{s.name}</div>
                          <div className="text-[10px] text-gray-500">{s.sector}</div>
                        </td>
                        <td className="py-3 text-right text-green-400"><Naira/>{formatNumber(s.profit)}</td>
                        <td className="py-3 text-right">{s.effort}h</td>
                        <td className="py-3 text-right font-mono font-bold text-yellow-400">
                          <Naira/>{formatNumber(s.roi)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {signalLeaderboard.length === 0 && <div className="text-center py-12 italic text-gray-600">No winning signals harvested yet.</div>}
              </div>
            </GlassCard>

            {renderComparator([{label: 'Alpha Yield', val: 'YIELD'}])}
          </div>
        </div>
      )}

    </div>
  );
};
