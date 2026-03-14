import { useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';

export const useAnalytics = () => {
  const { history, telemetry, signals } = useLedger();

  // --- DATA AGGREGATOR ---
  // Merges manual history logs with raw bank telemetry into one chronological stream
  const combinedFinancialEvents = useMemo(() => {
      const hEvents = history.map(h => ({ 
          id: h.id, date: h.date, type: h.type, amount: h.amount, title: h.title,
          isTelemetry: false, categoryGroup: undefined 
      }));
      const tEvents = telemetry.map(t => ({ 
          id: t.id, date: t.date, type: t.type, amount: t.amount, title: t.title,
          isTelemetry: true, categoryGroup: t.categoryGroup 
      }));
      return [...hEvents, ...tEvents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [history, telemetry]);

  // --- CHART 1: BURN VELOCITY (ALL-TIME) ---
  const burnHistory = useMemo(() => {
    if (combinedFinancialEvents.length === 0) return [];

    const dates = combinedFinancialEvents.map(e => new Date(e.date).getTime());
    const minD = new Date(Math.min(...dates));
    const maxD = new Date(Math.max(...dates));
    
    const dataMap: Record<string, { date: string; burn: number }> = {};
    
    // Create a continuous timeline from the earliest transaction to now
    let curr = new Date(minD.getFullYear(), minD.getMonth(), 1);
    const end = new Date(maxD.getFullYear(), maxD.getMonth(), 1);
    
    while (curr <= end) {
      const displayKey = curr.toLocaleString('en-US', { month: 'short', year: '2-digit' }); 
      const sortKey = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`; 
      dataMap[sortKey] = { date: displayKey, burn: 0 };
      curr.setMonth(curr.getMonth() + 1);
    }

    combinedFinancialEvents.forEach(e => {
      if (e.type === 'SPEND' || e.type === 'GENEROSITY' || e.type === 'GENEROSITY_GIFT') {
        const d = new Date(e.date);
        const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (dataMap[sortKey]) {
          dataMap[sortKey].burn += Math.abs(e.amount || 0);
        }
      }
    });

    // Ensure chronological order for the Area Chart
    return Object.keys(dataMap).sort().map(k => dataMap[k]);
  }, [combinedFinancialEvents]);

  // --- CHART 2: CATEGORY SPLIT ---
  const categorySplit = useMemo(() => {
    const map: Record<string, number> = {};
    combinedFinancialEvents.filter(e => e.type === 'SPEND').forEach(e => {
        const key = e.categoryGroup || 'Uncategorized';
        map[key] = (map[key] || 0) + Math.abs(e.amount || 0);
    });
      
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [combinedFinancialEvents]);

  // --- TABLE 1: TOP MERCHANTS ---
  const topMerchants = useMemo(() => {
    const map: Record<string, { merchant: string; total: number; count: number; category: string }> = {};
    telemetry.filter(t => t.type === 'SPEND').forEach(t => {
       const m = t.title || 'Unknown Merchant';
       if (!map[m]) map[m] = { merchant: m, total: 0, count: 0, category: t.categoryGroup || 'General' };
       map[m].total += Math.abs(t.amount);
       map[m].count += 1;
    });

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);
  }, [telemetry]);

  // --- TABLE 2: ALPHA LEADERBOARD ---
  const signalStats = useMemo(() => {
    const data = signals.filter(s => s.totalGenerated > 0 || s.hoursLogged > 0).map(s => ({
        id: s.id, name: s.title, sector: s.sector, effort: s.hoursLogged, profit: s.totalGenerated,
        roi: s.hoursLogged > 0 ? (s.totalGenerated / s.hoursLogged) : 0
      })).sort((a, b) => b.roi - a.roi);

    const totalProfit = data.reduce((sum, s) => sum + s.profit, 0);
    const totalEffort = data.reduce((sum, s) => sum + s.effort, 0);
    const globalYield = totalEffort > 0 ? totalProfit / totalEffort : 0;

    return { scatter: data, leaderboard: data, globalYield };
  }, [signals]);

  // --- TABLE 3: MONTHLY STATEMENTS ---
  const monthlyStatement = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();

    combinedFinancialEvents.forEach(log => {
      const key = log.date.slice(0, 7); // YYYY-MM
      if (!map.has(key)) map.set(key, { income: 0, expense: 0 });
      
      const entry = map.get(key)!;
      if (log.type === 'DROP' || log.type === 'TRIAGE_SESSION') entry.income += (log.amount || 0);
      if (log.type === 'SPEND' || log.type === 'GENEROSITY' || log.type === 'GENEROSITY_GIFT') entry.expense += (log.amount || 0);
    });

    return Array.from(map.entries()).map(([month, data]) => {
      const net = data.income - data.expense;
      return { 
          month, ...data, net, 
          savingsRate: data.income > 0 ? (net / data.income) * 100 : 0 
      };
    }).sort((a, b) => b.month.localeCompare(a.month)); 
  }, [combinedFinancialEvents]);

  // --- EXECUTIVE RIBBON STATS ---
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

  // --- TABLE 4: BLEED FORENSICS ---
  const bleedForensics = useMemo(() => {
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const bleeds = telemetry.filter(t => t.highVelocityFlag && t.date.startsWith(currentMonthKey));
    const map: Record<string, { desc: string; category: string; count: number; total: number; latestDate: string }> = {};

    bleeds.forEach(b => {
        const rawDesc = (b.description || b.title || 'Unknown Friction').split(' - ')[0].trim();
        if (!map[rawDesc]) {
            map[rawDesc] = { desc: rawDesc, category: b.categoryGroup || 'General', count: 0, total: 0, latestDate: b.date };
        }
        map[rawDesc].count += 1;
        map[rawDesc].total += Math.abs(b.amount || 0);
        if (new Date(b.date) > new Date(map[rawDesc].latestDate)) {
            map[rawDesc].latestDate = b.date;
        }
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [telemetry]);

  // --- CHART 3: DYNAMIC COMPARATOR ENGINE ---
  const getComparatorData = (keys: string[], mode: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'MIXED') => {
    return keys.map(key => {
        let total = 0;
        let effectiveMode = mode;
        if (mode === 'MIXED') {
            if (key.length === 4) effectiveMode = 'ANNUAL';       
            else if (key.startsWith('Q')) effectiveMode = 'QUARTERLY';    
            else effectiveMode = 'MONTHLY';                               
        }

        combinedFinancialEvents.filter(h => h.type === 'SPEND' || h.type === 'GENEROSITY' || h.type === 'GENEROSITY_GIFT').forEach(log => {
            const dateStr = log.date; 
            const year = dateStr.slice(0, 4);
            const month = parseInt(dateStr.slice(5, 7)); 

            if (effectiveMode === 'ANNUAL' && dateStr.startsWith(key)) total += Math.abs(log.amount || 0);
            else if (effectiveMode === 'MONTHLY' && dateStr.startsWith(key)) total += Math.abs(log.amount || 0);
            else if (effectiveMode === 'QUARTERLY') {
                const parts = key.split(' '); 
                if (parts.length === 2 && year === parts[1]) {
                    const qNum = parseInt(parts[0].replace('Q', '')); 
                    const startMonth = (qNum - 1) * 3 + 1;
                    if (month >= startMonth && month <= startMonth + 2) total += Math.abs(log.amount || 0);
                }
            }
        });
        
        // Convert raw database key (2022-10) to display label (Oct 22) for the chart axis
        let displayName = key;
        if (key.includes('-') && key.length === 7) {
           const [y, m] = key.split('-');
           const d = new Date(parseInt(y), parseInt(m) - 1, 1);
           displayName = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
        }

        return { name: displayName, rawKey: key, value: total };
    });
  };

  // --- UTILS: DROP-DOWN PERIOD SELECTORS ---
  const availablePeriods = useMemo(() => {
      const years = new Set<string>();
      const months = new Set<string>();
      const quarters = new Set<string>();

      combinedFinancialEvents.forEach(h => {
          const d = new Date(h.date);
          const y = d.getFullYear().toString();
          years.add(y);
          months.add(h.date.slice(0, 7)); 
          quarters.add(`Q${Math.ceil((d.getMonth() + 1) / 3)} ${y}`);
      });

      return {
          years: Array.from(years).sort().reverse(),
          quarters: Array.from(quarters).sort().reverse(), 
          months: Array.from(months).sort().reverse()
      };
  }, [combinedFinancialEvents]);

  return { 
    burnHistory, categorySplit, signalLeaderboard: signalStats.leaderboard,
    monthlyStatement, ribbon, bleedForensics, topMerchants,
    getComparatorData, availablePeriods 
  };
};
