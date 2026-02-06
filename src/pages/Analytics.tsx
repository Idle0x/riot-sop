import { useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { useLedger } from '../context/LedgerContext';
import { useUser } from '../context/UserContext';

import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { Naira } from '../components/ui/Naira';
import { formatNumber } from '../utils/format';

import { 
  Download, TrendingUp, PieChart as PieIcon, Target, Calendar, 
  Zap, AlertTriangle, ShieldCheck, Plus, BarChart2 
} from 'lucide-react';

import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';

export const Analytics = () => {
  const { user } = useUser();
  const { history, budgets } = useLedger();
  const { 
    burnHistory, categorySplit, signalPerformance,
    monthlyStatement, ribbon, signalLeaderboard,
    getComparatorData, availablePeriods
  } = useAnalytics();

  const [compMode, setCompMode] = useState<'ANNUAL' | 'QUARTERLY' | 'MONTHLY'>('MONTHLY');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [periodToAdd, setPeriodToAdd] = useState('');

  const comparisonData = getComparatorData(selectedPeriods, compMode);

  const addPeriod = () => {
      if (periodToAdd && !selectedPeriods.includes(periodToAdd)) {
          setSelectedPeriods([...selectedPeriods, periodToAdd]);
          setPeriodToAdd('');
      }
  };

  const handleExport = () => {
    const data = JSON.stringify({ user, history, budgets }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `riot_sovereign_intelligence_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/95 border border-white/10 p-4 rounded-xl shadow-2xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
          <p className="text-gray-500 mb-2 border-b border-white/5 pb-1">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} style={{ color: p.color || '#fff' }} className="flex items-center gap-2 mb-1">
              <span className="text-white opacity-40">{p.name === 'value' ? 'Amount' : p.name}:</span> 
              {typeof p.value === 'number' && !['Effort', 'ROI'].includes(p.name) ? (
                <><Naira/>{formatNumber(p.value)}</>
              ) : p.value}
              {p.name === 'Effort' ? 'h' : ''}
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
           <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">Intelligence Hub</h1>
           <p className="text-gray-700 font-black text-[10px] uppercase tracking-[0.3em]">Forensic Signal Analysis & Burn Audit</p>
        </div>
        <GlassButton size="sm" onClick={handleExport} className="border-white/5 hover:bg-white/10">
          <Download size={14} className="mr-2"/> Export Data (JSON)
        </GlassButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-5 border-blue-500/10">
           <div className="flex items-center gap-2 mb-3 text-blue-500">
             <ShieldCheck size={14}/> <span className="text-[10px] font-black uppercase tracking-widest">Savings Rate</span>
           </div>
           <div className="text-3xl font-mono font-bold text-white">{ribbon.savingsRate.toFixed(1)}%</div>
           <div className={`text-[10px] mt-2 font-black ${ribbon.savingsDelta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
             {ribbon.savingsDelta >= 0 ? '▲' : '▼'} {Math.abs(ribbon.savingsDelta).toFixed(1)}% <span className="text-gray-700 uppercase tracking-tighter">vs Prev</span>
           </div>
        </GlassCard>
        <GlassCard className="p-5 border-yellow-500/10">
           <div className="flex items-center gap-2 mb-3 text-yellow-500">
             <Zap size={14}/> <span className="text-[10px] font-black uppercase tracking-widest">Alpha Yield</span>
           </div>
           <div className="text-3xl font-mono font-bold text-white flex items-center gap-1">
             <Naira/>{formatNumber(ribbon.alphaYield)}<span className="text-[10px] text-gray-700 uppercase tracking-tighter">/hr</span>
           </div>
           <div className="text-[10px] text-gray-700 mt-2 font-black uppercase tracking-widest">Avg Signal ROI</div>
        </GlassCard>
        <GlassCard className="p-5 border-red-500/10">
           <div className="flex items-center gap-2 mb-3 text-red-500">
             <AlertTriangle size={14}/> <span className="text-[10px] font-black uppercase tracking-widest">Major Leak</span>
           </div>
           <div className="text-xl font-black text-white truncate uppercase tracking-tighter">{ribbon.largestLeak?.name || 'Secure'}</div>
           <div className="text-[10px] text-gray-700 mt-2 font-mono uppercase font-black">
             <Naira/>{formatNumber(ribbon.largestLeak?.amount || 0)}
           </div>
        </GlassCard>
        <GlassCard className="p-5 border-green-500/10">
           <div className="flex items-center gap-2 mb-3 text-green-500">
             <Target size={14}/> <span className="text-[10px] font-black uppercase tracking-widest">Win Rate</span>
           </div>
           <div className="text-3xl font-mono font-bold text-white">
             {signalLeaderboard.length > 0 ? ((signalLeaderboard.filter(s => s.profit > 0).length / signalLeaderboard.length) * 100).toFixed(0) : 0}%
           </div>
           <div className="text-[10px] text-gray-700 mt-2 font-black uppercase tracking-widest">Profitable Signals</div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="p-8 h-[450px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-red-500" size={20}/>
              <h3 className="font-black text-white uppercase text-xs tracking-[0.2em]">Burn Velocity (6 Mo)</h3>
            </div>
            <div className="flex items-center gap-4 text-[9px] font-black text-gray-600 uppercase tracking-widest">
               <div className="flex items-center gap-1"><div className="w-2 h-0.5 bg-red-500"/> Burn</div>
               <div className="flex items-center gap-1"><div className="w-2 h-0.5 border-t border-dashed border-gray-700"/> Budget Limit</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={burnHistory}>
              <defs>
                <linearGradient id="colorBurn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#222" fontSize={9} tickLine={false} axisLine={false} tick={{fill: '#555', fontWeight: 'bold'}}/>
              <YAxis stroke="#222" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `₦${val/1000}k`}/>
              <Tooltip content={<CustomTooltip />}/>
              <Area type="monotone" dataKey="burn" stroke="#ef4444" fillOpacity={1} fill="url(#colorBurn)" strokeWidth={3} name="Burn" />
              <Area type="step" dataKey="limit" stroke="#555" strokeDasharray="6 6" fill="transparent" name="Cap" strokeWidth={1} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-8 h-[450px] flex flex-col border-blue-500/5">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
               <Calendar className="text-blue-500" size={20}/>
               <h3 className="font-black text-white uppercase text-xs tracking-[0.2em]">Dynamic Comparator</h3>
            </div>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
               {['ANNUAL', 'QUARTERLY', 'MONTHLY'].map(m => (
                 <button key={m} onClick={() => { setCompMode(m as any); setSelectedPeriods([]); }} className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase transition-all ${compMode === m ? 'bg-white text-black' : 'text-gray-600 hover:text-white'}`}>
                   {m === 'ANNUAL' ? 'Years' : m === 'QUARTERLY' ? 'Quarters' : 'Months'}
                 </button>
               ))}
            </div>
          </div>
          <div className="flex gap-2 mb-6">
             <select className="bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl px-4 py-3 flex-1 outline-none focus:border-blue-500/50" value={periodToAdd} onChange={(e) => setPeriodToAdd(e.target.value)}>
                <option value="">+ Add Period</option>
                {(compMode === 'ANNUAL' ? availablePeriods.years : compMode === 'QUARTERLY' ? availablePeriods.quarters : availablePeriods.months).map(p => (
                    <option key={p} value={p}>{p}</option>
                ))}
             </select>
             <button onClick={addPeriod} disabled={!periodToAdd} className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-500 transition-all disabled:opacity-20"><Plus size={18}/></button>
          </div>
          <div className="flex-1 min-h-0">
            {selectedPeriods.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData}>
                    <XAxis dataKey="name" stroke="#222" fontSize={9} tick={{fill: '#555', fontWeight: 'bold'}} />
                    <YAxis stroke="#222" fontSize={9} tickFormatter={(val) => `₦${val/1000}k`} />
                    <Tooltip content={<CustomTooltip />}/>
                    <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                        {comparisonData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
                        ))}
                    </Bar>
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-800 border border-dashed border-white/5 rounded-3xl">
                    <BarChart2 size={40} className="mb-3 opacity-20"/>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">No Selection</span>
                </div>
            )}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <GlassCard className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="text-blue-500" size={20}/>
              <h3 className="font-black text-white uppercase text-xs tracking-[0.2em]">P&L Forensic Journal</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] font-black text-left text-gray-700 uppercase tracking-widest">
                <thead className="text-gray-800 border-b border-white/5">
                  <tr>
                    <th className="pb-4">Period</th>
                    <th className="pb-4 text-right text-green-500">Inflow</th>
                    <th className="pb-4 text-right text-red-500">Outflow</th>
                    <th className="pb-4 text-right">NSR %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {monthlyStatement.slice(0, 8).map((m) => (
                    <tr key={m.month} className="hover:bg-white/5 transition-colors group">
                      <td className="py-4 font-mono text-white group-hover:text-blue-500">{m.month}</td>
                      <td className="py-4 text-right text-green-500 font-mono"><Naira/>{formatNumber(m.income)}</td>
                      <td className="py-4 text-right text-red-500 font-mono"><Naira/>{formatNumber(m.expense)}</td>
                      <td className={`py-4 text-right font-mono ${m.savingsRate >= 20 ? 'text-blue-500' : 'text-orange-500'}`}>
                         {m.savingsRate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
         </GlassCard>

         <GlassCard className="p-8 border-yellow-500/5">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="text-yellow-500" size={20}/>
              <h3 className="font-black text-white uppercase text-xs tracking-[0.2em]">Alpha Signal Efficiency</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] font-black text-left text-gray-700 uppercase tracking-widest">
                <thead className="text-gray-800 border-b border-white/5">
                  <tr>
                    <th className="pb-4">Signal</th>
                    <th className="pb-4 text-right">Value</th>
                    <th className="pb-4 text-right">Effort</th>
                    <th className="pb-4 text-right text-yellow-500">ROI/Hr</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {signalLeaderboard.slice(0, 8).map((s) => (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                      <td className="py-4">
                         <div className="text-white group-hover:text-yellow-500 transition-colors">{s.name}</div>
                         <div className="text-[8px] text-gray-800 font-black">{s.sector}</div>
                      </td>
                      <td className="py-4 text-right text-green-500 font-mono"><Naira/>{formatNumber(s.profit)}</td>
                      <td className="py-4 text-right font-mono text-gray-600">{s.effort}h</td>
                      <td className="py-4 text-right font-mono font-bold text-yellow-500 text-sm">
                         <Naira/>{formatNumber(s.roi)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
         </GlassCard>
      </div>

      <GlassCard className="p-10 border-white/5">
         <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-10">
            <div>
               <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                 <Target className="text-green-500"/> The Alpha Matrix
               </h3>
               <p className="text-[10px] text-gray-700 font-black uppercase tracking-widest">ROI Distribution: Effort (X) vs Profit (Y)</p>
            </div>
         </div>
         <div className="h-[500px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                <XAxis type="number" dataKey="effort" name="Effort" unit="h" stroke="#111" fontSize={10} />
                <YAxis type="number" dataKey="profit" name="Profit" stroke="#111" fontSize={10} tickFormatter={(val) => `₦${val/1000}k`} />
                <ZAxis type="number" dataKey="roi" range={[100, 1000]} name="ROI" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Scatter name="Signals" data={signalPerformance} fill="#10b981">
                   {signalPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.roi > ribbon.alphaYield ? '#10b981' : '#222'} fillOpacity={0.6} />
                   ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
         </div>
      </GlassCard>

      <GlassCard className="p-10 h-[500px]">
        <div className="flex items-center gap-3 mb-10">
          <PieIcon className="text-purple-500" size={20}/>
          <h3 className="font-black text-white uppercase text-xs tracking-[0.2em]">Spend Heatmap</h3>
        </div>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={categorySplit} layout="vertical" margin={{ left: 20, right: 40 }}>
            <XAxis type="number" stroke="#111" fontSize={9} tickFormatter={(val) => `₦${val/1000}k`}/>
            <YAxis dataKey="name" type="category" stroke="#fff" fontSize={10} width={100} fontStyle="bold" />
            <Tooltip content={<CustomTooltip />}/>
            <Bar dataKey="value" fill="#8b5cf6" radius={[0, 10, 10, 0]} barSize={24}>
              {categorySplit.map((_, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#8b5cf6'} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  );
};
