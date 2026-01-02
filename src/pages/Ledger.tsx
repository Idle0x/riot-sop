import { useState } from 'react';
import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { ArrowDownLeft, ArrowUpRight, Trash2, Search, History } from 'lucide-react';
import { Naira } from '../components/ui/Naira';
import { cn } from '../utils/cn';

export const Ledger = () => {
  const { transactions, deleteTransaction, projects, budgetCategories } = useFinancials();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'drop' | 'expense' | 'allocation'>('all');

  // Helpers
  const formatMoney = (amount: number, currency: string) => {
    if (currency === 'USD') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    return <span className="flex items-center gap-1"><Naira />{new Intl.NumberFormat('en-NG').format(amount)}</span>;
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  // 1-Hour Rule Check
  const canDelete = (dateStr: string) => {
    const ONE_HOUR = 60 * 60 * 1000;
    return (new Date().getTime() - new Date(dateStr).getTime()) < ONE_HOUR;
  };

  // Filter Logic
  const filteredTx = transactions
    .filter(t => filterType === 'all' || t.type === filterType)
    .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 (t.category && budgetCategories.find(c => c.id === t.category)?.name.toLowerCase().includes(searchTerm.toLowerCase())))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">The Ledger</h1>
          <p className="text-gray-400">Transaction History & Audit Trail</p>
        </div>
        
        {/* Filters */}
        <div className="flex gap-2">
           <GlassInput 
             icon={<Search size={14} />} 
             placeholder="Search logs..." 
             className="w-48 h-10 text-sm"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
           <div className="flex bg-black/20 p-1 rounded-xl border border-glass-border">
             {['all', 'drop', 'expense'].map((f) => (
               <button 
                 key={f}
                 onClick={() => setFilterType(f as any)}
                 className={cn(
                   "px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize", 
                   filterType === f ? "bg-glass-highlight text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                 )}
               >
                 {f}
               </button>
             ))}
           </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTx.length === 0 ? (
          <div className="text-center py-12 opacity-50">
            <History className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p>No records found in the blockchain.</p>
          </div>
        ) : (
          filteredTx.map((tx) => {
            const isDeletable = canDelete(tx.date);
            const categoryName = tx.category ? budgetCategories.find(c => c.id === tx.category)?.name : null;
            const projectSource = tx.projectId ? projects.find(p => p.id === tx.projectId)?.name : null;

            return (
              <GlassCard key={tx.id} className="p-4 flex items-center justify-between group hover:border-white/20 transition-all">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={cn(
                    "p-3 rounded-full",
                    tx.type === 'drop' ? "bg-accent-success/10 text-accent-success" :
                    tx.type === 'expense' ? "bg-accent-danger/10 text-accent-danger" :
                    "bg-accent-info/10 text-accent-info"
                  )}>
                    {tx.type === 'drop' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>

                  {/* Details */}
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      {tx.description}
                      {categoryName && <span className="text-[10px] bg-white/10 px-1.5 rounded text-gray-300">{categoryName}</span>}
                      {projectSource && <span className="text-[10px] bg-accent-info/10 text-accent-info px-1.5 rounded">{projectSource}</span>}
                    </div>
                    <div className="text-xs text-gray-500">{formatDate(tx.date)}</div>
                  </div>
                </div>

                {/* Amount & Action */}
                <div className="text-right flex items-center gap-6">
                  <div className={cn(
                    "font-mono font-bold text-lg",
                    tx.type === 'drop' ? "text-accent-success" : "text-white"
                  )}>
                    {tx.type === 'expense' || tx.type === 'allocation' ? '-' : '+'}{formatMoney(tx.amount, tx.currency)}
                  </div>

                  {isDeletable && (
                    <button 
                      onClick={() => { if(confirm("Undo this transaction? Money will be refunded.")) deleteTransaction(tx.id); }}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-accent-danger transition-all"
                      title="Undo (Available for 1hr)"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </GlassCard>
            );
          })
        )}
      </div>

    </div>
  );
};
