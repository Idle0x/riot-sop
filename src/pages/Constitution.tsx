import { GlassCard } from '../components/ui/GlassCard';
import { Shield } from 'lucide-react';

export const Constitution = () => (
  <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8 pb-20 animate-fade-in">
    <div className="text-center mb-12">
      <Shield size={48} className="mx-auto text-white mb-4 opacity-80" />
      <h1 className="text-4xl font-bold text-white tracking-tight">The Constitution</h1>
      <p className="text-gray-400 mt-2">v1.6 • Irrevocable Rules</p>
    </div>

    <GlassCard className="p-8 border-l-4 border-green-500">
      <h2 className="text-2xl font-bold text-white mb-4">Core Principles</h2>
      <ul className="space-y-4 text-gray-300 list-disc pl-5">
        <li>I am building this to buy <strong>Freedom</strong>, not status.</li>
        <li>Pay Future Self first, Present Self second.</li>
        <li>Live invisibly secure (Stealth Wealth).</li>
        <li>My system protects me from others and myself.</li>
      </ul>
    </GlassCard>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <GlassCard className="p-6">
        <h3 className="font-bold text-white mb-2">The Algorithm</h3>
        <p className="text-sm text-gray-400 font-mono">
          IF Drop &gt; $10k THEN Silence (7 Days).<br/>
          IF Impulse Buy THEN Wait 72 Hours.<br/>
          IF Buffer Access THEN Red Tape Protocol.
        </p>
      </GlassCard>
      {/* More cards for Generosity Rules, etc */}
    </div>
  </div>
);
