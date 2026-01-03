import { useState } from 'react';
import { Settings as SettingsIcon, ShieldAlert, AlertTriangle, Lock } from 'lucide-react';
import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { GlassInput } from '../components/ui/GlassInput';

export const Settings = () => {
  const { monthlyBurn, updateMonthlyBurn, resetBalances } = useFinancials();
  
  // --- EVOLUTION LOG STATE ---
  const [isEditingBurn, setIsEditingBurn] = useState(false);
  const [newBurn, setNewBurn] = useState(monthlyBurn.toString());
  const [burnReason, setBurnReason] = useState('');

  // --- NUCLEAR RESET STATE ---
  const [resetStep, setResetStep] = useState(0);
  const [resetInput, setResetInput] = useState('');
  const [passwordInput, setPasswordInput] = useState(''); // NEW STATE
  const [passwordError, setPasswordError] = useState(''); // NEW STATE

  // --- HANDLERS ---
  const handleSaveBurn = () => {
    if (!newBurn || !burnReason) return;
    updateMonthlyBurn(parseFloat(newBurn), burnReason);
    setIsEditingBurn(false);
    setBurnReason('');
  };

  // NEW: Verify Master Password
  const verifyPassword = () => {
    const storedKey = localStorage.getItem('riot_access_key');
    if (passwordInput === storedKey) {
      setResetStep(5); // Move to Final Execution
      setPasswordError('');
    } else {
      setPasswordError('Invalid Access Key');
    }
  };

  const handleNuke = () => {
    resetBalances();
    setResetStep(0);
    setResetInput('');
    setPasswordInput('');
    alert("SYSTEM RESET COMPLETE. Balances are zero.");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-20">
      
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">System Settings</h1>
        <p className="text-gray-400">Configuration & Control</p>
      </div>

      {/* 1. EVOLUTION LOG (Edit Living Numbers) */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent-info/10 text-accent-info rounded-lg">
            <SettingsIcon size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white">Evolution Log</h3>
            <p className="text-xs text-gray-400">Adjust living costs with audit trail</p>
          </div>
        </div>

        {!isEditingBurn ? (
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-glass-border">
            <div>
              <div className="text-sm text-gray-400">Monthly Burn Rate</div>
              <div className="text-2xl font-mono font-bold text-white">${monthlyBurn}</div>
            </div>
            <GlassButton size="sm" variant="secondary" onClick={() => setIsEditingBurn(true)}>
              Update
            </GlassButton>
          </div>
        ) : (
          <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-glass-border animate-fade-in">
            <h4 className="font-bold text-sm text-accent-info">New Operating Baseline</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassInput 
                label="New Amount ($)" 
                type="number" 
                value={newBurn} 
                onChange={(e) => setNewBurn(e.target.value)} 
              />
              <GlassInput 
                label="Reason (Required)" 
                placeholder="e.g. Inflation, Moved to Lagos..." 
                value={burnReason} 
                onChange={(e) => setBurnReason(e.target.value)} 
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <GlassButton size="sm" variant="ghost" onClick={() => setIsEditingBurn(false)}>Cancel</GlassButton>
              <GlassButton size="sm" disabled={!burnReason} onClick={handleSaveBurn}>Log Change</GlassButton>
            </div>
          </div>
        )}
      </GlassCard>

      {/* 2. DANGER ZONE (The Nuclear Reset) */}
      <GlassCard className="p-6 border-accent-danger/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent-danger/10 text-accent-danger rounded-lg">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white">Danger Zone</h3>
            <p className="text-xs text-gray-400">Irreversible actions</p>
          </div>
        </div>
        
        {resetStep === 0 && (
          <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-glass-border">
            <div>
              <div className="font-bold text-white">Nuclear Reset</div>
              <div className="text-xs text-gray-500">Reset all balances to zero</div>
            </div>
            <GlassButton variant="danger" size="sm" onClick={() => setResetStep(1)}>
              Initiate
            </GlassButton>
          </div>
        )}

        {/* THE RITUAL */}
        {resetStep > 0 && (
          <div className="p-6 bg-accent-danger/5 border border-accent-danger/30 rounded-xl space-y-4 text-center animate-fade-in">
            <div className="flex justify-center text-accent-danger mb-2">
              <AlertTriangle size={32} />
            </div>
            
            {resetStep === 1 && (
              <>
                <h3 className="font-bold text-lg text-white">Protocol Initiated</h3>
                <p className="text-sm text-gray-400">This will set Treasury, Payroll, and Buffer to 0.</p>
                <GlassButton variant="danger" onClick={() => setResetStep(2)}>I Understand</GlassButton>
              </>
            )}

            {resetStep === 2 && (
              <>
                <h3 className="font-bold text-lg text-white">Are you sure?</h3>
                <p className="text-sm text-gray-400">Transaction history will remain. Balances will vanish.</p>
                <GlassButton variant="danger" onClick={() => setResetStep(3)}>Yes, Proceed</GlassButton>
              </>
            )}

            {resetStep === 3 && (
              <>
                <h3 className="font-bold text-lg text-white">Security Challenge 1/2</h3>
                <p className="text-sm text-gray-400">Type the phrase below:</p>
                <div className="font-mono text-xs bg-black/40 p-2 rounded select-all mb-2">I AM DEPLOYING CAPITAL</div>
                <GlassInput 
                  className="text-center" 
                  value={resetInput} 
                  onChange={(e) => setResetInput(e.target.value)} 
                />
                <GlassButton 
                  disabled={resetInput !== "I AM DEPLOYING CAPITAL"} 
                  onClick={() => { setResetStep(4); setResetInput(''); }}
                  className="mt-2"
                >
                  Verify Phrase
                </GlassButton>
              </>
            )}

            {/* NEW STEP 4: PASSWORD CHECK */}
            {resetStep === 4 && (
              <>
                <h3 className="font-bold text-lg text-white">Security Challenge 2/2</h3>
                <p className="text-sm text-gray-400">Enter your Master Access Key to authorize.</p>
                
                <div className="max-w-xs mx-auto space-y-2">
                  <GlassInput 
                    type="password"
                    icon={<Lock size={16} />}
                    className="text-center" 
                    placeholder="Master Password"
                    value={passwordInput} 
                    onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(''); }} 
                  />
                  {passwordError && (
                    <div className="text-xs text-accent-danger font-bold animate-pulse">{passwordError}</div>
                  )}
                </div>

                <div className="flex gap-2 justify-center mt-2">
                  <GlassButton variant="secondary" onClick={() => setResetStep(0)}>Cancel</GlassButton>
                  <GlassButton onClick={verifyPassword}>Authorize</GlassButton>
                </div>
              </>
            )}

            {resetStep === 5 && (
              <>
                <h3 className="font-bold text-lg text-white">Final Authorization</h3>
                <p className="text-sm text-gray-400">Click the button 3 times to execute.</p>
                <div className="flex justify-center gap-2">
                  <GlassButton variant="secondary" onClick={() => setResetStep(0)}>Cancel</GlassButton>
                  <GlassButton variant="danger" onClick={handleNuke}>EXECUTE RESET</GlassButton>
                </div>
              </>
            )}
          </div>
        )}
      </GlassCard>

      {/* APP INFO */}
      <div className="text-center pt-8">
        <p className="text-xs text-gray-600">
          THE riot' SOP v2.0.0<br/>
          Secure Local Storage Active
        </p>
      </div>

    </div>
  );
};
