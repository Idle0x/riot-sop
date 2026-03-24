import { useState, useMemo } from 'react';
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

  const harvestLogs = useMemo(() => {
    return history
      .filter(h => h.type === 'TRIAGE_SESSION' && h.linkedSignalId)
      .map(h => {
        const signal = signals.find(s => s.id === h.linkedSignalId);
        const phase = h.metadata?.phase || signal?.phase || 'Unknown';
        const hours = h.metadata?.hoursLogged || signal?.hoursLogged || 1;

        return {
          ...h,
          signalTitle: signal?.title || 'Unknown Asset',
          sector: signal?.sector || 'General',
          snapshotPhase: phase as SignalPhase | 'Unknown',
          snapshotHours: hours,
          snapshotEfficiency: h.metadata?.efficiency || 0,
          value: h.amount || 0 
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [history, signals]);

  const metrics = useMemo(() => {
    const totalHarvested = harvestLogs.reduce((acc, log) => acc + log.value, 0);

    const avgEfficiency = harvestLogs.length > 0 
        ? harvestLogs.reduce((acc, log) => acc + (log.snapshotEfficiency || 0), 0) / harvestLogs.length
        : 0;

    const byPhase: Record<string, number> = {};
    harvestLogs.forEach(log => {
        byPhase[log.snapshotPhase] = (byPhase[log.snapshotPhase] || 0) + log.value;
    });

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-2 md:p-4 animate-fade-in">
      <GlassCard className="w-full max-w-6xl h-[95vh] md:h-[90vh] flex flex-col relative border-yellow-500/20 shadow-[0_0_60px_rgba(234,179,8,0.1)] p-0 overflow-hidden">

        {/* HEADER */}
        <div className="p-4 md:p-6 border-b border-white/10 bg-black/60 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 md:gap-4 min-w-0 pr-4">
            <div className="p-2 md:p-3 bg-yellow-500/10 rounded-lg md:rounded-xl border border-yellow-500/30 text-yellow-400 shrink-0">
                <Landmark className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight truncate">The Treasury</h2>
              <p className="text-[9px] md:text-xs text-gray-500 font-mono uppercase tracking-widest truncate mt-0.5">Asset Performance & Yield Analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white shrink-0 border border-white/10"><X className="w-5 h-5 md:w-6 md:h-6" /></button>
        </div>

        <div className="flex flex-col lg:flex-row h-full overflow-hidden">

            {/* PANEL 1: ANALYTICS */}
            <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-white/10 bg-black/40 p-4 md:p-6 overflow-y-auto space-y-4 md:space-y-6 shrink-0 lg:shrink">

                {/* KPI CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 md:gap-4">
                    <div className="p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20">
                        <div className="flex items-center gap-1.5 md:gap-2 text-yellow-500 mb-1.5 md:mb-2 text-[9px] md:text-xs font-bold uppercase tracking-wider truncate">
                            <DollarSign size={12} className="md:w-3.5 md:h-3.5 shrink-0"/> <span className="truncate">Realized Yield</span>
                        </div>
                        <div className="text-lg md:text-3xl font-mono font-bold text-white truncate">
                             <Naira/>{formatNumber(metrics.totalHarvested)}
                        </div>
                    </div>
                    <div className="p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
                        <div className="flex items-center gap-1.5 md:gap-2 text-emerald-500 mb-1.5 md:mb-2 text-[9px] md:text-xs font-bold uppercase tracking-wider truncate">
                            <Activity size={12} className="md:w-3.5 md:h-3.5 shrink-0"/> <span className="truncate">Avg. Efficiency</span>
                        </div>
                        <div className="text-lg md:text-3xl font-mono font-bold text-white truncate">
                             ${formatNumber(metrics.avgEfficiency)}<span className="text-[10px] md:text-sm text-gray-400">/hr</span>
                        </div>
                    </div>
                </div>

                {/* YIELD BY PHASE */}
                <div className="space-y-3 md:space-y-4 pt-2 md:pt-0">
                    <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase flex items-center gap-1.5 md:gap-2"><Layers size={14} className="md:w-4 md:h-4"/> Yield by Phase</h3>
                    <div className="space-y-2 md:space-y-3">
                        {Object.entries(metrics.byPhase).sort((a,b) => b[1] - a[1]).map(([phase, value]) => {
                             const percent = metrics.totalHarvested > 0 ? (value / metrics.totalHarvested) * 100 : 0;
                             return (
                                 <div key={phase} className="group">
                                     <div className="flex justify-between text-[10px] md:text-xs mb-1 font-bold">
                                         <span className="text-white capitalize">{phase}</span>
                                         <span className="font-mono text-gray-400"><Naira/>{formatNumber(value)} <span className="text-[9px] md:text-[10px] opacity-60">({percent.toFixed(0)}%)</span></span>
                                     </div>
                                     <div className="h-1 md:h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                         <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${percent}%` }}/>
                                     </div>
                                 </div>
                             );
                        })}
                    </div>
                </div>

                 {/* YIELD BY SECTOR */}
                 <div className="space-y-3 md:space-y-4 pt-4 border-t border-white/10 hidden md:block">
                    <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase flex items-center gap-1.5 md:gap-2"><PieChart size={14} className="md:w-4 md:h-4"/> Top Sectors</h3>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(metrics.bySector).sort((a,b) => b[1] - a[1]).map(([sector, value]) => {
                             const style = getSectorStyle(sector);
                             return (
                                 <div key={sector} className={`px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg border ${style.bg} ${style.border} flex flex-col min-w-[80px] md:min-w-[100px]`}>
                                     <span className={`text-[9px] md:text-[10px] font-bold uppercase ${style.text}`}>{sector}</span>
                                     <span className="text-[11px] md:text-xs font-mono font-bold text-white mt-0.5 md:mt-1"><Naira/>{formatNumber(value)}</span>
                                 </div>
                             );
                        })}
                    </div>
                </div>

            </div>

            {/* PANEL 2: THE LEDGER */}
            <div className="flex-1 flex flex-col bg-black/20 min-h-0">

                {/* FILTERS */}
                <div className="p-3 md:p-4 border-b border-white/10 flex gap-1.5 md:gap-2 overflow-x-auto scrollbar-hide shrink-0">
                    {['ALL', 'discovery', 'validation', 'contribution', 'delivered'].map(f => (
                        <button 
                            key={f} 
                            onClick={() => setFilterPhase(f)}
                            className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg text-[9px] md:text-xs font-bold uppercase transition-all whitespace-nowrap border ${filterPhase === f ? 'bg-yellow-500 text-black border-yellow-500 shadow-md' : 'bg-black/40 text-gray-500 hover:bg-white/10 hover:text-gray-300 border-white/10'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* TABLE HEADER */}
                <div className="grid grid-cols-12 gap-2 md:gap-4 px-3 py-2 md:p-4 border-b border-white/10 text-[8px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-black/60 shrink-0">
                    <div className="col-span-5 md:col-span-4">Date / Asset</div>
                    <div className="col-span-4 md:col-span-3">Phase <span className="hidden sm:inline">Snapshot</span></div>
                    <div className="col-span-3 text-right">Amount</div>
                    <div className="hidden md:block col-span-2 text-right">Efficiency</div>
                </div>

                {/* TABLE BODY */}
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {filteredLogs.length === 0 ? (
                        <div className="text-center py-12 md:py-20 text-gray-600 text-xs md:text-sm font-bold uppercase tracking-widest">No harvest records found.</div>
                    ) : (
                        filteredLogs.map((log) => {
                            const style = getSectorStyle(log.sector); 
                            return (
                                <div key={log.id} className="grid grid-cols-12 gap-2 md:gap-4 px-3 py-3 md:p-4 border-b border-white/5 hover:bg-white/5 transition-colors group items-center">
                                    <div className="col-span-5 md:col-span-4 min-w-0 pr-2">
                                        <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                                            <Calendar size={10} className="md:w-3 md:h-3 text-gray-500 shrink-0"/>
                                            <span className="text-[9px] md:text-xs text-gray-400 font-mono">{new Date(log.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className={`font-bold text-[11px] md:text-sm truncate ${style.text}`}>{log.signalTitle}</div>
                                    </div>

                                    <div className="col-span-4 md:col-span-3 min-w-0 pr-2">
                                        <div className={`inline-block px-1.5 md:px-2 py-0.5 rounded text-[8px] md:text-[10px] uppercase font-bold mb-0.5 md:mb-1 border truncate max-w-full ${log.snapshotPhase === 'delivered' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                            {log.snapshotPhase}
                                        </div>
                                        <div className="text-[8px] md:text-[10px] text-gray-500 font-bold truncate">
                                            Logged: {log.snapshotHours} <span className="hidden sm:inline">hrs</span><span className="sm:hidden">h</span>
                                        </div>
                                    </div>

                                    <div className="col-span-3">
                                        <div className="font-mono font-bold text-green-400 text-xs md:text-sm text-right md:text-left">
                                            +<Naira/>{formatNumber(log.value)}
                                        </div>
                                        {/* Mobile only efficiency summary */}
                                        <div className="md:hidden text-[8px] text-yellow-500/80 font-mono text-right mt-0.5">${formatNumber(log.snapshotEfficiency)}/h</div>
                                        <div className="text-[8px] md:text-[10px] text-gray-600 truncate mt-0.5 hidden md:block">{log.title}</div>
                                    </div>

                                    <div className="hidden md:block col-span-2 text-right">
                                        <div className="flex items-center justify-end gap-1 text-yellow-500 font-mono font-bold text-xs md:text-sm">
                                            <TrendingUp size={12} className="shrink-0"/>
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
