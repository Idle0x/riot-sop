import { useState } from 'react';
import { useLedger } from '../context/LedgerContext';
// REMOVED: useUser import (unused)
import { useFinancialStats } from '../hooks/useFinancialStats'; 
import { GlassCard } from '../components/ui/GlassCard';
// REMOVED: GlassButton import (unused)
import { Naira } from '../components/ui/Naira';
import { formatNumber } from '../utils/format';
import { CashFlowChart } from '../components/dashboard/CashFlowChart'; 
import { 
  TrendingUp, TrendingDown, Activity, Wallet, ShieldCheck, 
  Heart, Zap, ArrowRight, AlertTriangle, ArrowDownLeft, ArrowUpRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const navigate = useNavigate();
  // REMOVED: const { user } = useUser(); (unused)
  const { runwayMonths, history } = useLedger();
  const { 
    netFlow, inflow, outflow, burnDelta, chartData, allocation 
  } = useFinancialStats();

  // --- MINI-LEDGER STATE ---
  const [activityFilter, setActivityFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');

  // Filter Logic
  const filteredActivity = history.filter(log => {
    if (activityFilter === 'ALL') return true;
    if (activityFilter === 'IN') return log.type === 'DROP' || log.type === 'TRIAGE_SESSION';
    if (activityFilter === 'OUT') return log.type === 'SPEND' || log.type === 'GENEROSITY' || log.type === 'TRANSFER';
    return true;
  }).slice(0, 5); // Show last 5 of specific type

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 pb-20 space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Command Center</h1>
          <p className="text-gray-400 text-sm mt-1">
            Runway: <span className={`${runwayMonths < 3 ? 'text-red-500 font-bold' : 'text-green-400'}`}>
              {runwayMonths === Infinity ? '∞' : runwayMonths.toFixed(1)} Months
            </span>
          </p>
        </div>
        <div className="text-right">
           <div className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Net Worth (Est)</div>
           <div className="text-xl font-mono font-bold text-white">
             <Naira/>{formatNumber(allocation.liquid + allocation.reserved + allocation.generosity + allocation.idle)}
           </div>
        </div>
      </div>

      {/* DECK A: HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Net Flow */}
        <GlassCard className="p-4 relative overflow-hidden group">
          <div className={`absolute right-0 top-0 p-3 opacity-10 ${netFlow >= 0 ? 'bg-green-500' : 'bg-red-500'} blur-xl rounded-bl-full w-24 h-24 transition-all group-hover:opacity-20`}/>
          <div className="flex items-center gap-2 mb-2">
            {netFlow >= 0 ? <TrendingUp size={16} className="text-green-400"/> : <TrendingDown size={16} className="text-red-400"/>}
            <span className="text-xs font-bold text-gray-400 uppercase">Net Flow (Mo)</span>
          </div>
          <div className={`text-2xl font-mono font-bold ${netFlow >= 0 ? 'text-white' : 'text-red-400'}`}>
            {netFlow >= 0 ? '+' : ''}<Naira/>{formatNumber(netFlow)}
          </div>
          <div className="text-[10px] text-gray-500 mt-2 flex justify-between">
            <span className="text-green-400">In: {formatNumber(inflow)}</span>
            <span className="text-red-400">Out: {formatNumber(outflow)}</span>
          </div>
        </GlassCard>

        {/* Metric 2: Burn Velocity */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-blue-400"/>
            <span className="text-xs font-bold text-gray-400 uppercase">Burn Velocity</span>
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            <Naira/>{formatNumber(outflow)}
          </div>
          <div className="text-[10px] text-gray-500 mt-2">
            {burnDelta > 0 ? (
              <span className="text-red-400 flex items-center gap-1">▲ {burnDelta.toFixed(1)}% vs Last Month</span>
            ) : (
              <span className="text-green-400 flex items-center gap-1">▼ {Math.abs(burnDelta).toFixed(1)}% vs Last Month</span>
            )}
          </div>
        </GlassCard>

        {/* Metric 3: Idle Capital */}
        <GlassCard className={`p-4 ${allocation.idle > 100000 ? 'border-yellow-500/30' : ''}`}>
           <div className="flex items-center gap-2 mb-2">
            {allocation.idle > 100000 ? <AlertTriangle size={16} className="text-yellow-500"/> : <Wallet size={16} className="text-gray-400"/>}
            <span className="text-xs font-bold text-gray-400 uppercase">Unallocated (Idle)</span>
          </div>
          <div className={`text-2xl font-mono font-bold ${allocation.idle > 100000 ? 'text-yellow-400' : 'text-white'}`}>
            <Naira/>{formatNumber(allocation.idle)}
          </div>
          {allocation.idle > 0 ? (
             <button onClick={() => navigate('/triage')} className="text-[10px] text-yellow-500 mt-2 hover:underline flex items-center gap-1">
               Action Required: Triage Funds <ArrowRight size={10}/>
             </button>
          ) : (
             <div className="text-[10px] text-green-500 mt-2">All funds deployed efficienty.</div>
          )}
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* DECK B: VISUALIZATION */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-6 h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white flex items-center gap-2"><Activity size={16} className="text-purple-400"/> Cash Flow Trend</h3>
              <div className="flex gap-2 text-[10px]">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500/50"/> Income</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500/50"/> Expense</div>
              </div>
            </div>
            <CashFlowChart data={chartData} />
          </GlassCard>
        </div>

        {/* DECK C: ASSET STACK */}
        <div className="space-y-4">
           <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Asset Allocation</div>
           
           <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><Wallet size={16}/></div>
                 <div>
                   <div className="text-sm font-bold text-white">Operations</div>
                   <div className="text-[10px] text-gray-500">Liquid Cash</div>
                 </div>
              </div>
              <div className="font-mono font-bold text-white"><Naira/>{formatNumber(allocation.liquid)}</div>
           </div>

           <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg"><ShieldCheck size={16}/></div>
                 <div>
                   <div className="text-sm font-bold text-white">Defense</div>
                   <div className="text-[10px] text-gray-500">Vault + Buffer</div>
                 </div>
              </div>
              <div className="font-mono font-bold text-white"><Naira/>{formatNumber(allocation.reserved)}</div>
           </div>

           <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-pink-500/20 text-pink-400 rounded-lg"><Heart size={16}/></div>
                 <div>
                   <div className="text-sm font-bold text-white">Generosity</div>
                   <div className="text-[10px] text-gray-500">Wallet Balance</div>
                 </div>
              </div>
              <div className="font-mono font-bold text-white"><Naira/>{formatNumber(allocation.generosity)}</div>
           </div>

           <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg"><Zap size={16}/></div>
                 <div>
                   <div className="text-sm font-bold text-white">Signals</div>
                   <div className="text-[10px] text-gray-500">Total Generated</div>
                 </div>
              </div>
              <div className="font-mono font-bold text-white"><Naira/>{formatNumber(allocation.signals)}</div>
           </div>
        </div>
      </div>

      {/* DECK D: SMART MINI-LEDGER */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
           <h3 className="font-bold text-white">Recent Activity</h3>
           
           {/* THE TOGGLES */}
           <div className="flex gap-2">
              <button onClick={() => setActivityFilter('ALL')} className={`px-3 py-1 text-xs rounded-lg transition-colors border ${activityFilter === 'ALL' ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-transparent hover:border-white/20'}`}>All</button>
              <button onClick={() => setActivityFilter('IN')} className={`px-3 py-1 text-xs rounded-lg transition-colors border ${activityFilter === 'IN' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-white/5 text-gray-400 border-transparent hover:border-white/20'}`}>Inflow</button>
              <button onClick={() => setActivityFilter('OUT')} className={`px-3 py-1 text-xs rounded-lg transition-colors border ${activityFilter === 'OUT' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-white/5 text-gray-400 border-transparent hover:border-white/20'}`}>Outflow</button>
           </div>
        </div>

        <div className="space-y-2">
           {filteredActivity.length === 0 ? (
             <div className="text-center py-6 text-gray-500 text-xs">No recent activity found for this filter.</div>
           ) : (
             filteredActivity.map(log => {
               // Determine Logic
               const isIncome = log.type === 'DROP' || log.type === 'TRIAGE_SESSION';
               const isSpend = log.type === 'SPEND' || log.type === 'GENEROSITY';
               
               return (
                 <div key={log.id} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors border-b border-white/5 last:border-0 group">
                    <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-full ${isIncome ? 'bg-green-500/10 text-green-500' : isSpend ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                         {isIncome ? <ArrowDownLeft size={14}/> : isSpend ? <ArrowUpRight size={14}/> : <Activity size={14}/>}
                       </div>
                       <div>
                         <div className="text-sm font-bold text-white group-hover:text-gray-200 transition-colors">{log.title}</div>
                         <div className="text-[10px] text-gray-500">{new Date(log.date).toLocaleDateString()} • {log.type}</div>
                       </div>
                    </div>
                    <div className={`font-mono font-bold text-sm ${isIncome ? 'text-green-400' : isSpend ? 'text-red-400' : 'text-white'}`}>
                       {isIncome ? '+' : isSpend ? '-' : ''}{log.amount ? <><Naira/>{formatNumber(log.amount)}</> : '-'}
                    </div>
                 </div>
               );
             })
           )}
        </div>
        
        <div className="mt-4 pt-2 border-t border-white/5 text-center">
            <button onClick={() => navigate('/ledger')} className="text-xs text-gray-500 hover:text-white transition-colors">View Full Ledger History</button>
        </div>
      </GlassCard>

    </div>
  );
};
