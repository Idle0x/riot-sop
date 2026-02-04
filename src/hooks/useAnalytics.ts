import { useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';
import { useUser } from '../context/UserContext';

export const useAnalytics = () => {
  const { history, accounts, budgets, signals } = useLedger();
  const { user } = useUser();

  // 1. BURN HISTORY (Last 6 Months)
  // Groups 'SPEND' events by "MMM YYYY"
  const burnHistory = useMemo(() => {
    const data: Record<string, { date: string; burn: number; limit: number }> = {};
    const monthlyLimit = budgets.reduce((sum, b) => sum + (b.frequency === 'monthly' ? b.amount : 0), 0);

    // Initialize last 6 months to 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      data[key] = { date: key, burn: 0, limit: monthlyLimit };
    }

    history.forEach(h => {
      if (h.type === 'SPEND' || h.type === 'SYSTEM_EVENT' && h.title.includes('Burn')) {
        const d = new Date(h.date);
        const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (data[key]) {
          data[key].burn += Math.abs(h.amount || 0);
        }
      }
    });

    return Object.values(data);
  }, [history, budgets]);

  // 2. NET WORTH TREND (Derived from Snapshots)
  // Uses 'SNAPSHOT' tags created by SystemEngine
  const netWorthTrend = useMemo(() => {
    const snapshots = history
      .filter(h => h.tags?.includes('SNAPSHOT'))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 snapshots

    if (snapshots.length === 0) {
      // Fallback: Current State point
      const liquid = (accounts.find(a => a.type === 'payroll')?.balance || 0) + (accounts.find(a => a.type === 'treasury')?.balance || 0);
      const locked = (accounts.find(a => a.type === 'vault')?.balance || 0) + (accounts.find(a => a.type === 'buffer')?.balance || 0);
      return [{ date: 'Today', liquid, locked, total: liquid + locked }];
    }

    return snapshots.map(s => {
      // Note: Snapshots currently store "Runway Months" in 'amount'. 
      // For V2, we might want to store actual Net Worth in amount or parsing description.
      // For now, let's assume we start tracking clean Net Worth snapshots in V3.
      // We will mock trend based on Runway for now to show visual curve.
      return {
        date: new Date(s.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
        runway: s.amount || 0
      };
    });
  }, [history, accounts]);

  // 3. CATEGORY SPEND (Treemap Data)
  const categorySplit = useMemo(() => {
    const map: Record<string, number> = {};
    
    // Iterate recent history to find category usage
    // Note: Since history logs store Title as "Budget Name", we aggregate by Title
    history
      .filter(h => h.type === 'SPEND')
      .slice(0, 100) // Last 100 txns
      .forEach(h => {
        const key = h.title || 'Uncategorized';
        map[key] = (map[key] || 0) + Math.abs(h.amount || 0);
      });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 Categories
  }, [history]);

  // 4. SIGNAL ALPHA (Scatter Plot)
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

  return { burnHistory, netWorthTrend, categorySplit, signalPerformance };
};
