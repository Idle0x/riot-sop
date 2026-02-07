import { useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';

export const useAnalytics = () => {
  const { history, budgets, signals } = useLedger();

  // 1. BURN HISTORY
  const burnHistory = useMemo(() => {
    const data: Record<string, { date: string; burn: number; limit: number }> = {};
    // Calculate Monthly Limit based on active monthly budgets
    const monthlyLimit = budgets.reduce((sum, b) => sum + (b.frequency === 'monthly' ? b.amount : 0), 0);

    // Initialize last 6 months with 0 burn
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

  // 2. CATEGORY SPEND
  const categorySplit = useMemo(() => {
    const map: Record<string, number> = {};
    history.filter(h => h.type === 'SPEND').forEach(h => {
        const key = h.title || 'Uncategorized';
        map[key] = (map[key] || 0) + Math.abs(h.amount || 0);
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [history]);

  // 3. SIGNAL STATS
  const signalStats = useMemo(() => {
    const data = signals.filter(s => s.totalGenerated > 0 || s.hoursLogged > 0).map(s => ({
        id: s.id, 
        name: s.title, 
        sector: s.sector, 
        effort: s.hoursLogged, 
        profit: s.totalGenerated,
        roi: s.hoursLogged > 0 ? (s.totalGenerated / s.hoursLogged) : 0
      })).sort((a, b) => b.roi - a.roi);
    
    const totalProfit = data.reduce((sum, s) => sum + s.profit, 0);
    const totalEffort = data.reduce((sum, s) => sum + s.effort, 0);
    const globalYield = totalEffort > 0 ? totalProfit / totalEffort : 0;
    
    return { scatter: data, leaderboard: data, globalYield };
  }, [signals]);

  // 4. MONTHLY STATEMENT
  const monthlyStatement = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    // Initialize last 6 months
    for (let i = 0; i < 6; i++) {
      const d = new Date(); 
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7); // YYYY-MM
      map.set(key, { income: 0, expense: 0 });
    }

    history.forEach(log => {
      const key = log.date.slice(0, 7); // YYYY-MM
      if (map.has(key)) {
        const entry = map.get(key)!;
        if (log.type === 'DROP' || log.type === 'TRIAGE_SESSION') {
            entry.income += (log.amount || 0);
        }
        if (log.type === 'SPEND' || log.type === 'GENEROSITY') {
            entry.expense += (log.amount || 0);
        }
      }
    });

    return Array.from(map.entries()).map(([month, data]) => {
      const net = data.income - data.expense;
      return { 
          month, 
          ...data, 
          net, 
          savingsRate: data.income > 0 ? (net / data.income) * 100 : 0 
      };
    }).sort((a, b) => b.month.localeCompare(a.month));
  }, [history]);

  // 5. METRIC RIBBON
  const ribbon = useMemo(() => {
    const lastMonth = monthlyStatement[0] || { savingsRate: 0 };
    const prevMonth = monthlyStatement[1] || { savingsRate: 0 };
    const largestLeak = categorySplit[0] ? { name: categorySplit[0].name, amount: categorySplit[0].value } : null;
    return { 
        savingsRate: lastMonth.savingsRate, 
        savingsDelta: lastMonth.savingsRate - prevMonth.savingsRate, 
        alphaYield: signalStats.globalYield, 
        largestLeak 
    };
  }, [monthlyStatement, categorySplit, signalStats]);


  // --- UPDATED: COMPARATOR ENGINE ---
  const getComparatorData = (keys: string[], mode: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'MIXED') => {
    return keys.map(key => {
        let total = 0;

        // Determine the type of the key if in MIXED mode
        let effectiveMode = mode;
        if (mode === 'MIXED') {
            if (key.length === 4 && !isNaN(Number(key))) effectiveMode = 'ANNUAL';       // "2025"
            else if (key.startsWith('Q')) effectiveMode = 'QUARTERLY';    // "Q1 2025"
            else effectiveMode = 'MONTHLY';                               // "2025-01"
        }

        history.filter(h => h.type === 'SPEND' || h.type === 'GENEROSITY').forEach(log => {
            const dateStr = log.date; // "2026-02-15..."
            const year = dateStr.slice(0, 4);
            const month = parseInt(dateStr.slice(5, 7)); // 1-12

            if (effectiveMode === 'ANNUAL') {
                // Key = "2026"
                if (dateStr.startsWith(key)) total += Math.abs(log.amount || 0);
            } 
            else if (effectiveMode === 'MONTHLY') {
                // Key = "2026-02"
                if (dateStr.startsWith(key)) total += Math.abs(log.amount || 0);
            }
            else if (effectiveMode === 'QUARTERLY') {
                // Key = "Q1 2026"
                const parts = key.split(' '); 
                if (parts.length === 2) {
                    const [q, y] = parts; // q="Q1", y="2026"
                    if (year === y) {
                        const qNum = parseInt(q.replace('Q', '')); // 1
                        const startMonth = (qNum - 1) * 3 + 1;
                        const endMonth = startMonth + 2;
                        if (month >= startMonth && month <= endMonth) {
                            total += Math.abs(log.amount || 0);
                        }
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
          quarters: Array.from(quarters).sort().reverse(), 
          months: Array.from(months).sort().reverse()
      };
  }, [history]);

  return { 
    burnHistory, categorySplit, signalPerformance: signalStats.scatter, signalLeaderboard: signalStats.leaderboard,
    monthlyStatement, ribbon, 
    getComparatorData, availablePeriods 
  };
};
