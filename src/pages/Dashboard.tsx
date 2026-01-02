import { Wallet, CreditCard, ShieldCheck } from 'lucide-react';
import { MetricCard } from '../components/ui/MetricCard';
import { GlassProgressBar } from '../components/ui/GlassProgressBar';
import { GlassCard } from '../components/ui/GlassCard';

export const Dashboard = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. TOP ROW - KEY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Treasury (USD) */}
        <MetricCard 
          title="Treasury"
          value="$12,450.00"
          subValue="≈ ₦18,675,000"
          icon={<Wallet size={20} />}
          trend={{ value: 12, isPositive: true }}
        />

        {/* Payroll (NGN) */}
        <MetricCard 
          title="Payroll"
          value="₦450,000"
          subValue="OpEx / Living"
          icon={<CreditCard size={20} />}
          trend={{ value: 5, isPositive: false }}
        />

        {/* Buffer (Locked) */}
        <MetricCard 
          title="Buffer Vault"
          value="₦2,000,000"
          subValue="Emergency Only"
          icon={<ShieldCheck size={20} />}
        />
      </div>

      {/* 2. RUNWAY VISUALIZER */}
      <GlassCard className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Financial Runway</h3>
            <p className="text-sm text-gray-400">Time until Treasury depletion at current burn rate</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono font-bold text-accent-success">8.4 Months</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Secure</div>
          </div>
        </div>

        <GlassProgressBar 
          value={8.4} 
          max={12} 
          label="Target: 12 Months" 
          color="success" 
          size="lg"
          showPercentage={false}
        />
        
        <div className="mt-4 flex justify-between text-xs text-gray-500 font-mono">
          <span>0 Months</span>
          <span>6 Months (Safety Line)</span>
          <span>12 Months (Freedom)</span>
        </div>
      </GlassCard>

      {/* 3. ACTIVE GOALS PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white">Active Goals (Phase 1)</h3>
            <span className="text-xs font-bold px-2 py-1 rounded bg-accent-info/10 text-accent-info">P1: SECURITY</span>
          </div>
          
          <div className="space-y-6">
            <GlassProgressBar value={65} max={100} label="Laptop Upgrade" color="warning" />
            <GlassProgressBar value={30} max={100} label="Apartment Fund" color="info" />
            <GlassProgressBar value={100} max={100} label="Debt Clearance" color="success" />
          </div>
        </GlassCard>

        <GlassCard className="p-6">
           <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white">Monthly Budget</h3>
            <span className="text-xs text-gray-400">November 2025</span>
          </div>
           {/* Placeholder for Budget Component */}
           <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
             Budget Monitor Module Loading...
           </div>
        </GlassCard>
      </div>

    </div>
  );
};
