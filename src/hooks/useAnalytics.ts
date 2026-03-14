import { useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';

export const useAnalytics = () => {
  const { history, telemetry, budgets, signals } = useLedger();

  // Helper to safely merge Ledger History + Data Lake Telemetry
  const combinedFinancialEvents = useMemo(() => {
      const hEvents = history.map(h => ({ 
          id: h.id,
          date: h.date,
          type: h.type,
          amount: h.amount,
          title: h.title,
          isTelemetry: false, 
          categoryGroup: undefined 
      }));
      const tEvents = telemetry.map(t => ({ 
          id: t.id,
          date: t.date,
          type: t.type,
          amount: t.amount,
          title: t.title,
          isTelemetry: true, 
          categoryGroup: t.categoryGroup 
      }));
      return [...hEvents, ...tEvents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [history, telemetry]);

  // 1. BURN HISTORY
  const burnHistory = useMemo(() => {
    const data: Record<string, { date: string; burn: number; limit: number }> = {};
    const monthlyLimit = budgets.reduce((sum, b) => sum + (b.frequency === 'monthly' ? b.amount : 0), 0);

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      data[key] = { date: key, burn: 0, limit: monthlyLimit };
    }

    combinedFinancialEvents.forEach(e => {
      if (e.type === 'SPEND' || e.type === 'GENEROSITY') {
        const d = new Date(e.date);
        const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (data[key]) {
          data[key].burn += Math.abs(e.amount || 0);
        }
      }
    });

    return Object.values(data);
  }, [combinedFinancialEvents, budgets]);

  // 2. CATEGORY SPEND (Driven largely by Data Lake categorization)
  const categorySplit = useMemo(() => {
    const map: Record<string, number> = {};
    
    combinedFinancialEvents.filter(e => e.type === 'SPEND').forEach(e => {
        const key = e.categoryGroup || e.title || 'Uncategorized';
        map[key] = (map[key] || 0) + Math.abs(e.amount || 0);
    });
      
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [combinedFinancialEvents]);

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
    
    for (let i = 0; i < 6; i++) {
      const d = new Date(); 
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7); 
      map.set(key, { income: 0, expense: 0 });
    }

    combinedFinancialEvents.forEach(log => {
      const key = log.date.slice(0, 7); 
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
  }, [combinedFinancialEvents]);

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

  // --- COMPARATOR ENGINE ---
  const getComparatorData = (keys: string[], mode: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'MIXED') => {
    return keys.map(key => {
        let total = 0;
        let effectiveMode = mode;
        
        if (mode === 'MIXED') {
            if (key.length === 4 && !isNaN(Number(key))) effectiveMode = 'ANNUAL';       
            else if (key.startsWith('Q')) effectiveMode = 'QUARTERLY';    
            else effectiveMode = 'MONTHLY';                               
        }

        combinedFinancialEvents.filter(h => h.type === 'SPEND' || h.type === 'GENEROSITY').forEach(log => {
            const dateStr = log.date; 
            const year = dateStr.slice(0, 4);
            const month = parseInt(dateStr.slice(5, 7)); 

            if (effectiveMode === 'ANNUAL' && dateStr.startsWith(key)) {
                total += Math.abs(log.amount || 0);
            } 
            else if (effectiveMode === 'MONTHLY' && dateStr.startsWith(key)) {
                total += Math.abs(log.amount || 0);
            }
            else if (effectiveMode === 'QUARTERLY') {
                const parts = key.split(' '); 
                if (parts.length === 2) {
                    const [q, y] = parts; 
                    if (year === y) {
                        const qNum = parseInt(q.replace('Q', '')); 
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

  const availablePeriods = useMemo(() => {
      const years = new Set<string>();
      const months = new Set<string>();
      const quarters = new Set<string>();

      combinedFinancialEvents.forEach(h => {
          const d = new Date(h.date);
          const y = d.getFullYear().toString();
          years.add(y);
          months.add(h.date.slice(0, 7)); 

          const m = d.getMonth() + 1;
          const q = Math.ceil(m / 3);
          quarters.add(`Q${q} ${y}`);
      });

      return {
          years: Array.from(years).sort().reverse(),
          quarters: Array.from(quarters).sort().reverse(), 
          months: Array.from(months).sort().reverse()
      };
  }, [combinedFinancialEvents]);

  return { 
    burnHistory, categorySplit, signalPerformance: signalStats.scatter, signalLeaderboard: signalStats.leaderboard,
    monthlyStatement, ribbon, 
    getComparatorData, availablePeriods 
  };
};
