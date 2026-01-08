import { useState, useMemo } from 'react';
import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { Naira } from '../components/ui/Naira';
import { Clock, Undo2, Search, Filter, ArrowDown } from 'lucide-react';

export const Ledger = () => {
  const { history, deleteTransaction } = useFinancials();
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
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Universal Black Box</h1>
        <div className="text-xs text-gray-500 font-mono">{history.length} Total Records</div>
      </div>

      {/* CONTROLS */}
      <GlassCard className="p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
          <input 
            type="text" 
            placeholder="Search records..." 
            className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/30"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48 relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
          <select 
            className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/30 appearance-none"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="ALL">All Events</option>
            <option value="SPEND">Spending</option>
            <option value="DROP">Income Drops</option>
            <option value="TRIAGE">Triage Operations</option>
            <option value="SYSTEM_EVENT">System Events</option>
          </select>
        </div>
      </GlassCard>

      {/* LIST */}
      <div className="space-y-4">
        {visibleHistory.map(log => (
          <GlassCard key={log.id} className="p-4 flex justify-between items-center group hover:border-white/20 transition-colors">
            <div className="flex items-center gap-4">
               <div className={`p-3 rounded-full ${log.type === 'SPEND' ? 'bg-red-500/10 text-red-500' : log.type === 'DROP' ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-gray-400'}`}>
                 <Clock size={20}/>
               </div>
               <div>
                 <div className="font-bold text-white flex items-center gap-2">
                   {log.title}
                   <span className="text-[10px] uppercase bg-white/10 px-2 py-0.5 rounded text-gray-400 font-mono">{log.type}</span>
                 </div>
                 <div className="text-xs text-gray-500">{new Date(log.date).toLocaleString()} • {log.description}</div>
               </div>
            </div>

            <div className="text-right">
              <div className={`font-mono font-bold ${log.amount && log.amount < 0 ? 'text-red-400' : 'text-white'}`}>
                {log.amount ? <><Naira/>{new Intl.NumberFormat().format(Math.abs(log.amount))}</> : '-'}
              </div>
              {isUndoable(log.date) && (
                <button 
                  onClick={() => deleteTransaction(log.id)}
                  className="text-xs text-red-400 hover:underline flex items-center gap-1 ml-auto mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Undo2 size={10}/> Undo
                </button>
              )}
            </div>
          </GlassCard>
        ))}

        {visibleHistory.length < filteredHistory.length && (
          <button 
            onClick={() => setLimit(prev => prev + 50)}
            className="w-full py-4 text-sm text-gray-500 hover:text-white flex items-center justify-center gap-2"
          >
            <ArrowDown size={16}/> Load More History
          </button>
        )}
      </div>
    </div>
  );
};
