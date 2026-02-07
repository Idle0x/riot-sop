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

    // 1. Update Ledger
    updateAccount('generosity', -val);
    
    // 2. Commit Action
    commitAction({
      date: new Date().toISOString(),
      type: 'GENEROSITY',
      title: 'Generosity Gift',
      amount: val,
      description: `${recipient} | [${tier}]`,
      tags: ['generosity', tier]
    });

    // 3. Reset Form
    setRecipient('');
    setAmount('');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-20 animate-fade-in">

      {/* --- HEADER & BALANCE --- */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="text-blue-400" /> Generosity Firewall
          </h1>
          <p className="text-gray-400 mt-1">"I give from abundance, not guilt."</p>
        </div>

        <GlassCard className="p-4 min-w-[250px] border-blue-500/30">
          <div className="text-xs text-gray-400 uppercase font-bold mb-1 flex items-center gap-2">
            <Wallet size={12}/> Wallet Balance
          </div>
          <div className={`text-2xl font-mono font-bold flex items-center gap-1 ${availableBalance === 0 ? 'text-gray-500' : 'text-white'}`}>
            <Naira/>{formatNumber(availableBalance)}
          </div>
          <div className="text-[10px] text-gray-500 mt-1 flex justify-between">
            <span className="flex items-center gap-0.5">Rec. Cap: <Naira/>{formatNumber(dynamicCap)}</span>
            <span className="flex items-center gap-0.5">Sent (Mo): <Naira/>{formatNumber(monthTotal)}</span>
          </div>
        </GlassCard>
      </div>

      {/* --- ACTION: DISTRIBUTE FUNDS (New) --- */}
      {availableBalance > 0 && (
        <GlassCard className="p-6 border-green-500/20 bg-green-500/5">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Send size={16} className="text-green-400"/> Distribute Funds
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
             <div className="md:col-span-1">
               <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Tier Classification</label>
               <select className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-white/30 outline-none" value={tier} onChange={(e) => setTier(e.target.value)}>
                  <option value="T1">T1 (Family)</option>
                  <option value="T2">T2 (Inner Circle)</option>
                  <option value="T3">T3 (One-off)</option>
               </select>
             </div>
             <div className="md:col-span-1">
                <GlassInput label="Recipient Name" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g. John Doe"/>
             </div>
             <div className="md:col-span-1">
                <GlassInput label="Amount (NGN)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"/>
             </div>
             <div className="md:col-span-1">
               <GlassButton className="w-full" onClick={handleGive} disabled={!amount || parseFloat(amount) > availableBalance || !recipient}>
                 Send Funds
               </GlassButton>
             </div>
          </div>
        </GlassCard>
      )}

      {/* --- POLICY: THE DEFENSE PROTOCOLS (Restored from Old Code) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <Users size={16}/> The Tier System
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-green-400 font-bold">T1 (Parents)</span>
              <span className="text-gray-400 text-xs">Priority. Anytime.</span>
            </li>
            <li className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-blue-400 font-bold">T2 (Inner Circle)</span>
              <span className="text-gray-400 text-xs">2-3 People Max.</span>
            </li>
            <li className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-yellow-400 font-bold">T3 (Everyone Else)</span>
              <span className="text-gray-400 text-xs">One Time Only.</span>
            </li>
            <li className="flex justify-between pt-1">
              <span className="text-red-500 font-bold">T4 (Banned)</span>
              <span className="text-gray-400 text-xs">Never.</span>
            </li>
          </ul>
        </GlassCard>

        <GlassCard className="p-6 relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Ban size={64}/></div>
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
             <AlertTriangle size={16} className="text-red-500"/> Auto-No Protocol
          </h3>
          <p className="text-sm text-gray-300 mb-2">Engage if they say:</p>
          <ul className="text-xs text-gray-400 space-y-1 mb-4 italic pl-4 border-l-2 border-red-500/30">
            <li>"You have money now..."</li>
            <li>"I'll pay you back soon..." (Assume it's a gift)</li>
            <li>"You've changed..."</li>
          </ul>
          <div className="p-2 bg-white/5 rounded border border-white/10 text-xs text-center font-mono text-white">
            RESPONSE: "Budget finished. Next month."
          </div>
        </GlassCard>
      </div>

      {/* --- LEDGER: HISTORY & LOOKUP --- */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <h3 className="font-bold text-white">Passbook</h3>

          {/* Filters */}
          <div className="flex gap-2">
             <button onClick={() => setFilter('ALL')} className={`px-3 py-1 text-xs rounded-lg transition-colors border ${filter === 'ALL' ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-transparent hover:border-white/20'}`}>All</button>
             <button onClick={() => setFilter('IN')} className={`px-3 py-1 text-xs rounded-lg transition-colors border ${filter === 'IN' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-white/5 text-gray-400 border-transparent hover:border-white/20'}`}>Inflows</button>
             <button onClick={() => setFilter('OUT')} className={`px-3 py-1 text-xs rounded-lg transition-colors border ${filter === 'OUT' ? 'bg-pink-500/20 text-pink-400 border-pink-500/50' : 'bg-white/5 text-gray-400 border-transparent hover:border-white/20'}`}>Gifts</button>
          </div>

          {/* Search */}
          <div className="relative w-48">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14}/>
             <input 
               className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:border-white/30 outline-none"
               placeholder="Check Name..."
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
        </div>

        <div className="space-y-2">
          {displayedLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No records found.</div>
          ) : (
            displayedLogs.map(log => {
               const isOutflow = log.type === 'GENEROSITY';

               if (isOutflow) {
                   const tier = log.description?.match(/\[(T\d)\]/)?.[1] || 'T3'; 
                   const name = log.description?.split('|')[0] || 'Unknown';
                   return (
                    <GlassCard key={log.id} className="p-4 flex justify-between items-center border-l-4 border-l-pink-500 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-pink-500/10 text-pink-500 rounded-full"><ArrowUpRight size={16}/></div>
                         <div>
                            <div className="font-bold text-white flex items-center gap-2">
                            {name} 
                            <span className={`text-[10px] px-1.5 rounded border ${getTierColor(tier)}`}>{tier}</span>
                            </div>
                            <div className="text-xs text-gray-500">{new Date(log.date).toLocaleDateString()}</div>
                         </div>
                      </div>
                      <div className="font-mono font-bold text-pink-400 flex items-center gap-1">
                        -<Naira/>{formatNumber(log.amount || 0)}
                      </div>
                    </GlassCard>
                   );
               } else {
                   // INFLOW
                   return (
                    <GlassCard key={log.id} className="p-4 flex justify-between items-center border-l-4 border-l-green-500 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-green-500/10 text-green-500 rounded-full"><ArrowDownLeft size={16}/></div>
                         <div>
                            <div className="font-bold text-white">Wallet Allocation</div>
                            <div className="text-xs text-gray-500">{new Date(log.date).toLocaleDateString()} • From Triage</div>
                         </div>
                      </div>
                      <div className="font-mono font-bold text-green-400 flex items-center gap-1">
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
