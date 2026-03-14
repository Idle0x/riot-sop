import { Link } from 'react-router-dom';
import { useLedger } from '../context/LedgerContext';
import { useUser } from '../context/UserContext';

// UI COMPONENTS
import { GlassCard } from '../components/ui/GlassCard';
import { Naira } from '../components/ui/Naira';
import { formatNumber } from '../utils/format';
import { ActionCenter } from '../components/ActionCenter';

// ICONS
import { 
  Wallet, Shield, Flame, Activity, TrendingUp, Target, 
  ArrowRight, HeartHandshake, Box, Lock 
} from 'lucide-react';

export const Dashboard = () => {
  const { user } = useUser();
  const { 
    accounts, 
    goals, 
    budgets, 
    runwayMonths, 
    realRunwayMonths, 
    monthlyBurn, 
    totalLiquid, 
    unallocatedCash 
  } = useLedger();

  // Helper to extract specific account balances safely
  const getBalance = (type: string) => accounts.find(a => a.type === type)?.balance || 0;

  const treasuryBalance = getBalance('treasury');
  const payrollBalance = getBalance('payroll');
  const generosityBalance = getBalance('generosity');

  const activeGoals = goals.filter(g => !g.isCompleted);
  const activeBudgets = budgets.filter(b => b.amount > 0);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Welcome back, {(user as any)?.name?.split(' ')[0] || 'Operator'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            System status: <span className="text-green-400 font-mono">NOMINAL</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Local Time</p>
          <p className="text-sm font-mono text-gray-300">
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </p>
        </div>
      </div>

      {/* --- THE ACTION CENTER WIDGET --- */}
      {/* (It will vanish automatically when there are no active anomalies) */}
      <ActionCenter />

      {/* --- TIER 1: EXECUTIVE RIBBON --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Liquid Capital */}
        <GlassCard className="p-5 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
          <div className="flex items-center gap-2 mb-2 text-blue-400">
            <Wallet size={18}/> <span className="text-xs font-bold uppercase tracking-wider">Total Liquid</span>
          </div>
          <div className="text-3xl font-mono font-bold text-white">
            <Naira/>{formatNumber(totalLiquid)}
          </div>
          <div className="mt-2 text-xs text-gray-500 flex justify-between items-center">
             <span>Vault + Payroll</span>
             <Link to="/ledger" className="text-blue-400/0 group-hover:text-blue-400 transition-colors"><ArrowRight size={14}/></Link>
          </div>
        </GlassCard>

        {/* Burn Velocity */}
        <GlassCard className="p-5 relative overflow-hidden group hover:border-red-500/50 transition-colors">
          <div className="flex items-center gap-2 mb-2 text-red-400">
            <Flame size={18}/> <span className="text-xs font-bold uppercase tracking-wider">Burn Velocity</span>
          </div>
          <div className="text-3xl font-mono font-bold text-white">
            <Naira/>{formatNumber(monthlyBurn)}<span className="text-sm text-gray-500 font-normal">/mo</span>
          </div>
          <div className="mt-2 text-xs text-gray-500 flex justify-between items-center">
             <span>Active Protocols</span>
             <Link to="/budgets" className="text-red-400/0 group-hover:text-red-400 transition-colors"><ArrowRight size={14}/></Link>
          </div>
        </GlassCard>

        {/* Operational Runway */}
        <GlassCard className="p-5 relative overflow-hidden group hover:border-green-500/50 transition-colors">
          <div className="flex items-center gap-2 mb-2 text-green-400">
            <Activity size={18}/> <span className="text-xs font-bold uppercase tracking-wider">Ops Runway</span>
          </div>
          <div className="text-3xl font-mono font-bold text-white">
            {runwayMonths.toFixed(1)} <span className="text-sm text-gray-500 font-normal">months</span>
          </div>
          <div className="mt-2 text-xs text-gray-500 flex justify-between items-center">
             <span>Real (Inflation Adj): {realRunwayMonths.toFixed(1)}m</span>
          </div>
        </GlassCard>

        {/* Unallocated Holding */}
        <GlassCard className="p-5 relative overflow-hidden group border-yellow-500/30 bg-yellow-950/10 hover:border-yellow-500/50 transition-colors">
          <div className="flex items-center gap-2 mb-2 text-yellow-400">
            <Box size={18}/> <span className="text-xs font-bold uppercase tracking-wider">Holding / Unallocated</span>
          </div>
          <div className="text-3xl font-mono font-bold text-yellow-500">
            <Naira/>{formatNumber(unallocatedCash)}
          </div>
          <div className="mt-2 text-xs text-yellow-500/60 flex justify-between items-center">
             <span>Requires Triage</span>
             <Link to="/triage" className="text-yellow-400/0 group-hover:text-yellow-400 transition-colors"><ArrowRight size={14}/></Link>
          </div>
        </GlassCard>

      </div>

      {/* --- TIER 2: CAPITAL DEPLOYMENT & RESERVES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* The Vaults */}
        <GlassCard className="p-6 col-span-1 flex flex-col gap-6">
           <h3 className="font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
             <Shield size={20} className="text-purple-400"/> Core Reserves
           </h3>
           
           <div className="space-y-4 flex-1">
              <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><Lock size={20}/></div>
                    <div>
                       <h4 className="font-bold text-gray-200">Cold Storage</h4>
                       <p className="text-[10px] text-gray-500">Tier 3 / Treasury</p>
                    </div>
                 </div>
                 <div className="text-right font-mono font-bold text-lg text-white">
                    <Naira/>{formatNumber(treasuryBalance)}
                 </div>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 text-green-400 rounded-lg"><TrendingUp size={20}/></div>
                    <div>
                       <h4 className="font-bold text-gray-200">Payroll</h4>
                       <p className="text-[10px] text-gray-500">Tier 2 / Active Capital</p>
                    </div>
                 </div>
                 <div className="text-right font-mono font-bold text-lg text-white">
                    <Naira/>{formatNumber(payrollBalance)}
                 </div>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg"><HeartHandshake size={20}/></div>
                    <div>
                       <h4 className="font-bold text-gray-200">Generosity Firewall</h4>
                       <p className="text-[10px] text-gray-500">Protected Outflow</p>
                    </div>
                 </div>
                 <div className="text-right font-mono font-bold text-lg text-white">
                    <Naira/>{formatNumber(generosityBalance)}
                 </div>
              </div>
           </div>
        </GlassCard>

        {/* Active Protocols (Budgets) */}
        <GlassCard className="p-6 col-span-1 lg:col-span-2 flex flex-col">
           <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                 <Activity size={20} className="text-red-400"/> Operational Protocols
              </h3>
              <Link to="/budgets" className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                 View All <ArrowRight size={12}/>
              </Link>
           </div>
           
           <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[300px]">
              {activeBudgets.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-gray-500 italic py-8">
                    <Activity size={32} className="mb-2 opacity-20"/>
                    No active budgets defined.
                 </div>
              ) : (
                 activeBudgets.map(b => {
                    const percentage = b.amount > 0 ? Math.min(100, (b.spent / b.amount) * 100) : 0;
                    const isOver = b.spent > b.amount;
                    return (
                       <div key={b.id} className="bg-black/20 p-4 rounded-xl border border-white/5">
                          <div className="flex justify-between items-end mb-2">
                             <div>
                                <h4 className="font-bold text-gray-200">{b.name}</h4>
                                <div className="text-[10px] text-gray-500 uppercase">{b.frequency}</div>
                             </div>
                             <div className="text-right">
                                <span className={`font-mono font-bold ${isOver ? 'text-red-500' : 'text-white'}`}>
                                   <Naira/>{formatNumber(b.spent)}
                                </span>
                                <span className="text-gray-500 text-xs font-mono"> / <Naira/>{formatNumber(b.amount)}</span>
                             </div>
                          </div>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                             <div 
                               className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : percentage > 85 ? 'bg-orange-500' : 'bg-blue-500'}`} 
                               style={{ width: `${percentage}%` }}
                             />
                          </div>
                       </div>
                    )
                 })
              )}
           </div>
        </GlassCard>
      </div>

      {/* --- TIER 3: ACTIVE MISSIONS --- */}
      <GlassCard className="p-6">
         <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
               <Target size={20} className="text-green-400"/> Active Missions
            </h3>
            <Link to="/goals" className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
               Go to War Room <ArrowRight size={12}/>
            </Link>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.length === 0 ? (
               <div className="col-span-1 md:col-span-2 text-center py-8 text-gray-500 italic border border-dashed border-white/10 rounded-xl">
                  No active missions. Proceed to the War Room to define targets.
               </div>
            ) : (
               activeGoals.slice(0, 4).map(g => {
                  const percentage = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
                  return (
                     <div key={g.id} className="bg-black/30 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                           <div>
                              <h4 className="font-bold text-white truncate max-w-[200px]">{g.title}</h4>
                              <div className="text-[10px] text-gray-500 uppercase tracking-wider">{g.type} • {g.phase}</div>
                           </div>
                           <div className="text-right">
                              <div className="font-mono font-bold text-green-400">{percentage.toFixed(0)}%</div>
                           </div>
                        </div>
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-2">
                           <div className="bg-green-500 h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }} />
                        </div>
                        <div className="flex justify-between text-xs font-mono text-gray-500">
                           <span><Naira/>{formatNumber(g.currentAmount)}</span>
                           <span><Naira/>{formatNumber(g.targetAmount)}</span>
                        </div>
                     </div>
                  )
               })
            )}
         </div>
      </GlassCard>

    </div>
  );
};
