import { useState } from 'react';
import { useLedger } from '../context/LedgerContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Naira } from '../components/ui/Naira'; // RESTORED
import { calculateGenerosityCap, getTierColor } from '../utils/finance';
import { formatNumber } from '../utils/format'; // UPDATED
import { Shield, Users, AlertTriangle, Search, Ban } from 'lucide-react';

export const Generosity = () => {
  const { history, runwayMonths } = useLedger();
  const [searchTerm, setSearchTerm] = useState('');

  const dynamicCap = calculateGenerosityCap(runwayMonths);
  const currentMonth = new Date().toISOString().slice(0, 7); 

  const generosityLogs = history.filter(h => h.tags?.includes('generosity'));
  const monthTotal = generosityLogs
    .filter(log => log.date.startsWith(currentMonth))
    .reduce((sum, log) => sum + (log.amount || 0), 0);

  const remainingCap = Math.max(0, dynamicCap - monthTotal);

  const filteredLogs = generosityLogs.filter(log => 
    (log.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="text-blue-400" /> Generosity Firewall
          </h1>
        </div>

        <GlassCard className="p-4 min-w-[250px] border-blue-500/30">
          <div className="text-xs text-gray-400 uppercase font-bold mb-1">Available to Give</div>
          <div className={`text-2xl font-mono font-bold flex items-center gap-1 ${remainingCap === 0 ? 'text-red-500' : 'text-white'}`}>
            <Naira/>{formatNumber(remainingCap)}
          </div>
          <div className="text-[10px] text-gray-500 mt-1 flex justify-between">
            <span className="flex items-center gap-0.5">Cap: <Naira/>{formatNumber(dynamicCap)}</span>
            <span className="flex items-center gap-0.5">Used: <Naira/>{formatNumber(monthTotal)}</span>
          </div>
        </GlassCard>
      </div>

      {/* ... Keeping Policy Reminder Cards Same ... */}
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-white">Giving Ledger</h3>
           {/* Search Input logic... */}
        </div>

        <div className="space-y-2">
          {filteredLogs.map(log => {
               const tier = log.description?.match(/\[(T\d)\]/)?.[1] || 'T3'; 
               const name = log.description?.split('|')[0] || 'Unknown';
               return (
                <GlassCard key={log.id} className="p-4 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      {name} 
                      <span className={`text-[10px] px-1.5 rounded border ${getTierColor(tier)}`}>{tier}</span>
                    </div>
                    <div className="text-xs text-gray-500">{new Date(log.date).toLocaleDateString()}</div>
                  </div>
                  <div className="font-mono font-bold text-white flex items-center gap-1">
                    <Naira/>{formatNumber(log.amount || 0)}
                  </div>
                </GlassCard>
               );
          })}
        </div>
      </div>
    </div>
  );
};
