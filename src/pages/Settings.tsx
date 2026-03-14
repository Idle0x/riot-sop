import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useLedger, type ResetModule } from '../context/LedgerContext';

import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';
import { formatNumber } from '../utils/format';

import { 
  Settings as SettingsIcon, ShieldAlert, Zap, Save, 
  Flame, Home, TrendingUp, AlertOctagon, Skull 
} from 'lucide-react';

export const Settings = () => {
  const { user, updateProfile } = useUser();
  const { commitAction, resetModule } = useLedger();

  const [burnCap, setBurnCap] = useState('');
  const [annualRent, setAnnualRent] = useState('');
  const [inflationRate, setInflationRate] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState<ResetModule | null>(null);

  useEffect(() => {
    if (user) {
      setBurnCap(user.burnCap?.toString() || '0');
      setAnnualRent(user.annualRent?.toString() || '0');
      setInflationRate(user.inflationRate?.toString() || '0');
    }
  }, [user]);

  const handleSaveParameters = async () => {
    setIsSaving(true);
    
    const newBurn = parseFloat(burnCap);
    const newRent = parseFloat(annualRent);
    const newInf = parseFloat(inflationRate);

    try {
        await updateProfile({
            burnCap: newBurn,
            annualRent: newRent,
            inflationRate: newInf
        });

        // STEP 3 WIRED: The System automatically logs parameter changes to the Blackbox
        if (user?.burnCap !== newBurn) {
            commitAction({
                date: new Date().toISOString(),
                type: 'PARAM_UPDATE',
                title: 'Burn Cap Adjusted',
                description: `Shifted from ₦${formatNumber(user?.burnCap || 0)} to ₦${formatNumber(newBurn)}`
            });
        }

        if (user?.inflationRate !== newInf) {
            commitAction({
                date: new Date().toISOString(),
                type: 'PARAM_UPDATE',
                title: 'Inflation Target Adjusted',
                description: `Shifted from ${user?.inflationRate || 0}% to ${newInf}%`
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        setIsSaving(false);
    }
  };

  const handleExecuteReset = () => {
      if (confirmReset) {
          resetModule(confirmReset);
          setConfirmReset(null);
      }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-20 animate-fade-in relative">

      {/* RESET CONFIRMATION MODAL */}
      {confirmReset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
              <div className="w-full max-w-md bg-zinc-900 border border-red-500/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center">
                  <AlertOctagon size={48} className="mx-auto text-red-500 mb-4 animate-pulse"/>
                  <h2 className="text-2xl font-bold text-white uppercase tracking-widest mb-2">Confirm Purge</h2>
                  <p className="text-gray-400 text-sm mb-8">
                      You are about to permanently execute a <strong className="text-white uppercase">{confirmReset}</strong> wipe. This data cannot be recovered.
                  </p>
                  <div className="flex gap-4">
                      <button onClick={() => setConfirmReset(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors">Cancel</button>
                      <button onClick={handleExecuteReset} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                          <Skull size={16}/> Execute Wipe
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <SettingsIcon className="text-gray-400" /> System Governance
        </h1>
        <p className="text-gray-400 text-sm mt-1">Manage global macro parameters and execute structural overrides.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
        {/* --- GLOBAL PARAMETERS --- */}
        <GlassCard className="p-6 h-fit space-y-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                <ShieldAlert className="text-blue-400" size={20}/>
                <h2 className="font-bold text-white">Macro Parameters</h2>
            </div>
            
            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2"><Flame size={12}/> Global Burn Cap (OpEx)</label>
                    <GlassInput type="number" value={burnCap} onChange={(e) => setBurnCap(e.target.value)} />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2"><Home size={12}/> Annual Rent Base</label>
                    <GlassInput type="number" value={annualRent} onChange={(e) => setAnnualRent(e.target.value)} />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2"><TrendingUp size={12}/> Target Inflation Rate (%)</label>
                    <GlassInput type="number" value={inflationRate} onChange={(e) => setInflationRate(e.target.value)} />
                </div>
            </div>

            <GlassButton className="w-full" onClick={handleSaveParameters} disabled={isSaving}>
                {isSaving ? 'Synchronizing...' : <><Save size={16} className="mr-2"/> Commit Parameters</>}
            </GlassButton>
        </GlassCard>

        {/* --- NUCLEAR CONTROLS --- */}
        <GlassCard className="p-6 h-fit space-y-6 border-red-500/20 bg-red-950/5">
            <div className="flex flex-col border-b border-red-500/20 pb-4">
                <div className="flex items-center gap-2 text-red-500">
                    <Zap size={20}/>
                    <h2 className="font-bold text-white">Nuclear Overrides</h2>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Executing these protocols will permanently wipe selected environments.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setConfirmReset('dashboard')} className="p-3 border border-white/10 rounded-xl text-left hover:border-red-500/50 hover:bg-red-500/10 transition-all group">
                    <div className="text-sm font-bold text-white group-hover:text-red-400">Wipe Balances</div>
                    <div className="text-[10px] text-gray-500">Reset all Tier 1/2/3 wallets to zero.</div>
                </button>
                <button onClick={() => setConfirmReset('budgets')} className="p-3 border border-white/10 rounded-xl text-left hover:border-red-500/50 hover:bg-red-500/10 transition-all group">
                    <div className="text-sm font-bold text-white group-hover:text-red-400">Wipe Budgets</div>
                    <div className="text-[10px] text-gray-500">Delete all OpEx tracking caps.</div>
                </button>
                <button onClick={() => setConfirmReset('signals')} className="p-3 border border-white/10 rounded-xl text-left hover:border-red-500/50 hover:bg-red-500/10 transition-all group">
                    <div className="text-sm font-bold text-white group-hover:text-red-400">Wipe Signals</div>
                    <div className="text-[10px] text-gray-500">Delete active deal flow & pipeline.</div>
                </button>
                <button onClick={() => setConfirmReset('telemetry')} className="p-3 border border-white/10 rounded-xl text-left hover:border-red-500/50 hover:bg-red-500/10 transition-all group">
                    <div className="text-sm font-bold text-white group-hover:text-red-400">Purge Data Lake</div>
                    <div className="text-[10px] text-gray-500">Delete all ingested bank CSV data.</div>
                </button>
            </div>

            <div className="pt-4 border-t border-red-500/20">
                <button onClick={() => setConfirmReset('all')} className="w-full p-4 bg-red-600/10 border border-red-600/50 text-red-500 font-bold rounded-xl hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center gap-2">
                    <AlertOctagon size={18}/> EXECUTE TOTAL FACTORY RESET
                </button>
                <p className="text-center text-[10px] text-red-400 mt-2 font-mono">
                    WARNING: Irreversible.
                </p>
            </div>
        </GlassCard>

      </div>
    </div>
  );
};
