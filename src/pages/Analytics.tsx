import { useState, useMemo } from 'react';
import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { Naira } from '../components/ui/Naira';
import { Download, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const Analytics = () => {
  const { history, user, budgets, nuclearReset } = useFinancials();
  const [viewRange, setViewRange] = useState<'1Y' | '5Y' | 'ALL'>('1Y');

  // --- 1. DATA SOVEREIGNTY (JSON Export) ---
  const handleExport = () => {
    const data = JSON.stringify({ user, history, budgets }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riot_sovereign_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // --- 2. HISTORICAL TREND ENGINE ---
  const chartData = useMemo(() => {
    // Aggregates transaction history by month to show Burn Rate over time
    const grouped = history
      .filter(h => h.type === 'SPEND' || h.type === 'SYSTEM_EVENT')
      .reduce((acc, log) => {
        const month = log.date.substring(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + (log.amount || 0);
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, amount]) => ({ date, burn: amount }));
  }, [history]);

  // --- 3. INFLATION SENTINEL ---
  const currentMonthlyBurn = budgets.reduce((sum, b) => sum + b.amount, 0);
  const inflationWarning = currentMonthlyBurn > (user.burnCap * 1.15); // 15% threshold

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 pb-20 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Deep Analytics</h1>
        <GlassButton size="sm" onClick={handleExport}>
          <Download size={16} className="mr-2"/> Export Sovereignty (JSON)
        </GlassButton>
      </div>

      {/* INFLATION ALERT */}
      {inflationWarning && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-red-500/20 rounded-full text-red-500"><TrendingUp size={24}/></div>
          <div>
            <h3 className="font-bold text-white">Lifestyle Inflation Detected</h3>
            <p className="text-sm text-red-400">Current burn ({currentMonthlyBurn}) is &gt;15% over your initial cap ({user.burnCap}).</p>
          </div>
        </div>
      )}

      {/* TREND CHART */}
      <GlassCard className="p-6 h-96">
        <div className="flex justify-between mb-4">
          <h3 className="font-bold text-white">Burn Rate History</h3>
          <div className="flex gap-2">
            {['1Y', '5Y', 'ALL'].map(r => (
              <button 
                key={r} 
                onClick={() => setViewRange(r as any)}
                className={`text-xs px-3 py-1 rounded border ${viewRange === r ? 'bg-white text-black' : 'bg-transparent text-gray-500 border-white/10'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="date" stroke="#555" fontSize={10} />
            <YAxis stroke="#555" fontSize={10} />
            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
            <Line type="monotone" dataKey="burn" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* ASSET CLASS BREAKDOWN (Visuals) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="font-bold text-white mb-4">Capital Efficiency</h3>
          {/* ROI Logic would go here */}
          <div className="text-center text-gray-500 py-8">Insufficient data for efficiency calculation.</div>
        </GlassCard>
        
        {/* DANGER ZONE */}
        <GlassCard className="p-6 border-red-900/30">
          <h3 className="font-bold text-red-500 mb-2 flex items-center gap-2">
            <AlertTriangle size={16}/> Danger Zone
          </h3>
          <p className="text-xs text-gray-500 mb-4">Irreversible actions.</p>
          <button 
            onClick={() => { if(confirm("NUCLEAR RESET: Are you sure?")) nuclearReset() }}
            className="w-full py-3 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-sm font-bold transition-all"
          >
            Initiate Nuclear Reset
          </button>
        </GlassCard>
      </div>
    </div>
  );
};
