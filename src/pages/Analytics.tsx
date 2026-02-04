import { useState, useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { useLedger } from '../context/LedgerContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { Download, TrendingUp, Calendar, Layers } from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';

export const Analytics = () => {
  const { user } = useUser();
  const { history, budgets } = useLedger();
  const [viewMode, setViewMode] = useState<'BURN' | 'RUNWAY' | 'COMPARE'>('BURN');

  // --- 1. DATA SOVEREIGNTY ---
  const handleExport = () => {
    const data = JSON.stringify({ user, history, budgets }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riot_sovereign_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // --- 2. CHART DATA ENGINES ---

  // A. Burn History (Line)
  const burnData = useMemo(() => {
    const grouped = history
      .filter(h => h.type === 'SPEND' || (h.type === 'SYSTEM_EVENT' && h.title === 'Runway Decay'))
      .reduce((acc, log) => {
        const month = log.date.substring(0, 7); 
        acc[month] = (acc[month] || 0) + (log.amount || 0);
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, amount]) => ({ date, burn: amount }));
  }, [history]);

  // B. Runway Horizon (Line - Derived from Snapshots)
  const runwayData = useMemo(() => {
    return history
      .filter(h => h.tags?.includes('SNAPSHOT'))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(h => ({
        date: new Date(h.date).toLocaleDateString(),
        months: h.amount || 0
      }));
  }, [history]);

  // C. Year-over-Year Comparison (Bar)
  const comparisonData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    // Initialize 12 months
    const months = Array.from({length: 12}, (_, i) => ({
      name: new Date(0, i).toLocaleString('default', { month: 'short' }),
      [currentYear]: 0,
      [lastYear]: 0
    }));

    history.filter(h => h.type === 'SPEND').forEach(log => {
      const d = new Date(log.date);
      const y = d.getFullYear();
      const m = d.getMonth();
      if (y === currentYear || y === lastYear) {
        // @ts-ignore
        months[m][y] += (log.amount || 0);
      }
    });

    return months;
  }, [history]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white">Deep Analytics</h1>
           <p className="text-gray-400 text-sm">Temporal Financial Analysis</p>
        </div>
        <GlassButton size="sm" onClick={handleExport}>
          <Download size={16} className="mr-2"/> Export Data (JSON)
        </GlassButton>
      </div>

      {/* CONTROLS */}
      <div className="flex bg-black/20 p-1 rounded-xl border border-white/10 w-fit">
        <button onClick={() => setViewMode('BURN')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${viewMode === 'BURN' ? 'bg-white text-black' : 'text-gray-500'}`}>
          <TrendingUp size={14}/> Burn Rate
        </button>
        <button onClick={() => setViewMode('RUNWAY')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${viewMode === 'RUNWAY' ? 'bg-white text-black' : 'text-gray-500'}`}>
          <Layers size={14}/> Runway Horizon
        </button>
        <button onClick={() => setViewMode('COMPARE')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${viewMode === 'COMPARE' ? 'bg-white text-black' : 'text-gray-500'}`}>
          <Calendar size={14}/> Year vs Year
        </button>
      </div>

      {/* MAIN CHART CARD */}
      <GlassCard className="p-6 h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'BURN' ? (
            <LineChart data={burnData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#666" fontSize={10} />
              <YAxis stroke="#666" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
              <Line type="monotone" dataKey="burn" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 8 }} />
            </LineChart>
          ) : viewMode === 'RUNWAY' ? (
            <LineChart data={runwayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#666" fontSize={10} />
              <YAxis stroke="#666" fontSize={10} domain={[0, 'auto']} />
              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
              <Line type="stepAfter" dataKey="months" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#666" fontSize={10} />
              <YAxis stroke="#666" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
              <Legend />
              <Bar dataKey={new Date().getFullYear() - 1} fill="#3b82f6" name="Last Year" />
              <Bar dataKey={new Date().getFullYear()} fill="#10b981" name="This Year" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </GlassCard>

      {/* INSIGHT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-gray-500 text-xs font-bold uppercase mb-2">Total Lifecycle Spend</h3>
          <div className="text-2xl font-mono font-bold text-white">
            {/* Sum all SPEND types */}
            {new Intl.NumberFormat().format(history.filter(h => h.type === 'SPEND').reduce((a, b) => a + (b.amount || 0), 0))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-gray-500 text-xs font-bold uppercase mb-2">Data Points</h3>
          <div className="text-2xl font-mono font-bold text-white">
            {history.length}
          </div>
          <p className="text-xs text-gray-600 mt-1">Commits to Ledger</p>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-gray-500 text-xs font-bold uppercase mb-2">System Health</h3>
          <div className="text-2xl font-mono font-bold text-green-500">
            ONLINE
          </div>
          <p className="text-xs text-gray-600 mt-1">Simulation Active</p>
        </GlassCard>
      </div>
    </div>
  );
};
