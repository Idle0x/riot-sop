import { useState, useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Naira } from '../components/ui/Naira';
import { formatNumber } from '../utils/format';
import { 
  Clock, Undo2, Search, Filter, ArrowDown, 
  Target, Flame, Skull, Zap, Heart, ShieldCheck, Wallet, 
  ShieldAlert, Play, Gift, Database, BookOpen
} from 'lucide-react';

export const Ledger = () => {
  const { history, deleteTransaction } = useLedger();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [limit, setLimit] = useState(50);

  const isUndoable = (date: string, type: string) => {
    const isRecent = (new Date().getTime() - new Date(date).getTime()) < (60 * 60 * 1000);
    const isReversible = type === 'SPEND' || type === 'DROP' || type === 'GENEROSITY_GIFT';
    return isRecent && isReversible;
  };

  const filteredHistory = useMemo(() => {
    return history.filter(log => {
      const matchesSearch = log.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (log.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (log.recipientName || '').toLowerCase().includes(searchTerm.toLowerCase());

      let matchesType = true;
      if (filterType !== 'ALL') {
          matchesType = log.type === filterType;
      }

      return matchesSearch && matchesType;
    });
  }, [history, searchTerm, filterType]);

  const visibleHistory = filteredHistory.slice(0, limit);

  const getIcon = (type: string) => {
    const props = { size: 16, className: "md:w-5 md:h-5" };
    if (type === 'AUDIT_COMPLETED') return <Database {...props}/>;
    if (type === 'JOURNAL_LOGGED' || type === 'JOURNAL') return <BookOpen {...props}/>;
    if (type === 'SYSTEM_EVENT' || type.includes('UPDATE')) return <ShieldAlert {...props}/>;
    if (type === 'WORK_SESSION') return <Play {...props}/>; 
    if (type === 'GENEROSITY_GIFT') return <Gift {...props}/>; 
    if (type.includes('SIGNAL_KILL')) return <Skull {...props}/>;
    if (type.includes('SIGNAL')) return <Zap {...props}/>;
    if (type.includes('GOAL')) return <Target {...props}/>;
    if (type.includes('BUDGET')) return <Flame {...props}/>;
    if (type === 'GENEROSITY') return <Heart {...props}/>;
    if (type === 'TAX_ALLOCATION') return <ShieldCheck {...props}/>;
    if (type === 'DROP') return <Wallet {...props}/>;
    return <Clock {...props}/>;
  };

  const getColor = (type: string) => {
    if (type === 'AUDIT_COMPLETED') return 'bg-cyan-500/10 text-cyan-400';
    if (type === 'JOURNAL_LOGGED' || type === 'JOURNAL') return 'bg-blue-500/10 text-blue-400';
    if (type === 'SYSTEM_EVENT' || type.includes('UPDATE')) return 'bg-orange-500/10 text-orange-500'; 
    if (type === 'WORK_SESSION') return 'bg-purple-500/10 text-purple-400'; 
    if (type === 'GENEROSITY_GIFT') return 'bg-pink-500/10 text-pink-400'; 
    if (type.includes('KILL') || type.includes('DELETE') || type === 'SPEND') return 'bg-red-500/10 text-red-500';
    if (type === 'DROP' || type.includes('HARVEST') || type.includes('CREATE')) return 'bg-green-500/10 text-green-500';
    if (type.includes('PROMOTE') || type === 'TRIAGE') return 'bg-blue-500/10 text-blue-400';
    if (type === 'GENEROSITY') return 'bg-pink-500/10 text-pink-500';
    return 'bg-white/5 text-gray-400';
  };

  return (
    <div className="max-w-4xl mx-auto p-3 md:p-8 pb-16 md:pb-20 space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 md:gap-4">
        <h1 className="text-xl md:text-3xl font-bold text-white">Forensic Ledger</h1>
        <div className="text-[10px] md:text-xs text-gray-500 font-mono">{history.length} Total Records</div>
      </div>

      <GlassCard className="p-3 md:p-4 flex flex-col md:flex-row gap-3 md:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5 md:w-4 md:h-4"/>
          <input 
            type="text" 
            placeholder="Search records or merchants..." 
            className="w-full bg-black/20 border border-white/10 rounded-lg py-1.5 md:py-2 pl-8 md:pl-10 pr-3 md:pr-4 text-xs md:text-sm text-white focus:outline-none focus:border-white/30"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48 relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5 md:w-4 md:h-4"/>
          <select 
            className="w-full bg-black/20 border border-white/10 rounded-lg py-1.5 md:py-2 pl-8 md:pl-10 pr-3 md:pr-4 text-xs md:text-sm text-white focus:outline-none focus:border-white/30 appearance-none font-bold"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="ALL">All Events</option>
            <option value="SPEND">Spending</option>
            <option value="DROP">Income Drops</option>
            <option value="WORK_SESSION">Labor / Time</option>
            <option value="SYSTEM_EVENT">System Audits</option>
            <option value="JOURNAL_LOGGED">Journal Entries</option>
          </select>
        </div>
      </GlassCard>

      <div className="space-y-2.5 md:space-y-4">
        {visibleHistory.map(log => (
          <GlassCard key={log.id} className="p-3 md:p-4 flex justify-between items-center group transition-colors border-white/5 hover:border-white/20">
            <div className="flex items-center gap-2.5 md:gap-4 min-w-0">
               <div className={`p-2.5 md:p-3 rounded-xl md:rounded-full shrink-0 ${getColor(log.type)}`}>
                 {getIcon(log.type)}
               </div>
               <div className="min-w-0">
                 <div className="font-bold text-white text-[13px] md:text-base flex items-center gap-1.5 md:gap-2 flex-wrap">
                   <span className="truncate">{log.title}</span>

                   <span className="text-[8px] md:text-[10px] uppercase bg-white/10 px-1.5 md:px-2 py-0.5 rounded text-gray-400 font-mono shrink-0">{log.type}</span>
                   {log.recipientTier && (
                      <span className="text-[8px] md:text-[10px] uppercase bg-pink-500/20 text-pink-400 px-1.5 md:px-2 py-0.5 rounded font-mono border border-pink-500/30 shrink-0">
                        {log.recipientTier}
                      </span>
                   )}
                 </div>
                 <div className="text-[10px] md:text-xs text-gray-500 truncate max-w-[200px] md:max-w-md mt-0.5 md:mt-1">
                    {new Date(log.date).toLocaleString()} • {log.description}
                 </div>
               </div>
            </div>

            <div className="text-right shrink-0 pl-2">
              <div className={`font-mono font-bold text-sm md:text-base flex items-center justify-end gap-0.5 md:gap-1 ${
                  log.type === 'WORK_SESSION' ? 'text-purple-400' :
                  log.amount && log.amount < 0 ? 'text-red-400' : 
                  log.type === 'SPEND' ? 'text-red-400' : 'text-white'
              }`}>
                {log.type === 'WORK_SESSION' 
                    ? `${log.amount}h` 
                    : log.amount ? <><Naira/>{formatNumber(Math.abs(log.amount))}</> : ''
                }
              </div>

              {isUndoable(log.date, log.type) && (
                <button 
                  onClick={() => deleteTransaction(log.id)}
                  className="text-[9px] md:text-xs text-red-400 hover:underline flex items-center justify-end gap-1 ml-auto mt-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                >
                  <Undo2 size={10} className="w-3 h-3 md:w-3.5 md:h-3.5"/> Reverse
                </button>
              )}
            </div>
          </GlassCard>
        ))}

        {visibleHistory.length === 0 && (
            <div className="text-center py-8 md:py-12 text-gray-500 text-xs md:text-sm">No records found for this filter.</div>
        )}

        {visibleHistory.length > 0 && visibleHistory.length < filteredHistory.length && (
          <button 
            onClick={() => setLimit(prev => prev + 50)}
            className="w-full py-3 md:py-4 text-xs md:text-sm text-gray-500 hover:text-white flex items-center justify-center gap-1.5 md:gap-2 border border-dashed border-white/10 rounded-xl mt-4"
          >
            <ArrowDown size={14} className="md:w-4 md:h-4"/> Load More History
          </button>
        )}
      </div>
    </div>
  );
};
