import { useState, useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';
import { Naira } from './ui/Naira';
import { formatNumber } from '../utils/format';
import { 
  AlertTriangle, TrendingDown, Clock, ShieldPlus, 
  AlertOctagon, CheckCircle, ArrowRight, X
} from 'lucide-react';

export const ActionCenter = () => {
  const { telemetry, history, addBudget, commitAction, monthlyBurn } = useLedger();
  
  const [activeAnomaly, setActiveAnomaly] = useState<string | null>(null);
  const [resolveMode, setResolveMode] = useState<'BUDGET' | 'ABSORB' | 'BLEED' | null>(null);
  const [resolveInput, setResolveInput] = useState<string>('');

  const currentMonth = new Date().toISOString().slice(0, 7);

  // 1. ENGINE: Find what has already been resolved this month
  const resolvedThisMonth = useMemo(() => {
      return history
          .filter(h => h.type === ('ANOMALY_RESOLVED' as any) && h.date.startsWith(currentMonth))
          .map(h => h.title.split(': ')[1]); // Extracts the category name from the log title
  }, [history, currentMonth]);

  // 2. ENGINE: Detect Active Leaks
  const anomalies = useMemo(() => {
      const map: Record<string, { category: string, total: number, count: number }> = {};
      
      telemetry.forEach(t => {
          if (!t.date.startsWith(currentMonth) || t.type !== 'SPEND') return;
          
          if (t.highVelocityFlag || t.categoryGroup === 'Uncategorized') {
              const cat = t.categoryGroup || 'Uncategorized';
              
              // If it's already resolved this month, it is invisible.
              if (resolvedThisMonth.includes(cat)) return; 

              if (!map[cat]) map[cat] = { category: cat, total: 0, count: 0 };
              map[cat].total += Math.abs(t.amount);
              map[cat].count += 1;
          }
      });
      return Object.values(map).sort((a, b) => b.total - a.total);
  }, [telemetry, currentMonth, resolvedThisMonth]);

  // IF NO ANOMALIES, THE WIDGET VANISHES (Inbox Zero)
  if (anomalies.length === 0) return null;

  const handleResolve = (category: string, total: number) => {
      if (resolveMode === 'BUDGET') {
          const limit = parseFloat(resolveInput.replace(/[^0-9.]/g, ''));
          if (isNaN(limit) || limit <= 0) return alert("Enter a valid budget limit.");
          addBudget({
              name: `${category} (Auto-Protocol)`,
              amount: limit, spent: total, frequency: 'monthly', // TypeScript Fix: Lowercase 'monthly'
              category: category, autoDeduct: false
          });
          commitAction({ type: 'ANOMALY_RESOLVED' as any, title: `BUDGETED: ${category}`, description: `Converted to ₦${formatNumber(limit)} Protocol.`, amount: 0 } as any);
      } 
      else if (resolveMode === 'ABSORB') {
          if (!resolveInput.trim()) return alert("Context required to absorb.");
          commitAction({ type: 'ANOMALY_RESOLVED' as any, title: `ABSORBED: ${category}`, description: resolveInput, amount: total } as any);
      } 
      else if (resolveMode === 'BLEED') {
          commitAction({ type: 'ANOMALY_RESOLVED' as any, title: `ACKNOWLEDGED BLEED: ${category}`, description: "Logged as behavioral failure for this cycle.", amount: total } as any);
      }

      // Reset UI after processing
      setActiveAnomaly(null);
      setResolveMode(null);
      setResolveInput('');
  };

  return (
    <GlassCard className="mb-8 border-red-500/40 bg-gradient-to-br from-red-950/20 to-black/40 overflow-hidden animate-fade-in relative shadow-[0_0_30px_rgba(239,68,68,0.1)]">
      {/* Top Banner */}
      <div className="bg-red-500/10 border-b border-red-500/20 p-4 flex items-center gap-3">
         <div className="p-2 bg-red-500/20 text-red-400 rounded-lg animate-pulse">
            <AlertTriangle size={24}/>
         </div>
         <div>
            <h2 className="text-lg font-bold text-red-500 tracking-tight">CFO Action Required</h2>
            <p className="text-xs text-red-400/80">The Data Lake has intercepted {anomalies.length} unresolved structural leak{anomalies.length > 1 ? 's' : ''} this month.</p>
         </div>
      </div>

      <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {anomalies.map((anomaly) => {
            const isExpanded = activeAnomaly === anomaly.category;
            const annualizedCost = anomaly.total * 12;
            const runwayLostDays = monthlyBurn > 0 ? ((anomaly.total / monthlyBurn) * 30).toFixed(1) : '0';

            return (
              <div key={anomaly.category} className={`border rounded-xl transition-all duration-300 ${isExpanded ? 'border-red-500 bg-black/60 col-span-1 md:col-span-2 lg:col-span-3' : 'border-red-500/20 bg-black/20 hover:border-red-500/50 cursor-pointer'}`}>
                 
                 {/* Condensed View */}
                 {!isExpanded && (
                   <div className="p-4" onClick={() => setActiveAnomaly(anomaly.category)}>
                      <div className="flex justify-between items-start mb-2">
                         <h3 className="font-bold text-white text-lg">{anomaly.category}</h3>
                         <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-1 rounded-full font-mono">{anomaly.count}x hits</span>
                      </div>
                      <div className="text-2xl font-mono font-bold text-red-500 mb-1">
                         <Naira/>{formatNumber(anomaly.total)}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-3">
                         Click to resolve protocol <ArrowRight size={12}/>
                      </div>
                   </div>
                 )}

                 {/* Expanded Resolution View (The CFO Simulator) */}
                 {isExpanded && (
                   <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
                      
                      {/* Left: Impact Simulator */}
                      <div className="flex-1 space-y-4 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-6">
                         <div className="flex justify-between items-start">
                            <div>
                               <h3 className="font-bold text-white text-xl">{anomaly.category}</h3>
                               <p className="text-xs text-gray-400">Total Month-to-Date Impact</p>
                            </div>
                            <button onClick={() => setActiveAnomaly(null)} className="text-gray-500 hover:text-white bg-white/5 p-1 rounded-full"><X size={16}/></button>
                         </div>
                         <div className="text-3xl font-mono font-bold text-red-500">
                            <Naira/>{formatNumber(anomaly.total)}
                         </div>

                         {/* The Reality Check */}
                         <div className="bg-red-950/30 border border-red-500/20 rounded-lg p-3 space-y-2 mt-4">
                            <div className="flex justify-between items-center text-xs">
                               <span className="text-gray-400 flex items-center gap-1"><TrendingDown size={14}/> Annualized Bleed:</span>
                               <span className="font-mono text-red-400"><Naira/>{formatNumber(annualizedCost)}/yr</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                               <span className="text-gray-400 flex items-center gap-1"><Clock size={14}/> Runway Tax:</span>
                               <span className="font-mono text-orange-400">-{runwayLostDays} days lost</span>
                            </div>
                         </div>
                      </div>

                      {/* Right: Resolution Protocol */}
                      <div className="flex-1 flex flex-col justify-center">
                         <h4 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Execute Resolution</h4>
                         
                         {!resolveMode ? (
                           <div className="space-y-2">
                             <button onClick={() => setResolveMode('BUDGET')} className="w-full text-left p-3 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-colors flex items-center justify-between group">
                                <div>
                                   <div className="text-sm font-bold text-blue-400 flex items-center gap-2"><ShieldPlus size={16}/> Convert to Protocol</div>
                                   <div className="text-[10px] text-gray-400 mt-1">This is a valid recurring cost. Create a budget for it.</div>
                                </div>
                             </button>
                             <button onClick={() => setResolveMode('ABSORB')} className="w-full text-left p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors flex items-center justify-between group">
                                <div>
                                   <div className="text-sm font-bold text-yellow-400 flex items-center gap-2"><CheckCircle size={16}/> Absorb as One-Off</div>
                                   <div className="text-[10px] text-gray-400 mt-1">Life happens. Add context and absorb the hit this month.</div>
                                </div>
                             </button>
                             <button onClick={() => setResolveMode('BLEED')} className="w-full text-left p-3 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center justify-between group">
                                <div>
                                   <div className="text-sm font-bold text-red-400 flex items-center gap-2"><AlertOctagon size={16}/> Acknowledge as Bleed</div>
                                   <div className="text-[10px] text-gray-400 mt-1">This was a behavioral failure. Log the strike.</div>
                                </div>
                             </button>
                           </div>
                         ) : (
                           <div className="animate-fade-in space-y-4 bg-black/40 p-4 rounded-lg border border-white/5">
                              {resolveMode === 'BUDGET' && (
                                 <>
                                   <label className="text-xs text-blue-400 font-bold uppercase">Set Monthly Limit (₦)</label>
                                   <input type="text" placeholder={`e.g. ${anomaly.total + 5000}`} value={resolveInput} onChange={(e) => setResolveInput(e.target.value)} className="w-full bg-black border border-blue-500/30 rounded p-2 text-white font-mono text-sm outline-none focus:border-blue-500" autoFocus />
                                 </>
                              )}
                              {resolveMode === 'ABSORB' && (
                                 <>
                                   <label className="text-xs text-yellow-400 font-bold uppercase">What happened?</label>
                                   <input type="text" placeholder="e.g. Emergency car repair" value={resolveInput} onChange={(e) => setResolveInput(e.target.value)} className="w-full bg-black border border-yellow-500/30 rounded p-2 text-white text-sm outline-none focus:border-yellow-500" autoFocus />
                                 </>
                              )}
                              {resolveMode === 'BLEED' && (
                                 <p className="text-sm text-red-400 italic">"I acknowledge this capital was deployed without intent. The ledger will record this strike."</p>
                              )}

                              <div className="flex gap-2 pt-2">
                                 <GlassButton size="sm" onClick={() => handleResolve(anomaly.category, anomaly.total)} className="flex-1 justify-center bg-white/10 hover:bg-white/20">Execute</GlassButton>
                                 <GlassButton size="sm" onClick={() => { setResolveMode(null); setResolveInput(''); }} className="bg-transparent border-white/10 hover:bg-white/5">Cancel</GlassButton>
                              </div>
                           </div>
                         )}
                      </div>
                   </div>
                 )}
              </div>
            );
         })}
      </div>
    </GlassCard>
  );
};
