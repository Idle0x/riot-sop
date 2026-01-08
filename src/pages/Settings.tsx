import { useState } from 'react';
import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';
import { HistoryLog } from '../types';
import { Settings as Gear, Clock } from 'lucide-react';

export const Settings = () => {
  const { user, updateUser, history } = useFinancials();
  const [newBurn, setNewBurn] = useState(user.burnCap.toString());
  const [reason, setReason] = useState('');

  // Filter history for System Events (Evolution Log)
  const evolutionLog = history.filter(h => h.type === 'SYSTEM_EVENT');

  const handleUpdate = () => {
    // In real app, check for Cooldown logic here
    updateUser({ 
      burnCap: parseFloat(newBurn), 
      // Log the reason implicitly via the system event in Context
    });
    setReason('');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8 pb-20 animate-fade-in">
      <h1 className="text-3xl font-bold text-white">System Configuration</h1>

      {/* CORE SETTINGS */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Gear className="text-gray-400" />
          <h3 className="font-bold text-white">Operating Parameters</h3>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassInput 
              label="Monthly Burn Cap (₦)" 
              type="number" 
              value={newBurn} 
              onChange={e => setNewBurn(e.target.value)} 
            />
            <GlassInput 
              label="Inflation Rate" 
              value={user.inflationRate} 
              readOnly 
              className="opacity-50" 
            />
          </div>
          <GlassInput 
            label="Reason for Change (Required)" 
            placeholder="e.g. Moved apartments, Fuel price increase..." 
            value={reason} 
            onChange={e => setReason(e.target.value)} 
          />
          <GlassButton disabled={!reason || newBurn === user.burnCap.toString()} onClick={handleUpdate}>
            Update Parameters
          </GlassButton>
          <p className="text-xs text-gray-500 mt-2">* Changes take 7 days to fully settle (Cooldown Active).</p>
        </div>
      </GlassCard>

      {/* EVOLUTION LOG */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Evolution Log</h3>
        {evolutionLog.map(log => (
          <div key={log.id} className="flex gap-4 p-4 border-l-2 border-white/10 pl-6 relative">
            <div className="absolute -left-[9px] top-6 w-4 h-4 rounded-full bg-black border-2 border-white/20" />
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Clock size={12}/> {new Date(log.date).toLocaleDateString()}
              </div>
              <h4 className="font-bold text-white text-sm">{log.title}</h4>
              <p className="text-xs text-gray-400">{log.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
