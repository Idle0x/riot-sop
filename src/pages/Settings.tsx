import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useLedger, type ResetModule } from '../context/LedgerContext';

// COMPONENTS
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';

// ICONS
import { 
  Settings as Gear, ShieldAlert, Landmark, Lock, 
  Trash2, AlertTriangle, XCircle 
} from 'lucide-react';

export const Settings = () => {
  const { user, updateProfile } = useUser();
  const { resetModule, commitAction } = useLedger();

  // Core Settings States
  const [newBurn, setNewBurn] = useState(user?.burnCap?.toString() || '');
  const [newInflation, setNewInflation] = useState(user?.inflationRate?.toString() || '0');
  const [reason, setReason] = useState('');
  const [rent, setRent] = useState(user?.annualRent?.toString() || '0');

  // Security States
  const [nuclearStep, setNuclearStep] = useState(0); // 0=Idle, 1=Key, 2=FinalConfirm
  const [masterPassInput, setMasterPassInput] = useState('');
  const [newMasterKey, setNewMasterKey] = useState('');
  
  // Reset Selection
  const [selectedReset, setSelectedReset] = useState<ResetModule | null>(null);

  const hasMasterKey = !!user?.settings?.masterKey;

  // --- HANDLERS ---

  const handleUpdateProfile = async () => {
    const effectiveDate = new Date();
    effectiveDate.setDate(effectiveDate.getDate() + 7);

    if (!user) return;

    // Log the changes if significant
    if (parseFloat(newBurn) !== user.burnCap) {
        commitAction({ date: new Date().toISOString(), type: 'SYSTEM_EVENT', title: 'Burn Cap Updated', description: `${user.burnCap} -> ${newBurn}` });
    }
    if (parseFloat(newInflation) !== user.inflationRate) {
        commitAction({ date: new Date().toISOString(), type: 'SYSTEM_EVENT', title: 'Inflation Rate Adjusted', description: `${user.inflationRate}% -> ${newInflation}%` });
    }

    await updateProfile({ 
      annualRent: parseFloat(rent), 
      inflationRate: parseFloat(newInflation),
      pendingChanges: [
        ...(user.pendingChanges || []), 
        { 
          id: crypto.randomUUID(), 
          key: 'burnCap' as any, 
          value: parseFloat(newBurn), 
          effectiveDate: effectiveDate.toISOString() 
        }
      ] 
    });
    setReason('');
    alert("Profile Updated: Changes logged.");
  };

  const handleSetMasterKey = async () => {
    if (!newMasterKey || newMasterKey.length < 6) {
      alert("Master Key must be at least 6 characters.");
      return;
    }
    await updateProfile({
      settings: {
        ...user?.settings,
        allowNegativeBalance: user?.settings?.allowNegativeBalance || false,
        monthlyCheckpointDay: user?.settings?.monthlyCheckpointDay || 1,
        masterKey: newMasterKey
      }
    });
    setNewMasterKey('');
    alert("Master Key Established. Do not lose this.");
  };

  const verifyKey = () => {
      if (masterPassInput === user?.settings?.masterKey) {
          setNuclearStep(2); // Move to Final Confirmation
      } else {
          alert("Invalid Master Password.");
      }
  };

  const executeReset = () => {
      if (selectedReset) {
          resetModule(selectedReset);
          alert(`${selectedReset.toUpperCase()} RESET EXECUTED.`);
          // Reset State
          setNuclearStep(0);
          setMasterPassInput('');
          setSelectedReset(null);
      }
  };

  const initiateReset = (module: ResetModule) => {
      setSelectedReset(module);
      setNuclearStep(1);
  };

  const cancelReset = () => {
      setNuclearStep(0);
      setMasterPassInput('');
      setSelectedReset(null);
  };

  if (!user) return <div>Loading settings...</div>;

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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBurn(e.target.value)} 
            />
            <GlassInput 
              label="Inflation Rate (%)" 
              type="number"
              value={newInflation} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewInflation(e.target.value)}
              placeholder="e.g. 30"
            />
          </div>
          <GlassInput 
            label="Reason for Change" 
            placeholder="Required for audit trail..." 
            value={reason} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)} 
          />
        </div>
      </GlassCard>

      {/* TAX PROFILE CARD (NTA 2026) */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Landmark className="text-accent-info" />
          <h3 className="font-bold text-white">Tax Profile (NTA 2026)</h3>
        </div>
        <div className="space-y-4">
           <GlassInput 
              label="Your Annual Rent (₦)" 
              type="number" 
              placeholder="e.g. 1,500,000"
              value={rent} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRent(e.target.value)} 
           />
           <div className="p-3 bg-accent-info/5 border border-accent-info/20 rounded-xl">
              <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Legal Rent Shield</div>
              <div className="text-xs text-blue-300">
                You are eligible for 20% relief on this amount (capped at ₦500k).
              </div>
           </div>
           <GlassButton className="w-full" onClick={handleUpdateProfile}>
             Save Profile & Tax Data
           </GlassButton>
        </div>
      </GlassCard>

      {/* DANGER ZONE: PROTOCOL SELECTION */}
      <GlassCard className="p-6 border-red-900/30 relative overflow-hidden">
          <h3 className="font-bold text-red-500 mb-4 flex items-center gap-2">
            <ShieldAlert size={18}/> Danger Zone: Factory Resets
          </h3>
          
          {!hasMasterKey ? (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-500 text-xs">
                <strong className="block mb-1">Security Alert</strong>
                You must set a Master Key to access Reset Protocols.
              </div>
              <GlassInput 
                type="password" 
                label="Create Master Key" 
                placeholder="Unique Password" 
                value={newMasterKey} 
                onChange={(e) => setNewMasterKey(e.target.value)} 
              />
              <GlassButton variant="secondary" className="w-full" onClick={handleSetMasterKey}>
                <Lock size={16} className="mr-2"/> Set Master Key
              </GlassButton>
            </div>
          ) : (
            <>
              {/* STEP 0: SELECTION GRID */}
              {nuclearStep === 0 && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
                    <button onClick={() => initiateReset('dashboard')} className="p-4 border border-red-500/20 rounded-xl hover:bg-red-500/10 text-left transition-colors group">
                        <div className="font-bold text-white group-hover:text-red-400">Wipe Dashboard</div>
                        <div className="text-[10px] text-gray-500">Resets all account balances to 0.</div>
                    </button>
                    <button onClick={() => initiateReset('generosity')} className="p-4 border border-red-500/20 rounded-xl hover:bg-red-500/10 text-left transition-colors group">
                        <div className="font-bold text-white group-hover:text-red-400">Wipe Generosity</div>
                        <div className="text-[10px] text-gray-500">Empties the Generosity Wallet.</div>
                    </button>
                    <button onClick={() => initiateReset('goals')} className="p-4 border border-red-500/20 rounded-xl hover:bg-red-500/10 text-left transition-colors group">
                        <div className="font-bold text-white group-hover:text-red-400">Wipe Goals</div>
                        <div className="text-[10px] text-gray-500">Deletes all active missions.</div>
                    </button>
                    <button onClick={() => initiateReset('signals')} className="p-4 border border-red-500/20 rounded-xl hover:bg-red-500/10 text-left transition-colors group">
                        <div className="font-bold text-white group-hover:text-red-400">Wipe Signals</div>
                        <div className="text-[10px] text-gray-500">Deletes all deal flow data.</div>
                    </button>
                    <button onClick={() => initiateReset('budgets')} className="p-4 border border-red-500/20 rounded-xl hover:bg-red-500/10 text-left transition-colors group">
                        <div className="font-bold text-white group-hover:text-red-400">Wipe Budgets</div>
                        <div className="text-[10px] text-gray-500">Removes recurring expenses.</div>
                    </button>
                    <button onClick={() => initiateReset('journal')} className="p-4 border border-red-500/20 rounded-xl hover:bg-red-500/10 text-left transition-colors group">
                        <div className="font-bold text-white group-hover:text-red-400">Wipe Journal</div>
                        <div className="text-[10px] text-gray-500">Deletes personal entries.</div>
                    </button>
                    
                    <div className="md:col-span-2 mt-2">
                        <button onClick={() => initiateReset('all')} className="w-full py-4 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                            <Trash2 size={16}/> Factory Reset (Total Wipe)
                        </button>
                    </div>
                 </div>
              )}

              {/* STEP 1: VERIFY KEY */}
              {nuclearStep === 1 && (
                <div className="space-y-4 animate-fade-in bg-black/40 p-6 rounded-xl border border-red-500/30">
                  <div className="text-center">
                      <Lock size={32} className="mx-auto text-red-500 mb-2"/>
                      <p className="text-sm text-white font-bold uppercase">Security Check</p>
                      <p className="text-xs text-gray-400">Enter Master Key to proceed with {selectedReset?.toUpperCase()} Reset.</p>
                  </div>
                  
                  <GlassInput 
                    type="password" 
                    placeholder="Enter Master Key" 
                    value={masterPassInput} 
                    onChange={(e) => setMasterPassInput(e.target.value)} 
                    className="text-center border-red-500/50"
                    autoFocus
                  />
                  
                  <div className="flex gap-2">
                    <GlassButton variant="ghost" onClick={cancelReset} className="flex-1">Cancel</GlassButton>
                    <GlassButton variant="danger" onClick={verifyKey} className="flex-1">Verify</GlassButton>
                  </div>
                </div>
              )}

              {/* STEP 2: FINAL CONFIRMATION */}
              {nuclearStep === 2 && (
                <div className="space-y-6 animate-fade-in bg-red-950/20 p-6 rounded-xl border border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                  <div className="text-center space-y-2">
                      <AlertTriangle size={48} className="mx-auto text-red-500 animate-pulse"/>
                      <h3 className="text-xl text-white font-bold uppercase tracking-wider">Final Warning</h3>
                      <p className="text-sm text-red-300 px-4">
                        Are you absolutely sure you want to wipe 
                        <strong className="text-white block text-lg my-1">{selectedReset?.toUpperCase()}</strong>
                        This action cannot be undone. History will be logged.
                      </p>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={executeReset} 
                      className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition-all scale-100 hover:scale-[1.02]"
                    >
                      YES, DELETE DATA
                    </button>
                    <button 
                      onClick={cancelReset} 
                      className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle size={16}/> ABORT MISSION
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
      </GlassCard>
    </div>
  );
};
