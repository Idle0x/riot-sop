import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useLedger } from '../context/LedgerContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';
import { Settings as Gear, ShieldAlert, CloudUpload, Landmark } from 'lucide-react';

export const Settings = () => {
  const { user, updateProfile } = useUser();
  const { 
    addBudget, addGoal, addSignal, updateAccount, commitAction 
  } = useLedger();

  // Existing States
  const [newBurn, setNewBurn] = useState(user?.burnCap?.toString() || '');
  const [reason, setReason] = useState('');
  const [rent, setRent] = useState(user?.annualRent?.toString() || '0');

  // Nuclear State
  const [nuclearStep, setNuclearStep] = useState(0);
  const [masterPass, setMasterPass] = useState('');

  const handleUpdate = () => {
    const effectiveDate = new Date();
    effectiveDate.setDate(effectiveDate.getDate() + 7);

    if (!user) return;

    updateProfile({ 
      annualRent: parseFloat(rent), 
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
    alert("Profile Updated: Cooldowns applied where necessary.");
  };

  const syncLocalData = async () => {
    if (!confirm("This will upload data from your browser's LocalStorage to the Cloud Database. Continue?")) return;

    try {
        // 1. Migrate Accounts (Balances only, assuming types exist)
        const localAccounts = JSON.parse(localStorage.getItem('riot_accounts') || '[]');
        localAccounts.forEach((acc: any) => {
            if (acc.balance !== 0) updateAccount(acc.id, acc.balance); // Add balance diff
        });

        // 2. Migrate Budgets
        const localBudgets = JSON.parse(localStorage.getItem('riot_budgets') || '[]');
        localBudgets.forEach((b: any) => {
            // Remove ID so DB generates a fresh one
            const { name, amount, spent, frequency, category, autoDeduct, expiryDate } = b; 
            addBudget({ name, amount, spent, frequency, category, autoDeduct, expiryDate });
        });

        // 3. Migrate Goals
        const localGoals = JSON.parse(localStorage.getItem('riot_goals') || '[]');
        localGoals.forEach((g: any) => {
             const { title, phase, targetAmount, currentAmount, isCompleted, priority, type, subGoals } = g;
             addGoal({ title, phase, targetAmount, currentAmount, isCompleted, priority, type, subGoals });
        });
        
        // 4. Migrate Signals
        const localSignals = JSON.parse(localStorage.getItem('riot_signals') || '[]');
        localSignals.forEach((s: any) => {
            const { title, sector, phase, confidence, effort, hoursLogged, totalGenerated, redFlags, proofOfWork, thesis, research, outcome, timeline } = s;
            addSignal({ title, sector, phase, confidence, effort, hoursLogged, totalGenerated, redFlags, proofOfWork, thesis, research, outcome, timeline });
        });

        // 5. Migrate History
        const localHistory = JSON.parse(localStorage.getItem('riot_history') || '[]');
        localHistory.forEach((h: any) => {
             // Remove ID so DB generates a fresh one
            const { id, ...rest } = h;
            commitAction(rest);
        });

        alert("Migration initiated! Check your dashboard in a few seconds.");
    } catch (e) {
        console.error(e);
        alert("Error during migration. Check console.");
    }
  };

  const executeNuclear = () => {
    // In Cloud V2, we restrict Nuclear Reset to just LocalStorage clearing for safety
    // True Database Wiping should be done via Supabase Dashboard to prevent accidents
    if (masterPass === 'PROTOCOL_ZERO') {
      localStorage.clear();
      alert("LOCAL DATA PURGED. You are now disconnected.");
      window.location.reload();
    } else {
      alert("Invalid Master Password.");
    }
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
              label="Inflation Rate" 
              value={user.inflationRate} 
              readOnly 
              className="opacity-50" 
            />
          </div>
          <GlassInput 
            label="Reason for Change" 
            placeholder="Required for audit..." 
            value={reason} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)} 
          />
        </div>
      </GlassCard>

      {/* NEW: TAX PROFILE CARD (NTA 2026) */}
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
           <GlassButton className="w-full" onClick={handleUpdate}>
             Save Tax Profile
           </GlassButton>
        </div>
      </GlassCard>

      {/* DATA MIGRATION */}
      <GlassCard className="p-6 border-blue-500/30">
        <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
          <CloudUpload size={18}/> Data Migration
        </h3>
        <button 
          onClick={() => syncLocalData()}
          className="w-full py-3 border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 rounded-xl text-sm font-bold transition-all"
        >
          Push Local Data to Cloud
        </button>
      </GlassCard>

      {/* NUCLEAR ZONE */}
      <GlassCard className="p-6 border-red-900/30">
          <h3 className="font-bold text-red-500 mb-2 flex items-center gap-2">
            <ShieldAlert size={18}/> Danger Zone
          </h3>
          {nuclearStep === 0 ? (
             <button onClick={() => setNuclearStep(1)} className="w-full py-3 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-sm font-bold transition-all">Initiate Nuclear Reset</button>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <p className="text-sm text-red-400 font-bold uppercase">This will clear local session. Cloud data remains safe.</p>
              <GlassInput type="password" placeholder="Enter Master Key" value={masterPass} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMasterPass(e.target.value)} />
              <div className="flex gap-2">
                <GlassButton variant="ghost" onClick={() => setNuclearStep(0)} className="flex-1">Cancel</GlassButton>
                <GlassButton variant="danger" onClick={executeNuclear} className="flex-1">NUKE LOCAL</GlassButton>
              </div>
            </div>
          )}
      </GlassCard>
    </div>
  );
};
