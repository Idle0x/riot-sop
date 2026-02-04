import { useState, useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Naira } from '../components/ui/Naira'; // RESTORED
import { formatNumber } from '../utils/format'; // UPDATED
import { Clock, Undo2, Search, Filter, ArrowDown } from 'lucide-react';

export const Ledger = () => {
  const { history, deleteTransaction } = useLedger();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [limit, setLimit] = useState(50);

  const isUndoable = (date: string) => {
    return (new Date().getTime() - new Date(date).getTime()) < (60 * 60 * 1000);
  };

  const filteredHistory = useMemo(() => {
    return history.filter(log => {
      const matchesSearch = log.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (log.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'ALL' || log.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [history, searchTerm, filterType]);

  const visibleHistory = filteredHistory.slice(0, limit);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 pb-20 space-y-6">
      {/* ... Controls section remains same ... */}

      <div className="space-y-4">
        {visibleHistory.map(log => (
          <GlassCard key={log.id} className="p-4 flex justify-between items-center group hover:border-white/20 transition-colors">
            <div className="flex items-center gap-4">
               {/* ... Icon logic same ... */}
               <div>
                 <div className="font-bold text-white flex items-center gap-2">
                   {log.title}
                   <span className="text-[10px] uppercase bg-white/10 px-2 py-0.5 rounded text-gray-400 font-mono">{log.type}</span>
                 </div>
                 <div className="text-xs text-gray-500">{new Date(log.date).toLocaleString()} • {log.description}</div>
               </div>
            </div>

            <div className="text-right">
              <div className={`font-mono font-bold flex items-center justify-end gap-1 ${log.amount && log.amount < 0 ? 'text-red-400' : 'text-white'}`}>
                {log.amount ? <><Naira/>{formatNumber(Math.abs(log.amount))}</> : '-'}
              </div>
              {isUndoable(log.date) && (
                <button onClick={() => deleteTransaction(log.id)} className="text-xs text-red-400 hover:underline flex items-center gap-1 ml-auto mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Undo2 size={10}/> Undo
                </button>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
