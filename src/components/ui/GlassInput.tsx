import { type InputHTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, label, icon, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-accent-success transition-colors">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-black/20 border border-glass-border rounded-xl py-3 px-4",
              "text-white placeholder:text-gray-600 focus:outline-none focus:border-accent-success/50",
              "focus:ring-1 focus:ring-accent-success/50 transition-all duration-300",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              icon && "pl-11",
              className
            )}
            {...props}
          />
        </div>
      </div>
    );
  }
);
GlassInput.displayName = 'GlassInput';
