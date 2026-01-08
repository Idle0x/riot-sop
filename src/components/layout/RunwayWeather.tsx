import { ReactNode } from 'react';
import { getFinancialState } from '../../utils/finance';

interface Props { months: number; children: ReactNode; }

export const RunwayWeather = ({ months, children }: Props) => {
  const state = getFinancialState(months);
  
  const gradients = {
    dry: 'bg-gradient-to-br from-black via-red-950 to-black',
    critical: 'bg-gradient-to-br from-gray-900 via-orange-950/40 to-black',
    building: 'bg-gradient-to-br from-gray-900 via-emerald-950/30 to-black',
    secure: 'bg-gradient-to-br from-gray-900 via-emerald-900/20 to-black',
    freedom: 'bg-gradient-to-br from-gray-900 via-purple-950/40 to-black',
  };

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${gradients[state]}`}>
      {children}
    </div>
  );
};
