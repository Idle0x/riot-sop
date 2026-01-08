import { type ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: (e: React.MouseEvent) => void; // NEW: Added onClick support
}

export const GlassCard = ({ children, className, hoverEffect = false, onClick }: GlassCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-glass-border bg-glass backdrop-blur-md",
        "shadow-glass-md transition-all duration-300",
        // Top Shine Effect
        "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        hoverEffect && "hover:-translate-y-1 hover:border-white/20 hover:shadow-glass-lg hover:shadow-accent-success/5",
        onClick && "cursor-pointer", // Add pointer cursor if clickable
        className
      )}
    >
      {children}
    </div>
  );
};
