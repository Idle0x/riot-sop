import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useLedger, type ResetModule } from '../context/LedgerContext';

import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';
import { formatNumber } from '../utils/format';

import { 
  Settings as SettingsIcon, ShieldAlert, Zap, Save, 
  Flame, Home, TrendingUp, AlertOctagon, Skull, 
  EyeOff, Eye, Key, Lock, Unlock, RefreshCw
} from 'lucide-react';

const VERIFICATION_PHRASES = [
  "I accept the responsibility of total data loss",
  "Sovereignty requires absolute discipline and accountability",
  "Execute systemic purge and initialize clean slate",
  "The blackbox records all decisions for posterity",
  "Hard-fork the protocol and sever all active links"
];

export const Settings = () => {
  const { user, updateProfile, isGhostMode, toggleGhostMode } = useUser();
  const { commitAction, resetModule } = useLedger();

  // Operating Params
  const [burnCap, setBurnCap] = useState('');
  const [annualRent, setAnnualRent] = useState('');
  const [inflationRate, setInflationRate] = useState('');
  const [reasonForChange, setReasonForChange] = useState('');
  
  // Security
  const [masterKey, setMasterKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Nuclear Gate Logic
  const [authSentence, setAuthSentence] = useState('');
  const [userInputSentence, setUserInputSentence] = useState('');
  const [isNuclearUnlocked, setIsNuclearUnlocked] = useState(false);
  const [confirmReset, setConfirmReset] = useState<ResetModule | null>(null);
  const [finalWipeDoubleCheck, setFinalWipeDoubleCheck] = useState(false);

  useEffect(() => {
    if (user) {
      setBurnCap(user.burnCap?.toString() || '0');
      setAnnualRent(user.annualRent?.toString() || '0');
      setInflationRate(user.inflationRate?.toString() || '0');
      setMasterKey(user.settings?.masterKey || '');
    }
    // Generate random auth phrase
    setAuthSentence(VERIFICATION_PHRASES[Math.floor(Math.random() * VERIFICATION_PHRASES.length)]);
  }, [user]);

  // Unlock Nuclear Grid if sentence matches
  useEffect(() => {
    if (userInputSentence.trim() === authSentence) {
      setIsNuclearUnlocked(true);
    } else {
      setIsNuclearUnlocked(false);
    }
  }, [userInputSentence, authSentence]);

  const rentShieldAmount = Math.min(parseFloat(annualRent || '0') * 0.25, 500000);

  const handleSaveParameters = async () => {
    setIsSaving(true);
    const nBurn = parseFloat(burnCap);
    const nRent = parseFloat(annualRent);
    const nInf = parseFloat(inflationRate);

    try {
        await updateProfile({
            burnCap: nBurn,
            annualRent: nRent,
            inflationRate: nInf,
            settings: {
              ...user?.settings,
              masterKey: masterKey,
              allowNegativeBalance: user?.settings?.allowNegativeBalance || false,
              monthlyCheckpointDay: user?.settings?.monthlyCheckpointDay || 1
            }
        });

        // BLACKBOX AUDIT TRAIL
        const changes = [];
        if (user?.burnCap !== nBurn) changes.push(`Burn Cap -> ₦${formatNumber(nBurn)}`);
        if (user?.annualRent !== nRent) changes.push(`Rent Base -> ₦${formatNumber(nRent)}`);
        if (user?.inflationRate !== nInf) changes.push(`Inflation -> ${nInf}%`);

        if (changes.length > 0) {
            commitAction({
                date: new Date().toISOString(),
                type: 'PARAM_UPDATE',
                title: 'System Parameters Modified',
                description: `${changes.join(' | ')}. Reason: ${reasonForChange || 'Standard Optimization'}`
            });
        }
        setReasonForChange('');
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
          setFinalWipeDoubleCheck(false);
          setUserInputSentence(''); // Lock the gate again
      }
  };

  const regeneratePhrase = () => {
    setAuthSentence(VERIFICATION_PHRASES[Math.floor(Math.random() * VERIFICATION_PHRASES.length)]);
    setUserInputSentence('');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-20 animate-fade-in relative">

      {/* MODAL: FINAL WIPE CONFIRMATION */}
      {confirmReset && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
              <div className="w-full max-w-md bg-zinc-900 border border-red-500/50 rounded-2xl p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.3)]">
                  <AlertOctagon size={64} className="mx-auto text-red-500 mb-6 animate-bounce"/>
                  <h2 className="text-3xl font-bold text-white mb-2 uppercase italic">Final Warning</h2>
                  <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                      You are executing a structural wipe of <strong className="text-white uppercase">[{confirmReset}]</strong>. 
                      This bypasses the ledger safety and vaporizes the selected database nodes. 
                      <br/><br/>
                      Are you absolutely certain?
                  </p>
                  
                  <div className="flex flex-col gap-3">
                      <button 
                        onClick={handleExecuteReset}
                        className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                      >
                          <Skull size={20}/> Confirm Permanent Deletion
                      </button>
                      <button onClick={() => setConfirmReset(null)} className="w-full py-3 text-gray-500 hover:text-white transition-colors font-bold uppercase text-xs tracking-widest">Abort Protocol</button>
                  </div>
              </div>
          </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <SettingsIcon className="text-gray-400" /> System Configuration
        </h1>
      </div>

      {/* --- SECTION 1: OPERATING PARAMETERS --- */}
      <GlassCard className="p-8 space-y-8">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <SettingsIcon className="text-blue-400" size={20}/>
              <h2 className="font-bold text-white uppercase tracking-widest text-sm">Operating Parameters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Monthly Burn Cap (₦)</label>
                  <GlassInput type="number" value={burnCap} onChange={(e) => setBurnCap(e.target.value)} placeholder="200,000" />
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Inflation Rate (%)</label>
                  <GlassInput type="number" value={inflationRate} onChange={(e) => setInflationRate(e.target.value)} placeholder="1" />
              </div>
          </div>

          <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Reason for Change</label>
              <textarea 
                  value={reasonForChange}
                  onChange={(e) => setReasonForChange(e.target.value)}
                  placeholder="Required for audit trail..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-blue-500/50 outline-none h-20 transition-all"
              />
          </div>
      </GlassCard>

      {/* --- SECTION 2: TAX PROFILE (NTA 2026) --- */}
      <GlassCard className="p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Home className="text-indigo-400" size={20}/>
              <h2 className="font-bold text-white uppercase tracking-widest text-sm">Tax Profile (NTA 2026)</h2>
          </div>

          <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Your Annual Rent (₦)</label>
              <GlassInput type="number" value={annualRent} onChange={(e) => setAnnualRent(e.target.value)} placeholder="0" />
          </div>

          <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Legal Rent Shield</div>
              <div className="text-xs text-gray-400">
                You are eligible for 25% relief on this amount (capped at ₦500k). 
                <br/>
                <span className="text-white font-mono font-bold mt-1 inline-block">Active Shield: ₦{formatNumber(rentShieldAmount)}</span>
              </div>
          </div>

          <GlassButton className="w-full" onClick={handleSaveParameters} disabled={isSaving}>
              {isSaving ? 'Synchronizing State...' : 'Save Profile & Tax Data'}
          </GlassButton>
      </GlassCard>

      {/* --- SECTION 3: PRIVACY & SECURITY --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <GlassCard className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Key size={18} className="text-yellow-500"/>
                    <h3 className="font-bold text-white text-sm">Security Layer</h3>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                    <Lock size={12} className="text-gray-500"/>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Master Key Active</span>
                  </div>
              </div>
              <GlassInput 
                  label="System Master Key" 
                  type="password" 
                  value={masterKey} 
                  onChange={(e) => setMasterKey(e.target.value)} 
                  placeholder="Enter Root Key..."
              />
          </GlassCard>

          <GlassCard className="p-6 flex items-center justify-between">
              <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    {isGhostMode ? <EyeOff size={18} className="text-red-400"/> : <Eye size={18} className="text-green-400"/>}
                    Ghost Mode
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase">UI Grayscale & Value Obfuscation</p>
              </div>
              <button 
                  onClick={toggleGhostMode}
                  className={`w-14 h-7 rounded-full transition-all relative ${isGhostMode ? 'bg-red-500' : 'bg-zinc-700'}`}
              >
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${isGhostMode ? 'left-8' : 'left-1'}`} />
              </button>
          </GlassCard>
      </div>

      {/* --- SECTION 4: DANGER ZONE (THE NUCLEAR GATE) --- */}
      <GlassCard className="p-8 border-red-500/20 bg-red-950/5 relative overflow-hidden">
        
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-red-500/20 pb-6 mb-6">
            <div>
                <h3 className="font-bold text-red-500 flex items-center gap-2 text-lg uppercase tracking-tighter">
                  <AlertOctagon size={20}/> Danger Zone: Factory Resets
                </h3>
                <p className="text-[10px] text-gray-500 mt-1">Authorized bypass protocols for structural data liquidation.</p>
            </div>
            {!isNuclearUnlocked ? (
               <div className="flex items-center gap-2 text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 animate-pulse">
                  <Lock size={14}/>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Locked</span>
               </div>
            ) : (
               <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                  <Unlock size={14}/>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Authorized</span>
               </div>
            )}
        </div>

        {/* AUTHORIZATION GATE */}
        {!isNuclearUnlocked && (
          <div className="space-y-4 mb-8">
              <div className="flex justify-between items-end">
                <p className="text-xs text-gray-400 font-medium">Type the following phrase to unlock overrides:</p>
                <button onClick={regeneratePhrase} className="text-gray-500 hover:text-white"><RefreshCw size={14}/></button>
              </div>
              <div className="bg-black/60 border border-white/5 p-4 rounded-xl text-center select-none italic text-gray-300 font-mono text-sm">
                "{authSentence}"
              </div>
              <GlassInput 
                  value={userInputSentence} 
                  onChange={(e) => setUserInputSentence(e.target.value)} 
                  placeholder="Verify authorization phrase..."
              />
          </div>
        )}

        {/* NUCLEAR GRID (Blurred unless unlocked) */}
        <div className={`transition-all duration-700 ${!isNuclearUnlocked ? 'opacity-20 blur-md pointer-events-none' : 'opacity-100 blur-0'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => setConfirmReset('dashboard')} className="p-5 border border-white/10 rounded-2xl text-left hover:border-red-500/50 hover:bg-red-500/10 transition-all group">
                    <div className="text-sm font-bold text-white group-hover:text-red-400">Wipe Dashboard</div>
                    <div className="text-[10px] text-gray-500 mt-1">Resets all account balances to 0.</div>
                </button>
                <button onClick={() => setConfirmReset('generosity')} className="p-5 border border-white/10 rounded-2xl text-left hover:border-red-500/50 hover:bg-red-500/10 transition-all group">
                    <div className="text-sm font-bold text-white group-hover:text-red-400">Wipe Generosity</div>
                    <div className="text-[10px] text-gray-500 mt-1">Empties the Generosity Wallet.</div>
                </button>
                <button onClick={() => setConfirmReset('goals')} className="p-5 border border-white/10 rounded-2xl text-left hover:border-red-500/50 hover:bg-red-500/10 transition-all group">
                    <div className="text-sm font-bold text-white group-hover:text-red-400">Wipe Goals</div>
                    <div className="text-[10px] text-gray-500 mt-1">Deletes all active missions.</div>
                </button>
                <button onClick={() => setConfirmReset('signals')} className="p-5 border border-white/10 rounded-2xl text-left hover:border-red-500/50 hover:bg-red-500/10 transition-all group">
                    <div className="text-sm font-bold text-white group-hover:text-red-400">Wipe Signals</div>
                    <div className="text-[10px] text-gray-500 mt-1">Deletes all deal flow data.</div>
                </button>
                <button onClick={() => setConfirmReset('budgets')} className="p-5 border border-white/10 rounded-2xl text-left hover:border-red-500/50 hover:bg-red-500/10 transition-all group">
                    <div className="text-sm font-bold text-white group-hover:text-red-400">Wipe Budgets</div>
                    <div className="text-[10px] text-gray-500 mt-1">Removes recurring expenses.</div>
                </button>
                <button onClick={() => setConfirmReset('journal')} className="p-5 border border-white/10 rounded-2xl text-left hover:border-red-500/50 hover:bg-red-500/10 transition-all group">
                    <div className="text-sm font-bold text-white group-hover:text-red-400">Wipe Journal</div>
                    <div className="text-[10px] text-gray-500 mt-1">Deletes personal entries.</div>
                </button>
                {/* NEW: Data Lake Reset */}
                <button onClick={() => setConfirmReset('telemetry')} className="p-5 border border-white/10 rounded-2xl text-left hover:border-red-500/50 hover:bg-red-500/10 transition-all group md:col-span-2">
                    <div className="text-sm font-bold text-white group-hover:text-red-400 flex items-center gap-2">Wipe Ingestions <span className="text-[10px] bg-red-500/20 px-2 py-0.5 rounded">Data Lake</span></div>
                    <div className="text-[10px] text-gray-500 mt-1">Purge all raw bank CSV records and high-velocity telemetry.</div>
                </button>
            </div>

            <div className="mt-8 pt-6 border-t border-red-500/20">
                <button 
                  onClick={() => setConfirmReset('all')} 
                  className="w-full p-5 bg-red-600/10 border border-red-600/50 text-red-500 font-black rounded-2xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em]"
                >
                    <Skull size={20}/> Factory Reset (Total Wipe)
                </button>
                <p className="text-center text-[10px] text-red-500/60 mt-3 font-mono">
                    Warning: Irreversible. Excludes Forensic Ledger history.
                </p>
            </div>
        </div>

      </GlassCard>

    </div>
  );
};
