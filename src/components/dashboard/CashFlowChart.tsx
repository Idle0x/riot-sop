import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatNumber } from '../../utils/format';

interface Props {
  data: { name: string; income: number; expense: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-lg text-xs shadow-xl">
        <p className="font-bold text-white mb-2">{label}</p>
        <p className="text-green-400">In: ${formatNumber(payload[0].value)}</p>
        <p className="text-red-400">Out: ${formatNumber(payload[1].value)}</p>
        <div className="mt-2 pt-2 border-t border-white/10 text-gray-400">
           Net: <span className={payload[0].value - payload[1].value >= 0 ? 'text-green-400' : 'text-red-400'}>
             {payload[0].value - payload[1].value >= 0 ? '+' : ''}${formatNumber(payload[0].value - payload[1].value)}
           </span>
        </div>
      </div>
    );
  }
  return null;
};

export const CashFlowChart = ({ data }: Props) => {
  return (
    <div className="h-[200px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6b7280', fontSize: 10 }} 
            dy={10}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
          <Bar dataKey="income" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-in-${index}`} fill="rgba(34, 197, 94, 0.5)" />
            ))}
          </Bar>
          <Bar dataKey="expense" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-out-${index}`} fill="rgba(239, 68, 68, 0.5)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
