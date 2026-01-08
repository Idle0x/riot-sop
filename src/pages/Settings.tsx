import { useState } from 'react';
import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';
import { Settings as Gear, Clock, ShieldAlert } from 'lucide-react';

export const Settings = () => {
  const { user, updateUser, history, nuclearReset } = useFinancials();
  const [newBurn, setNewBurn] = useState(user.burnCap.toString());
  const [reason, setReason] = useState('');
  
  // Nuclear State
  const [nuclearStep, setNuclearStep] = useState(0);
  const [masterPass, setMasterPass] = useState('');

  // Filter history for System Events
  const evolutionLog = history.filter(h => h.type === 'SYSTEM_EVENT');

  const handleUpdate = () => {
    // Queue the change for 7 days later
    const effectiveDate = new Date();
    effectiveDate.setDate(effectiveDate.getDate() + 7);

    const pending = [
      ...user.pendingChanges, 
      { 
        id: crypto.randomUUID(), 
        key: 'burnCap' as any, 
        value: parseFloat(newBurn), 
        effectiveDate: effectiveDate.toISOString() 
      }
    ];

    updateUser({ pendingChanges: pending });
    setReason('');
    alert("Change Queued: Will apply in 7 days.");
  };

  const executeNuclear = () => {
    const success = nuclearReset(masterPass);
    if (success) {
      alert("SYSTEM RESET COMPLETE. GODSPEED.");
      window.location.reload();
    } else {
      alert("Invalid Master Password.");
    }
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
            <GlassInput label="Monthly Burn Cap (₦)" type="number" value={newBurn} onChange={e => setNewBurn(e.target.value)} />
            <GlassInput label="Inflation Rate" value={user.inflationRate} readOnly className="opacity-50" />
          </div>
          <GlassInput label="Reason for Change" placeholder="Required for audit..." value={reason} onChange={e => setReason(e.target.value)} />
          
          <GlassButton disabled={!reason || newBurn === user.burnCap.toString()} onClick={handleUpdate}>
            Queue Update (7 Days)
          </GlassButton>

          {/* Pending Changes Display */}
          {user.pendingChanges.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <h4 className="text-xs font-bold text-yellow-500 uppercase mb-2">Pending Cooldowns</h4>
              {user.pendingChanges.map(c => (
                <div key={c.id} className="text-xs text-gray-300 flex justify-between">
                  <span>Change {c.key} to {c.value}</span>
                  <span className="font-mono text-gray-500">{new Date(c.effectiveDate).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>

      {/* NUCLEAR ZONE */}
      <GlassCard className="p-6 border-red-900/30">
          <h3 className="font-bold text-red-500 mb-2 flex items-center gap-2">
            <ShieldAlert size={18}/> Danger Zone
          </h3>
          
          {nuclearStep === 0 ? (
             <button 
               onClick={() => setNuclearStep(1)}
               className="w-full py-3 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-sm font-bold transition-all"
             >
               Initiate Nuclear Reset
             </button>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <p className="text-sm text-red-400 font-bold uppercase">This will wipe all data. Irreversible.</p>
              <GlassInput 
                type="password" 
                placeholder="Enter Master Key to Confirm" 
                value={masterPass} 
                onChange={e => setMasterPass(e.target.value)}
              />
              <div className="flex gap-2">
                <GlassButton variant="ghost" onClick={() => setNuclearStep(0)} className="flex-1">Cancel</GlassButton>
                <GlassButton variant="danger" onClick={executeNuclear} className="flex-1">NUKE IT</GlassButton>
              </div>
            </div>
          )}
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
