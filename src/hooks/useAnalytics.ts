import { useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';

export const useAnalytics = () => {
  const { history, budgets, signals } = useLedger();

  // 1. BURN HISTORY (Last 6 Months)
  const burnHistory = useMemo(() => {
    const data: Record<string, { date: string; burn: number; limit: number }> = {};
    const monthlyLimit = budgets.reduce((sum, b) => sum + (b.frequency === 'monthly' ? b.amount : 0), 0);

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      data[key] = { date: key, burn: 0, limit: monthlyLimit };
    }

    history.forEach(h => {
      if (h.type === 'SPEND' || (h.type === 'SYSTEM_EVENT' && h.title.includes('Burn'))) {
        const d = new Date(h.date);
        const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (data[key]) {
          data[key].burn += Math.abs(h.amount || 0);
        }
      }
    });

    return Object.values(data);
  }, [history, budgets]);

  // 2. CATEGORY SPEND (Treemap Data)
  const categorySplit = useMemo(() => {
    const map: Record<string, number> = {};
    history
      .filter(h => h.type === 'SPEND')
      .slice(0, 100)
      .forEach(h => {
        const key = h.title || 'Uncategorized';
        map[key] = (map[key] || 0) + Math.abs(h.amount || 0);
      });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [history]);

  // 3. SIGNAL ALPHA (Scatter Plot)
  const signalPerformance = useMemo(() => {
    return signals
      .filter(s => s.totalGenerated > 0 || s.hoursLogged > 0)
      .map(s => ({
        name: s.title,
        effort: s.hoursLogged,
        profit: s.totalGenerated,
        roi: s.hoursLogged > 0 ? (s.totalGenerated / s.hoursLogged) : 0
      }));
  }, [signals]);

  // 4. YEAR-OVER-YEAR COMPARISON (Restored Logic)
  const comparisonData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    const months = Array.from({length: 12}, (_, i) => ({
      name: new Date(0, i).toLocaleString('default', { month: 'short' }),
      [currentYear]: 0,
      [lastYear]: 0
    }));

    history.filter(h => h.type === 'SPEND').forEach(log => {
      const d = new Date(log.date);
      const y = d.getFullYear();
      const m = d.getMonth();
      if (y === currentYear || y === lastYear) {
        // @ts-ignore
        months[m][y] += Math.abs(log.amount || 0);
      }
    });

    return months;
  }, [history]);

  return { burnHistory, categorySplit, signalPerformance, comparisonData };
};
