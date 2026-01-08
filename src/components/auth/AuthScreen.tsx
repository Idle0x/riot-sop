import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { GlassCard } from '../ui/GlassCard';
import { GlassInput } from '../ui/GlassInput';
import { GlassButton } from '../ui/GlassButton';
import { Shield, Mail, Lock, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';

interface Props {
  onAuthenticated: () => void;
}

export const AuthScreen = ({ onAuthenticated }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Account created! You can now log in.');
        setIsLogin(true);
        setLoading(false);
        return; 
      }
      onAuthenticated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-success/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-info/10 rounded-full blur-[100px]" />
      </div>

      <GlassCard className="w-full max-w-md p-8 relative z-10 border-glass-border/50">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-full bg-white/5 border border-glass-border mb-4 shadow-glass-lg">
            <Shield className="w-8 h-8 text-accent-success" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isLogin ? 'Command Center' : 'Initialize Identity'}
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            {isLogin ? 'Authenticate to access sovereign data' : 'Create your secure financial ledger'}
          </p>
        </div>

        <div className="space-y-4">
          <GlassInput 
            icon={<Mail size={16}/>} 
            placeholder="Email Directive" 
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          />
          <GlassInput 
            icon={<Lock size={16}/>} 
            placeholder="Passcode" 
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleAuth()}
          />

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          <GlassButton className="w-full mt-2" onClick={handleAuth} disabled={loading || !email || !password}>
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : null}
            {isLogin ? 'Establish Link' : 'Create Identity'} <ArrowRight className="ml-2 w-4 h-4"/>
          </GlassButton>

          <div className="text-center mt-4">
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-xs text-gray-500 hover:text-white hover:underline transition-colors"
            >
              {isLogin ? "No identity? Initialize New System" : "Already established? Login"}
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
