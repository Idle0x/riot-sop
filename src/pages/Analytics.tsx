import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '../hooks/useAnalytics';
import { useFinancialStats } from '../hooks/useFinancialStats';
import { useUser } from '../context/UserContext';

import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { Naira } from '../components/ui/Naira';
import { formatNumber } from '../utils/format';
import { CategoryDrawer } from '../components/ui/CategoryDrawer';

import { 
  Download, TrendingUp, PieChart as PieIcon, Target, Calendar, 
  Zap, AlertTriangle, ShieldCheck, X, BarChart2, 
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

  const [customStart, setCustomStart] = useState(() => {
     const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split('T')[0]);

  const [masterTimeframe, setMasterTimeframe] = useState('1M');
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('VELOCITY');

  const [compMetric, setCompMetric] = useState<ComparatorMetric>('BURN');
  const [compMode, setCompMode] = useState<'ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'MIXED'>('ANNUAL');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
    getComparatorData, availablePeriods, filteredSnapshots,
    filteredEvents 
  } = useAnalytics(masterTimeframe, customStart, customEnd);

  const { 
    trueInflow, trueOutflow, trueNetFlow, inflowDelta, outflowDelta,
    prevTrueInflow, prevTrueOutflow
  } = useFinancialStats(masterTimeframe, customStart, customEnd);

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
        <div className="bg-black/90 border border-white/10 p-2 md:p-3 rounded-lg shadow-xl text-[10px] md:text-xs z-50">
          <p className="font-bold text-white mb-1.5 md:mb-2">{label}</p>
          {payload.map((p: any, idx: number) => {
             const isRunway = p.name === 'Liquid Runway' || compMetric === 'RUNWAY';
             return (
              <p key={idx} style={{ color: p.color || '#fff' }} className="flex items-center gap-1 font-bold">
                {p.name === 'value' ? 'Amount' : p.name}: 
                {typeof p.value === 'number' ? (
                   <span className="font-mono font-bold">
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
    <GlassCard className="p-4 md:p-6 h-[350px] md:h-[450px] flex flex-col w-full">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 md:gap-4 mb-3 md:mb-4">
        <div className="flex items-center gap-2">
           <Calendar className="text-blue-400 w-4 h-4 md:w-5 md:h-5"/>
           <h3 className="font-bold text-white text-sm md:text-base">Contextual Comparator</h3>
        </div>
        <div className="flex flex-wrap gap-1 bg-black/40 p-1 rounded-lg border border-white/10">
           {allowedMetrics.map(m => (
             <button
               key={m.val}
               onClick={() => setCompMetric(m.val)}
               className={`text-[9px] md:text-[10px] px-2.5 py-1 md:px-3 md:py-1.5 rounded transition-colors font-bold uppercase tracking-wider ${compMetric === m.val ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
             >
               {m.label}
             </button>
           ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
         {['ANNUAL', 'QUARTERLY', 'MONTHLY', 'MIXED'].map((m) => (
             <button 
               key={m} 
               onClick={() => handleModeSwitch(m as any)} 
               className={`text-[9px] md:text-[10px] px-2 py-1 md:py-1.5 rounded border transition-colors flex-1 font-bold ${compMode === m ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-500 border-white/10 hover:border-white/30 hover:bg-white/5'}`}
             >
                 {m === 'MIXED' ? 'UNIVERSAL' : m}
             </button>
         ))}
      </div>

      <div className="flex gap-2 mb-3 md:mb-4">
         <select 
           className="bg-black/40 border border-white/10 text-white text-[10px] md:text-xs rounded-lg px-2 py-1.5 md:py-2 flex-1 focus:border-white/30 outline-none cursor-pointer font-bold"
           value="" 
           onChange={(e) => {
               const val = e.target.value;
               if (val && !selectedPeriods.includes(val)) {
                   setSelectedPeriods([...selectedPeriods, val]);
               }
           }}
         >
            <option value="" disabled hidden>
                {compMode === 'MIXED' ? 'Select period to add...' : `Add ${compMode.toLowerCase().slice(0, -2)}...`}
            </option>
            {periodOptions.map(p => (
                <option key={p} value={p}>{formatPeriodLabel(p)}</option>
            ))}
         </select>
      </div>

      <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4 min-h-[20px] md:min-h-[24px]">
         {selectedPeriods.map(p => (
             <div key={p} className="flex items-center gap-1 bg-blue-500/20 border border-blue-500/50 text-blue-300 text-[9px] md:text-[10px] font-bold px-2 py-0.5 md:py-1 rounded-full">
                {formatPeriodLabel(p)} <button onClick={() => removePeriod(p)} className="hover:text-white ml-1"><X size={10}/></button>
             </div>
         ))}
         {selectedPeriods.length > 0 && <button onClick={clearAll} className="text-[9px] md:text-[10px] text-gray-500 font-bold underline ml-auto hover:text-white mt-1 md:mt-0">Clear</button>}
      </div>

      <div className="flex-1 min-h-0">
        {comparisonData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                    <XAxis dataKey="name" stroke="#555" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#555" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => compMetric === 'RUNWAY' ? `${val}mo` : `₦${formatAxisAmount(val)}`} width={40}/>
                    <Tooltip content={<CustomTooltip />}/>
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={25}>
                        {comparisonData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 border border-dashed border-white/5 rounded-xl">
                <BarChart2 className="w-6 h-6 md:w-8 md:h-8 mb-2 opacity-50"/>
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">No Periods Selected</span>
            </div>
        )}
      </div>
    </GlassCard>
  );

  return (
    <div className="max-w-7xl mx-auto p-3 md:p-8 space-y-5 md:space-y-8 pb-16 md:pb-20 animate-fade-in">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-3 md:gap-4">
        <div>
           <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">Intelligence Hub</h1>
           <p className="text-[10px] md:text-sm text-gray-400 mt-0.5">Forensic analysis of aggregated system & bank data.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">

           {masterTimeframe === 'CUSTOM' && (
             <div className="flex items-center justify-between sm:justify-start gap-2 bg-white/5 border border-white/10 rounded-lg p-1.5 w-full sm:w-auto">
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="bg-transparent text-[10px] md:text-xs text-white font-bold outline-none px-1 md:px-2 [color-scheme:dark] w-full" />
                <span className="text-gray-500 text-[10px] font-bold px-1">to</span>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="bg-transparent text-[10px] md:text-xs text-white font-bold outline-none px-1 md:px-2 [color-scheme:dark] w-full" />
             </div>
           )}

           <div className="flex items-center gap-2 w-full sm:w-auto">
             <select 
                value={masterTimeframe}
                onChange={(e) => setMasterTimeframe(e.target.value)}
                className="flex-1 sm:flex-none bg-black/40 border border-white/20 text-white text-[10px] md:text-sm font-bold rounded-lg px-2.5 py-2 md:px-3 md:py-2 outline-none focus:border-blue-500 transition-colors cursor-pointer"
             >
                <option value="24H">24 Hours</option>
                <option value="3D">3 Days</option>
                <option value="7D">7 Days</option>
                <option value="1M">1 Month</option>
                <option value="3M">3 Months</option>
                <option value="6M">6 Months</option>
                <option value="YTD">YTD</option>
                <option value="1Y">1 Year</option>
                <option value="5Y">5 Years</option>
                <option value="MAX">All-Time</option>
                <option value="CUSTOM">Custom...</option>
             </select>
             <GlassButton size="sm" onClick={handleExport} className="shrink-0 px-3 py-2 md:px-4 text-[10px] md:text-sm">
               <Download size={14} className="md:w-4 md:h-4"/> <span className="hidden md:inline ml-2">Export Lake</span>
             </GlassButton>
           </div>
        </div>
      </div>

      {/* KPI HUD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <GlassCard className="p-3 md:p-4 relative overflow-hidden">
           <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2 text-blue-400">
             <ShieldCheck size={14} className="md:w-4 md:h-4 shrink-0"/> <span className="text-[9px] md:text-xs font-bold uppercase truncate">Net Savings Rate</span>
           </div>
           <div className="text-lg md:text-2xl font-mono font-bold text-white">{currentNSR.toFixed(1)}%</div>
           <div className={`text-[8px] md:text-[10px] mt-0.5 md:mt-1 font-bold ${nsrDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
             {nsrDelta >= 0 ? '▲' : '▼'} {Math.abs(nsrDelta).toFixed(1)}% <span className="hidden sm:inline">vs Prev Period</span>
           </div>
        </GlassCard>

        <GlassCard className="p-3 md:p-4 relative overflow-hidden">
           <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2 text-yellow-400">
             <Zap size={14} className="md:w-4 md:h-4 shrink-0"/> <span className="text-[9px] md:text-xs font-bold uppercase truncate">Global Alpha Yield</span>
           </div>
           <div className="text-lg md:text-2xl font-mono font-bold text-white flex items-center gap-0.5 md:gap-1">
             <Naira/>{formatNumber(ribbon.alphaYield)}<span className="text-[10px] md:text-sm text-gray-500 font-normal">/hr</span>
           </div>
           <div className="text-[8px] md:text-[10px] text-gray-500 font-bold mt-0.5 md:mt-1">Total Signal ROI</div>
        </GlassCard>

        <GlassCard className="p-3 md:p-4 relative overflow-hidden border-red-500/30 bg-red-950/10">
           <div className="flex items-center justify-between mb-1 md:mb-2">
              <div className="flex items-center gap-1.5 md:gap-2 text-red-400">
                <AlertTriangle size={14} className="md:w-4 md:h-4 shrink-0"/> 
                <span className="text-[9px] md:text-xs font-bold uppercase truncate">Largest OpEx Leak</span>
              </div>
           </div>
           <div className="text-sm md:text-lg font-bold text-white flex flex-col md:flex-row md:items-baseline gap-0.5 md:gap-2">
              <span className="truncate">{ribbon.largestLeak?.name || 'None'}</span>
              {ribbon.largestLeak && (
                 <>
                   <span className="hidden md:inline text-gray-600">•</span>
                   <span className="font-mono text-red-500"><Naira/>{formatNumber(ribbon.largestLeak.amount)}</span>
                 </>
              )}
           </div>
           <div className="text-[8px] md:text-[10px] text-red-400 mt-0.5 md:mt-1 font-bold">Selected Timeframe</div>
        </GlassCard>

        <GlassCard className="p-3 md:p-4 relative overflow-hidden">
           <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2 text-green-400">
             <Target size={14} className="md:w-4 md:h-4 shrink-0"/> <span className="text-[9px] md:text-xs font-bold uppercase truncate">Signal Win Rate</span>
           </div>
           <div className="text-lg md:text-2xl font-mono font-bold text-white">
             {signalLeaderboard.length > 0 ? ((signalLeaderboard.filter(s => s.profit > 0).length / signalLeaderboard.length) * 100).toFixed(0) : 0}%
           </div>
           <div className="text-[8px] md:text-[10px] text-gray-500 font-bold mt-0.5 md:mt-1">Profitable vs Attempted</div>
        </GlassCard>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex gap-2 overflow-x-auto border-b border-white/10 pb-3 md:pb-4 scrollbar-hide">
        {[
          { id: 'VELOCITY', icon: <Activity size={14} className="md:w-4 md:h-4"/>, label: 'Flow & Velocity' },
          { id: 'SOVEREIGNTY', icon: <LineChart size={14} className="md:w-4 md:h-4"/>, label: 'Runway Sovereignty' },
          { id: 'ALLOCATION', icon: <Landmark size={14} className="md:w-4 md:h-4"/>, label: 'Capital Allocation' },
          { id: 'INTELLIGENCE', icon: <Zap size={14} className="md:w-4 md:h-4"/>, label: 'Signal Intelligence' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AnalyticsTab)}
            className={`flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold transition-all whitespace-nowrap border ${
              activeTab === tab.id 
                ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                : 'text-gray-400 border-transparent hover:bg-white/5 hover:border-white/10 hover:text-white'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* --------------------------------------------------------- */}
      {/* TAB 1: VELOCITY */}
      {/* --------------------------------------------------------- */}
      {activeTab === 'VELOCITY' && (
        <div className="space-y-4 md:space-y-6 animate-fade-in">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
             <div className="p-3 md:p-4 rounded-xl border border-white/10 bg-white/5">
                <div className="text-[9px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Income <span className="hidden sm:inline">(Excl. Transfers)</span></div>
                <div className="text-xl md:text-2xl font-mono font-bold text-white"><Naira/>{formatNumber(trueInflow)}</div>
                <div className={`text-[10px] md:text-xs mt-1 font-bold ${inflowDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                   {inflowDelta >= 0 ? '▲' : '▼'} {Math.abs(inflowDelta).toFixed(1)}% <span className="hidden sm:inline">vs Prev Period</span>
                </div>
             </div>
             <div className="p-3 md:p-4 rounded-xl border border-white/10 bg-white/5">
                <div className="text-[9px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Expenses <span className="hidden sm:inline">(Excl. Transfers)</span></div>
                <div className="text-xl md:text-2xl font-mono font-bold text-white"><Naira/>{formatNumber(trueOutflow)}</div>
                <div className={`text-[10px] md:text-xs mt-1 font-bold ${outflowDelta <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                   {outflowDelta <= 0 ? '▼' : '▲'} {Math.abs(outflowDelta).toFixed(1)}% <span className="hidden sm:inline">vs Prev Period</span>
                </div>
             </div>
             <div className="p-3 md:p-4 rounded-xl border border-blue-500/30 bg-blue-900/10">
                <div className="text-[9px] md:text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Net Flow</div>
                <div className={`text-xl md:text-2xl font-mono font-bold ${trueNetFlow >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                   {trueNetFlow >= 0 ? '+' : '-'}<Naira/>{formatNumber(Math.abs(trueNetFlow))}
                </div>
                <div className="text-[10px] md:text-xs mt-1 text-gray-500 font-bold">Absolute Liquidity Generated</div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <GlassCard className="p-4 md:p-6 h-[250px] md:h-[450px]">
              <div className="flex justify-between items-start mb-4 md:mb-6">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <TrendingUp className="text-red-500 w-4 h-4 md:w-5 md:h-5"/>
                    <h3 className="font-bold text-white text-sm md:text-base">Burn Velocity</h3>
                  </div>
              </div>
              <ResponsiveContainer width="100%" height="80%">
                <AreaChart data={burnHistory}>
                  <defs>
                    <linearGradient id="colorBurn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#555" fontSize={9} tickLine={false} axisLine={false} minTickGap={30}/>
                  <YAxis stroke="#555" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `₦${formatAxisAmount(val)}`} width={40}/>
                  <Tooltip content={<CustomTooltip />}/>
                  <Area type="monotone" dataKey="burn" stroke="#ef4444" fillOpacity={1} fill="url(#colorBurn)" strokeWidth={2} name="Burn" />
                </AreaChart>
              </ResponsiveContainer>
            </GlassCard>

            {renderComparator([{label: 'Total Expenses', val: 'BURN'}, {label: 'Total Income', val: 'INCOME'}])}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <GlassCard className="p-4 md:p-6 h-[300px] md:h-[400px]">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <PieIcon className="text-purple-400 w-4 h-4 md:w-5 md:h-5"/>
                  <h3 className="font-bold text-white text-sm md:text-base">Category Distribution</h3>
                </div>
                <span className="text-[8px] md:text-[10px] text-gray-500 font-bold border border-white/10 px-1.5 py-0.5 rounded-full">Tap bars</span>
              </div>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={categorySplit} layout="vertical" margin={{ left: 0 }}>
                  <XAxis type="number" stroke="#555" fontSize={9} tickFormatter={(val) => `₦${formatAxisAmount(val)}`}/>
                  <YAxis dataKey="name" type="category" stroke="#fff" fontSize={9} width={80}/>
                  <Bar 
                    dataKey="value" 
                    fill="#8b5cf6" 
                    radius={[0, 4, 4, 0]} 
                    name="Spent" 
                    barSize={15}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(data) => setSelectedCategory(data.name || data.payload?.name)}
                  >
                    {categorySplit.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#8b5cf6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>

            <CategoryDrawer 
               isOpen={!!selectedCategory} 
               onClose={() => setSelectedCategory(null)} 
               category={selectedCategory} 
               events={filteredEvents} 
            />

            <GlassCard className="p-4 md:p-6 h-[300px] md:h-[400px] flex flex-col">
                <div className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-4">
                  <Briefcase className="text-cyan-400 w-4 h-4 md:w-5 md:h-5"/>
                  <h3 className="font-bold text-white text-sm md:text-base">Top Merchants <span className="hidden sm:inline">(Vendor Concentration)</span></h3>
                </div>
                <div className="overflow-x-auto overflow-y-auto flex-1 pr-1 md:pr-2 relative scrollbar-hide">
                  <table className="w-full text-[10px] md:text-xs text-left text-gray-400">
                    <thead className="text-gray-500 border-b border-white/10 uppercase sticky top-0 bg-[#0a0a0a] z-10 font-bold">
                      <tr>
                        <th className="py-1.5 md:py-2">Merchant</th>
                        <th className="py-1.5 md:py-2 text-center">Freq</th>
                        <th className="py-1.5 md:py-2 text-right">Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topMerchants.map((m, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-2 md:py-3">
                             <div className="font-bold text-white truncate max-w-[120px] md:max-w-full">{m.merchant}</div>
                             <div className="text-[8px] md:text-[9px] text-cyan-500/80 uppercase font-bold truncate max-w-[120px] md:max-w-full">{m.category}</div>
                          </td>
                          <td className="py-2 md:py-3 text-center font-mono">{m.count}x</td>
                          <td className="py-2 md:py-3 text-right font-mono font-bold text-cyan-400">
                             <Naira/>{formatNumber(m.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {topMerchants.length === 0 && <div className="text-center py-8 italic text-gray-600 text-xs font-bold">Awaiting Data Lake sync.</div>}
                </div>
            </GlassCard>
          </div>

          <GlassCard className="p-4 md:p-6 h-[300px] md:h-[400px]">
            <div className="flex flex-col mb-4 md:mb-6">
              <h3 className="font-bold text-white flex items-center gap-1.5 md:gap-2 text-sm md:text-base">
                 <Activity className="text-orange-400 w-4 h-4 md:w-5 md:h-5"/> Lifestyle Inflation Tracker
              </h3>
              <p className="text-[9px] md:text-xs text-gray-400 mt-1 font-bold">
                Plots rolling 30D burn against hard budget cap. If orange crosses red, you are bleeding out.
              </p>
            </div>
            <ResponsiveContainer width="100%" height="75%">
              {filteredSnapshots.length > 0 ? (
                <ComposedChart data={filteredSnapshots} margin={{ left: -15, bottom: -10 }}>
                  <defs>
                    <linearGradient id="colorCreep" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="month" stroke="#777" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#777" fontSize={9} tickFormatter={(val) => `₦${formatAxisAmount(val)}`} tickLine={false} axisLine={false} width={40}/>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} iconSize={10} />

                  <Area type="monotone" dataKey="rollingBurn" fill="url(#colorCreep)" stroke="#f97316" strokeWidth={2} name="Trailing 30D Burn" />
                  <Line type="stepAfter" dataKey="budgetCap" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Budget Cap" />
                </ComposedChart>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-xl">
                    <Activity className="mb-2 opacity-50 w-6 h-6 md:w-8 md:h-8"/>
                    <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest">Awaiting first nightly snapshot.</span>
                </div>
              )}
            </ResponsiveContainer>
          </GlassCard>

          <div ref={bleedSectionRef} id="bleed-forensics" className="pt-2 md:pt-4">
            <GlassCard className="p-4 md:p-6 border-red-500/30 bg-red-950/10">
              <div className="flex flex-col md:flex-row justify-between md:items-end gap-3 md:gap-4 mb-4 md:mb-6">
                 <div>
                    <h3 className="font-bold text-red-500 flex items-center gap-1.5 md:gap-2 text-base md:text-xl tracking-tight">
                      <Search size={18} className="md:w-[22px] md:h-[22px]"/> Systemic Friction & Bleed Forensics
                    </h3>
                    <p className="text-[10px] md:text-xs text-red-400/80 mt-1 font-bold">High-velocity records flagged by the circuit breaker.</p>
                 </div>
                 <div className="text-left md:text-right mt-1 md:mt-0">
                    <div className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold">Timeframe Damage</div>
                    <div className="text-xl md:text-2xl font-mono font-bold text-red-500 flex items-center gap-0.5">
                       <Naira/>{formatNumber(bleedForensics.reduce((sum, item) => sum + item.total, 0))}
                    </div>
                 </div>
              </div>

              <div className="overflow-x-auto max-h-[300px] md:max-h-[400px] overflow-y-auto pr-1 md:pr-2 relative scrollbar-hide">
                <table className="w-full text-[10px] md:text-sm text-left">
                   <thead className="text-[9px] md:text-xs text-gray-500 border-b border-white/10 uppercase tracking-wider sticky top-0 bg-[#290808] z-10 font-bold">
                      <tr>
                         <th className="py-2 md:py-3">Culprit</th>
                         <th className="py-2 md:py-3 text-center">Freq</th>
                         <th className="py-2 md:py-3 text-right">Damage</th>
                         <th className="py-2 md:py-3 text-right hidden sm:table-cell">Last Date</th>
                      </tr>
                   </thead>
                   <tbody>
                      {bleedForensics.map((bleed, idx) => (
                         <tr key={idx} className="border-b border-white/5 hover:bg-red-500/5 transition-colors">
                            <td className="py-2.5 md:py-4">
                               <div className="font-bold text-gray-200 truncate max-w-[120px] md:max-w-full">{bleed.desc}</div>
                               <div className="text-[8px] md:text-[10px] text-red-400 uppercase font-bold truncate max-w-[120px] md:max-w-full">{bleed.category}</div>
                            </td>
                            <td className="py-2.5 md:py-4 text-center font-mono text-gray-300 font-bold">{bleed.count}x</td>
                            <td className="py-2.5 md:py-4 text-right font-bold text-red-400 font-mono"><Naira/>{formatNumber(bleed.total)}</td>
                            <td className="py-2.5 md:py-4 text-right text-[9px] md:text-xs text-gray-500 font-bold hidden sm:table-cell">{new Date(bleed.latestDate).toLocaleDateString()}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
                {bleedForensics.length === 0 && <div className="text-center py-8 md:py-12 text-green-500/80 font-mono font-bold text-xs md:text-sm">ZERO SYSTEMIC FRICTION DETECTED.</div>}
              </div>
            </GlassCard>
          </div>

          <GlassCard className="p-4 md:p-6">
             <div className="flex items-center justify-between mb-3 md:mb-4">
               <h3 className="font-bold text-white flex items-center gap-1.5 md:gap-2 text-sm md:text-base">
                  <ShieldCheck className="text-blue-400 w-4 h-4 md:w-5 md:h-5"/> Macro Statements
               </h3>
             </div>
             <div className="overflow-x-auto max-h-[250px] md:max-h-[350px] overflow-y-auto pr-1 md:pr-2 scrollbar-hide">
               <table className="w-full text-[10px] md:text-xs text-left text-gray-400 relative">
                 <thead className="text-gray-500 border-b border-white/10 uppercase sticky top-0 bg-[#0a0a0a] z-10 font-bold">
                   <tr>
                     <th className="py-1.5 md:py-2">Period</th>
                     <th className="py-1.5 md:py-2 text-right">Income</th>
                     <th className="py-1.5 md:py-2 text-right">Expense</th>
                     <th className="py-1.5 md:py-2 text-right">Net Flow</th>
                     <th className="py-1.5 md:py-2 text-right">NSR</th>
                   </tr>
                 </thead>
                 <tbody>
                   {monthlyStatement.map((m) => (
                     <tr key={m.month} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                       <td className="py-2.5 md:py-3 font-mono text-white font-bold">{m.month}</td>
                       <td className="py-2.5 md:py-3 text-right text-green-400 font-bold"><Naira/>{formatNumber(m.income)}</td>
                       <td className="py-2.5 md:py-3 text-right text-red-400 font-bold"><Naira/>{formatNumber(m.expense)}</td>
                       <td className={`py-2.5 md:py-3 text-right font-mono font-bold ${m.net >= 0 ? 'text-blue-400' : 'text-red-500'}`}>
                          {m.net >= 0 ? '+' : '-'}<Naira/>{formatNumber(Math.abs(m.net))}
                       </td>
                       <td className="py-2.5 md:py-3 text-right font-bold text-white">{m.savingsRate.toFixed(1)}%</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
               {monthlyStatement.length === 0 && <div className="text-center py-6 md:py-8 italic text-gray-600 text-[10px] md:text-xs font-bold">No statement data found.</div>}
             </div>
          </GlassCard>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* TAB 2: SOVEREIGNTY */}
      {/* --------------------------------------------------------- */}
      {activeTab === 'SOVEREIGNTY' && (
        <div className="space-y-4 md:space-y-6 animate-fade-in">
          <GlassCard className="p-4 md:p-6 h-[350px] md:h-[500px]">
            <div className="flex flex-col mb-4 md:mb-6">
              <h3 className="font-bold text-white flex items-center gap-1.5 md:gap-2 text-sm md:text-xl">
                 <LineChart className="text-emerald-400 w-4 h-4 md:w-6 md:h-6"/> Historical Sovereignty Protocol
              </h3>
              <p className="text-[9px] md:text-xs text-gray-400 mt-1 font-bold">
                 Tracking the correlation between Total System Value (Net Worth) and Survival Duration (Runway). 
              </p>
            </div>

            <ResponsiveContainer width="100%" height="80%">
              {filteredSnapshots.length > 0 ? (
                <ComposedChart data={filteredSnapshots} margin={{ left: -15, right: -15, bottom: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="month" stroke="#777" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#10b981" fontSize={9} tickFormatter={(val) => `₦${formatAxisAmount(val)}`} tickLine={false} axisLine={false} width={40} />
                  <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={9} tickFormatter={(val) => `${val}mo`} tickLine={false} axisLine={false} width={30} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} iconSize={10} />

                  <Area yAxisId="left" type="monotone" dataKey="netWorth" fill="#10b981" fillOpacity={0.1} stroke="#10b981" strokeWidth={2} name="Total Net Worth" />
                  <Line yAxisId="right" type="monotone" dataKey="runway" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} name="Liquid Runway" />
                </ComposedChart>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-xl">
                    <LineChart className="mb-2 opacity-50 w-6 h-6 md:w-8 md:h-8"/>
                    <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest">Database Syncing. Awaiting first nightly snapshot.</span>
                </div>
              )}
            </ResponsiveContainer>
          </GlassCard>

          {renderComparator([{label: 'Net Worth', val: 'NET_WORTH'}, {label: 'Liquid Runway', val: 'RUNWAY'}])}
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* TAB 3: ALLOCATION */}
      {/* --------------------------------------------------------- */}
      {activeTab === 'ALLOCATION' && (
        <div className="space-y-4 md:space-y-6 animate-fade-in">
          <GlassCard className="p-4 md:p-6 h-[350px] md:h-[500px]">
            <div className="flex flex-col mb-4 md:mb-6">
              <h3 className="font-bold text-white flex items-center gap-1.5 md:gap-2 text-sm md:text-xl">
                 <Landmark className="text-purple-400 w-4 h-4 md:w-6 md:h-6"/> Capital Deployment History
              </h3>
              <p className="text-[9px] md:text-xs text-gray-400 mt-1 font-bold">
                 Visualizing how unallocated liquidity transitions into funded War Room goals and Generosity.
              </p>
            </div>
            <ResponsiveContainer width="100%" height="80%">
              {filteredSnapshots.length > 0 ? (
                <AreaChart data={filteredSnapshots} margin={{ left: -15, bottom: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="month" stroke="#777" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#777" fontSize={9} tickFormatter={(val) => `₦${formatAxisAmount(val)}`} tickLine={false} axisLine={false} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} iconSize={10} />

                  <Area type="monotone" dataKey="idle" stackId="1" stroke="#eab308" fill="#eab308" fillOpacity={0.3} name="Idle / Holding" />
                  <Area type="monotone" dataKey="goals" stackId="1" stroke="#a855f7" fill="#a855f7" fillOpacity={0.5} name="War Room Goals" />
                  <Area type="monotone" dataKey="generosity" stackId="1" stroke="#ec4899" fill="#ec4899" fillOpacity={0.7} name="Generosity" />
                </AreaChart>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-xl">
                    <Landmark className="mb-2 opacity-50 w-6 h-6 md:w-8 md:h-8"/>
                    <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest">Database Syncing. Awaiting first nightly snapshot.</span>
                </div>
              )}
            </ResponsiveContainer>
          </GlassCard>

          {renderComparator([{label: 'War Room Goals', val: 'GOALS'}, {label: 'Idle Holding', val: 'IDLE'}])}
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* TAB 4: INTELLIGENCE */}
      {/* --------------------------------------------------------- */}
      {activeTab === 'INTELLIGENCE' && (
        <div className="space-y-4 md:space-y-6 animate-fade-in">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <GlassCard className="p-4 md:p-6 h-[250px] md:h-[350px]">
              <div className="flex items-center gap-1.5 md:gap-2 mb-2">
                <PieIcon className="text-blue-400 w-4 h-4 md:w-5 md:h-5"/>
                <h3 className="font-bold text-white text-sm md:text-base">Conversion Funnel</h3>
              </div>
              <ResponsiveContainer width="100%" height="90%">
                {signalFunnel.length > 0 ? (
                  <PieChart>
                    <Pie data={signalFunnel} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                      {signalFunnel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={30} wrapperStyle={{ fontSize: '10px' }} iconSize={10}/>
                  </PieChart>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600">
                      <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">No Signal Data</span>
                  </div>
                )}
              </ResponsiveContainer>
            </GlassCard>

            <GlassCard className="p-4 md:p-6 h-[250px] md:h-[350px] lg:col-span-2">
              <div className="flex flex-col mb-3 md:mb-4">
                <h3 className="font-bold text-white flex items-center gap-1.5 md:gap-2 text-sm md:text-base">
                   <TrendingUp className="text-green-400 w-4 h-4 md:w-5 md:h-5"/> Cumulative Yield Trajectory
                </h3>
                <p className="text-[9px] md:text-xs text-gray-400 mt-1 font-bold">Total revenue generated from harvested signals over time.</p>
              </div>
              <ResponsiveContainer width="100%" height="80%">
                {filteredSnapshots.length > 0 ? (
                  <AreaChart data={filteredSnapshots} margin={{ left: -15, bottom: -10 }}>
                    <defs>
                      <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="month" stroke="#777" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#10b981" fontSize={9} tickFormatter={(val) => `₦${formatAxisAmount(val)}`} tickLine={false} axisLine={false} width={40} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="signalYield" stroke="#10b981" fill="url(#colorYield)" strokeWidth={2} name="Total Harvested Revenue" />
                  </AreaChart>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-xl">
                      <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest">Awaiting first nightly snapshot.</span>
                  </div>
                )}
              </ResponsiveContainer>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <GlassCard className="p-4 md:p-6 h-[300px] md:h-[450px] flex flex-col">
              <div className="flex items-center justify-between mb-3 md:mb-4 shrink-0">
                <h3 className="font-bold text-white flex items-center gap-1.5 md:gap-2 text-sm md:text-base">
                  <Zap className="text-yellow-400 w-4 h-4 md:w-5 md:h-5"/> Alpha Leaderboard
                </h3>
              </div>
              <div className="overflow-x-auto overflow-y-auto flex-1 pr-1 md:pr-2 relative scrollbar-hide">
                <table className="w-full text-[10px] md:text-xs text-left text-gray-400">
                  <thead className="text-gray-500 border-b border-white/10 uppercase sticky top-0 bg-[#0a0a0a] z-10 font-bold">
                    <tr>
                      <th className="py-1.5 md:py-2">Signal</th>
                      <th className="py-1.5 md:py-2 text-right">Profit</th>
                      <th className="py-1.5 md:py-2 text-right">Hours</th>
                      <th className="py-1.5 md:py-2 text-right text-yellow-500">Yield/Hr</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signalLeaderboard.map((s) => (
                      <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-2.5 md:py-3">
                          <div className="font-bold text-white truncate max-w-[100px] md:max-w-full">{s.name}</div>
                          <div className="text-[8px] md:text-[10px] text-gray-500 uppercase font-bold truncate max-w-[100px] md:max-w-full">{s.sector}</div>
                        </td>
                        <td className="py-2.5 md:py-3 text-right text-green-400 font-bold"><Naira/>{formatNumber(s.profit)}</td>
                        <td className="py-2.5 md:py-3 text-right font-bold text-white">{s.effort}h</td>
                        <td className="py-2.5 md:py-3 text-right font-mono font-bold text-yellow-400">
                          <Naira/>{formatNumber(s.roi)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {signalLeaderboard.length === 0 && <div className="text-center py-8 italic text-gray-600 text-[10px] md:text-xs font-bold">No winning signals harvested yet.</div>}
              </div>
            </GlassCard>

            {renderComparator([{label: 'Alpha Yield', val: 'YIELD'}])}
          </div>
        </div>
      )}

    </div>
  );
};
