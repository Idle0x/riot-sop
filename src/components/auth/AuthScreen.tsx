import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext'; // Added Hook
import { GlassCard } from '../ui/GlassCard';
import { GlassInput } from '../ui/GlassInput';
import { GlassButton } from '../ui/GlassButton';
import { Shield, Mail, Lock, Loader2, AlertTriangle, Key, ArrowRight } from 'lucide-react';

interface Props {
  onAuthenticated: () => void;
}

type AuthView = 'login' | 'signup' | 'forgot' | 'update';

export const AuthScreen = ({ onAuthenticated }: Props) => {
  const { loginAsGuest } = useUser(); // Grab the guest login function
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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

  const handleGuestEntry = () => {
      loginAsGuest();
      onAuthenticated();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      <GlassCard className="w-full max-w-md p-5 md:p-8 relative z-10 border-white/10">
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex p-3 md:p-4 rounded-full bg-white/5 border border-white/10 mb-3 md:mb-4 shadow-2xl">
            {view === 'forgot' || view === 'update' ? <Key className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" /> : <Shield className="w-6 h-6 md:w-8 md:h-8 text-accent-success" />}
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            {view === 'login' && 'Command Center'}
            {view === 'signup' && 'Initialize Identity'}
            {view === 'forgot' && 'System Override'}
            {view === 'update' && 'Establish New Key'}
          </h1>
        </div>

        <div className="space-y-3 md:space-y-4">
          {view !== 'update' && (
            <GlassInput icon={<Mail size={14} className="md:w-4 md:h-4"/>} placeholder="Email Directive" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} />
          )}

          {view !== 'forgot' && (
            <GlassInput icon={<Lock size={14} className="md:w-4 md:h-4"/>} placeholder={view === 'update' ? "New Passcode" : "Passcode"} type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} onKeyDown={(e: any) => e.key === 'Enter' && handleAuth()} />
          )}

          {error && <div className="text-[10px] md:text-xs text-red-400 bg-red-500/10 p-2.5 md:p-3 rounded-lg flex items-start md:items-center gap-2 font-bold"><AlertTriangle size={14} className="shrink-0 mt-0.5 md:mt-0"/> {error}</div>}
          {message && <div className="text-[10px] md:text-xs text-green-400 bg-green-500/10 p-2.5 md:p-3 rounded-lg font-bold">{message}</div>}

          <GlassButton className="w-full mt-1 md:mt-2 text-xs md:text-sm py-2.5 md:py-3" onClick={handleAuth} disabled={loading || (view !== 'forgot' && !password) || (view !== 'update' && !email)}>
            {loading ? <Loader2 className="animate-spin mr-1.5 md:mr-2 h-3 w-3 md:h-4 md:w-4"/> : null}
            {view === 'login' ? 'Establish Link' : view === 'signup' ? 'Create Identity' : view === 'forgot' ? 'Request Override' : 'Confirm New Passcode'}
          </GlassButton>

          <div className="text-center mt-3 md:mt-4 space-y-1.5 md:space-y-2 flex flex-col">
             {view === 'login' ? (
               <>
                 <button onClick={() => setView('forgot')} className="text-[10px] md:text-xs text-gray-500 hover:text-white transition-colors font-bold tracking-wide uppercase">Forgot Passcode?</button>
                 <button onClick={() => setView('signup')} className="text-[10px] md:text-xs text-gray-500 hover:text-white transition-colors font-bold tracking-wide uppercase">Initialize New System</button>
               </>
             ) : (
                 <button onClick={() => { setView('login'); setError(''); setMessage(''); }} className="text-[10px] md:text-xs text-gray-500 hover:text-white transition-colors font-bold tracking-wide uppercase">Return to Login</button>
             )}
          </div>
        </div>

        {/* DEMO ENTRY POINT */}
        {view === 'login' && (
          <div className="mt-8 pt-6 border-t border-white/10 animate-fade-in">
             <button 
                onClick={handleGuestEntry} 
                className="w-full group flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
             >
                <div className="text-left">
                   <div className="text-xs md:text-sm font-bold text-white mb-0.5">Enter Demo Environment</div>
                   <div className="text-[9px] md:text-[10px] text-gray-400">Explore full features with simulated data.</div>
                </div>
                <div className="p-1.5 bg-white/10 rounded-lg text-white group-hover:bg-white text-black transition-colors">
                   <ArrowRight size={14}/>
                </div>
             </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
