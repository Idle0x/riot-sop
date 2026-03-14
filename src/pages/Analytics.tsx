import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '../hooks/useAnalytics';
import { useLedger } from '../context/LedgerContext';
import { useUser } from '../context/UserContext';

// UI COMPONENTS
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { Naira } from '../components/ui/Naira';
import { formatNumber } from '../utils/format';

// ICONS
import { 
  Download, TrendingUp, PieChart as PieIcon, Target, Calendar, 
  Zap, AlertTriangle, ShieldCheck, Plus, X, BarChart2, Layers, Search, Briefcase
} from 'lucide-react';

// CHARTS
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, ScatterChart, Scatter, ZAxis 
} from 'recharts';

export const Analytics = () => {
  const { user } = useUser();
  const { history, budgets, telemetry } = useLedger(); 
  const location = useLocation();
  const bleedSectionRef = useRef<HTMLDivElement>(null);

  // --- ANALYTICS ENGINE ---
  const { 
    burnHistory, categorySplit, signalPerformance,
    monthlyStatement, ribbon, signalLeaderboard,
    bleedForensics, topMerchants, // <--- NEW DATA
    getComparatorData, availablePeriods
  } = useAnalytics();

  // --- DEEP LINK SCROLLING ---
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('view') === 'leaks' && bleedSectionRef.current) {
        setTimeout(() => {
            bleedSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500); 
    }
  }, [location]);

  // --- STATE: COMPARATOR ---
  const [compMode, setCompMode] = useState<'ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'MIXED'>('ANNUAL');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [periodToAdd, setPeriodToAdd] = useState('');

  useEffect(() => {
    if (selectedPeriods.length === 0) {
        const currentYear = new Date().getFullYear().toString();
        const lastYear = (new Date().getFullYear() - 1).toString();
        const defaults = [lastYear, currentYear].filter(y => availablePeriods.years.includes(y));
        if (defaults.length > 0) {
            setSelectedPeriods(defaults);
        }
    }
  }, [availablePeriods, selectedPeriods.length]);

  const comparisonData = getComparatorData(selectedPeriods, compMode);

  const getPeriodOptions = () => {
    switch (compMode) {
        case 'ANNUAL': return availablePeriods.years;
        case 'QUARTERLY': return availablePeriods.quarters;
        case 'MONTHLY': return availablePeriods.months;
        case 'MIXED': return [...availablePeriods.years, ...availablePeriods.quarters, ...availablePeriods.months];
        default: return [];
    }
  };

  const periodOptions = getPeriodOptions();

  const addPeriod = () => {
      if (periodToAdd && !selectedPeriods.includes(periodToAdd)) {
          setSelectedPeriods([...selectedPeriods, periodToAdd]);
          setPeriodToAdd('');
      }
  };
  const removePeriod = (p: string) => setSelectedPeriods(selectedPeriods.filter(x => x !== p));
  const clearAll = () => setSelectedPeriods([]);

  const handleExport = () => {
    const data = JSON.stringify({ user, history, telemetry, budgets }, null, 2);
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
           <p className="text-gray-400 text-sm">Deep forensic analysis of aggregated system & bank data.</p>
        </div>
        <GlassButton size="sm" onClick={handleExport}>
          <Download size={16} className="mr-2"/> Export Full Data Lake (JSON)
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

        <GlassCard className="p-4 relative overflow-hidden border-red-500/20 bg-red-950/10">
           <div className="flex items-center gap-2 mb-2 text-red-400">
             <AlertTriangle size={16}/> <span className="text-xs font-bold uppercase">Largest System Leak</span>
           </div>
           <div className="text-lg font-bold text-white truncate">{ribbon.largestLeak?.name || 'None'}</div>
           <div className="text-[10px] text-red-400 mt-1 font-mono font-bold">
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
        {/* Left: Burn Velocity (UNLOCKED ALL-TIME) */}
        <GlassCard className="p-6 h-[450px]">
          <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-red-500" size={20}/>
                <h3 className="font-bold text-white">Aggregated Burn Velocity (All-Time)</h3>
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
              <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`}/>
              <Tooltip content={<CustomTooltip />}/>
              <Area type="monotone" dataKey="burn" stroke="#ef4444" fillOpacity={1} fill="url(#colorBurn)" strokeWidth={2} name="Burn" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Right: Dynamic Comparator */}
        <GlassCard className="p-6 h-[450px] flex flex-col">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
               <Calendar className="text-blue-400" size={20}/>
               <h3 className="font-bold text-white">Comparator</h3>
            </div>
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
               <button 
                 onClick={() => { setCompMode('MIXED'); setSelectedPeriods([]); }} 
                 className={`text-[10px] px-2 py-1 rounded border transition-colors flex items-center gap-1 ${compMode === 'MIXED' ? 'bg-purple-500 text-white border-purple-500' : 'text-gray-500 border-white/10 hover:border-white/30'}`}
               >
                   <Layers size={10}/> Universal
               </button>
            </div>
          </div>
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
          <div className="flex flex-wrap gap-2 mb-4 min-h-[24px]">
             {selectedPeriods.length === 0 && <span className="text-xs text-gray-600 italic">Select periods to compare...</span>}
             {selectedPeriods.map(p => (
                 <div key={p} className="flex items-center gap-1 bg-blue-500/20 border border-blue-500/50 text-blue-300 text-[10px] px-2 py-0.5 rounded-full">
                    {p} <button onClick={() => removePeriod(p)} className="hover:text-white"><X size={10}/></button>
                 </div>
             ))}
             {selectedPeriods.length > 0 && <button onClick={clearAll} className="text-[10px] text-gray-500 underline ml-auto hover:text-white">Clear</button>}
          </div>
          <div className="flex-1 min-h-0">
            {comparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData}>
                        <XAxis dataKey="name" stroke="#555" fontSize={10} />
                        <YAxis stroke="#555" fontSize={10} tickFormatter={(val) => `${val/1000}k`} />
                        <Tooltip content={<CustomTooltip />}/>
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
         
         {/* UNLOCKED: ALL-TIME MONTHLY STATEMENT */}
         <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="text-blue-400" size={20}/>
              <h3 className="font-bold text-white">Aggregated Monthly Statement</h3>
            </div>
            {/* Added max-height and overflow to allow infinite scrolling of history */}
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-2">
              <table className="w-full text-xs text-left text-gray-400 relative">
                <thead className="text-gray-500 border-b border-white/10 uppercase sticky top-0 bg-[#0a0a0a] z-10">
                  <tr>
                    <th className="py-2">Period</th>
                    <th className="py-2 text-right text-green-500">Income</th>
                    <th className="py-2 text-right text-red-500">Expense</th>
                    <th className="py-2 text-right">Net Flow</th>
                    <th className="py-2 text-right">NSR</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Removed .slice(0, 6) -> Shows everything back to 2019 */}
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
              {monthlyStatement.length === 0 && <div className="text-center py-4 italic">No statement data found.</div>}
            </div>
         </GlassCard>

         <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="text-yellow-400" size={20}/>
              <h3 className="font-bold text-white">Alpha Leaderboard</h3>
            </div>
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-2">
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
              {signalLeaderboard.length === 0 && <div className="text-center py-4 italic">No winning signals harvested yet.</div>}
            </div>
         </GlassCard>
      </div>

      {/* --- TIER 4: MACRO SPEND ANALYTICS (NEW) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* The Clean Category Pie */}
        <GlassCard className="p-6 h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <PieIcon className="text-purple-400" size={20}/>
            <h3 className="font-bold text-white">Macro Category Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={categorySplit} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" stroke="#555" fontSize={10} tickFormatter={(val) => `${val/1000}k`}/>
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

        {/* TOP MERCHANTS LEADERBOARD (NEW) */}
        <GlassCard className="p-6 h-[400px] flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="text-cyan-400" size={20}/>
              <h3 className="font-bold text-white">Top 15 Merchants (All-Time)</h3>
            </div>
            <div className="overflow-x-auto flex-1 pr-2">
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
                         <div className="text-[9px] text-cyan-500/80 uppercase">{m.category}</div>
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

      {/* --- TIER 5: THE DRILL-DOWN (BLEED FORENSICS) --- */}
      <div ref={bleedSectionRef} id="bleed-forensics" className="pt-8">
        <GlassCard className="p-6 border-red-500/30 bg-red-950/10">
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6 border-b border-red-500/20 pb-4">
             <div>
                <h3 className="font-bold text-red-500 flex items-center gap-2 text-xl">
                  <Search size={20}/> Systemic Friction & Bleed Forensics
                </h3>
                <p className="text-xs text-red-400 mt-1">
                  Drill-down of current month Data Lake records flagged by the high-velocity circuit breaker.
                </p>
             </div>
             <div className="text-right">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total Damage (Mo)</div>
                <div className="text-2xl font-mono font-bold text-red-500 flex items-center justify-end gap-1">
                   <Naira/>{formatNumber(bleedForensics.reduce((sum, item) => sum + item.total, 0))}
                </div>
             </div>
          </div>

          {bleedForensics.length === 0 ? (
             <div className="text-center py-12 text-green-500/80 font-mono text-sm">
                NO HIGH-VELOCITY LEAKS DETECTED THIS CYCLE.
             </div>
          ) : (
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                   <thead className="text-xs text-gray-500 border-b border-red-500/20 uppercase tracking-wider">
                      <tr>
                         <th className="py-3 font-bold">Culprit / Merchant</th>
                         <th className="py-3 font-bold text-center">Frequency</th>
                         <th className="py-3 font-bold text-right">Avg Impact</th>
                         <th className="py-3 font-bold text-right text-red-500">Total Damage</th>
                         <th className="py-3 font-bold text-right">Last Occurrence</th>
                      </tr>
                   </thead>
                   <tbody>
                      {bleedForensics.map((bleed, idx) => (
                         <tr key={idx} className="border-b border-red-500/10 hover:bg-red-500/5 transition-colors group">
                            <td className="py-4">
                               <div className="font-bold text-gray-200 group-hover:text-white transition-colors">{bleed.desc}</div>
                               <div className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded w-fit mt-1 border border-red-500/20 uppercase">
                                  {bleed.category}
                               </div>
                            </td>
                            <td className="py-4 text-center font-mono">
                               <span className="bg-white/5 px-2 py-1 rounded text-gray-300 border border-white/5">{bleed.count}x</span>
                            </td>
                            <td className="py-4 text-right text-gray-400 font-mono">
                               ~<Naira/>{formatNumber(Math.round(bleed.total / bleed.count))}
                            </td>
                            <td className="py-4 text-right font-bold text-red-400 font-mono">
                               <Naira/>{formatNumber(bleed.total)}
                            </td>
                            <td className="py-4 text-right text-xs text-gray-500">
                               {new Date(bleed.latestDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          )}
        </GlassCard>
      </div>

    </div>
  );
};
