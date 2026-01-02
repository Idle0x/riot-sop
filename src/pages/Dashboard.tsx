import { Wallet, CreditCard, ShieldCheck } from 'lucide-react';
import { useFinancials } from '../context/FinancialContext';
import { MetricCard } from '../components/ui/MetricCard';
import { GlassProgressBar } from '../components/ui/GlassProgressBar';
import { GlassCard } from '../components/ui/GlassCard';

export const Dashboard = () => {
  const { accounts, goals } = useFinancials();

  // 1. Get Real Account Balances
  const treasury = accounts.find(a => a.id === 'treasury');
  const payroll = accounts.find(a => a.id === 'payroll');
  const buffer = accounts.find(a => a.id === 'buffer');

  // 2. Calculate Real Runway (Assuming monthly burn of $1,500 for demo)
  // In a future update, we will make "Monthly Burn" a setting.
  const MONTHLY_BURN = 1500; 
  const treasuryBalance = treasury?.balance || 0;
  const runwayMonths = treasuryBalance / MONTHLY_BURN;
  
  // Runway Logic for Colors
  const runwayColor = runwayMonths < 3 ? 'danger' : runwayMonths < 6 ? 'warning' : 'success';
  const runwayLabel = runwayMonths < 3 ? 'CRITICAL' : runwayMonths < 6 ? 'CAUTION' : 'SECURE';

  // 3. Get Active Goals (Not Completed)
  const activeGoals = goals
    .filter(g => !g.isCompleted)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3); // Show top 3

  // Helper for formatting
  const formatUSD = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  const formatNGN = (val: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. TOP ROW - KEY METRICS (Live Data) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Treasury (USD) */}
        <MetricCard 
          title="Treasury"
          value={formatUSD(treasury?.balance || 0)}
          subValue="≈ ₦(Rate x Balance)"
          icon={<Wallet size={20} />}
          trend={{ value: 0, isPositive: true }} // We'll hook up trends later
          isPrivate={true} // Default to hidden for safety
        />

        {/* Payroll (NGN) */}
        <MetricCard 
          title="Payroll"
          value={formatNGN(payroll?.balance || 0)}
          subValue="OpEx / Living"
          icon={<CreditCard size={20} />}
        />

        {/* Buffer (Locked) */}
        <MetricCard 
          title="Buffer Vault"
          value={formatNGN(buffer?.balance || 0)}
          subValue="Emergency Only"
          icon={<ShieldCheck size={20} />}
        />
      </div>

      {/* 2. RUNWAY VISUALIZER (Live Data) */}
      <GlassCard className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Financial Runway</h3>
            <p className="text-sm text-gray-400">Based on fixed burn rate of ${MONTHLY_BURN}/mo</p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-mono font-bold text-accent-${runwayColor}`}>
              {runwayMonths.toFixed(1)} Months
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">{runwayLabel}</div>
          </div>
        </div>

        <GlassProgressBar 
          value={runwayMonths} 
          max={12} 
          label="Target: 12 Months" 
          color={runwayColor} 
          size="lg"
          showPercentage={false}
        />
        
        <div className="mt-4 flex justify-between text-xs text-gray-500 font-mono">
          <span>0 Months</span>
          <span>6 Months (Safety)</span>
          <span>12 Months (Freedom)</span>
        </div>
      </GlassCard>

      {/* 3. ACTIVE GOALS PREVIEW (Live Data) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white">Active Goals (Top 3)</h3>
            <span className="text-xs font-bold px-2 py-1 rounded bg-accent-info/10 text-accent-info">PRIORITY</span>
          </div>
          
          <div className="space-y-6">
            {activeGoals.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No active goals. Time to set new ones!</div>
            ) : (
              activeGoals.map(goal => (
                <GlassProgressBar 
                  key={goal.id}
                  value={goal.currentAmount} 
                  max={goal.targetAmount} 
                  label={goal.title} 
                  color={goal.phase === 'P1' ? 'warning' : 'info'} 
                />
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
           <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white">Monthly Budget</h3>
            <span className="text-xs text-gray-400">November 2025</span>
          </div>
           <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
             Budget Monitor Module Loading...
           </div>
        </GlassCard>
      </div>

    </div>
  );
};
