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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
      <GlassCard className="w-full max-w-5xl h-[85vh] flex flex-col relative border-white/10 shadow-2xl p-0 overflow-hidden">
        <div className="p-6 border-b border-white/10 bg-black/20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10"><Skull className="text-gray-400" size={24} /></div>
            <div>
              <h2 className="text-2xl font-bold text-white">The Crypt</h2>
              <div className="flex gap-4 text-xs text-gray-500 mt-1">
                <span className="flex items-center gap-1"><span className="text-white font-mono">{deadSignals.length}</span> Deceased</span>
                <span className="flex items-center gap-1"><span className="text-red-400 font-mono">{totalBurnedHours}h</span> Total Burn</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white"><X size={24} /></button>
        </div>

        <div className="p-4 border-b border-white/10 bg-white/5 flex gap-4 flex-wrap">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input type="text" placeholder="Search by name..." className="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-white/30 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
          </div>
          <div className="flex gap-2">
            {['ALL', 'RUG', 'REJECT', 'FAILURE', 'RETIRED'].map(f => (
              <button key={f} onClick={() => setFilterReason(f as any)} className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all ${filterReason === f ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-white/10'}`}>{f === 'ALL' ? 'All Graves' : f}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase w-1/4">Asset</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Life Span</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Burn</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Autopsy</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {deadSignals.map(s => {
                const style = getSectorStyle(s.sector);
                const lifeSpan = Math.ceil((new Date(s.updatedAt).getTime() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4"><div className="font-bold text-white text-sm">{s.title}</div><span className={`text-[10px] px-1.5 py-0.5 rounded ${style.bg} ${style.text} mt-1 inline-block`}>{s.sector}</span></td>
                    <td className="p-4 text-sm text-gray-400 font-mono"><div className="flex items-center gap-2"><Calendar size={12}/> {lifeSpan} Days</div></td>
                    <td className="p-4 text-sm font-mono"><div className="flex items-center gap-2 text-red-400/80"><Clock size={12}/> {s.hoursLogged}h</div></td>
                    <td className="p-4"><div className="flex items-center gap-2 mb-1">{s.outcome?.status === 'failure' && <AlertTriangle size={12} className="text-red-500"/>}<span className="text-xs font-bold uppercase text-gray-500">{s.outcome?.status}</span></div><div className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">{s.outcome?.reason}</div></td>
                    <td className="p-4 text-right"><button onClick={() => onRevive(s)} className="text-xs text-blue-500 hover:text-white border border-blue-500/20 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-auto"><RefreshCw size={12}/> Revive</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
