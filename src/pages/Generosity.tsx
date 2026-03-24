import { useState } from 'react';
import { useLedger } from '../context/LedgerContext';

// UI COMPONENTS
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { GlassInput } from '../components/ui/GlassInput';
import { Naira } from '../components/ui/Naira';

// UTILS
import { calculateGenerosityCap, getTierColor } from '../utils/finance';
import { formatNumber } from '../utils/format';

// ICONS
import { 
  Shield, Search, Send, Wallet, ArrowDownLeft, 
  ArrowUpRight, Users, AlertTriangle, Ban 
} from 'lucide-react';

export const Generosity = () => {
  const { history, runwayMonths, accounts, updateAccount, commitAction } = useLedger();

  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL'); 

  // Form State
  const [recipient, setRecipient] = useState('');
  const [tier, setTier] = useState('T3');
  const [amount, setAmount] = useState('');

  // --- DERIVED DATA ---
  const generosityWallet = accounts.find(a => a.type === 'generosity');
  const availableBalance = generosityWallet?.balance || 0;

  const dynamicCap = calculateGenerosityCap(runwayMonths);
  const currentMonth = new Date().toISOString().slice(0, 7); 

  // Filter Logs
  const outflowLogs = history.filter(h => h.type === 'GENEROSITY');
  const inflowLogs = history.filter(h => h.type === 'TRANSFER' && h.tags?.includes('generosity_fund'));
  const allLogs = [...outflowLogs, ...inflowLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate Stats
  const monthTotal = outflowLogs
    .filter(log => log.date.startsWith(currentMonth))
    .reduce((sum, log) => sum + (log.amount || 0), 0);

  const displayedLogs = (filter === 'ALL' ? allLogs : filter === 'IN' ? inflowLogs : outflowLogs).filter(log => 
    (log.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- ACTIONS ---
  const handleGive = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0 || val > availableBalance) return;

    updateAccount('generosity', -val);

    commitAction({
      date: new Date().toISOString(),
      type: 'GENEROSITY',
      title: 'Generosity Gift',
      amount: val,
      description: `${recipient} | [${tier}]`,
      tags: ['generosity', tier]
    });

    setRecipient('');
    setAmount('');
  };

  return (
    <div className="max-w-4xl mx-auto p-3 md:p-8 space-y-4 md:space-y-8 pb-16 md:pb-20 animate-fade-in">

      {/* --- HEADER & BALANCE --- */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-3 md:gap-6">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-white flex items-center gap-2 md:gap-3">
            <Shield className="text-blue-400 w-5 h-5 md:w-8 md:h-8" /> Generosity Firewall
          </h1>
          <p className="text-[10px] md:text-sm text-gray-400 mt-0.5 md:mt-1">"I give from abundance, not guilt."</p>
        </div>

        <GlassCard className="p-3 md:p-4 min-w-[200px] md:min-w-[250px] border-blue-500/30">
          <div className="text-[9px] md:text-xs text-gray-400 uppercase font-bold mb-1 flex items-center gap-1.5 md:gap-2">
            <Wallet size={10} className="md:w-3 md:h-3"/> Wallet Balance
          </div>
          <div className={`text-xl md:text-2xl font-mono font-bold flex items-center gap-1 ${availableBalance === 0 ? 'text-gray-500' : 'text-white'}`}>
            <Naira/>{formatNumber(availableBalance)}
          </div>
          <div className="text-[8px] md:text-[10px] text-gray-500 mt-1 md:mt-1.5 flex justify-between font-bold">
            <span className="flex items-center gap-0.5">Rec. Cap: <Naira/>{formatNumber(dynamicCap)}</span>
            <span className="flex items-center gap-0.5">Sent (Mo): <Naira/>{formatNumber(monthTotal)}</span>
          </div>
        </GlassCard>
      </div>

      {/* --- ACTION: DISTRIBUTE FUNDS --- */}
      {availableBalance > 0 && (
        <GlassCard className="p-4 md:p-6 border-green-500/20 bg-green-500/5">
          <h3 className="font-bold text-white mb-3 md:mb-4 flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
            <Send size={14} className="text-green-400 md:w-4 md:h-4"/> Distribute Funds
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 items-end">
             <div className="md:col-span-1">
               <label className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase mb-1 block">Tier Classification</label>
               <select className="w-full bg-black/20 border border-white/10 rounded-lg md:rounded-xl p-2.5 md:p-3 text-white text-xs md:text-sm focus:border-white/30 outline-none" value={tier} onChange={(e) => setTier(e.target.value)}>
                  <option value="T1">T1 (Family)</option>
                  <option value="T2">T2 (Inner Circle)</option>
                  <option value="T3">T3 (One-off)</option>
               </select>
             </div>
             <div className="md:col-span-1">
                <GlassInput label="Recipient Name" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g. John Doe" />
             </div>
             <div className="md:col-span-1">
                <GlassInput label="Amount (NGN)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
             </div>
             <div className="md:col-span-1 mt-1 md:mt-0">
               <GlassButton className="w-full text-xs md:text-sm py-2.5 md:py-3" onClick={handleGive} disabled={!amount || parseFloat(amount) > availableBalance || !recipient}>
                 Send Funds
               </GlassButton>
             </div>
          </div>
        </GlassCard>
      )}

      {/* --- POLICY: THE DEFENSE PROTOCOLS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <GlassCard className="p-4 md:p-6">
          <h3 className="font-bold text-white mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
            <Users size={14} className="md:w-4 md:h-4"/> The Tier System
          </h3>
          <ul className="space-y-2 md:space-y-3 text-[11px] md:text-sm">
            <li className="flex justify-between border-b border-white/5 pb-1.5 md:pb-2">
              <span className="text-green-400 font-bold">T1 (Parents)</span>
              <span className="text-gray-400 text-[9px] md:text-xs font-bold">Priority. Anytime.</span>
            </li>
            <li className="flex justify-between border-b border-white/5 pb-1.5 md:pb-2">
              <span className="text-blue-400 font-bold">T2 (Inner Circle)</span>
              <span className="text-gray-400 text-[9px] md:text-xs font-bold">2-3 People Max.</span>
            </li>
            <li className="flex justify-between border-b border-white/5 pb-1.5 md:pb-2">
              <span className="text-yellow-400 font-bold">T3 (Everyone Else)</span>
              <span className="text-gray-400 text-[9px] md:text-xs font-bold">One Time Only.</span>
            </li>
            <li className="flex justify-between pt-0.5 md:pt-1">
              <span className="text-red-500 font-bold">T4 (Banned)</span>
              <span className="text-gray-400 text-[9px] md:text-xs font-bold">Never.</span>
            </li>
          </ul>
        </GlassCard>

        <GlassCard className="p-4 md:p-6 relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-3 md:p-4 opacity-10"><Ban className="w-12 h-12 md:w-16 md:h-16"/></div>
          <h3 className="font-bold text-white mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
             <AlertTriangle size={14} className="text-red-500 md:w-4 md:h-4"/> Auto-No Protocol
          </h3>
          <p className="text-[11px] md:text-sm text-gray-300 mb-1.5 md:mb-2">Engage if they say:</p>
          <ul className="text-[10px] md:text-xs text-gray-400 space-y-1 mb-3 md:mb-4 italic pl-3 md:pl-4 border-l-2 border-red-500/30">
            <li>"You have money now..."</li>
            <li>"I'll pay you back soon..." <span className="text-gray-500">(Assume it's a gift)</span></li>
            <li>"You've changed..."</li>
          </ul>
          <div className="p-1.5 md:p-2 bg-white/5 rounded border border-white/10 text-[9px] md:text-xs text-center font-mono text-white font-bold">
            RESPONSE: "Budget finished. Next month."
          </div>
        </GlassCard>
      </div>

      {/* --- LEDGER: HISTORY & LOOKUP --- */}
      <div className="space-y-3 md:space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 md:gap-4">
          <h3 className="font-bold text-white text-sm md:text-base">Passbook</h3>

          {/* Filters */}
          <div className="flex gap-1.5 md:gap-2">
             <button onClick={() => setFilter('ALL')} className={`px-2.5 py-1 md:px-3 text-[9px] md:text-xs font-bold rounded-lg transition-colors border ${filter === 'ALL' ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-transparent hover:border-white/20'}`}>All</button>
             <button onClick={() => setFilter('IN')} className={`px-2.5 py-1 md:px-3 text-[9px] md:text-xs font-bold rounded-lg transition-colors border ${filter === 'IN' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-white/5 text-gray-400 border-transparent hover:border-white/20'}`}>Inflows</button>
             <button onClick={() => setFilter('OUT')} className={`px-2.5 py-1 md:px-3 text-[9px] md:text-xs font-bold rounded-lg transition-colors border ${filter === 'OUT' ? 'bg-pink-500/20 text-pink-400 border-pink-500/50' : 'bg-white/5 text-gray-400 border-transparent hover:border-white/20'}`}>Gifts</button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-48">
             <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 w-3 h-3 md:w-3.5 md:h-3.5"/>
             <input 
               className="w-full bg-black/20 border border-white/10 rounded-lg py-1.5 md:py-2 pl-7 md:pl-8 pr-2 md:pr-3 text-[10px] md:text-xs text-white focus:border-white/30 outline-none"
               placeholder="Check Name..."
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
        </div>

        <div className="space-y-2">
          {displayedLogs.length === 0 ? (
            <div className="text-center py-6 md:py-8 text-gray-500 text-xs md:text-sm font-bold">No records found.</div>
          ) : (
            displayedLogs.map(log => {
               const isOutflow = log.type === 'GENEROSITY';

               if (isOutflow) {
                   const tier = log.description?.match(/\[(T\d)\]/)?.[1] || 'T3'; 
                   const name = log.description?.split('|')[0] || 'Unknown';
                   return (
                    <GlassCard key={log.id} className="p-3 md:p-4 flex justify-between items-center border-l-[3px] md:border-l-4 border-l-pink-500 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                         <div className="p-1.5 md:p-2 bg-pink-500/10 text-pink-500 rounded-md md:rounded-full shrink-0"><ArrowUpRight size={14} className="md:w-4 md:h-4"/></div>
                         <div className="min-w-0">
                            <div className="font-bold text-white flex items-center gap-1.5 md:gap-2 text-[11px] md:text-sm truncate">
                            <span className="truncate">{name}</span>
                            <span className={`text-[8px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded border shrink-0 ${getTierColor(tier)}`}>{tier}</span>
                            </div>
                            <div className="text-[9px] md:text-xs text-gray-500 mt-0.5">{new Date(log.date).toLocaleDateString()}</div>
                         </div>
                      </div>
                      <div className="font-mono font-bold text-pink-400 flex items-center gap-0.5 md:gap-1 text-xs md:text-sm shrink-0 pl-2">
                        -<Naira/>{formatNumber(log.amount || 0)}
                      </div>
                    </GlassCard>
                   );
               } else {
                   return (
                    <GlassCard key={log.id} className="p-3 md:p-4 flex justify-between items-center border-l-[3px] md:border-l-4 border-l-green-500 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                         <div className="p-1.5 md:p-2 bg-green-500/10 text-green-500 rounded-md md:rounded-full shrink-0"><ArrowDownLeft size={14} className="md:w-4 md:h-4"/></div>
                         <div className="min-w-0">
                            <div className="font-bold text-white text-[11px] md:text-sm truncate">Wallet Allocation</div>
                            <div className="text-[9px] md:text-xs text-gray-500 mt-0.5 truncate">{new Date(log.date).toLocaleDateString()} • From Triage</div>
                         </div>
                      </div>
                      <div className="font-mono font-bold text-green-400 flex items-center gap-0.5 md:gap-1 text-xs md:text-sm shrink-0 pl-2">
                        +<Naira/>{formatNumber(log.amount || 0)}
                      </div>
                    </GlassCard>
                   );
               }
            })
          )}
        </div>
      </div>
    </div>
  );
};
