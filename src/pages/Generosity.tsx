import { useState } from 'react';
import { useLedger } from '../context/LedgerContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { GlassInput } from '../components/ui/GlassInput';
import { Naira } from '../components/ui/Naira';
import { calculateGenerosityCap, getTierColor } from '../utils/finance';
import { formatNumber } from '../utils/format';
import { 
  Shield, Search, Send, Wallet, ArrowDownLeft, 
  ArrowUpRight, Users, AlertTriangle, Ban 
} from 'lucide-react';

export const Generosity = () => {
  const { history, runwayMonths, accounts, updateAccount, commitAction } = useLedger();
  
  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL'); 
  const [recipient, setRecipient] = useState('');
  const [tier, setTier] = useState('T3');
  const [amount, setAmount] = useState('');

  // --- DATA ENGINE ---
  const generosityWallet = accounts.find(a => a.type === 'generosity');
  const availableBalance = generosityWallet?.balance || 0;
  const dynamicCap = calculateGenerosityCap(runwayMonths);
  const currentMonth = new Date().toISOString().slice(0, 7); 

  const outflowLogs = history.filter(h => h.type === 'GENEROSITY');
  const inflowLogs = history.filter(h => h.type === 'TRANSFER' && h.tags?.includes('generosity_fund'));
  const allLogs = [...outflowLogs, ...inflowLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const monthTotal = outflowLogs
    .filter(log => log.date.startsWith(currentMonth))
    .reduce((sum, log) => sum + (log.amount || 0), 0);

  const remainingCap = Math.max(0, dynamicCap - monthTotal);

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

  const displayedLogs = (filter === 'ALL' ? allLogs : filter === 'IN' ? inflowLogs : outflowLogs).filter(log => 
    (log.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 pb-20 animate-fade-in">

      {/* --- HEADER: THE FIREWALL STATUS --- */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-3 tracking-tighter">
            <Shield className="text-blue-500" size={32} /> GENEROSITY FIREWALL
          </h1>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">
            "I give from abundance, not guilt."
          </p>
        </div>

        <GlassCard className="p-6 min-w-[300px] border-blue-500/20 bg-blue-500/5">
          <div className="text-[10px] text-blue-400 uppercase font-black tracking-widest mb-2 flex items-center gap-2">
            <Wallet size={14}/> Wallet Balance
          </div>
          <div className="text-3xl font-mono font-bold text-white flex items-center gap-2 mb-4">
            <Naira/>{formatNumber(availableBalance)}
          </div>
          <div className="space-y-2 border-t border-white/5 pt-3">
             <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                <span className="text-gray-500">Monthly Safety Cap:</span>
                <span className="text-white"><Naira/>{formatNumber(dynamicCap)}</span>
             </div>
             <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                <span className="text-gray-500">Remaining Allowance:</span>
                <span className={remainingCap === 0 ? 'text-red-500' : 'text-green-400'}>
                  <Naira/>{formatNumber(remainingCap)}
                </span>
             </div>
          </div>
        </GlassCard>
      </div>

      {/* --- DISTRIBUTION ENGINE --- */}
      <GlassCard className={`p-8 border-green-500/30 bg-green-500/5 relative overflow-hidden ${availableBalance === 0 ? 'opacity-50 grayscale' : ''}`}>
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><Send size={120}/></div>
        <h3 className="text-sm font-black text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
          <Send size={18} className="text-green-400"/> Authorize Distribution
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end relative z-10">
           <div className="md:col-span-1">
             <label className="text-[10px] font-black text-gray-500 uppercase mb-2 block tracking-widest">Priority Tier</label>
             <select className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-green-500/50 transition-all" value={tier} onChange={(e) => setTier(e.target.value)}>
                <option value="T1">T1 (Immediate Family)</option>
                <option value="T2">T2 (Inner Circle)</option>
                <option value="T3">T3 (One-off / Casual)</option>
             </select>
           </div>
           <div className="md:col-span-1">
              <GlassInput label="Recipient Name" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Full Name"/>
           </div>
           <div className="md:col-span-1">
              <GlassInput label="Amount (NGN)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"/>
           </div>
           <div className="md:col-span-1">
             <GlassButton 
              className="w-full h-14 bg-green-500 text-black font-black uppercase tracking-widest hover:bg-green-400 transition-all disabled:bg-white/5 disabled:text-gray-600" 
              onClick={handleGive} 
              disabled={!amount || parseFloat(amount) > availableBalance || parseFloat(amount) > remainingCap}
             >
               Execute Gift
             </GlassButton>
           </div>
        </div>
      </GlassCard>

      {/* --- PROTOCOLS (RESTORED FROM OLD) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <GlassCard className="p-8 border-white/5">
          <h3 className="text-xs font-black text-gray-400 mb-6 flex items-center gap-2 uppercase tracking-[0.2em]">
            <Users size={16} className="text-blue-400"/> Operational Tiers
          </h3>
          <ul className="space-y-4">
            {[
              { t: 'T1', label: 'Parents / Dependents', desc: 'Priority funding. No questions.', color: 'text-green-400', border: 'border-green-400/30' },
              { t: 'T2', label: 'Inner Circle', desc: '2-3 people max. Systemic support.', color: 'text-blue-400', border: 'border-blue-400/30' },
              { t: 'T3', label: 'Everyone Else', desc: 'One-time one-offs only.', color: 'text-yellow-400', border: 'border-yellow-400/30' },
              { t: 'T4', label: 'Banned', desc: 'Zero allocation. Permanent blacklist.', color: 'text-red-500', border: 'border-red-500/30' }
            ].map(item => (
              <li key={item.t} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                <div className="flex items-center gap-3">
                   <span className={`text-[10px] font-black px-2 py-1 rounded border ${item.color} ${item.border}`}>{item.t}</span>
                   <span className="text-sm font-bold text-white">{item.label}</span>
                </div>
                <span className="text-[10px] text-gray-500 italic">{item.desc}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="p-8 relative overflow-hidden border-red-500/10 bg-red-500/5">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none"><Ban size={80}/></div>
          <h3 className="text-xs font-black text-red-500 mb-6 flex items-center gap-2 uppercase tracking-[0.2em]">
             <AlertTriangle size={16}/> Auto-No Protocol
          </h3>
          <p className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-widest">Execute "No" if context includes:</p>
          <div className="space-y-3 mb-6">
            {['"You have money now..."', '"I\'ll pay you back soon..." (Loan Trap)', '"You\'ve changed..."'].map((quote, i) => (
              <div key={i} className="p-3 bg-black/40 rounded-xl border border-white/5 text-xs italic text-gray-500">
                {quote}
              </div>
            ))}
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-dashed border-white/10 text-xs text-center font-mono text-white uppercase tracking-widest animate-pulse">
            "Budget reached. Try next month."
          </div>
        </GlassCard>
      </div>

      {/* --- PASSBOOK --- */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-white/5 pb-4">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">System Passbook</h3>

          <div className="flex items-center gap-4">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
               {['ALL', 'IN', 'OUT'].map(f => (
                 <button 
                  key={f}
                  onClick={() => setFilter(f as any)} 
                  className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${filter === f ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                 >
                   {f === 'OUT' ? 'Gifts' : f === 'IN' ? 'Inflow' : 'All'}
                 </button>
               ))}
            </div>

            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14}/>
               <input 
                 className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-[10px] font-bold text-white uppercase tracking-widest outline-none focus:border-white/30"
                 placeholder="Search Recipient..."
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {displayedLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-600 font-black text-[10px] uppercase tracking-[0.4em]">No Passbook Records</div>
          ) : (
            displayedLogs.map(log => {
               const isOutflow = log.type === 'GENEROSITY';

               if (isOutflow) {
                   const tierTag = log.description?.match(/\[(T\d)\]/)?.[1] || 'T3'; 
                   const name = log.description?.split('|')[0] || 'Unknown';
                   return (
                    <GlassCard key={log.id} className="p-5 flex justify-between items-center border-pink-500/10 hover:bg-pink-500/5 transition-colors group">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-pink-500/10 text-pink-500 rounded-2xl group-hover:scale-110 transition-transform"><ArrowUpRight size={18}/></div>
                         <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2 uppercase tracking-tight">
                            {name} 
                            <span className={`text-[9px] px-2 py-0.5 rounded-full border ${getTierColor(tierTag)} font-black`}>{tierTag}</span>
                            </div>
                            <div className="text-[10px] text-gray-600 font-mono mt-1 uppercase">{new Date(log.date).toLocaleDateString()}</div>
                         </div>
                      </div>
                      <div className="font-mono font-bold text-pink-400 text-lg">
                        -<Naira/>{formatNumber(log.amount || 0)}
                      </div>
                    </GlassCard>
                   );
               } else {
                   return (
                    <GlassCard key={log.id} className="p-5 flex justify-between items-center border-green-500/10 hover:bg-green-500/5 transition-colors group">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-green-500/10 text-green-400 rounded-2xl group-hover:scale-110 transition-transform"><ArrowDownLeft size={18}/></div>
                         <div>
                            <div className="font-bold text-white text-sm uppercase tracking-tight">Wallet Allocation</div>
                            <div className="text-[10px] text-gray-600 font-mono mt-1 uppercase">{new Date(log.date).toLocaleDateString()} • System Triage</div>
                         </div>
                      </div>
                      <div className="font-mono font-bold text-green-400 text-lg">
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
