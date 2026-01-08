import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Naira } from '../components/ui/Naira';
import { Clock, Undo2 } from 'lucide-react';

export const Ledger = () => {
  const { history, deleteTransaction } = useFinancials();

  const isUndoable = (date: string) => {
    return (new Date().getTime() - new Date(date).getTime()) < (60 * 60 * 1000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 pb-20 space-y-8">
      <h1 className="text-3xl font-bold text-white">Universal Black Box</h1>
      
      <div className="space-y-4">
        {history.map(log => (
          <GlassCard key={log.id} className="p-4 flex justify-between items-center group">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-white/5 rounded-full text-gray-400">
                 <Clock size={20}/>
               </div>
               <div>
                 <div className="font-bold text-white flex items-center gap-2">
                   {log.title}
                   <span className="text-[10px] uppercase bg-white/10 px-2 py-0.5 rounded text-gray-400">{log.type}</span>
                 </div>
                 <div className="text-xs text-gray-500">{new Date(log.date).toLocaleString()} • {log.description}</div>
               </div>
            </div>

            <div className="text-right">
              <div className="font-mono text-white font-bold">
                {log.amount ? <><Naira/>{new Intl.NumberFormat().format(log.amount)}</> : '-'}
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
      </div>
    </div>
  );
};
