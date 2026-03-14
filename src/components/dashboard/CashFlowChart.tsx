import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Naira } from '../ui/Naira';
import { formatNumber } from '../../utils/format';

const formatAxisAmount = (val: number) => {
  if (val === 0) return '0';
  if (val >= 1000000) return `${(val / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
  return val.toString();
};

interface CashFlowChartProps {
  data: any[];
}

export const CashFlowChart = ({ data }: CashFlowChartProps) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <XAxis 
            dataKey="name" 
            stroke="#555" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            minTickGap={15} 
        />
        <YAxis 
            stroke="#555" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(val) => `₦${formatAxisAmount(val)}`} 
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-black/90 border border-white/10 p-3 rounded-lg shadow-xl text-xs z-50">
                  <p className="font-bold text-white mb-2">{label}</p>
                  {payload.map((p: any, idx: number) => (
                    <p key={idx} style={{ color: p.fill }} className="flex items-center justify-between gap-4">
                      <span>{p.dataKey === 'income' ? 'Inflow' : 'Outflow'}:</span> 
                      <span className="font-mono font-bold"><Naira/>{formatNumber(p.value)}</span>
                    </p>
                  ))}
                </div>
              );
            }
            return null;
          }}
          cursor={{ fill: '#ffffff0a' }}
        />
        <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
        <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
};
