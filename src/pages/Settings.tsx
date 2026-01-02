import { Settings as SettingsIcon, ShieldAlert } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';

export const Settings = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-20">
      
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">System Settings</h1>
        <p className="text-gray-400">Configuration & Data Management</p>
      </div>

      {/* EVOLUTION LOG (Placeholder for Batch 2) */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent-info/10 text-accent-info rounded-lg">
            <SettingsIcon size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white">Evolution Log</h3>
            <p className="text-xs text-gray-400">Track changes to living costs and salary</p>
          </div>
        </div>
        <div className="p-4 border border-dashed border-glass-border rounded-xl text-center text-sm text-gray-500">
          Module coming in Batch 2
        </div>
      </GlassCard>

      {/* DANGER ZONE (Placeholder for Nuclear Reset) */}
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
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-glass-border">
            <div>
              <div className="font-bold text-white">Nuclear Reset</div>
              <div className="text-xs text-gray-500">Reset all balances to zero</div>
            </div>
            <GlassButton variant="danger" size="sm" disabled>
              Locked (Batch 2)
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* APP INFO */}
      <div className="text-center pt-8">
        <p className="text-xs text-gray-600">
          THE riot' SOP v1.0.0<br/>
          Secure Local Storage Active
        </p>
      </div>

    </div>
  );
};
