import { useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { useLedger } from '../context/LedgerContext';
import { useUser } from '../context/UserContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { Naira } from '../components/ui/Naira';
import { formatNumber } from '../utils/format';
import { Download, TrendingUp, Activity, PieChart as PieIcon, Target, Calendar } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, ScatterChart, Scatter, ZAxis, Legend
} from 'recharts';

export const Analytics = () => {
  const { user } = useUser();
  const { history, budgets } = useLedger();
  const { burnHistory, categorySplit, signalPerformance, comparisonData } = useAnalytics();
  
  // --- RESTORED: DATA SOVEREIGNTY ---
  const handleExport = () => {
    const data = JSON.stringify({ user, history, budgets }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riot_sovereign_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-white/10 p-3 rounded-lg shadow-xl text-xs">
          <p className="font-bold text-white mb-1">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} style={{ color: p.color }} className="flex items-center gap-1">
              {p.name}: {typeof p.value === 'number' && p.name !== 'Effort' ? <><Naira/>{formatNumber(p.value)}</> : p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-20 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white">Intelligence Hub</h1>
           <p className="text-gray-400 text-sm">Deep forensic analysis of your financial sovereignty.</p>
        </div>
        <GlassButton size="sm" onClick={handleExport}>
          <Download size={16} className="mr-2"/> Export Data (JSON)
        </GlassButton>
      </div>

      {/* ZONE 1: BURN VELOCITY (Area) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6 h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-red-500" size={20}/>
            <h3 className="font-bold text-white">Burn Velocity (Last 6 Mo)</h3>
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
              <Area type="step" dataKey="limit" stroke="#555" strokeDasharray="5 5" fill="transparent" name="Cap" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* ZONE 2: YEAR OVER YEAR (Restored Comparison) */}
        <GlassCard className="p-6 h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="text-blue-400" size={20}/>
            <h3 className="font-bold text-white">Year vs Year</h3>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={comparisonData}>
              <XAxis dataKey="name" stroke="#555" fontSize={10} />
              <YAxis stroke="#555" fontSize={10} tickFormatter={(val) => `${val/1000}k`} />
              <Tooltip content={<CustomTooltip />}/>
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
              <Bar dataKey={new Date().getFullYear() - 1} fill="#3b82f6" name="Last Year" radius={[4, 4, 0, 0]} />
              <Bar dataKey={new Date().getFullYear()} fill="#10b981" name="This Year" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* ZONE 3: CATEGORY HEATMAP & ALPHA MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Spent">
                {categorySplit.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#8b5cf6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

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
