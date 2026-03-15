import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { GlassCard } from '../ui/GlassCard';
import { GlassInput } from '../ui/GlassInput';
import { GlassButton } from '../ui/GlassButton';
import { Shield, Mail, Lock, Loader2, AlertTriangle, Key } from 'lucide-react';

interface Props {
  onAuthenticated: () => void;
}

type AuthView = 'login' | 'signup' | 'forgot' | 'update';

export const AuthScreen = ({ onAuthenticated }: Props) => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Listen for the password reset callback from the email link
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setView('update');
        setMessage('Override authorized. Enter your new master passcode.');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async () => {
    setLoading(true); setError(''); setMessage('');

    try {
      if (view === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Identity created. Check your email to verify the link.');
        setView('login');
      } 
      else if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthenticated();
      }
      else if (view === 'forgot') {
        // Automatically redirects back to your app's URL
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin, 
        });
        if (error) throw error;
        setMessage('Override directive sent. Check your email.');
      }
      else if (view === 'update') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMessage('Passcode updated successfully.');
        setView('login');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Background aesthetics kept intact... */}
      <GlassCard className="w-full max-w-md p-8 relative z-10 border-white/10">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-full bg-white/5 border border-white/10 mb-4 shadow-2xl">
            {view === 'forgot' || view === 'update' ? <Key className="w-8 h-8 text-yellow-500" /> : <Shield className="w-8 h-8 text-accent-success" />}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {view === 'login' && 'Command Center'}
            {view === 'signup' && 'Initialize Identity'}
            {view === 'forgot' && 'System Override'}
            {view === 'update' && 'Establish New Key'}
          </h1>
        </div>

        <div className="space-y-4">
          {view !== 'update' && (
            <GlassInput icon={<Mail size={16}/>} placeholder="Email Directive" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} />
          )}
          
          {view !== 'forgot' && (
            <GlassInput icon={<Lock size={16}/>} placeholder={view === 'update' ? "New Passcode" : "Passcode"} type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} onKeyDown={(e: any) => e.key === 'Enter' && handleAuth()} />
          )}

          {error && <div className="text-xs text-red-400 bg-red-500/10 p-3 rounded-lg flex items-center gap-2"><AlertTriangle size={14}/> {error}</div>}
          {message && <div className="text-xs text-green-400 bg-green-500/10 p-3 rounded-lg">{message}</div>}

          <GlassButton className="w-full mt-2" onClick={handleAuth} disabled={loading || (view !== 'forgot' && !password) || (view !== 'update' && !email)}>
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : null}
            {view === 'login' ? 'Establish Link' : view === 'signup' ? 'Create Identity' : view === 'forgot' ? 'Request Override' : 'Confirm New Passcode'}
          </GlassButton>

          <div className="text-center mt-4 space-y-2 flex flex-col">
             {view === 'login' ? (
               <>
                 <button onClick={() => setView('forgot')} className="text-xs text-gray-500 hover:text-white transition-colors">Forgot Passcode?</button>
                 <button onClick={() => setView('signup')} className="text-xs text-gray-500 hover:text-white transition-colors">Initialize New System</button>
               </>
             ) : (
                 <button onClick={() => { setView('login'); setError(''); setMessage(''); }} className="text-xs text-gray-500 hover:text-white transition-colors">Return to Login</button>
             )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
