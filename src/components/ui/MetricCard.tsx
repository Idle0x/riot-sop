import { useState } from 'react';
import { Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { cn } from '../../utils/cn';

interface MetricCardProps {
  title: string;
  value: string;        // Primary currency (e.g. USD)
  subValue?: string;    // Secondary currency (e.g. NGN)
  trend?: {
    value: number;      // e.g. 12
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  isPrivate?: boolean;  // Default privacy state
}

export const MetricCard = ({ 
  title, 
  value, 
  subValue, 
  trend, 
  icon,
  isPrivate = false 
}: MetricCardProps) => {
  const [isHidden, setIsHidden] = useState(isPrivate);

  return (
    <GlassCard className="relative p-6" hoverEffect>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {icon && <div className="p-2 rounded-lg bg-white/5 text-gray-400">{icon}</div>}
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            {title}
          </span>
        </div>
        
        {/* Privacy Toggle */}
        <button 
          onClick={() => setIsHidden(!isHidden)}
          className="text-gray-500 hover:text-white transition-colors"
        >
          {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Values */}
      <div className="mt-4 space-y-1">
        <div className="font-mono text-3xl font-bold text-white tracking-tight drop-shadow-lg">
          {isHidden ? '••••••' : value}
        </div>
        {subValue && (
          <div className="font-mono text-sm text-gray-500">
            {isHidden ? '••••••' : subValue}
          </div>
        )}
      </div>

      {/* Footer / Trend */}
      {trend && (
        <div className="mt-4 flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
            trend.isPositive ? "bg-accent-success/10 text-accent-success" : "bg-accent-danger/10 text-accent-danger"
          )}>
            {trend.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend.value}%
          </div>
          <span className="text-xs text-gray-500">vs last month</span>
        </div>
      )}
    </GlassCard>
  );
};
