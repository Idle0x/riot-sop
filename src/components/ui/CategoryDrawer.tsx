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
      {/* Dark overlay */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />

      {/* Modern Zinc Base */}
      <div className={`absolute bottom-0 left-0 right-0 h-[85vh] max-w-3xl mx-auto bg-[#09090b] border-t border-white/10 rounded-t-2xl flex flex-col transform transition-transform duration-500 ease-out shadow-2xl ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        
        {/* Grab Handle */}
        <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mt-4 mb-2 cursor-pointer hover:bg-white/20 transition-colors" onClick={onClose} />
        
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-start border-b border-white/5 flex-shrink-0 transition-all duration-300">
           <div className="flex-1">
              {!selectedEntity ? (
                  <div className="animate-fade-in">
                      <div className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                         <ShoppingBag size={12}/> Category Drill-Down
                      </div>
                      <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight">{category || 'Select a Category'}</h2>
                  </div>
              ) : (
                  <div className="flex flex-col animate-fade-in">
                      <button 
                          onClick={() => setSelectedEntity(null)}
                          className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium tracking-wide mb-3 hover:text-zinc-200 transition-colors w-max"
                      >
                          <ChevronLeft size={14}/> Back to {category}
                      </button>
                      
                      <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-violet-500/15 text-violet-400 flex items-center justify-center font-semibold text-sm tracking-widest flex-shrink-0 border border-violet-500/20">
                              {getInitials(selectedEntity)}
                          </div>
                          <h2 className="text-xl font-semibold text-zinc-100 tracking-tight leading-tight truncate max-w-[240px] md:max-w-full">
                              {selectedEntity}
                          </h2>
                      </div>
                  </div>
              )}
           </div>
           <button onClick={onClose} className="p-2 bg-transparent hover:bg-white/5 rounded-md text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0 ml-4">
              <X size={20} />
           </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            
            {!selectedEntity ? (
                /* ---------------------------------------------------------------- */
                /* VIEW 1: THE MACRO BOARD (Blue Accent Ecosystem)                  */
                /* ---------------------------------------------------------------- */
                <div className="space-y-6 animate-fade-in">
                    {/* KPI Strip */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col justify-center">
                            <div className="text-[11px] text-zinc-500 font-medium mb-1.5">Total Deployed</div>
                            <div className="text-2xl font-mono font-medium text-zinc-100"><Naira/>{formatNumber(categoryData.total)}</div>
                        </div>
                        <div className="grid grid-rows-2 gap-3">
                            <div className="px-4 py-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                                <div className="text-[11px] text-zinc-500 font-medium flex items-center gap-1.5"><Activity size={12}/> Frequency</div>
                                <div className="font-mono font-medium text-zinc-300 text-sm">{categoryData.count}x</div>
                            </div>
                            <div className="px-4 py-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                                <div className="text-[11px] text-zinc-500 font-medium flex items-center gap-1.5"><Activity size={12}/> Avg. Spend</div>
                                <div className="font-mono font-medium text-zinc-300 text-sm"><Naira/>{formatNumber(categoryData.avg)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Entity List */}
                    <div>
                        <div className="flex items-center justify-between mb-3 px-1">
                           <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                               <FileText size={14} className="text-blue-400"/> Entity Concentration
                           </h3>
                        </div>
                        
                        <div className="flex flex-col border border-white/5 rounded-xl overflow-hidden bg-white/[0.01]">
                            {categoryData.merchants.length > 0 ? categoryData.merchants.map((m, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => setSelectedEntity(m.name)}
                                    className={`relative p-3.5 flex justify-between items-center group cursor-pointer hover:bg-white/[0.04] transition-colors ${idx !== categoryData.merchants.length - 1 ? 'border-b border-white/5' : ''}`}
                                >
                                    {/* Matte Progress Bar */}
                                    <div className="absolute left-0 top-0 bottom-0 bg-blue-500/10 transition-all" style={{ width: `${m.percentage}%` }} />
                                    
                                    <div className="relative z-10 flex flex-col max-w-[60%]">
                                        <div className="font-medium text-zinc-200 text-sm truncate group-hover:text-white transition-colors">{m.name}</div>
                                        <div className="text-[11px] text-zinc-500 mt-0.5">{m.frequency} Transactions</div>
                                    </div>
                                    <div className="relative z-10 flex items-center gap-4">
                                       <span className="text-[11px] text-zinc-500 hidden sm:inline">{m.percentage.toFixed(0)}%</span>
                                       <span className="font-mono font-medium text-zinc-300 text-sm"><Naira/>{formatNumber(m.amount)}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-sm text-zinc-500 font-medium">No entity data available.</div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* ---------------------------------------------------------------- */
                /* VIEW 2: THE MICRO-LEDGER (Violet Accent Ecosystem)               */
                /* ---------------------------------------------------------------- */
                <div className="space-y-6 animate-fade-in">
                    
                    {/* Dossier Card */}
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                        <div>
                            <div className="text-[11px] text-zinc-500 font-medium mb-1">Allocated Volume</div>
                            <div className="font-mono text-xl font-medium text-zinc-100"><Naira/>{formatNumber(entityData.total)}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[11px] text-zinc-500 font-medium mb-1">Total Hits</div>
                            <div className="font-mono text-xl font-medium text-zinc-100">{entityData.txs.length}</div>
                        </div>
                    </div>

                    {/* Timeline Container */}
                    <div>
                        <div className="flex items-center justify-between mb-4 px-1">
                           <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                               <Clock size={14} className="text-violet-400"/> Transaction History
                           </h3>
                        </div>
                        
                        <div className="space-y-0 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/5 before:to-transparent">
                            {entityData.txs.map((tx, idx) => (
                                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-3 pl-8 md:pl-0">
                                    
                                    {/* Timeline Node */}
                                    <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white/10 bg-[#09090b] text-zinc-500 absolute left-0 md:left-1/2 md:-translate-x-1/2 shrink-0">
                                        <div className="w-1.5 h-1.5 rounded-full bg-violet-500/50" />
                                    </div>
                                    
                                    {/* Transaction Card */}
                                    <div className="w-full md:w-[calc(50%-2rem)] p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                                        <div className="flex justify-between items-start mb-1.5">
                                            <div className="text-[11px] text-zinc-400 font-medium">
                                                {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                            <div className="font-mono text-sm font-medium text-zinc-300">
                                                <Naira/>{formatNumber(Math.abs(tx.amount))}
                                            </div>
                                        </div>
                                        
                                        {/* Clean Narration */}
                                        {tx.narration ? (
                                            <div className="text-sm text-zinc-200 font-medium leading-relaxed">
                                                {tx.narration}
                                            </div>
                                        ) : null}

                                        {/* Audit Log (Raw) */}
                                        {tx.description && (
                                            <div className="mt-2 text-[10px] text-zinc-600 font-mono break-words leading-relaxed border-t border-white/5 pt-2">
                                                RAW: {tx.description}
                                            </div>
                                        )}
                                    </div>
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
