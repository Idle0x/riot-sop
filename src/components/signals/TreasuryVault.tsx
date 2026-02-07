import { useMemo, useState } from 'react';
import { useLedger } from '../../context/LedgerContext';
import { GlassCard } from '../ui/GlassCard';
import { formatNumber } from '../../utils/format';
import { getSectorStyle } from '../../utils/colors';
import { X, TrendingUp, Calendar, DollarSign, Activity, Layers, PieChart, Landmark } from 'lucide-react';
import { type SignalPhase } from '../../types';

interface Props {
  onClose: () => void;
}

export const TreasuryVault = ({ onClose }: Props) => {
  const { history, signals } = useLedger();
  const [filterPhase, setFilterPhase] = useState<string>('ALL');

  // 1. Get all Harvest Logs (Triage Sessions linked to signals)
  const harvestLogs = useMemo(() => {
    return history
      .filter(h => h.type === 'TRIAGE_SESSION' && h.linkedSignalId)
      .map(h => {
        const signal = signals.find(s => s.id === h.linkedSignalId);
        // Fallback to legacy data if snapshot metadata doesn't exist yet
        const phase = h.metadata?.phase || signal?.phase || 'Unknown';
        const hours = h.metadata?.hoursLogged || signal?.hoursLogged || 1;
        
        return {
          ...h,
          signalTitle: signal?.title || 'Unknown Asset',
          sector: signal?.sector || 'General',
          snapshotPhase: phase as SignalPhase | 'Unknown',
          snapshotHours: hours,
          snapshotEfficiency: h.metadata?.efficiency || 0,
          value: h.amount // NGN
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [history, signals]);

  // 2. Metrics Calculation
  const metrics = useMemo(() => {
    const totalHarvested = harvestLogs.reduce((acc, log) => acc + log.value, 0);
    
    // Efficiency: Average Session Efficiency
    const avgEfficiency = harvestLogs.length > 0 
        ? harvestLogs.reduce((acc, log) => acc + (log.snapshotEfficiency || 0), 0) / harvestLogs.length
        : 0;

    // Phase Breakdown
    const byPhase: Record<string, number> = {};
    harvestLogs.forEach(log => {
        byPhase[log.snapshotPhase] = (byPhase[log.snapshotPhase] || 0) + log.value;
    });

    // Sector Breakdown
    const bySector: Record<string, number> = {};
    harvestLogs.forEach(log => {
        bySector[log.sector] = (bySector[log.sector] || 0) + log.value;
    });

    return { totalHarvested, avgEfficiency, byPhase, bySector };
  }, [harvestLogs]);

  const filteredLogs = filterPhase === 'ALL' 
    ? harvestLogs 
    : harvestLogs.filter(l => l.snapshotPhase === filterPhase);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
      <GlassCard className="w-full max-w-6xl h-[90vh] flex flex-col relative border-yellow-500/20 shadow-[0_0_50px_rgba(234,179,8,0.05)] p-0 overflow-hidden">
        
        {/* HEADER */}
        <div className="p-6 border-b border-white/10 bg-black/40 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/30 text-yellow-400">
                <Landmark size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">The Treasury</h2>
              <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">Asset Performance & Yield Analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white"><X size={24} /></button>
        </div>

        <div className="flex flex-col lg:flex-row h-full overflow-hidden">
            
            {/* LEFT PANEL: ANALYTICS */}
            <div className="w-full lg:w-1/3 border-r border-white/10 bg-white/5 p-6 overflow-y-auto space-y-6">
                
                {/* KPI CARDS */}
                <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20">
                        <div className="flex items-center gap-2 text-yellow-500 mb-2 text-xs font-bold uppercase tracking-wider">
                            <DollarSign size={14}/> Total Realized Yield
                        </div>
                        <div className="text-3xl font-mono font-bold text-white truncate">
                             ₦{formatNumber(metrics.totalHarvested)}
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
                        <div className="flex items-center gap-2 text-emerald-500 mb-2 text-xs font-bold uppercase tracking-wider">
                            <Activity size={14}/> Avg. Session Efficiency
                        </div>
                        <div className="text-3xl font-mono font-bold text-white">
                             ${formatNumber(metrics.avgEfficiency)}<span className="text-sm text-gray-400">/hr</span>
                        </div>
                    </div>
                </div>

                {/* YIELD BY PHASE */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2"><Layers size={14}/> Yield by Phase</h3>
                    <div className="space-y-3">
                        {Object.entries(metrics.byPhase).sort((a,b) => b[1] - a[1]).map(([phase, value]) => {
                             const percent = metrics.totalHarvested > 0 ? (value / metrics.totalHarvested) * 100 : 0;
                             return (
                                 <div key={phase} className="group">
                                     <div className="flex justify-between text-xs mb-1">
                                         <span className="text-white capitalize">{phase}</span>
                                         <span className="font-mono text-gray-400">₦{formatNumber(value)} ({percent.toFixed(0)}%)</span>
                                     </div>
                                     <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                         <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${percent}%` }}/>
                                     </div>
                                 </div>
                             );
                        })}
                    </div>
                </div>

                 {/* YIELD BY SECTOR */}
                 <div className="space-y-4 pt-4 border-t border-white/10">
                    <h3 className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2"><PieChart size={14}/> Top Sectors</h3>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(metrics.bySector).sort((a,b) => b[1] - a[1]).map(([sector, value]) => {
                             const style = getSectorStyle(sector);
                             return (
                                 <div key={sector} className={`px-3 py-2 rounded-lg border ${style.bg} ${style.border} flex flex-col min-w-[100px]`}>
                                     <span className={`text-[10px] font-bold uppercase ${style.text}`}>{sector}</span>
                                     <span className="text-xs font-mono font-bold text-white mt-1">₦{formatNumber(value)}</span>
                                 </div>
                             );
                        })}
                    </div>
                </div>

            </div>

            {/* RIGHT PANEL: THE LEDGER */}
            <div className="flex-1 flex flex-col bg-black/20">
                
                {/* FILTERS */}
                <div className="p-4 border-b border-white/10 flex gap-2 overflow-x-auto">
                    {['ALL', 'discovery', 'validation', 'contribution', 'delivered'].map(f => (
                        <button 
                            key={f} 
                            onClick={() => setFilterPhase(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${filterPhase === f ? 'bg-yellow-500 text-black' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* TABLE HEADER */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-white/5">
                    <div className="col-span-3">Date / Asset</div>
                    <div className="col-span-3">Phase Snapshot</div>
                    <div className="col-span-3">Amount</div>
                    <div className="col-span-3 text-right">Efficiency</div>
                </div>

                {/* TABLE BODY */}
                <div className="flex-1 overflow-y-auto">
                    {filteredLogs.length === 0 ? (
                        <div className="text-center py-20 text-gray-600 text-sm">No harvest records found for this filter.</div>
                    ) : (
                        filteredLogs.map((log) => {
                            const style = getSectorStyle(log.sector);
                            return (
                                <div key={log.id} className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-colors group items-center">
                                    <div className="col-span-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Calendar size={12} className="text-gray-500"/>
                                            <span className="text-xs text-gray-400 font-mono">{new Date(log.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="font-bold text-white text-sm truncate">{log.signalTitle}</div>
                                    </div>

                                    <div className="col-span-3">
                                        <div className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold mb-1 border ${log.snapshotPhase === 'delivered' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                            {log.snapshotPhase}
                                        </div>
                                        <div className="text-[10px] text-gray-500">
                                            Logged: {log.snapshotHours} hrs
                                        </div>
                                    </div>

                                    <div className="col-span-3">
                                        <div className="font-mono font-bold text-green-400 text-sm">
                                            +₦{formatNumber(log.value)}
                                        </div>
                                        <div className="text-[10px] text-gray-600 truncate">{log.title}</div>
                                    </div>

                                    <div className="col-span-3 text-right">
                                        <div className="flex items-center justify-end gap-1 text-yellow-500 font-mono font-bold text-sm">
                                            <TrendingUp size={12} />
                                            ${formatNumber(log.snapshotEfficiency)}/hr
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

            </div>
        </div>
      </GlassCard>
    </div>
  );
};
