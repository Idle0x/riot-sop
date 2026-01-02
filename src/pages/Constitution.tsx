import { Shield, Lock, Eye, Anchor } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';

export const Constitution = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">The Constitution</h1>
        <p className="text-gray-400">Operating Principles v1.6</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* THE MISSION */}
        <GlassCard className="p-8 border-accent-info/30 md:col-span-2">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-full bg-accent-info/10 text-accent-info">
              <Anchor size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">The Mission</h2>
          </div>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              <strong className="text-white">I AM BUILDING THIS TO:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Never go broke and wonder "what happened" again.</li>
              <li>Secure my family's future, not prove anything to others.</li>
              <li>Buy <span className="text-accent-success font-bold">time, freedom, and options</span>—not things, status, or validation.</li>
            </ul>
          </div>
        </GlassCard>

        {/* CORE PRINCIPLE 1 */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4 text-accent-success">
            <Shield size={20} />
            <h3 className="font-bold">Security First</h3>
          </div>
          <p className="text-gray-300">
            Pay my Future Self first, Present Self second. The <span className="text-white font-bold">Buffer Vault (10%)</span> is sacred and untouched except for life-threatening emergencies.
          </p>
        </GlassCard>

        {/* CORE PRINCIPLE 2 */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4 text-accent-warning">
            <Eye size={20} />
            <h3 className="font-bold">Stealth Wealth</h3>
          </div>
          <p className="text-gray-300">
            Live invisibly secure, not visibly rich. My system protects me from others AND from myself. Money in the Treasury does not exist for spending.
          </p>
        </GlassCard>

        {/* CORE PRINCIPLE 3 */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4 text-accent-danger">
            <Lock size={20} />
            <h3 className="font-bold">The Firewall</h3>
          </div>
          <p className="text-gray-300">
            Generosity is capped at <span className="text-white font-bold">₦300k/drop</span>. No loans. No guilt. "No" is a complete sentence.
          </p>
        </GlassCard>

        {/* ALGO */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4 text-white">
            <span className="font-mono font-bold text-lg">IF/THEN</span>
            <h3 className="font-bold">The Algorithm</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-300 font-mono">
            <li>IF Drop &gt; $10k THEN Wait 24h.</li>
            <li>IF Friend asks $ THEN Check Budget.</li>
            <li>IF Impulse Buy THEN Wait 72h.</li>
          </ul>
        </GlassCard>

      </div>
      
      <div className="text-center pt-8 opacity-50">
        <p className="text-xs uppercase tracking-widest">Signed digitally by the Operator</p>
      </div>

    </div>
  );
};
