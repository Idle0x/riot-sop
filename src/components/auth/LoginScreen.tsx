import { useState, useEffect } from 'react';
import { Shield, Key, ArrowRight, Lock, AlertTriangle } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { GlassInput } from '../ui/GlassInput';
import { GlassButton } from '../ui/GlassButton';

interface LoginScreenProps {
  onAuthenticated: () => void;
}

export const LoginScreen = ({ onAuthenticated }: LoginScreenProps) => {
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const storedKey = localStorage.getItem('riot_access_key');
    if (!storedKey) {
      setIsSetupMode(true);
    }
  }, []);

  const handleLogin = () => {
    const storedKey = localStorage.getItem('riot_access_key');
    if (password === storedKey) {
      onAuthenticated();
    } else {
      setError('Access Denied: Invalid Key');
      setPassword('');
    }
  };

  const handleSetup = () => {
    if (password.length < 4) {
      setError('Key is too weak (min 4 chars)');
      return;
    }
    if (password !== confirmPassword) {
      setError('Keys do not match');
      return;
    }
    localStorage.setItem('riot_access_key', password);
    onAuthenticated();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-success/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-info/10 rounded-full blur-[100px]" />
      </div>

      <GlassCard className="w-full max-w-md p-8 relative z-10 border-glass-border/50">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex p-4 rounded-full bg-white/5 border border-glass-border mb-2 shadow-glass-lg">
            {isSetupMode ? <Shield className="w-8 h-8 text-accent-info" /> : <Lock className="w-8 h-8 text-accent-success" />}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isSetupMode ? 'Initialize System' : 'Restricted Access'}
          </h1>
          <p className="text-sm text-gray-400">
            {isSetupMode ? 'Create your master access key' : 'Enter security credential to proceed'}
          </p>
        </div>

        <div className="space-y-4">
          <GlassInput 
            type="password" 
            placeholder={isSetupMode ? "Create Key" : "Enter Access Key"}
            icon={<Key size={16} />}
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setPassword(e.target.value); setError(''); }}
            autoFocus
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && (isSetupMode ? null : handleLogin())}
          />

          {isSetupMode && (
            <GlassInput 
              type="password" 
              placeholder="Confirm Key"
              icon={<Key size={16} />}
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setConfirmPassword(e.target.value); setError(''); }}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSetup()}
            />
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-accent-danger bg-accent-danger/10 p-3 rounded-lg border border-accent-danger/20 animate-fade-in">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          <GlassButton 
            className="w-full mt-4" 
            size="lg" 
            onClick={isSetupMode ? handleSetup : handleLogin}
          >
            {isSetupMode ? 'Set Key & Boot' : 'Unlock System'} <ArrowRight className="ml-2 w-4 h-4" />
          </GlassButton>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest">
            THE riot' SOP // SECURE ENVIRONMENT
          </p>
        </div>
      </GlassCard>
    </div>
  );
};
