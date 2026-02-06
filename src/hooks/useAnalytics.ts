import { useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';

export const useAnalytics = () => {
  const { history, budgets, signals } = useLedger();

  // 1. BURN HISTORY (Unchanged)
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
      if (h.type === 'SPEND' || h.type === 'GENEROSITY') {
        const d = new Date(h.date);
        const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (data[key]) {
          data[key].burn += Math.abs(h.amount || 0);
        }
      }
    });

    return Object.values(data);
  }, [history, budgets]);

  // 2. CATEGORY SPEND (Unchanged)
  const categorySplit = useMemo(() => {
    const map: Record<string, number> = {};
    history.filter(h => h.type === 'SPEND').forEach(h => {
        const key = h.title || 'Uncategorized';
        map[key] = (map[key] || 0) + Math.abs(h.amount || 0);
      });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [history]);

  // 3. SIGNAL STATS (Unchanged)
  const signalStats = useMemo(() => {
    const data = signals.filter(s => s.totalGenerated > 0 || s.hoursLogged > 0).map(s => ({
        id: s.id, name: s.title, sector: s.sector, effort: s.hoursLogged, profit: s.totalGenerated,
        roi: s.hoursLogged > 0 ? (s.totalGenerated / s.hoursLogged) : 0
      })).sort((a, b) => b.roi - a.roi);
    const globalYield = data.reduce((sum, s) => sum + s.effort, 0) > 0 ? data.reduce((sum, s) => sum + s.profit, 0) / data.reduce((sum, s) => sum + s.effort, 0) : 0;
    return { scatter: data, leaderboard: data, globalYield };
  }, [signals]);

  // 4. MONTHLY STATEMENT (Unchanged)
  const monthlyStatement = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    for (let i = 0; i < 6; i++) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      map.set(key, { income: 0, expense: 0 });
    }
    history.forEach(log => {
      const key = log.date.slice(0, 7);
      if (map.has(key)) {
        const entry = map.get(key)!;
        if (log.type === 'DROP' || log.type === 'TRIAGE_SESSION') entry.income += (log.amount || 0);
        if (log.type === 'SPEND' || log.type === 'GENEROSITY') entry.expense += (log.amount || 0);
      }
    });
    return Array.from(map.entries()).map(([month, data]) => {
      const net = data.income - data.expense;
      return { month, ...data, net, savingsRate: data.income > 0 ? (net / data.income) * 100 : 0 };
    }).sort((a, b) => b.month.localeCompare(a.month));
  }, [history]);

  // 5. METRIC RIBBON (Unchanged)
  const ribbon = useMemo(() => {
    const lastMonth = monthlyStatement[0] || { savingsRate: 0 };
    const prevMonth = monthlyStatement[1] || { savingsRate: 0 };
    const largestLeak = categorySplit[0] ? { name: categorySplit[0].name, amount: categorySplit[0].value } : null;
    return { savingsRate: lastMonth.savingsRate, savingsDelta: lastMonth.savingsRate - prevMonth.savingsRate, alphaYield: signalStats.globalYield, largestLeak };
  }, [monthlyStatement, categorySplit, signalStats]);


  // --- UPDATED: COMPARATOR ENGINE ---
  const getComparatorData = (keys: string[], mode: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY') => {
    return keys.map(key => {
        let total = 0;
        
        history.filter(h => h.type === 'SPEND' || h.type === 'GENEROSITY').forEach(log => {
            const dateStr = log.date; // "2026-02-15..."
            const year = dateStr.slice(0, 4);
            const month = parseInt(dateStr.slice(5, 7)); // 1-12

            if (mode === 'ANNUAL') {
                if (dateStr.startsWith(key)) total += Math.abs(log.amount || 0);
            } 
            else if (mode === 'MONTHLY') {
                if (dateStr.startsWith(key)) total += Math.abs(log.amount || 0);
            }
            else if (mode === 'QUARTERLY') {
                // Key format: "Q1 2026"
                const [q, y] = key.split(' '); // q="Q1", y="2026"
                if (year === y) {
                    const qNum = parseInt(q.replace('Q', '')); // 1
                    // Q1 = Month 1,2,3
                    // Q2 = Month 4,5,6
                    const startMonth = (qNum - 1) * 3 + 1;
                    const endMonth = startMonth + 2;
                    if (month >= startMonth && month <= endMonth) {
                        total += Math.abs(log.amount || 0);
                    }
                }
            }
        });

        return { name: key, value: total };
    });
  };

  // Helper to get available options
  const availablePeriods = useMemo(() => {
      const years = new Set<string>();
      const months = new Set<string>();
      const quarters = new Set<string>();
      
      history.forEach(h => {
          const d = new Date(h.date);
          const y = d.getFullYear().toString();
          years.add(y);
          months.add(h.date.slice(0, 7)); // YYYY-MM
          
          // Calculate Quarter
          const m = d.getMonth() + 1;
          const q = Math.ceil(m / 3);
          quarters.add(`Q${q} ${y}`);
      });

      return {
          years: Array.from(years).sort().reverse(),
          quarters: Array.from(quarters).sort().reverse(), // e.g. ["Q1 2026", "Q4 2025"]
          months: Array.from(months).sort().reverse()
      };
  }, [history]);

  return { 
    burnHistory, categorySplit, signalPerformance: signalStats.scatter, signalLeaderboard: signalStats.leaderboard,
    monthlyStatement, ribbon, 
    getComparatorData, availablePeriods 
  };
};
