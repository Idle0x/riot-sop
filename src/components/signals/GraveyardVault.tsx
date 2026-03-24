import { useState, useMemo } from 'react';
import { useLedger } from '../../context/LedgerContext';
import { GlassCard } from '../ui/GlassCard';
import { type Signal } from '../../types';
import { X, Search, Skull, RefreshCw, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { getSectorStyle } from '../../utils/colors';

interface Props {
  onClose: () => void;
  onRevive: (signal: Signal) => void;
}

export const GraveyardVault = ({ onClose, onRevive }: Props) => {
  const { signals } = useLedger();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterReason, setFilterReason] = useState<'ALL' | 'RUG' | 'REJECT' | 'FAILURE' | 'RETIRED'>('ALL');

  const deadSignals = useMemo(() => {
    return signals
      .filter(s => s.phase === 'graveyard')
      .filter(s => {
        const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesReason = filterReason === 'ALL' ? true : s.outcome?.status?.toUpperCase().includes(filterReason);
        return matchesSearch && matchesReason;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [signals, searchTerm, filterReason]);

  const totalBurnedHours = deadSignals.reduce((acc, s) => acc + (s.hoursLogged || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-2 md:p-4 animate-fade-in">
      <GlassCard className="w-full max-w-5xl h-[95vh] md:h-[85vh] flex flex-col relative border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)] p-0 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-white/10 bg-black/40 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="p-2 md:p-3 bg-white/5 rounded-lg md:rounded-xl border border-white/10 shrink-0"><Skull className="text-gray-400 w-5 h-5 md:w-6 md:h-6" /></div>
            <div className="min-w-0">
              <h2 className="text-lg md:text-2xl font-bold text-white tracking-tight">The Crypt</h2>
              <div className="flex gap-2 md:gap-4 text-[9px] md:text-xs text-gray-500 mt-0.5 md:mt-1 font-bold">
                <span className="flex items-center gap-1 truncate"><span className="text-white font-mono">{deadSignals.length}</span> <span className="hidden sm:inline">Deceased</span></span>
                <span className="text-gray-600">•</span>
                <span className="flex items-center gap-1 truncate"><span className="text-red-400 font-mono">{totalBurnedHours}h</span> <span className="hidden sm:inline">Total Burn</span></span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white shrink-0"><X className="w-5 h-5 md:w-6 md:h-6" /></button>
        </div>

        <div className="p-3 md:p-4 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row gap-3 md:gap-4 shrink-0">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5 md:w-4 md:h-4" />
            <input type="text" placeholder="Search by name..." className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 md:pl-9 pr-3 md:pr-4 py-1.5 md:py-2 text-xs md:text-sm text-white focus:border-white/30 outline-none transition-colors" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
          </div>
          <div className="flex gap-1.5 md:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide w-full sm:w-auto">
            {['ALL', 'RUG', 'REJECT', 'FAILURE', 'RETIRED'].map(f => (
              <button key={f} onClick={() => setFilterReason(f as any)} className={`px-2.5 py-1.5 md:px-3 md:py-2 text-[9px] md:text-xs font-bold rounded-lg border transition-all whitespace-nowrap ${filterReason === f ? 'bg-white text-black border-white shadow-md' : 'bg-transparent text-gray-500 border-white/10 hover:bg-white/5 hover:text-gray-300'}`}>{f === 'ALL' ? 'All Graves' : f}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-black/20 scrollbar-hide">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black/60 sticky top-0 z-10 backdrop-blur-xl border-b border-white/10">
              <tr>
                <th className="p-3 md:p-4 text-[9px] md:text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3 sm:w-1/4">Asset</th>
                <th className="p-3 md:p-4 text-[9px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Life Span</th>
                <th className="p-3 md:p-4 text-[9px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Burn</th>
                <th className="p-3 md:p-4 text-[9px] md:text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Autopsy</th>
                <th className="p-3 md:p-4 text-[9px] md:text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {deadSignals.map(s => {
                const style = getSectorStyle(s.sector);
                const lifeSpan = Math.ceil((new Date(s.updatedAt).getTime() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-3 md:p-4 align-top md:align-middle">
                        <div className="font-bold text-white text-[11px] md:text-sm leading-tight mb-1 max-w-[120px] sm:max-w-full truncate">{s.title}</div>
                        <span className={`text-[8px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded border ${style.bg} ${style.text} ${style.border} inline-block font-bold truncate max-w-[100px] sm:max-w-full`}>{s.sector}</span>
                        {/* Mobile-only autopsy summary */}
                        <div className="md:hidden mt-2 flex items-center gap-1.5">
                            {s.outcome?.status === 'failure' && <AlertTriangle size={10} className="text-red-500 shrink-0"/>}
                            <span className="text-[9px] font-bold uppercase text-gray-500">{s.outcome?.status}</span>
                        </div>
                    </td>
                    <td className="p-3 md:p-4 text-[10px] md:text-sm text-gray-400 font-mono align-top md:align-middle"><div className="flex items-center gap-1.5 md:gap-2 font-bold"><Calendar size={10} className="md:w-3.5 md:h-3.5"/> {lifeSpan}d</div></td>
                    <td className="p-3 md:p-4 text-[10px] md:text-sm font-mono align-top md:align-middle"><div className="flex items-center gap-1.5 md:gap-2 text-red-400/80 font-bold"><Clock size={10} className="md:w-3.5 md:h-3.5"/> {s.hoursLogged}h</div></td>
                    <td className="p-3 md:p-4 align-top md:align-middle hidden md:table-cell">
                        <div className="flex items-center gap-2 mb-1">
                            {s.outcome?.status === 'failure' && <AlertTriangle size={12} className="text-red-500"/>}
                            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">{s.outcome?.status}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 line-clamp-2 max-w-[250px] leading-relaxed">{s.outcome?.reason}</div>
                    </td>
                    <td className="p-3 md:p-4 text-right align-top md:align-middle">
                        <button onClick={() => onRevive(s)} className="text-[9px] md:text-xs text-blue-400 hover:text-white border border-blue-500/30 bg-blue-500/10 md:bg-transparent px-2 py-1.5 md:px-3 md:py-1.5 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 flex items-center justify-center gap-1 md:gap-1.5 ml-auto transition-all hover:bg-blue-500/30 font-bold">
                            <RefreshCw size={10} className="md:w-3.5 md:h-3.5"/> Revive
                        </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {deadSignals.length === 0 && <div className="text-center py-16 font-mono text-xs md:text-sm text-gray-600 font-bold">No deceased records found.</div>}
        </div>
      </GlassCard>
    </div>
  );
};
