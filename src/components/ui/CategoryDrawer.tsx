import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Naira } from './Naira';
import { formatNumber } from '../../utils/format';

interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  category: string | null;
  events: any[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'Contacts & P2P': '#a78bfa',    
  'Utilities': '#4ecdc4',         
  'Food & Dining': '#ff7b47',     
  'Groceries': '#ff7b47',         
  'Inbound Transfer': '#4da6ff',  
  'Outbound Transfer': '#4da6ff', 
  'Internal Transfer': '#4da6ff', 
  'Subscriptions': '#ffd166',     
  'Software & Apps': '#ffd166',   
  'Betting & Gaming': '#f72585',  
  'Transport': '#00ffaa',         
  'Online Payment': '#c77dff',    
  'POS / Cash': '#c77dff',        
  'Bank Charges': '#f43f5e',      
  'Taxes & Levies': '#f43f5e',    
  'Generosity': '#fca5a5',        
  'Refunds': '#34d399',           
  'Uncategorized': '#94a3b8'      
};

const getHueFromString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 360);
};

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

  const catColor = category ? (CATEGORY_COLORS[category] || '#94a3b8') : '#94a3b8';

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
    if (!selectedEntity) return { total: 0, txs: [], hue: 0, color: '#fff' };
    const txs = categoryData.txs
        .filter(tx => (tx.title || 'Unknown Entity') === selectedEntity)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
    const total = txs.reduce((sum, e) => sum + Math.abs(e.amount), 0);
    const hue = getHueFromString(selectedEntity);
    const color = `hsl(${hue}, 80%, 65%)`; 

    return { total, txs, hue, color };
  }, [selectedEntity, categoryData]);

  const closeDrawer = () => {
      setSelectedEntity(null);
      onClose();
  };

  return createPortal(
    <div className={`fixed inset-0 z-[100] overflow-hidden transition-all duration-500 ${isOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'}`}>
      
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={closeDrawer}
      />

      {/* ==================================================================================== */}
      {/* LAYER 1: CATEGORY OVERVIEW (Mobile: 60vh, Desktop: 65vh) */}
      {/* ==================================================================================== */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-[60vh] md:h-[65vh] max-w-3xl mx-auto bg-[#0a0a0a] rounded-t-2xl md:rounded-t-3xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.8)] border-t border-white/10
        ${isOpen ? 'translate-y-0' : 'translate-y-[120%]'} 
        ${selectedEntity ? 'scale-[0.96] opacity-40 blur-[2px] pointer-events-none' : 'scale-100 opacity-100 blur-0'}`}
      >
        <div className="w-10 md:w-12 h-1 bg-white/20 rounded-full mx-auto mt-2 md:mt-3 mb-2 md:mb-3" />

        <div className="px-3 md:px-5 relative z-10 flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5 md:mb-2">
            <h2 className="text-base md:text-xl font-bold text-white tracking-tight">{category || 'Select Category'}</h2>
            <button onClick={closeDrawer} className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <X size={14} className="md:w-4 md:h-4" strokeWidth={2.5} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="col-span-2 rounded-lg md:rounded-xl p-2 md:p-3 bg-white/5 border border-white/10">
              <div className="text-[8px] md:text-[10px] uppercase tracking-widest font-bold mb-0.5 md:mb-1" style={{ color: catColor }}>
                TOTAL DEPLOYED
              </div>
              <div className="text-lg md:text-2xl font-bold text-white leading-none">
                <Naira/>{formatNumber(categoryData.total)}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg md:rounded-xl p-2 md:p-3 flex justify-between items-center">
              <div className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-widest font-bold">FREQ</div>
              <div className="text-sm md:text-lg font-bold text-white leading-none">
                {categoryData.count}<span className="text-[10px] md:text-xs text-gray-500 ml-0.5">×</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg md:rounded-xl p-2 md:p-3 flex justify-between items-center">
              <div className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-widest font-bold">AVG</div>
              <div className="text-sm md:text-lg font-bold text-white leading-none">
                <Naira/>{formatNumber(categoryData.avg)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 md:px-5 pb-4 md:pb-6 scrollbar-hide relative z-10">
          {categoryData.merchants.length > 0 ? categoryData.merchants.map((entity, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedEntity(entity.name)}
              className="flex items-center gap-2 md:gap-3 py-2 md:py-3 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
            >
              <span className="font-mono text-[10px] md:text-xs text-gray-500 w-4 md:w-5 shrink-0 font-bold">
                {String(i + 1).padStart(2, '0')}
              </span>

              <div className="flex-1 min-w-0">
                <div className="text-[11px] md:text-sm font-bold text-white mb-1 md:mb-1.5 truncate">
                  {entity.name}
                </div>
                <div className="h-1 md:h-1.5 bg-white/10 rounded-full w-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ background: catColor, width: `${entity.percentage}%` }} />
                </div>
                <div className="text-[8px] md:text-[10px] text-gray-400 mt-1 font-bold">
                  {entity.frequency} tx · {entity.percentage.toFixed(1)}%
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs md:text-base font-bold text-white">
                  <Naira/>{formatNumber(entity.amount)}
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-4 md:py-6 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest border border-dashed border-white/10 rounded-xl mt-1 md:mt-2">
              No entities found
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================================== */}
      {/* LAYER 2: ENTITY DETAIL (Mobile: 65vh, Desktop: 75vh) */}
      {/* ==================================================================================== */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-[65vh] md:h-[75vh] max-w-3xl mx-auto bg-black rounded-t-2xl md:rounded-t-3xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.9)] border-t border-white/10
        ${selectedEntity ? 'translate-y-0' : 'translate-y-[120%]'}`}
      >
        <div className="w-10 md:w-12 h-1 bg-white/20 rounded-full mx-auto mt-2 md:mt-3 mb-1.5 md:mb-2" />

        <div className="px-3 md:px-5 pt-1 md:pt-2 relative z-10 flex-shrink-0">
            <button 
                onClick={() => setSelectedEntity(null)} 
                className="flex items-center gap-1 bg-transparent border-none text-gray-400 hover:text-white cursor-pointer font-bold text-[9px] md:text-[10px] uppercase tracking-widest mb-3 md:mb-4 transition-colors"
            >
                <span>←</span><span>Back</span>
            </button>

            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div 
                    className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center font-bold text-xs md:text-sm shrink-0 bg-white/10 border border-white/20"
                    style={{ color: entityData.color }}
                >
                    {getInitials(selectedEntity || '')}
                </div>
                <div className="min-w-0">
                    <div className="text-[8px] md:text-[10px] tracking-widest font-bold mb-0 md:mb-0.5" style={{ color: entityData.color }}>
                        ENTITY RECORD
                    </div>
                    <div className="text-sm md:text-lg font-bold text-white tracking-tight truncate">
                        {selectedEntity}
                    </div>
                </div>
            </div>

            <div className="rounded-lg md:rounded-xl p-2 md:p-3 grid grid-cols-2 mb-3 md:mb-4 bg-white/5 border border-white/10">
                <div className="border-r border-white/10 pr-2 md:pr-3">
                    <div className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5 md:mb-1">VOLUME</div>
                    <div className="text-base md:text-xl font-bold text-white leading-none">
                        <Naira/>{formatNumber(entityData.total)}
                    </div>
                </div>
                <div className="pl-2 md:pl-3">
                    <div className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5 md:mb-1">HITS</div>
                    <div className="text-base md:text-xl font-bold leading-none" style={{ color: entityData.color }}>
                        {entityData.txs.length}
                    </div>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 md:px-5 pb-4 md:pb-6 scrollbar-hide relative z-10">
            <div className="absolute left-[10px] md:left-[14px] top-0 bottom-0 w-[2px] bg-white/10 z-0" />

            <div className="space-y-3 md:space-y-4">
                {entityData.txs.map((tx, i) => (
                    <div key={i} className="relative flex items-center justify-start w-full">
                        <div 
                            className="absolute left-[10px] md:left-[14px] top-[16px] md:top-[20px] w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border-[2px] md:border-[3px] border-black -translate-y-1/2 -translate-x-1/2 z-10"
                            style={{ background: entityData.color }}
                        />

                        <div className="w-[calc(100%-24px)] md:w-[calc(100%-32px)] ml-[24px] md:ml-[32px] bg-white/5 border border-white/10 rounded-lg md:rounded-xl p-2.5 md:p-3">
                            <div className="flex items-start justify-between mb-1">
                                <div className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                    {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                <div className="text-xs md:text-sm font-bold text-white leading-none">
                                    <Naira/>{formatNumber(Math.abs(tx.amount))}
                                </div>
                            </div>

                            {tx.narration ? (
                                <div className="text-xs md:text-sm font-bold text-gray-200 leading-snug">
                                    {tx.narration}
                                </div>
                            ) : null}

                            {tx.description && (
                                <div className="mt-1.5 md:mt-2 pt-1.5 md:pt-2 border-t border-white/10 text-[8px] md:text-[10px] font-mono text-gray-500 break-words leading-relaxed font-bold">
                                    RAW: {tx.description}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
