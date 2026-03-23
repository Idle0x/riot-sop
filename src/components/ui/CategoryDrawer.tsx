import { useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Activity, ShoppingBag, Clock, FileText } from 'lucide-react';
import { Naira } from './Naira';
import { formatNumber } from '../../utils/format';

interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  category: string | null;
  events: any[];
}

export const CategoryDrawer = ({ isOpen, onClose, category, events }: CategoryDrawerProps) => {
  
  // Prevent background scrolling when the drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Isolate the exact transactions for this category
  const categoryData = useMemo(() => {
    if (!category) return { total: 0, count: 0, avg: 0, merchants: [], txs: [] };

    const txs = events.filter(e => {
        const cat = e.categoryGroup || 'Uncategorized';
        return cat === category && e.type === 'SPEND';
    });

    const total = txs.reduce((sum, e) => sum + Math.abs(e.amount), 0);
    const count = txs.length;
    const avg = count > 0 ? total / count : 0;

    // Aggregate the Payees/Merchants
    const merchantMap: Record<string, number> = {};
    txs.forEach(tx => {
        const name = tx.title || 'Unknown Merchant';
        merchantMap[name] = (merchantMap[name] || 0) + Math.abs(tx.amount);
    });

    const merchants = Object.entries(merchantMap)
        .map(([name, amount]) => ({ name, amount, percentage: (amount / total) * 100 }))
        .sort((a, b) => b.amount - a.amount);

    return { total, count, avg, merchants, txs };
  }, [category, events]);

  // Use createPortal to teleport this component directly to the <body> tag,
  // bypassing all parent CSS transforms that cause weird scrolling issues.
  return createPortal(
    <div className={`fixed inset-0 z-[100] pointer-events-none ${isOpen ? 'pointer-events-auto' : ''}`}>
      {/* Dimmed Overlay */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />

      {/* Bottom Sheet Drawer */}
      <div className={`absolute bottom-0 left-0 right-0 h-[85vh] max-w-3xl mx-auto bg-[#0a0a0a]/95 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl flex flex-col transform transition-transform duration-500 ease-out shadow-[0_-10px_40px_rgba(0,0,0,0.5)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        
        {/* Drag Handle */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-2 cursor-pointer" onClick={onClose} />
        
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-start border-b border-white/5 flex-shrink-0">
           <div>
              <div className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                 <ShoppingBag size={12}/> Category Drill-Down
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{category || 'Select a Category'}</h2>
           </div>
           <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 transition-colors">
              <X size={20} />
           </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            
            {/* Macro Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total Deployed</div>
                    <div className="text-2xl font-mono font-bold text-white"><Naira/>{formatNumber(categoryData.total)}</div>
                </div>
                <div className="grid grid-rows-2 gap-2">
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1"><Activity size={10}/> Frequency</div>
                        <div className="font-mono font-bold text-white text-sm">{categoryData.count}x</div>
                    </div>
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1"><Activity size={10}/> Avg. Spend</div>
                        <div className="font-mono font-bold text-white text-sm"><Naira/>{formatNumber(categoryData.avg)}</div>
                    </div>
                </div>
            </div>

            {/* Entity Breakdown */}
            <div>
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 border-b border-white/5 pb-2">
                   <FileText size={16} className="text-purple-400"/> Entity Concentration
                </h3>
                <div className="space-y-2">
                    {categoryData.merchants.length > 0 ? categoryData.merchants.map((m, idx) => (
                        <div key={idx} className="relative overflow-hidden p-3 bg-white/5 rounded-xl flex justify-between items-center group">
                            <div className="absolute left-0 top-0 bottom-0 bg-purple-500/10 transition-all" style={{ width: `${m.percentage}%` }} />
                            <div className="relative z-10 font-bold text-gray-200 text-sm truncate max-w-[60%]">{m.name}</div>
                            <div className="relative z-10 flex items-center gap-3">
                               <span className="text-[10px] text-gray-500">{m.percentage.toFixed(0)}%</span>
                               <span className="font-mono font-bold text-purple-400 text-sm"><Naira/>{formatNumber(m.amount)}</span>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-4 text-xs text-gray-600 italic">No merchant data found for this period.</div>
                    )}
                </div>
            </div>

            {/* Raw Ledger */}
            <div>
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 border-b border-white/5 pb-2">
                   <Clock size={16} className="text-blue-400"/> Chronological Ledger
                </h3>
                <div className="space-y-2">
                    {categoryData.txs.length > 0 ? categoryData.txs.map((tx, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <div>
                                <div className="font-bold text-gray-300 text-xs">{tx.title || 'Unknown'}</div>
                                <div className="text-[10px] text-gray-500 mt-0.5">{new Date(tx.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            </div>
                            <div className="font-mono text-sm font-bold text-white">
                                -<Naira/>{formatNumber(Math.abs(tx.amount))}
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-4 text-xs text-gray-600 italic">No transactions found for this period.</div>
                    )}
                </div>
            </div>
            
            {/* Bottom Padding for scroll breathing room */}
            <div className="h-8" />
        </div>
      </div>
    </div>,
    document.body // Teleports to the exact root of the page
  );
};
