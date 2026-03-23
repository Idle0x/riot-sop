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
    const color = `hsl(${hue}, 70%, 65%)`;

    return { total, txs, hue, color };
  }, [selectedEntity, categoryData]);

  const closeDrawer = () => {
      setSelectedEntity(null);
      onClose();
  };

  return createPortal(
    <div className={`fixed inset-0 z-[100] overflow-hidden transition-all duration-500 ${isOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'}`}>
      
      {/* Global Dark Overlay */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={closeDrawer}
      />

      {/* ==================================================================================== */}
      {/* LAYER 1: CATEGORY OVERVIEW (The Scan) */}
      {/* ==================================================================================== */}
      {/* Note the translate-y-[120%] to completely hide the shadow bleed when closed */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-[85vh] max-w-3xl mx-auto bg-[#0c0c1a] rounded-t-3xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]
        ${isOpen ? 'translate-y-0' : 'translate-y-[120%]'} 
        ${selectedEntity ? 'scale-[0.96] opacity-40 blur-[2px] pointer-events-none' : 'scale-100 opacity-100 blur-0'}`}
      >
        {/* Category Accent Glow - Boosted alpha from 18 to 28 for OLED */}
        <div 
            className="absolute top-0 left-0 right-0 h-[180px] pointer-events-none"
            style={{ background: `radial-gradient(ellipse 80% 100% at 50% -20%, ${catColor}28, transparent)` }}
        />

        {/* Drag Handle */}
        <div className="w-9 h-[3px] bg-[#333348] rounded-full mx-auto mt-4 mb-5" />

        {/* Header */}
        <div className="px-6 relative z-10 flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: catColor, boxShadow: `0 0 10px ${catColor}` }} />
              <span className="font-mono text-[9px] tracking-[0.2em] font-bold" style={{ color: catColor }}>
                CATEGORY DRILL-DOWN
              </span>
            </div>
            <button onClick={closeDrawer} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[#777790] hover:bg-white/20 hover:text-white transition-colors">
              <X size={14} strokeWidth={3} />
            </button>
          </div>

          <h2 className="text-[26px] font-bold text-[#e4e4f0] tracking-tight mb-6">{category || 'Select Category'}</h2>

          {/* Stats Instruments */}
          <div className="grid grid-cols-2 gap-2.5 mb-7">
            {/* Hero Stat: Total Deployed */}
            <div className="col-span-2 rounded-[14px] p-4" style={{ background: `linear-gradient(135deg, ${catColor}15, ${catColor}05)`, border: `1px solid ${catColor}30` }}>
              <div className="font-mono text-[9px] tracking-[0.2em] font-bold mb-1.5" style={{ color: catColor }}>
                TOTAL DEPLOYED
              </div>
              <div className="text-[32px] font-bold text-[#e4e4f0] leading-none tracking-tight">
                <Naira/>{formatNumber(categoryData.total)}
              </div>
            </div>

            {/* Frequency - Surface lightened slightly for OLED */}
            <div className="bg-[#15152a] border border-[#252540] rounded-xl p-3.5">
              <div className="font-mono text-[9px] text-[#777790] tracking-[0.15em] font-bold mb-1">FREQUENCY</div>
              <div className="text-[22px] font-bold text-[#e4e4f0] leading-none">
                {categoryData.count}<span className="text-[13px] text-[#777790] font-mono ml-0.5">×</span>
              </div>
            </div>

            {/* Avg Spend */}
            <div className="bg-[#15152a] border border-[#252540] rounded-xl p-3.5">
              <div className="font-mono text-[9px] text-[#777790] tracking-[0.15em] font-bold mb-1">AVG. SPEND</div>
              <div className="text-[22px] font-bold text-[#e4e4f0] leading-none">
                <Naira/>{formatNumber(categoryData.avg)}
              </div>
            </div>
          </div>

          {/* Section Label */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-[3px] h-3.5 rounded-full" style={{ background: catColor }} />
            <span className="font-mono text-[9px] text-[#777790] tracking-[0.2em] font-bold">ENTITY CONCENTRATION</span>
          </div>
        </div>

        {/* Ranked Entity Leaderboard */}
        <div className="flex-1 overflow-y-auto px-6 pb-10 scrollbar-hide relative z-10">
          {categoryData.merchants.length > 0 ? categoryData.merchants.map((entity, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedEntity(entity.name)}
              className="flex items-center gap-3.5 py-3.5 border-b border-[#1a1a30] cursor-pointer hover:bg-white/[0.04] transition-colors"
            >
              <span className="font-mono text-[10px] text-[#555570] w-4 shrink-0 font-bold">
                {String(i + 1).padStart(2, '0')}
              </span>

              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-[#d0d0e8] mb-2 truncate">
                  {entity.name}
                </div>
                {/* Progress track lightened to white/10 so it's visible on OLED */}
                <div className="h-[3px] bg-white/10 rounded-full w-full overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${entity.percentage}%`, 
                      // Fill gradient opacity boosted to 99 so it survives OLED pixel crushing
                      background: `linear-gradient(90deg, ${catColor}99, ${catColor})` 
                    }} 
                  />
                </div>
                <div className="font-mono text-[9px] text-[#666680] mt-1.5 font-bold">
                  {entity.frequency} tx · {entity.percentage.toFixed(1)}%
                </div>
              </div>

              <div className="text-right shrink-0 flex flex-col items-end">
                <div className="text-[14px] font-bold text-[#e4e4f0]">
                  <Naira/>{formatNumber(entity.amount)}
                </div>
                <div className="font-mono text-[10px] text-[#555570] mt-1">→</div>
              </div>
            </div>
          )) : (
            <div className="text-center py-10 text-[11px] font-mono text-[#666680] uppercase tracking-widest border border-dashed border-[#252540] rounded-xl mt-2">
              No entities found
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================================== */}
      {/* LAYER 2: ENTITY DETAIL (The Dive) */}
      {/* ==================================================================================== */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-[92vh] max-w-3xl mx-auto bg-[#080810] rounded-t-[24px] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.9)]
        ${selectedEntity ? 'translate-y-0' : 'translate-y-[120%]'}`}
      >
        {/* Entity Depth Color Sweep - Alpha boosted for OLED */}
        <div 
            className="absolute top-0 left-0 right-0 h-[220px] pointer-events-none transition-colors duration-500"
            style={{ background: `radial-gradient(ellipse 60% 100% at 30% -10%, ${entityData.color}20, transparent 70%)` }}
        />

        {/* Drag Handle */}
        <div className="w-9 h-[3px] bg-[#252540] rounded-full mx-auto mt-4 mb-0" />

        <div className="px-6 pt-4 relative z-10 flex-shrink-0">
            {/* Back Navigation */}
            <button 
                onClick={() => setSelectedEntity(null)} 
                className="flex items-center gap-1.5 bg-transparent border-none text-[#666680] hover:text-[#e4e4f0] cursor-pointer font-mono text-[10px] uppercase tracking-widest mb-6 transition-colors"
            >
                <span>←</span>
                <span>Back to {category}</span>
            </button>

            {/* Entity Identity Block */}
            <div className="flex items-center gap-4 mb-6">
                <div 
                    className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center font-bold text-[16px] shrink-0"
                    style={{ 
                        background: `linear-gradient(135deg, ${entityData.color}40, ${entityData.color}15)`,
                        border: `1px solid ${entityData.color}50`,
                        color: entityData.color,
                        boxShadow: `0 0 20px ${entityData.color}20`
                    }}
                >
                    {getInitials(selectedEntity || '')}
                </div>
                <div className="min-w-0">
                    <div className="font-mono text-[9px] tracking-[0.2em] font-bold mb-1" style={{ color: entityData.color }}>
                        ENTITY RECORD
                    </div>
                    <div className="text-[18px] font-bold text-[#e4e4f0] tracking-tight leading-tight truncate">
                        {selectedEntity}
                    </div>
                </div>
            </div>

            {/* Dossier Stats */}
            <div 
                className="rounded-2xl p-4 grid grid-cols-2 mb-7"
                style={{ 
                    background: `linear-gradient(135deg, ${entityData.color}12, transparent)`,
                    border: `1px solid ${entityData.color}25`
                }}
            >
                <div className="border-r border-[#1a1a30] pr-4">
                    <div className="font-mono text-[9px] text-[#777790] tracking-[0.15em] font-bold mb-1.5">ALLOCATED VOLUME</div>
                    <div className="text-[24px] font-bold text-[#e4e4f0] leading-none tracking-tight">
                        <Naira/>{formatNumber(entityData.total)}
                    </div>
                </div>
                <div className="pl-4">
                    <div className="font-mono text-[9px] text-[#777790] tracking-[0.15em] font-bold mb-1.5">TOTAL HITS</div>
                    <div className="text-[24px] font-bold leading-none tracking-tight" style={{ color: entityData.color }}>
                        {entityData.txs.length}
                    </div>
                </div>
            </div>

            {/* Section Label */}
            <div className="flex items-center gap-2 mb-5">
                <div className="w-[3px] h-3.5 rounded-full" style={{ background: entityData.color }} />
                <span className="font-mono text-[9px] text-[#777790] tracking-[0.2em] font-bold">TRANSACTION HISTORY</span>
            </div>
        </div>

        {/* Transaction Timeline */}
        <div className="flex-1 overflow-y-auto px-6 pb-10 scrollbar-hide relative z-10">
            {/* Center Spine */}
            <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-[#2a2a40] to-transparent md:-translate-x-1/2 z-0" />

            <div className="space-y-4">
                {entityData.txs.map((tx, i) => {
                    const isLeft = i % 2 === 0;
                    return (
                        <div key={i} className={`relative flex items-center md:justify-${isLeft ? 'start' : 'end'} justify-start w-full`}>
                            
                            {/* Center Dot */}
                            <div 
                                className="absolute left-[20px] md:left-1/2 top-[20px] w-2.5 h-2.5 rounded-full border-2 border-[#1a1a2e] -translate-y-1/2 -translate-x-1/2 z-10"
                                style={{ background: entityData.color, boxShadow: `0 0 10px ${entityData.color}80` }}
                            />

                            {/* Transaction Card - Lightened from #0d0d1e to white/5 for OLED contrast */}
                            <div className={`w-[calc(100%-40px)] md:w-[44%] ml-[40px] md:ml-0 bg-white/[0.04] border border-white/5 rounded-xl p-3 hover:bg-white/[0.08] transition-colors`}>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="font-mono text-[10px] text-[#777790] font-bold">
                                        {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div className="font-sans text-[14px] font-bold text-[#e4e4f0] leading-none">
                                        <Naira/>{formatNumber(Math.abs(tx.amount))}
                                    </div>
                                </div>

                                {tx.narration ? (
                                    <div className="text-[13px] font-bold text-[#c0c0d8] leading-snug">
                                        {tx.narration}
                                    </div>
                                ) : null}

                                {tx.description && (
                                    <div className="mt-2 pt-2 border-t border-white/5 text-[9px] font-mono text-[#555570] break-words leading-relaxed font-semibold">
                                        RAW: {tx.description}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
