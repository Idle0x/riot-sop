import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface RunwayWeatherProps {
  months: number;
  children: ReactNode;
}

export const RunwayWeather = ({ months, children }: RunwayWeatherProps) => {
  // Determine financial "Season"
  const getSeason = () => {
    if (months <= 0) return 'dry';
    if (months < 3) return 'critical';
    if (months < 6) return 'building';
    if (months < 12) return 'secure';
    return 'freedom';
  };

  const season = getSeason();

  // Ambient Gradients
  const gradients = {
    dry: 'bg-gradient-to-br from-bg-primary via-[#1a0505] to-[#2a0a0a]', // Dark Red/Black
    critical: 'bg-gradient-to-br from-bg-primary via-[#1a1005] to-[#2a1a0a]', // Dark Orange
    building: 'bg-gradient-to-br from-bg-primary via-[#051a1a] to-[#0a2a2a]', // Dark Teal
    secure: 'bg-gradient-to-br from-bg-primary via-[#051a05] to-[#0a2a0a]', // Dark Green
    freedom: 'bg-gradient-to-br from-bg-primary via-[#1a051a] to-[#2a0a2a]', // Dark Purple/Gold
  };

  return (
    <div className={cn("min-h-screen transition-colors duration-1000", gradients[season])}>
      {/* Weather Overlay (Subtle noise/texture) */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      {children}
    </div>
  );
};
