import type { ReactNode } from 'react';
import { GlassButton } from './GlassButton';

interface Props {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export const EmptyState = ({ icon, title, description, actionLabel, onAction }: Props) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
      <div className="p-4 rounded-full bg-white/5 text-gray-500">
        {icon}
      </div>
      <div className="space-y-1">
        <h3 className="text-white font-bold text-sm">{title}</h3>
        <p className="text-xs text-gray-500 max-w-[200px] mx-auto">{description}</p>
      </div>
      <GlassButton size="sm" variant="secondary" onClick={onAction}>
        {actionLabel}
      </GlassButton>
    </div>
  );
};
