import { useState, useEffect } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { useLedger } from '../context/LedgerContext';
import { useUser } from '../context/UserContext';

// UI COMPONENTS
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { Naira } from '../components/ui/Naira';

// UTILS
import { formatNumber } from '../utils/format';

// ICONS
import { 
  Download, TrendingUp, PieChart as PieIcon, Target, Calendar, 
  Zap, AlertTriangle, ShieldCheck, Plus, X, BarChart2, Layers 
} from 'lucide-react';

// CHARTS
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, ScatterChart, Scatter, ZAxis 
} from 'recharts';

export const Analytics = () => {
  const { user } = useUser();
  const { history, budgets } = useLedger();
  
  // --- ANALYTICS ENGINE ---
  const { 
    burnHistory, categorySplit, signalPerformance,
    monthlyStatement, ribbon, signalLeaderboard,
    getComparatorData, availablePeriods
  } = useAnalytics();

  // --- STATE: COMPARATOR (Now supports 'MIXED') ---
  const [compMode, setCompMode] = useState<'ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'MIXED'>('ANNUAL');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [periodToAdd, setPeriodToAdd] = useState('');

  // 1. Auto-Initialize Comparator (Default to Last 2 Years)
  useEffect(() => {
    if (selectedPeriods.length === 0) {
        const currentYear = new Date().getFullYear().toString();
        const lastYear = (new Date().getFullYear() - 1).toString();
        // Only add if they exist in the data
        const defaults = [lastYear, currentYear].filter(y => availablePeriods.years.includes(y));
        if (defaults.length > 0) {
            setSelectedPeriods(defaults);
        }
    }
  }, [availablePeriods]);

  // 2. Generate Data based on selection
  // Note: getComparatorData needs to handle the logic of fetching data regardless of mode
  const comparisonData = getComparatorData(selectedPeriods, compMode);

  // 3. Dynamic Options Logic (The "Crazy" Mode)
  const getPeriodOptions = () => {
    switch (compMode) {
        case 'ANNUAL': return availablePeriods.years;
        case 'QUARTERLY': return availablePeriods.quarters;
        case 'MONTHLY': return availablePeriods.months;
        case 'MIXED': 
            // Combine all and sort/group them. 
            // Assuming strings are distinct like "2025", "Q1 2025", "Jan 2025"
            return [
                ...availablePeriods.years,
                ...availablePeriods.quarters,
                ...availablePeriods.months
            ];
        default: return [];
    }
  };

  const periodOptions = getPeriodOptions();

  // --- ACTIONS ---
  const addPeriod = () => {
      if (periodToAdd && !selectedPeriods.includes(periodToAdd)) {
          setSelectedPeriods([...selectedPeriods, periodToAdd]);
          setPeriodToAdd('');
      }
  };
  const removePeriod = (p: string) => setSelectedPeriods(selectedPeriods.filter(x => x !== p));
  const clearAll = () => setSelectedPeriods([]);

  const handleExport = () => {
    const data = JSON.stringify({ user, history, budgets }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `riot_sovereign_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // --- CUSTOM TOOLTIP ---
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-white/10 p-3 rounded-lg shadow-xl text-xs z-50">
          <p className="font-bold text-white mb-1">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} style={{ color: p.color }} className="flex items-center gap-1">
              {p.name === 'value' ? 'Amount' : p.name}: 
              {typeof p.value === 'number' && p.name !== 'Effort' && p.name !== 'ROI' 
                ? <><Naira/>{formatNumber(p.value)}</> 
                : p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-20 animate-fade-in">

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white">Intelligence Hub</h1>
           <p className="text-gray-400 text-sm">Deep forensic analysis of your financial sovereignty.</p>
        </div>
        <GlassButton size="sm" onClick={handleExport}>
          <Download size={16} className="mr-2"/> Export Data (JSON)
        </GlassButton>
      </div>

      {/* --- TIER 1: EXECUTIVE RIBBON --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4 relative overflow-hidden">
           <div className="flex items-center gap-2 mb-2 text-blue-400">
             <ShieldCheck size={16}/> <span className="text-xs font-bold uppercase">Net Savings Rate</span>
           </div>
           <div className="text-2xl font-mono font-bold text-white">{ribbon.savingsRate.toFixed(1)}%</div>
           <div className={`text-[10px] mt-1 ${ribbon.savingsDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
             {ribbon.savingsDelta >= 0 ? '▲' : '▼'} {Math.abs(ribbon.savingsDelta).toFixed(1)}% vs Last Month
           </div>
        </GlassCard>

        <GlassCard className="p-4 relative overflow-hidden">
           <div className="flex items-center gap-2 mb-2 text-yellow-400">
             <Zap size={16}/> <span className="text-xs font-bold uppercase">Global Alpha Yield</span>
           </div>
           <div className="text-2xl font-mono font-bold text-white flex items-center gap-1">
             <Naira/>{formatNumber(ribbon.alphaYield)}<span className="text-sm text-gray-500">/hr</span>
           </div>
           <div className="text-[10px] text-gray-500 mt-1">Total Signal ROI</div>
        </GlassCard>

        <GlassCard className="p-4 relative overflow-hidden">
           <div className="flex items-center gap-2 mb-2 text-red-400">
             <AlertTriangle size={16}/> <span className="text-xs font-bold uppercase">Largest Leak</span>
           </div>
           <div className="text-lg font-bold text-white truncate">{ribbon.largestLeak?.name || 'None'}</div>
           <div className="text-[10px] text-gray-500 mt-1 font-mono">
             <Naira/>{formatNumber(ribbon.largestLeak?.amount || 0)} (Total Spend)
           </div>
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

      {/* --- TIER 2: BURN & COMPARATOR --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Burn Velocity */}
        <GlassCard className="p-6 h-[450px]">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-red-500" size={20}/>
            <h3 className="font-bold text-white">Burn Velocity (6 Mo)</h3>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={burnHistory}>
              <defs>
                <linearGradient id="colorBurn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#555" fontSize={10} tickLine={false} axisLine={false}/>
              <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`}/>
              <Tooltip content={<CustomTooltip />}/>
              <Area type="monotone" dataKey="burn" stroke="#ef4444" fillOpacity={1} fill="url(#colorBurn)" strokeWidth={2} name="Burn" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Right: Dynamic Comparator (Updated) */}
        <GlassCard className="p-6 h-[450px] flex flex-col">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
               <Calendar className="text-blue-400" size={20}/>
               <h3 className="font-bold text-white">Comparator</h3>
            </div>

            {/* Mode Switcher */}
            <div className="flex gap-2">
               {['ANNUAL', 'QUARTERLY', 'MONTHLY'].map((m) => (
                   <button 
                     key={m} 
                     onClick={() => { setCompMode(m as any); setSelectedPeriods([]); }} 
                     className={`text-[10px] px-2 py-1 rounded border transition-colors ${compMode === m ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-500 border-white/10 hover:border-white/30'}`}
                   >
                       {m.charAt(0) + m.slice(1, 3).toLowerCase()}
                   </button>
               ))}
               {/* THE CRAZY MODE BUTTON */}
               <button 
                 onClick={() => { setCompMode('MIXED'); setSelectedPeriods([]); }} 
                 className={`text-[10px] px-2 py-1 rounded border transition-colors flex items-center gap-1 ${compMode === 'MIXED' ? 'bg-purple-500 text-white border-purple-500' : 'text-gray-500 border-white/10 hover:border-white/30'}`}
               >
                   <Layers size={10}/> Universal
               </button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2 mb-4">
             <select 
               className="bg-black/40 border border-white/10 text-white text-xs rounded px-2 py-1.5 flex-1 focus:border-white/30 outline-none"
               value={periodToAdd}
               onChange={(e) => setPeriodToAdd(e.target.value)}
             >
                <option value="">
                    {compMode === 'MIXED' ? 'Select anything (Year, Quarter, Month)...' : `Add ${compMode.toLowerCase().slice(0, -2)}...`}
                </option>
                {periodOptions.map(p => (
                    <option key={p} value={p}>{p}</option>
                ))}
             </select>
             <button onClick={addPeriod} disabled={!periodToAdd} className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded disabled:opacity-50"><Plus size={16}/></button>
          </div>

          {/* Active Tags */}
          <div className="flex flex-wrap gap-2 mb-4 min-h-[24px]">
             {selectedPeriods.length === 0 && <span className="text-xs text-gray-600 italic">Select periods to compare...</span>}
             {selectedPeriods.map(p => (
                 <div key={p} className="flex items-center gap-1 bg-blue-500/20 border border-blue-500/50 text-blue-300 text-[10px] px-2 py-0.5 rounded-full">
                    {p} <button onClick={() => removePeriod(p)} className="hover:text-white"><X size={10}/></button>
                 </div>
             ))}
             {selectedPeriods.length > 0 && <button onClick={clearAll} className="text-[10px] text-gray-500 underline ml-auto hover:text-white">Clear</button>}
          </div>

          {/* Chart */}
          <div className="flex-1 min-h-0">
            {comparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData}>
                        <XAxis dataKey="name" stroke="#555" fontSize={10} />
                        <YAxis stroke="#555" fontSize={10} tickFormatter={(val) => `${val/1000}k`} />
                        <Tooltip content={<CustomTooltip />}/>
                        {/* FIXED: barSize={40} ensures they stay sleek and don't balloon up */}
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}>
                            {comparisonData.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-600">
                    <BarChart2 size={32} className="mb-2 opacity-50"/>
                    <span className="text-xs">No Data Selected</span>
                </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* --- TIER 3: FORENSIC TABLES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Monthly Statement */}
         <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="text-blue-400" size={20}/>
              <h3 className="font-bold text-white">Monthly Statement</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-400">
                <thead className="text-gray-500 border-b border-white/10 uppercase">
                  <tr>
                    <th className="py-2">Period</th>
                    <th className="py-2 text-right text-green-500">Income</th>
                    <th className="py-2 text-right text-red-500">Expense</th>
                    <th className="py-2 text-right">Net</th>
                    <th className="py-2 text-right">NSR</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyStatement.slice(0, 6).map((m) => (
                    <tr key={m.month} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 font-mono text-white">{m.month}</td>
                      <td className="py-3 text-right text-green-400"><Naira/>{formatNumber(m.income)}</td>
                      <td className="py-3 text-right text-red-400"><Naira/>{formatNumber(m.expense)}</td>
                      <td className={`py-3 text-right font-bold ${m.net >= 0 ? 'text-blue-400' : 'text-red-500'}`}>
                         <Naira/>{formatNumber(m.net)}
                      </td>
                      <td className="py-3 text-right">{m.savingsRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
         </GlassCard>

         {/* Alpha Leaderboard */}
         <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="text-yellow-400" size={20}/>
              <h3 className="font-bold text-white">Alpha Leaderboard</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-400">
                <thead className="text-gray-500 border-b border-white/10 uppercase">
                  <tr>
                    <th className="py-2">Signal</th>
                    <th className="py-2 text-right">Profit</th>
                    <th className="py-2 text-right">Hours</th>
                    <th className="py-2 text-right text-yellow-500">Yield/Hr</th>
                  </tr>
                </thead>
                <tbody>
                  {signalLeaderboard.slice(0, 6).map((s) => (
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
            </div>
         </GlassCard>
      </div>

      {/* --- TIER 4: VISUAL MATRIX --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <GlassCard className="p-6 h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <PieIcon className="text-purple-400" size={20}/>
            <h3 className="font-bold text-white">Top Spend Categories</h3>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={categorySplit} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" stroke="#555" fontSize={10} tickFormatter={(val) => `${val/1000}k`}/>
              <YAxis dataKey="name" type="category" stroke="#fff" fontSize={10} width={70}/>
              <Tooltip content={<CustomTooltip />}/>
              {/* FIXED: Bar size constraint */}
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Spent" barSize={20}>
                {categorySplit.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#8b5cf6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Signal Scatter Plot */}
        <GlassCard className="p-6 h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <Target className="text-accent-success" size={20}/>
            <h3 className="font-bold text-white">Signal Alpha (Effort vs Reward)</h3>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <XAxis type="number" dataKey="effort" name="Effort" unit="h" stroke="#555" fontSize={10} />
              <YAxis type="number" dataKey="profit" name="Profit" stroke="#555" fontSize={10} tickFormatter={(val) => `${val/1000}k`} />
              <ZAxis type="number" dataKey="roi" range={[50, 400]} name="ROI" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
              <Scatter name="Signals" data={signalPerformance} fill="#10b981" />
            </ScatterChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

    </div>
  );
};
