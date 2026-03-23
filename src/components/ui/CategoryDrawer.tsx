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

// 1. The Category Color Map (Layer 1 Accents)
const CATEGORY_COLORS: Record<string, string> = {
  'Contacts & P2P': '#a78bfa',    // purple
  'Utilities': '#4ecdc4',         // teal
  'Food & Dining': '#ff7b47',     // orange
  'Groceries': '#ff7b47',         // orange
  'Inbound Transfer': '#4da6ff',  // blue
  'Outbound Transfer': '#4da6ff', // blue
  'Internal Transfer': '#4da6ff', // blue
  'Subscriptions': '#ffd166',     // yellow
  'Software & Apps': '#ffd166',   // yellow
  'Betting & Gaming': '#f72585',  // pink
  'Transport': '#00ffaa',         // green
  'Online Payment': '#c77dff',    // violet
  'POS / Cash': '#c77dff',        // violet
  'Bank Charges': '#f43f5e',      // rose
  'Taxes & Levies': '#f43f5e',    // rose
  'Generosity': '#fca5a5',        // light red
  'Refunds': '#34d399',           // emerald
  'Uncategorized': '#94a3b8'      // slate
};

// 2. Deterministic Entity Color Generator (Layer 2 Accents)
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
    <div className={`fixed inset-0 z-[100] pointer-events-none ${isOpen ? 'pointer-events-auto' : ''}`}>
      {/* Global Dark Overlay */}
      <div 
        className={`absolute inset-0 bg-black/80 transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={closeDrawer}
      />

      {/* ==================================================================================== */}
      {/* LAYER 1: CATEGORY OVERVIEW (The Scan) */}
      {/* ==================================================================================== */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-[85vh] max-w-3xl mx-auto bg-[#0c0c1a] rounded-t-3xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col shadow-2xl
        ${isOpen ? 'translate-y-0' : 'translate-y-full'} 
        ${selectedEntity ? 'scale-[0.96] opacity-40 blur-[2px] pointer-events-none' : 'scale-100 opacity-100 blur-0'}`}
      >
        {/* Category Accent Glow */}
        <div 
            className="absolute top-0 left-0 right-0 h-[180px] pointer-events-none"
            style={{ background: `radial-gradient(ellipse 80% 100% at 50% -20%, ${catColor}18, transparent)` }}
        />

        {/* Drag Handle */}
        <div className="w-9 h-[3px] bg-[#252540] rounded-full mx-auto mt-4 mb-5" />

        {/* Header */}
        <div className="px-6 relative z-10 flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: catColor, boxShadow: `0 0 8px ${catColor}` }} />
              <span className="font-mono text-[9px] tracking-[0.2em] font-semibold" style={{ color: catColor }}>
                CATEGORY DRILL-DOWN
              </span>
            </div>
            <button onClick={closeDrawer} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[#555570] hover:bg-white/10 hover:text-white transition-colors">
              <X size={14} strokeWidth={3} />
            </button>
          </div>

          <h2 className="text-[26px] font-bold text-[#e4e4f0] tracking-tight mb-6">{category || 'Select Category'}</h2>

          {/* Stats Instruments */}
          <div className="grid grid-cols-2 gap-2.5 mb-7">
            {/* Hero Stat: Total Deployed */}
            <div className="col-span-2 rounded-[14px] p-4" style={{ background: `linear-gradient(135deg, ${catColor}10, ${catColor}04)`, border: `1px solid ${catColor}22` }}>
              <div className="font-mono text-[9px] tracking-[0.2em] font-semibold opacity-80 mb-1.5" style={{ color: catColor }}>
                TOTAL DEPLOYED
              </div>
              <div className="text-[32px] font-bold text-[#e4e4f0] leading-none tracking-tight">
                <Naira/>{formatNumber(categoryData.total)}
              </div>
            </div>

            {/* Frequency */}
            <div className="bg-[#111124] border border-[#1a1a30] rounded-xl p-3.5">
              <div className="font-mono text-[9px] text-[#555570] tracking-[0.15em] font-semibold mb-1">FREQUENCY</div>
              <div className="text-[22px] font-bold text-[#e4e4f0] leading-none">
                {categoryData.count}<span className="text-[13px] text-[#555570] font-mono ml-0.5">×</span>
              </div>
            </div>

            {/* Avg Spend */}
            <div className="bg-[#111124] border border-[#1a1a30] rounded-xl p-3.5">
              <div className="font-mono text-[9px] text-[#555570] tracking-[0.15em] font-semibold mb-1">AVG. SPEND</div>
              <div className="text-[22px] font-bold text-[#e4e4f0] leading-none">
                <Naira/>{formatNumber(categoryData.avg)}
              </div>
            </div>
          </div>

          {/* Section Label */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-[3px] h-3.5 rounded-full" style={{ background: catColor }} />
            <span className="font-mono text-[9px] text-[#555570] tracking-[0.2em] font-semibold">ENTITY CONCENTRATION</span>
          </div>
        </div>

        {/* Ranked Entity Leaderboard */}
        <div className="flex-1 overflow-y-auto px-6 pb-10 scrollbar-hide relative z-10">
          {categoryData.merchants.length > 0 ? categoryData.merchants.map((entity, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedEntity(entity.name)}
              className="flex items-center gap-3.5 py-3.5 border-b border-[#0f0f1e] cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <span className="font-mono text-[10px] text-[#333348] w-4 shrink-0 font-medium">
                {String(i + 1).padStart(2, '0')}
              </span>

              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[#d0d0e8] mb-1.5 truncate">
                  {entity.name}
                </div>
                <div className="h-[2px] bg-[#0f0f1e] rounded-full w-full overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${entity.percentage}%`, 
                      background: `linear-gradient(90deg, ${catColor}44, ${catColor})` 
                    }} 
                  />
                </div>
                <div className="font-mono text-[9px] text-[#444460] mt-1.5 font-medium">
                  {entity.frequency} tx · {entity.percentage.toFixed(1)}%
                </div>
              </div>

              <div className="text-right shrink-0 flex flex-col items-end">
                <div className="text-[14px] font-bold text-[#e4e4f0]">
                  <Naira/>{formatNumber(entity.amount)}
                </div>
                <div className="font-mono text-[10px] text-[#333348] mt-1">→</div>
              </div>
            </div>
          )) : (
            <div className="text-center py-10 text-[11px] font-mono text-[#444460] uppercase tracking-widest border border-dashed border-[#1a1a30] rounded-xl mt-2">
              No entities found
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================================== */}
      {/* LAYER 2: ENTITY DETAIL (The Dive) */}
      {/* ==================================================================================== */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-[92vh] max-w-3xl mx-auto bg-[#080810] rounded-t-[24px] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.8)]
        ${selectedEntity ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Entity Depth Color Sweep */}
        <div 
            className="absolute top-0 left-0 right-0 h-[220px] pointer-events-none transition-colors duration-500"
            style={{ background: `radial-gradient(ellipse 60% 100% at 30% -10%, ${entityData.color}14, transparent 70%)` }}
        />

        {/* Drag Handle */}
        <div className="w-9 h-[3px] bg-[#1a1a2e] rounded-full mx-auto mt-4 mb-0" />

        <div className="px-6 pt-4 relative z-10 flex-shrink-0">
            {/* Back Navigation */}
            <button 
                onClick={() => setSelectedEntity(null)} 
                className="flex items-center gap-1.5 bg-transparent border-none text-[#444460] hover:text-[#e4e4f0] cursor-pointer font-mono text-[10px] uppercase tracking-widest mb-6 transition-colors"
            >
                <span>←</span>
                <span>Back to {category}</span>
            </button>

            {/* Entity Identity Block */}
            <div className="flex items-center gap-4 mb-6">
                <div 
                    className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center font-bold text-[16px] shrink-0"
                    style={{ 
                        background: `linear-gradient(135deg, ${entityData.color}30, ${entityData.color}15)`,
                        border: `1px solid ${entityData.color}35`,
                        color: entityData.color,
                        boxShadow: `0 0 20px ${entityData.color}15`
                    }}
                >
                    {getInitials(selectedEntity || '')}
                </div>
                <div className="min-w-0">
                    <div className="font-mono text-[9px] tracking-[0.2em] font-semibold opacity-80 mb-1" style={{ color: entityData.color }}>
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
                    background: `linear-gradient(135deg, ${entityData.color}08, transparent)`,
                    border: `1px solid ${entityData.color}18`
                }}
            >
                <div className="border-r border-[#1a1a30] pr-4">
                    <div className="font-mono text-[9px] text-[#444460] tracking-[0.15em] font-semibold mb-1.5">ALLOCATED VOLUME</div>
                    <div className="text-[24px] font-bold text-[#e4e4f0] leading-none tracking-tight">
                        <Naira/>{formatNumber(entityData.total)}
                    </div>
                </div>
                <div className="pl-4">
                    <div className="font-mono text-[9px] text-[#444460] tracking-[0.15em] font-semibold mb-1.5">TOTAL HITS</div>
                    <div className="text-[24px] font-bold leading-none tracking-tight" style={{ color: entityData.color }}>
                        {entityData.txs.length}
                    </div>
                </div>
            </div>

            {/* Section Label */}
            <div className="flex items-center gap-2 mb-5">
                <div className="w-[3px] h-3.5 rounded-full" style={{ background: entityData.color }} />
                <span className="font-mono text-[9px] text-[#444460] tracking-[0.2em] font-semibold">TRANSACTION HISTORY</span>
            </div>
        </div>

        {/* Transaction Timeline */}
        <div className="flex-1 overflow-y-auto px-6 pb-10 scrollbar-hide relative z-10">
            {/* Center Spine (Visible on md screens, hidden on small screens for better space) */}
            <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-[#1a1a30] to-transparent md:-translate-x-1/2 z-0" />

            <div className="space-y-4">
                {entityData.txs.map((tx, i) => {
                    const isLeft = i % 2 === 0;
                    return (
                        <div key={i} className={`relative flex items-center md:justify-${isLeft ? 'start' : 'end'} justify-start w-full`}>
                            
                            {/* Center Dot */}
                            <div 
                                className="absolute left-[20px] md:left-1/2 top-1/2 w-2 h-2 rounded-full border-2 border-[#080810] -translate-y-1/2 -translate-x-1/2 z-10"
                                style={{ background: entityData.color, boxShadow: `0 0 8px ${entityData.color}60` }}
                            />

                            {/* Transaction Card */}
                            <div className={`w-[calc(100%-40px)] md:w-[44%] ml-[40px] md:ml-0 bg-[#0d0d1e] border border-[#111120] rounded-xl p-3 hover:bg-[#111124] transition-colors`}>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="font-mono text-[9px] text-[#555570] font-medium">
                                        {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div className="font-sans text-[14px] font-bold text-[#d0d0e8] leading-none">
                                        <Naira/>{formatNumber(Math.abs(tx.amount))}
                                    </div>
                                </div>

                                {tx.narration ? (
                                    <div className="text-[13px] font-medium text-[#a0a0b8] leading-snug">
                                        {tx.narration}
                                    </div>
                                ) : null}

                                {tx.description && (
                                    <div className="mt-2 pt-2 border-t border-[#1a1a30] text-[9px] font-mono text-[#333348] break-words leading-relaxed">
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
