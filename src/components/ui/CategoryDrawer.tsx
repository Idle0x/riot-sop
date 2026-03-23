import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Activity, ShoppingBag, Clock, FileText, ChevronLeft } from 'lucide-react';
import { Naira } from './Naira';
import { formatNumber } from '../../utils/format';

interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  category: string | null;
  events: any[];
}

const getInitials = (name: string) => {
    if (!name || name === 'Unknown Merchant') return '?';
    const words = name.split(' ').filter(w => w.length > 0);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
};

export const CategoryDrawer = ({ isOpen, onClose, category, events }: CategoryDrawerProps) => {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) setTimeout(() => setSelectedEntity(null), 300);
  }, [isOpen, category]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const categoryData = useMemo(() => {
    if (!category) return { total: 0, count: 0, avg: 0, merchants: [], txs: [] };

    const txs = events.filter(e => {
        const cat = e.categoryGroup || 'Uncategorized';
        return cat === category && e.type === 'SPEND';
    });

    const total = txs.reduce((sum, e) => sum + Math.abs(e.amount), 0);
    const count = txs.length;
    const avg = count > 0 ? total / count : 0;

    const merchantMap: Record<string, number> = {};
    const freqMap: Record<string, number> = {};
    
    txs.forEach(tx => {
        const name = tx.title || 'Unknown Entity';
        merchantMap[name] = (merchantMap[name] || 0) + Math.abs(tx.amount);
        freqMap[name] = (freqMap[name] || 0) + 1;
    });

    const merchants = Object.entries(merchantMap)
        .map(([name, amount]) => ({ 
            name, 
            amount, 
            frequency: freqMap[name],
            percentage: total > 0 ? (amount / total) * 100 : 0 
        }))
        .sort((a, b) => b.amount - a.amount);

    return { total, count, avg, merchants, txs };
  }, [category, events]);

  const entityData = useMemo(() => {
    if (!selectedEntity) return { total: 0, txs: [] };
    const txs = categoryData.txs
        .filter(tx => (tx.title || 'Unknown Entity') === selectedEntity)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
    const total = txs.reduce((sum, e) => sum + Math.abs(e.amount), 0);
    return { total, txs };
  }, [selectedEntity, categoryData]);

  return createPortal(
    <div className={`fixed inset-0 z-[100] pointer-events-none ${isOpen ? 'pointer-events-auto' : ''}`}>
      <div 
        className={`absolute inset-0 bg-black/80 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />

      {/* The Solid, Minimalist Base */}
      <div className={`absolute bottom-0 left-0 right-0 h-[85vh] max-w-3xl mx-auto bg-[#0a0a0a] border-t border-white/10 rounded-t-2xl flex flex-col transform transition-transform duration-500 ease-out shadow-2xl ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-2 cursor-pointer hover:bg-white/40 transition-colors" onClick={onClose} />
        
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-start border-b border-white/5 flex-shrink-0 transition-all duration-300">
           <div>
              {!selectedEntity ? (
                  <div className="animate-fade-in">
                      <div className="text-xs text-blue-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                         <ShoppingBag size={12}/> Category Drill-Down
                      </div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">{category || 'Select a Category'}</h2>
                  </div>
              ) : (
                  <div className="flex flex-col animate-fade-in">
                      <button 
                          onClick={() => setSelectedEntity(null)}
                          className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3 hover:text-white transition-colors"
                      >
                          <ChevronLeft size={12}/> Back to {category}
                      </button>
                      
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold tracking-widest flex-shrink-0 border border-white/5">
                              {getInitials(selectedEntity)}
                          </div>
                          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight truncate max-w-[240px] md:max-w-full">
                              {selectedEntity}
                          </h2>
                      </div>
                  </div>
              )}
           </div>
           <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 transition-colors flex-shrink-0 ml-4">
              <X size={20} />
           </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            
            {!selectedEntity ? (
                /* VIEW 1: THE ENTITY BOARD */
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-[#111] border border-white/5 rounded-xl">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-medium">Total Deployed</div>
                            <div className="text-2xl font-mono font-bold text-white"><Naira/>{formatNumber(categoryData.total)}</div>
                        </div>
                        <div className="grid grid-rows-2 gap-2">
                            <div className="p-3 bg-[#111] border border-white/5 rounded-xl flex items-center justify-between">
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1 font-medium"><Activity size={10}/> Frequency</div>
                                <div className="font-mono font-bold text-white text-sm">{categoryData.count}x</div>
                            </div>
                            <div className="p-3 bg-[#111] border border-white/5 rounded-xl flex items-center justify-between">
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1 font-medium"><Activity size={10}/> Avg. Spend</div>
                                <div className="font-mono font-bold text-white text-sm"><Naira/>{formatNumber(categoryData.avg)}</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between border-b border-white/5 pb-2">
                           <div className="flex items-center gap-2"><FileText size={16} className="text-gray-400"/> Entity Concentration</div>
                           <span className="text-[10px] text-gray-600 font-normal hidden sm:inline">Tap an entity to view micro-ledger</span>
                        </h3>
                        <div className="space-y-2">
                            {categoryData.merchants.length > 0 ? categoryData.merchants.map((m, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => setSelectedEntity(m.name)}
                                    className="relative overflow-hidden p-3 bg-[#111] hover:bg-white/5 border border-white/5 rounded-lg flex justify-between items-center group cursor-pointer transition-colors"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 bg-blue-500/10 transition-all" style={{ width: `${m.percentage}%` }} />
                                    <div className="relative z-10 flex flex-col max-w-[55%]">
                                        <div className="font-bold text-gray-200 text-sm truncate group-hover:text-white transition-colors">{m.name}</div>
                                        <div className="text-[10px] text-gray-500 font-medium">{m.frequency} Transactions</div>
                                    </div>
                                    <div className="relative z-10 flex items-center gap-3">
                                       <span className="text-[10px] text-gray-500 hidden sm:inline font-medium">{m.percentage.toFixed(0)}%</span>
                                       <span className="font-mono font-bold text-gray-200 text-sm"><Naira/>{formatNumber(m.amount)}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-xs text-gray-500 font-medium border border-dashed border-white/10 rounded-xl">No entity data found.</div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* VIEW 2: THE MICRO-LEDGER PROFILE */
                <div className="space-y-6 animate-fade-in">
                    
                    <div className="flex items-center justify-between p-4 bg-[#111] border border-white/5 rounded-xl">
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Total Allocated</div>
                            <div className="font-mono text-xl font-bold text-white"><Naira/>{formatNumber(entityData.total)}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Frequency</div>
                            <div className="font-mono text-xl font-bold text-white">{entityData.txs.length}x</div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 border-b border-white/5 pb-2">
                           <Clock size={16} className="text-gray-400"/> Chronological Ledger
                        </h3>
                        <div className="space-y-3">
                            {entityData.txs.map((tx, idx) => (
                                <div key={idx} className="flex flex-col p-4 bg-[#111] border border-white/5 rounded-lg hover:border-white/10 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-[11px] text-gray-500 font-medium tracking-wide">
                                            {new Date(tx.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        <div className="font-mono text-sm font-bold text-red-400">
                                            -<Naira/>{formatNumber(Math.abs(tx.amount))}
                                        </div>
                                    </div>
                                    
                                    {/* Only renders if tx.narration is a valid string and not empty */}
                                    {tx.narration ? (
                                        <div className="text-sm text-gray-200 font-medium leading-relaxed mb-1">
                                            {tx.narration}
                                        </div>
                                    ) : null}

                                    {/* The Ultra-faint Raw Bank Description (Always renders) */}
                                    {tx.description && (
                                        <div className="text-[10px] text-gray-600 font-mono break-words leading-relaxed mt-1">
                                            RAW: {tx.description}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            <div className="h-12" />
        </div>
      </div>
    </div>,
    document.body
  );
};
