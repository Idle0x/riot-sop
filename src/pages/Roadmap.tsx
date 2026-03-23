import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useLedger, type ResetModule } from '../context/LedgerContext';
import { generateSecurityPhrase } from '../utils/security'; 

// COMPONENTS
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';
import { formatNumber } from '../utils/format';

// ICONS
import { 
  Settings as Gear, ShieldAlert, Landmark, Lock, 
  Trash2, AlertTriangle, RefreshCw, EyeOff, Eye, ShieldCheck
} from 'lucide-react'; 

export const Settings = () => {
  const { user, updateProfile, toggleGhostMode, isGhostMode } = useUser();
  const { resetModule, commitAction } = useLedger();

  // --- CORE STATE ---
  const [newBurn, setNewBurn] = useState(user?.burnCap?.toString() || '');
  const [newInflation, setNewInflation] = useState(user?.inflationRate?.toString() || '0');
  const [reason, setReason] = useState('');
  const [rent, setRent] = useState(user?.annualRent?.toString() || '0');

  // --- SECURITY: THE SOVEREIGN TYPER ---
  const [isZoneUnlocked, setIsZoneUnlocked] = useState(false);
  const [challengePhrase, setChallengePhrase] = useState('');
  const [typerInput, setTyperInput] = useState('');

  // --- SECURITY: NUCLEAR STEPS ---
  const [nuclearStep, setNuclearStep] = useState(0); // 0=Select, 1=Key, 2=Warn
  const [masterPassInput, setMasterPassInput] = useState('');
  const [newMasterKey, setNewMasterKey] = useState('');
  const [selectedReset, setSelectedReset] = useState<ResetModule | null>(null);

  const hasMasterKey = !!user?.settings?.masterKey;

  // Initialize/Refresh Challenge
  useEffect(() => {
    setChallengePhrase(generateSecurityPhrase());
  }, []);

  // Validation for the typer
  useEffect(() => {
    if (typerInput.trim() === challengePhrase.trim() && challengePhrase !== '') {
        setIsZoneUnlocked(true);
        setTyperInput('');
    }
  }, [typerInput, challengePhrase]);

  const handleRefreshChallenge = () => {
      setChallengePhrase(generateSecurityPhrase());
      setTyperInput('');
  };

  // --- ACTION HANDLERS ---

  const handleSaveParameters = async () => {
    if (!user) return;

    const parsedBurn = parseFloat(newBurn);
    const parsedInf = parseFloat(newInflation);
    const parsedRent = parseFloat(rent);

    // 1. Log to Universal Blackbox with "Reason for Change"
    if (parsedBurn !== user.burnCap) {
        commitAction({ 
            date: new Date().toISOString(), 
            type: 'PARAM_UPDATE', 
            title: 'Burn Cap Adjusted', 
            description: `Cap: ${user.burnCap} -> ${parsedBurn}. Reason: ${reason || 'Not specified'}` 
        });
    }

    // 2. Execute Update
    await updateProfile({ 
      annualRent: parsedRent, 
      inflationRate: parsedInf,
      burnCap: parsedBurn 
    });

    setReason('');
    alert("System Parameters Synchronized.");
  };

  const handleSetMasterKey = async () => {
    if (!newMasterKey || newMasterKey.length < 6) {
      alert("Security Protocol: Master Key must be ≥ 6 characters.");
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
    alert("Master Key Established. System access secured.");
  };

  const verifyKey = () => {
      if (masterPassInput === user?.settings?.masterKey) {
          setNuclearStep(2);
      } else {
          alert("Unauthorized: Invalid Master Password.");
      }
  };

  const executeReset = () => {
      if (selectedReset) {
          resetModule(selectedReset);

          // Re-lock everything for safety
          setNuclearStep(0);
          setMasterPassInput('');
          setSelectedReset(null);
          setIsZoneUnlocked(false);
          setChallengePhrase(generateSecurityPhrase());

          alert(`${selectedReset.toUpperCase()} PURGE COMPLETE.`);
      }
  };

  const cancelReset = () => {
      setNuclearStep(0);
      setMasterPassInput('');
      setSelectedReset(null);
  };

  // Tax Logic: 25% relief capped at 500k
  const rentValue = parseFloat(rent) || 0;
  const rawShield = rentValue * 0.25;
  const actualShield = Math.min(rawShield, 500000);

  if (!user) return <div className="p-10 md:p-20 text-center font-mono text-sm animate-pulse">SYNCHRONIZING_USER_STATE...</div>;

  return (
    <div className="max-w-4xl mx-auto p-3 md:p-8 space-y-5 md:space-y-8 pb-16 md:pb-20 animate-fade-in">

      <div className="flex justify-between items-center gap-2">
        <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight truncate">System Config</h1>
        {/* --- PRIVACY SHIELD (GHOST MODE) --- */}
        <button 
            onClick={toggleGhostMode}
            className={`flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full border transition-all shrink-0 ${
                isGhostMode 
                ? 'bg-red-500/20 border-red-500/50 text-red-400' 
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
        >
            {isGhostMode ? <EyeOff size={14} className="md:w-4 md:h-4"/> : <Eye size={14} className="md:w-4 md:h-4"/>}
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest hidden sm:inline">
                {isGhostMode ? 'Ghost Mode Active' : 'Privacy Shield Off'}
            </span>
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest sm:hidden">
                {isGhostMode ? 'Ghost' : 'Privacy'}
            </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8">

        <div className="space-y-5 md:space-y-8">
            {/* OPERATING PARAMETERS */}
            <GlassCard className="p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <Gear className="text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                <h3 className="font-bold text-white uppercase text-[10px] md:text-xs tracking-widest">Operating Parameters</h3>
                </div>
                <div className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <GlassInput 
                        label="Monthly Burn (₦)" 
                        type="number" 
                        value={newBurn} 
                        onChange={(e) => setNewBurn(e.target.value)} 
                    />
                    <GlassInput 
                        label="Inflation (%)" 
                        type="number"
                        value={newInflation} 
                        onChange={(e) => setNewInflation(e.target.value)}
                    />
                </div>
                <GlassInput 
                    label="Reason for Change" 
                    placeholder="Audit trail requirement..." 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)} 
                />
                <GlassButton className="w-full text-xs md:text-sm py-2.5 md:py-3" onClick={handleSaveParameters}>
                    Commit Macro Updates
                </GlassButton>
                </div>
            </GlassCard>

            {/* TAX PROFILE */}
            <GlassCard className="p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <Landmark className="text-blue-400 w-4 h-4 md:w-5 md:h-5" />
                <h3 className="font-bold text-white uppercase text-[10px] md:text-xs tracking-widest">Tax Profile (NTA 2026)</h3>
                </div>
                <div className="space-y-3 md:space-y-4">
                <GlassInput 
                    label="Annual Rent (₦)" 
                    type="number" 
                    value={rent} 
                    onChange={(e) => setRent(e.target.value)} 
                />
                <div className="p-3 md:p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg md:rounded-xl flex justify-between items-center">
                    <div>
                        <div className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold">Legal Rent Shield</div>
                        <div className="text-[10px] md:text-xs text-blue-300 mt-0.5">25% relief applied</div>
                    </div>
                    <div className="text-right font-mono font-bold text-blue-400 text-base md:text-lg">
                        ₦{formatNumber(actualShield)}
                    </div>
                </div>
                </div>
            </GlassCard>
        </div>

        {/* DANGER ZONE (The Nuclear Grid) */}
        <GlassCard className="p-4 md:p-6 border-red-500/20 bg-red-950/5 relative overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-4 md:mb-6 text-red-500">
                <ShieldAlert className="w-4 h-4 md:w-5 md:h-5"/>
                <h3 className="font-bold text-white uppercase text-[10px] md:text-xs tracking-widest">Nuclear Overrides</h3>
            </div>

            {!hasMasterKey ? (
                <div className="space-y-3 md:space-y-4 py-2 md:py-4 animate-fade-in flex-1 flex flex-col justify-center">
                <div className="p-2.5 md:p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg md:rounded-xl text-yellow-500 text-[11px] md:text-xs leading-relaxed">
                    <ShieldCheck size={14} className="inline mr-1 mb-0.5"/> 
                    <strong>Identity Required:</strong> You must establish a Master Key before resetting systemic components.
                </div>
                <GlassInput 
                    type="password" 
                    label="Establish Master Key" 
                    value={newMasterKey} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMasterKey(e.target.value)} 
                />
                <GlassButton variant="secondary" className="w-full text-xs md:text-sm py-2.5 md:py-3 mt-2" onClick={handleSetMasterKey}>
                    <Lock size={14} className="mr-1.5 md:mr-2 md:w-4 md:h-4"/> Secure Access
                </GlassButton>
                </div>
            ) : (
                <div className="flex-1 flex flex-col">
                {!isZoneUnlocked ? (
                    /* LEVEL 1: COGNITIVE FRICTION */
                    <div className="space-y-4 md:space-y-6 animate-fade-in py-4 md:py-8 my-auto">
                        <div className="text-center space-y-1.5 md:space-y-2">
                            <Lock className="mx-auto text-gray-700 w-8 h-8 md:w-10 md:h-10"/>
                            <h4 className="text-white font-bold text-xs md:text-sm tracking-widest uppercase">Encryption Locked</h4>
                            <p className="text-[9px] md:text-[10px] text-gray-500">Verify human consciousness by typing the phrase below.</p>
                        </div>

                        <div className="bg-black/60 p-3 md:p-4 rounded-lg md:rounded-xl border border-white/5 relative group">
                            <p className="text-center font-mono text-xs md:text-sm text-red-500/80 select-none tracking-tight">
                                {challengePhrase}
                            </p>
                            <button onClick={handleRefreshChallenge} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white p-1 transition-colors">
                                <RefreshCw size={12}/>
                            </button>
                        </div>

                        <input 
                            value={typerInput}
                            onChange={(e) => setTyperInput(e.target.value)}
                            className="w-full bg-transparent border-b border-gray-800 py-2 md:py-3 text-center font-mono text-sm md:text-base text-white focus:outline-none focus:border-red-500/50 transition-all"
                            placeholder="Awaiting verification..."
                            autoComplete="off"
                        />
                    </div>
                ) : (
                    /* LEVEL 2: NUCLEAR FLOW */
                    <div className="animate-fade-in min-h-[250px] md:min-h-[300px] flex flex-col my-auto">
                        {nuclearStep === 0 && (
                            <div className="grid grid-cols-2 gap-2 md:gap-3 flex-1">
                                {[
                                    { id: 'dashboard', label: 'Wipe Balances', desc: 'Resets T1/2/3' },
                                    { id: 'budgets', label: 'Wipe Budgets', desc: 'Delete OpEx limits' },
                                    { id: 'signals', label: 'Wipe Signals', desc: 'Delete Deal Flow' },
                                    { id: 'telemetry', label: 'Wipe Ingestions', desc: 'Purge Bank CSVs' },
                                    { id: 'goals', label: 'Wipe Goals', desc: 'Delete Missions' },
                                    { id: 'journal', label: 'Wipe Journal', desc: 'Clear Personal Notes' }
                                ].map((item) => (
                                    <button 
                                        key={item.id} 
                                        onClick={() => { setSelectedReset(item.id as ResetModule); setNuclearStep(1); }} 
                                        className="p-2.5 md:p-3 border border-white/5 rounded-lg md:rounded-xl hover:bg-red-500/10 text-left transition-all group border-dashed"
                                    >
                                        <div className="text-[11px] md:text-xs font-bold text-white group-hover:text-red-400">{item.label}</div>
                                        <div className="text-[8px] md:text-[9px] text-gray-500 mt-0.5 md:mt-1">{item.desc}</div>
                                    </button>
                                ))}
                                <button 
                                    onClick={() => { setSelectedReset('all'); setNuclearStep(1); }} 
                                    className="col-span-2 mt-1 md:mt-2 py-3 md:py-4 border border-red-500/50 text-red-500 hover:bg-red-600 hover:text-white rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-1.5 md:gap-2"
                                >
                                    <Trash2 size={12} className="md:w-3.5 md:h-3.5"/> Execute Full Factory Reset
                                </button>
                            </div>
                        )}

                        {nuclearStep === 1 && (
                            <div className="space-y-3 md:space-y-4 animate-fade-in bg-black/40 p-4 md:p-6 rounded-xl border border-red-500/30 my-auto">
                                <div className="text-center">
                                    <Lock className="w-5 h-5 md:w-6 md:h-6 mx-auto text-red-500 mb-1.5 md:mb-2"/>
                                    <p className="text-[10px] md:text-xs text-white font-bold uppercase tracking-widest">Verify Authority</p>
                                    <p className="text-[9px] md:text-[10px] text-gray-500 mt-1">Confirming purge of: {selectedReset?.toUpperCase()}</p>
                                </div>
                                <GlassInput 
                                    type="password" 
                                    placeholder="Enter Master Key" 
                                    value={masterPassInput} 
                                    onChange={(e) => setMasterPassInput(e.target.value)} 
                                    className="text-center"
                                    autoFocus
                                />
                                <div className="flex gap-2 mt-2">
                                    <GlassButton variant="ghost" onClick={cancelReset} className="flex-1 text-[9px] md:text-[10px] py-2 md:py-2.5">Cancel</GlassButton>
                                    <GlassButton onClick={verifyKey} className="flex-1 bg-red-600 border-red-600 text-[9px] md:text-[10px] py-2 md:py-2.5 hover:bg-red-700">Authenticate</GlassButton>
                                </div>
                            </div>
                        )}

                        {nuclearStep === 2 && (
                            <div className="space-y-4 md:space-y-6 animate-fade-in bg-red-950/20 p-4 md:p-6 rounded-xl border border-red-500 shadow-2xl my-auto">
                                <div className="text-center space-y-1.5 md:space-y-2">
                                    <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 mx-auto text-red-500 animate-pulse"/>
                                    <h3 className="text-base md:text-lg text-white font-bold uppercase tracking-tighter">Irreversible Action</h3>
                                    <p className="text-[10px] md:text-[11px] text-red-300 px-1 md:px-2 leading-relaxed">
                                        You are about to vaporize <strong>{selectedReset?.toUpperCase()}</strong> data. This cannot be undone. System history will record this event.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={executeReset} className="w-full py-3 md:py-4 bg-red-600 hover:bg-red-700 text-white text-[11px] md:text-xs font-bold rounded-lg md:rounded-xl transition-all">
                                        YES, DESTROY DATA
                                    </button>
                                    <button onClick={cancelReset} className="w-full py-2 text-gray-500 hover:text-white text-[9px] md:text-[10px] uppercase font-bold transition-colors">
                                        Abort Mission
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                </div>
            )}
        </GlassCard>

      </div>
    </div>
  );
};
