import { ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility to merge tailwind classes safely
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard = ({ children, className, hoverEffect = false }: GlassCardProps) => {
  return (
    <div
      className={cn(
        // Base Glass Styles
        "relative overflow-hidden rounded-2xl border border-glass-border bg-glass backdrop-blur-md",
        "shadow-glass-md transition-all duration-300",
        // Top Shine Effect
        "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        // Hover State (Optional)
        hoverEffect && "hover:-translate-y-1 hover:border-white/20 hover:shadow-glass-lg hover:shadow-accent-success/5",
        className
      )}
    >
      {children}
    </div>
  );
};
