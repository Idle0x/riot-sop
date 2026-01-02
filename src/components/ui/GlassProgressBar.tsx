import { cn } from '../../utils/cn';

interface GlassProgressBarProps {
  value: number;      // Current amount
  max: number;        // Target amount
  label?: string;     // e.g., "8.2 months runway"
  color?: 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
}

export const GlassProgressBar = ({ 
  value, 
  max, 
  label, 
  color = 'success',
  size = 'md',
  showPercentage = true
}: GlassProgressBarProps) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  // Color Maps
  const colors = {
    success: 'from-accent-success to-emerald-600 shadow-accent-success/20',
    warning: 'from-accent-warning to-amber-600 shadow-accent-warning/20',
    danger: 'from-accent-danger to-red-600 shadow-accent-danger/20',
    info: 'from-accent-info to-blue-600 shadow-accent-info/20',
  };

  const sizes = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  };

  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        {label && (
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            {label}
          </span>
        )}
        {showPercentage && (
          <span className={cn("font-mono text-sm font-bold", `text-accent-${color}`)}>
            {percentage.toFixed(0)}%
          </span>
        )}
      </div>
      
      {/* Bar Container */}
      <div className={cn("relative w-full overflow-hidden rounded-full bg-glass-border", sizes[size])}>
        {/* Fill */}
        <div
          className={cn(
            "absolute left-0 top-0 h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out",
            colors[color]
          )}
          style={{ width: `${percentage}%` }}
        >
          {/* Shimmer Effect */}
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </div>
    </div>
  );
};
