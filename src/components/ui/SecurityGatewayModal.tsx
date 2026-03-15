import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { GlassCard } from './GlassCard';
import { GlassInput } from './GlassInput';
import { GlassButton } from './GlassButton';
import { AlertOctagon, Loader2, X } from 'lucide-react';

interface Props {
  actionName: string; 
  userEmail: string; 
  onVerify: () => void; 
  onCancel: () => void;
}

export const SecurityGatewayModal = ({ actionName, userEmail, onVerify, onCancel }: Props) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Re-authenticate by signing in again with the current email and entered password
      const { error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password
      });
      
      if (error) throw new Error('Cryptographic signature invalid. Access denied.');
      
      // If it passes, trigger the nuclear function
      onVerify();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <GlassCard className="w-full max-w-md p-6 border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.1)] relative">
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
        
        <div className="text-center mb-6">
          <AlertOctagon size={40} className="mx-auto text-red-500 mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-white uppercase tracking-widest">Security Gateway</h2>
          <p className="text-xs text-red-400 mt-2">You are attempting to execute: <br/><span className="font-mono text-white text-sm">{actionName}</span></p>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-gray-400 text-center">To authorize this destructive action, confirm your master passcode.</p>
          
          <GlassInput 
            type="password" 
            placeholder="Master Passcode" 
            value={password} 
            onChange={(e: any) => setPassword(e.target.value)}
            onKeyDown={(e: any) => e.key === 'Enter' && handleVerify()}
            autoFocus
          />

          {error && <div className="text-xs text-red-400 text-center">{error}</div>}

          <div className="flex gap-3 mt-4">
            <GlassButton className="flex-1 bg-white/5 border-white/10" onClick={onCancel}>Abort</GlassButton>
            <button 
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl flex justify-center items-center transition-colors disabled:opacity-50"
              onClick={handleVerify}
              disabled={loading || !password}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Authorize Override'}
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
