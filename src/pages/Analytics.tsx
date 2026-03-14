import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '../hooks/useAnalytics';
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
  BarChart, Bar, Cell 
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
      return new Date(parseInt(y), parseInt(m) - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
  }
  return p;
};

export const Analytics = () => {
  const { user } = useUser();
  const location = useLocation();
  const bleedSectionRef = useRef<HTMLDivElement>(null);
  const isInit = useRef(false);

  const { 
    burnHistory, categorySplit,
    monthlyStatement, ribbon, signalLeaderboard,
    bleedForensics, topMerchants,
    getComparatorData, availablePeriods
  } = useAnalytics();

  const [compMode, setCompMode] = useState<'ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'MIXED'>('ANNUAL');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [periodToAdd, setPeriodToAdd] = useState('');

  // 1. SET DEFAULTS ON LOAD
  useEffect(() => {
    if (!isInit.current && availablePeriods.years.length > 0) {
        const curY = new Date().getFullYear().toString();
        const prevY = (new Date().getFullYear() - 1).toString();
        const defaults = [prevY, curY].filter(y => availablePeriods.years.includes(y));
        setSelectedPeriods(defaults.length ? defaults : [availablePeriods.years[0]]);
        isInit.current = true;
    }
  }, [availablePeriods]);

  const comparisonData = getComparatorData(selectedPeriods, compMode);

  // 2. DATA-DRIVEN SWITCHING
  const handleModeSwitch = (mode: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'MIXED') => {
      setCompMode(mode);
      setSelectedPeriods([]); // Clear to prevent key mismatch
      
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
          {payload.map((p: any, idx: number) => (
            <p key={idx} style={{ color: p.color || '#fff' }} className="flex items-center gap-1">
              {p.name === 'value' ? 'Amount' : p.name}: 
              {typeof p.value === 'number' ? <span className="font-mono"><Naira/>{formatNumber(p.value)}</span> : p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-20 animate-fade-in">
      
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white">Intelligence Hub</h1>
           <p className="text-gray-400 text-sm">Deep forensic analysis of your Data Lake.</p>
        </div>
        <GlassButton size="sm" onClick={handleExport}><Download size={16} className="mr-2"/> Export JSON</GlassButton>
      </div>

      {/* EXECUTIVE RIBBON */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4"><div className="text-blue-400 text-xs font-bold uppercase mb-2">Net Savings Rate</div><div className="text-2xl font-mono font-bold text-white">{ribbon.savingsRate.toFixed(1)}%</div></GlassCard>
        <GlassCard className="p-4"><div className="text-yellow-400 text-xs font-bold uppercase mb-2">Alpha Yield</div><div className="text-2xl font-mono font-bold text-white"><Naira/>{formatNumber(ribbon.alphaYield)}/h</div></GlassCard>
        <GlassCard className="p-4 border-red-500/20 bg-red-950/10"><div className="text-red-400 text-xs font-bold uppercase mb-2">Largest Leak</div><div className="text-lg font-bold text-white truncate">{ribbon.largestLeak?.name || 'None'}</div></GlassCard>
        <GlassCard className="p-4"><div className="text-green-400 text-xs font-bold uppercase mb-2">Goal Success</div><div className="text-2xl font-mono font-bold text-white">{signalLeaderboard.length} Wins</div></GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BURN CHART */}
        <GlassCard className="p-6 h-[450px]">
          <h3 className="font-bold text-white mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-red-500"/> Aggregated Burn Velocity</h3>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={burnHistory}>
              <XAxis dataKey="date" stroke="#555" fontSize={10} minTickGap={30}/>
              <YAxis stroke="#555" fontSize={10} tickFormatter={(val) => `₦${formatAxisAmount(val)}`}/>
              <Tooltip content={<CustomTooltip />}/>
              <Area type="monotone" dataKey="burn" stroke="#ef4444" fill="#ef444433" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* COMPARATOR */}
        <GlassCard className="p-6 h-[450px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white flex items-center gap-2"><Calendar size={20} className="text-blue-400"/> Comparator</h3>
            <div className="flex gap-1">
               {['ANNUAL', 'QUARTERLY', 'MONTHLY', 'MIXED'].map(m => (
                 <button key={m} onClick={() => handleModeSwitch(m as any)} className={`text-[9px] px-2 py-1 rounded border ${compMode === m ? 'bg-blue-500 border-blue-500' : 'text-gray-500 border-white/10'}`}>
                    {m.slice(0,4)}
                 </button>
               ))}
            </div>
          </div>
          
          <div className="flex gap-2 mb-4">
             <select className="bg-black/40 border border-white/10 text-white text-xs rounded px-2 py-2 flex-1 outline-none" value={periodToAdd} onChange={(e) => setPeriodToAdd(e.target.value)}>
                <option value="">Add Period...</option>
                {periodOptions.map(p => <option key={p} value={p}>{formatPeriodLabel(p)}</option>)}
             </select>
             <button onClick={addPeriod} className="bg-white/10 p-2 rounded"><Plus size={16}/></button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
             {selectedPeriods.map(p => (
               <div key={p} className="flex items-center gap-1 bg-blue-500/20 border border-blue-500/50 text-blue-300 text-[10px] px-2 py-1 rounded-full">
                  {formatPeriodLabel(p)} <X size={10} className="ml-1 cursor-pointer" onClick={() => removePeriod(p)}/>
               </div>
             ))}
          </div>

          <div className="flex-1">
            {comparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <XAxis dataKey="name" stroke="#555" fontSize={10} />
                  <YAxis stroke="#555" fontSize={10} tickFormatter={(val) => `₦${formatAxisAmount(val)}`} />
                  <Tooltip content={<CustomTooltip />}/>
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-gray-600 text-xs italic">Select periods to begin comparison...</div>}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* STATEMENTS TABLE */}
        <GlassCard className="p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><ShieldCheck size={20} className="text-blue-400"/> Monthly Statements</h3>
            <div className="overflow-y-auto max-h-[350px] pr-2">
              <table className="w-full text-xs text-left">
                <thead className="text-gray-500 border-b border-white/10 uppercase sticky top-0 bg-[#0a0a0a] z-10">
                  <tr><th className="py-2">Period</th><th className="text-right">Income</th><th className="text-right">Expense</th><th className="text-right">Net</th></tr>
                </thead>
                <tbody>
                  {monthlyStatement.map(m => (
                    <tr key={m.month} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 font-mono text-white">{m.month}</td>
                      <td className="text-right text-green-400"><Naira/>{formatNumber(m.income)}</td>
                      <td className="text-right text-red-400"><Naira/>{formatNumber(m.expense)}</td>
                      <td className={`text-right font-bold ${m.net >= 0 ? 'text-blue-400' : 'text-red-500'}`}><Naira/>{formatNumber(Math.abs(m.net))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </GlassCard>

        {/* CATEGORY BAR CHART */}
        <GlassCard className="p-6 h-[415px]">
          <h3 className="font-bold text-white mb-6 flex items-center gap-2"><PieIcon size={20} className="text-purple-400"/> Category Distribution</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={categorySplit} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" stroke="#555" fontSize={10} tickFormatter={formatAxisAmount}/>
              <YAxis dataKey="name" type="category" stroke="#fff" fontSize={10} width={100}/>
              <Tooltip content={<CustomTooltip />}/>
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20}>
                {categorySplit.map((_, i) => <Cell key={i} fill={i === 0 ? '#ef4444' : '#8b5cf6'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* TOP MERCHANTS */}
      <GlassCard className="p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Briefcase size={20} className="text-cyan-400"/> Top Merchants (All-Time)</h3>
          <div className="overflow-y-auto max-h-[400px] pr-2">
            <table className="w-full text-xs text-left">
              <thead className="text-gray-500 border-b border-white/10 uppercase sticky top-0 bg-[#0a0a0a] z-10">
                <tr><th className="py-2">Merchant</th><th className="text-center">Freq</th><th className="text-right">Volume</th></tr>
              </thead>
              <tbody>
                {topMerchants.map((m, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-3 font-bold text-white">{m.merchant}<div className="text-[9px] text-cyan-500/80 uppercase font-normal">{m.category}</div></td>
                    <td className="text-center font-mono">{m.count}x</td>
                    <td className="text-right font-mono font-bold text-cyan-400"><Naira/>{formatNumber(m.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </GlassCard>

      {/* BLEED FORENSICS */}
      <div ref={bleedSectionRef} className="pt-4">
        <GlassCard className="p-6 border-red-500/30 bg-red-950/10">
          <h3 className="font-bold text-red-500 flex items-center gap-2 text-xl mb-6"><Search size={20}/> Bleed Forensics (This Month)</h3>
          <div className="overflow-y-auto max-h-[400px] pr-2">
            <table className="w-full text-sm text-left">
               <thead className="text-xs text-gray-500 border-b border-red-500/20 uppercase sticky top-0 bg-[#290808] z-10">
                  <tr><th className="py-3">Culprit</th><th className="text-center">Freq</th><th className="text-right">Total Damage</th><th className="text-right">Last Date</th></tr>
               </thead>
               <tbody>
                  {bleedForensics.map((b, i) => (
                    <tr key={i} className="border-b border-red-500/10 hover:bg-red-500/5">
                      <td className="py-4 font-bold text-gray-200">{b.desc}<div className="text-[10px] text-red-400 uppercase font-normal">{b.category}</div></td>
                      <td className="text-center font-mono">{b.count}x</td>
                      <td className="text-right font-bold text-red-400"><Naira/>{formatNumber(b.total)}</td>
                      <td className="text-right text-xs text-gray-500">{new Date(b.latestDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
            {bleedForensics.length === 0 && <div className="py-12 text-center text-green-500 font-mono">NO LEAKS DETECTED.</div>}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
