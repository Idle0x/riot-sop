import { useState, useEffect, useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';
import { supabase } from '../lib/supabase'; // NEEDED for fetching snapshots

export const useAnalytics = (timeframe: string = 'MAX') => {
  const { history, telemetry, signals } = useLedger();

  // --- NEW: FETCH HISTORICAL SNAPSHOTS FROM DB ---
  const [historicalSnapshots, setHistoricalSnapshots] = useState<any[]>([]);

  useEffect(() => {
    const fetchSnapshots = async () => {
      // Pull the daily snapshots from the database
      const { data, error } = await supabase
        .from('daily_snapshots')
        .select('*')
        .order('date', { ascending: true }); // Must be chronological for charts
        
      if (error) {
        console.error("Error fetching snapshots:", error);
        return;
      }
      
      // Format the data so Recharts can read it easily
      const formattedData = data.map(snap => {
        const d = new Date(snap.date);
        return {
          ...snap,
          month: d.toLocaleString('en-US', { month: 'short', day: 'numeric' }), // e.g. "Mar 23"
          netWorth: Number(snap.net_worth || 0),
          runway: Number(snap.runway_months || 0),
          goals: Number(snap.allocated_goals || 0),
          idle: Number(snap.idle_holding || 0),
          generosity: Number(snap.generosity_wallet || 0)
        };
      });
      
      setHistoricalSnapshots(formattedData);
    };

    fetchSnapshots();
  }, []);

  // --- 1. GLOBAL TIMEFRAME CONTROLLER ---
  const startDate = useMemo(() => {
    const date = new Date();
    switch(timeframe) {
      case '24H': date.setHours(date.getHours() - 24); break;
      case '3D': date.setDate(date.getDate() - 3); break;
      case '7D': date.setDate(date.getDate() - 7); break;
      case '1M': date.setMonth(date.getMonth() - 1); break;
      case '3M': date.setMonth(date.getMonth() - 3); break;
      case '6M': date.setMonth(date.getMonth() - 6); break;
      case '1Y': date.setFullYear(date.getFullYear() - 1); break;
      case '5Y': date.setFullYear(date.getFullYear() - 5); break;
      case 'MAX': return new Date(0); // Dawn of time
      default: return new Date(0);
    }
    return date;
  }, [timeframe]);

  // --- 2. DUAL PIPELINE DATA AGGREGATOR ---
  // allEvents: Bypasses the timeframe filter so the Comparator always has full history.
  const allEvents = useMemo(() => {
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

  // filteredEvents: Obeys the Master Timeframe for all other charts and tables.
  const filteredEvents = useMemo(() => allEvents.filter(e => new Date(e.date) >= startDate), [allEvents, startDate]);
  const filteredTelemetry = useMemo(() => telemetry.filter(t => new Date(t.date) >= startDate), [telemetry, startDate]);

  // --- CHART 1: DYNAMIC BURN VELOCITY ---
  const burnHistory = useMemo(() => {
    if (filteredEvents.length === 0) return [];

    const isDaily = ['24H', '3D', '7D', '1M'].includes(timeframe);
    const dataMap: Record<string, { date: string; burn: number }> = {};

    filteredEvents.forEach(e => {
      if (e.type === 'SPEND' || e.type === 'GENEROSITY' || e.type === 'GENEROSITY_GIFT') {
        const d = new Date(e.date);
        let sortKey = '';
        let displayKey = '';

        if (isDaily) {
            sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            displayKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
            sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            displayKey = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        }

        if (!dataMap[sortKey]) dataMap[sortKey] = { date: displayKey, burn: 0 };
        dataMap[sortKey].burn += Math.abs(e.amount || 0);
      }
    });

    return Object.keys(dataMap).sort().map(k => dataMap[k]);
  }, [filteredEvents, timeframe]);

  // --- CHART 2: CATEGORY SPLIT ---
  const categorySplit = useMemo(() => {
    const map: Record<string, number> = {};
    filteredEvents.filter(e => e.type === 'SPEND').forEach(e => {
        const key = e.categoryGroup || 'Uncategorized';
        map[key] = (map[key] || 0) + Math.abs(e.amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredEvents]);

  // --- TABLE 1: TOP MERCHANTS ---
  const topMerchants = useMemo(() => {
    const map: Record<string, { merchant: string; total: number; count: number; category: string }> = {};
    filteredTelemetry.filter(t => t.type === 'SPEND').forEach(t => {
       const m = t.title || 'Unknown Merchant';
       if (!map[m]) map[m] = { merchant: m, total: 0, count: 0, category: t.categoryGroup || 'General' };
       map[m].total += Math.abs(t.amount);
       map[m].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 15);
  }, [filteredTelemetry]);

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
    filteredEvents.forEach(log => {
      const key = log.date.slice(0, 7); 
      if (!map.has(key)) map.set(key, { income: 0, expense: 0 });
      const entry = map.get(key)!;
      if (log.type === 'DROP' || log.type === 'TRIAGE_SESSION') entry.income += (log.amount || 0);
      if (log.type === 'SPEND' || log.type === 'GENEROSITY' || log.type === 'GENEROSITY_GIFT') entry.expense += (log.amount || 0);
    });

    return Array.from(map.entries()).map(([month, data]) => {
      const net = data.income - data.expense;
      return { month, ...data, net, savingsRate: data.income > 0 ? (net / data.income) * 100 : 0 };
    }).sort((a, b) => b.month.localeCompare(a.month)); 
  }, [filteredEvents]);

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
    const map: Record<string, { desc: string; category: string; count: number; total: number; latestDate: string }> = {};

    // Looks at the selected timeframe instead of just currentMonthKey
    filteredTelemetry.filter(t => t.highVelocityFlag).forEach(b => {
        const rawDesc = (b.description || b.title || 'Unknown Friction').split(' - ')[0].trim();
        if (!map[rawDesc]) map[rawDesc] = { desc: rawDesc, category: b.categoryGroup || 'General', count: 0, total: 0, latestDate: b.date };
        map[rawDesc].count += 1;
        map[rawDesc].total += Math.abs(b.amount || 0);
        if (new Date(b.date) > new Date(map[rawDesc].latestDate)) map[rawDesc].latestDate = b.date;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredTelemetry]);

  // --- COMPARATOR ENGINE (USES ALL EVENTS TO AVOID TIMEFRAME CHOKING) ---
  const getComparatorData = (keys: string[], mode: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'MIXED') => {
    return keys.map(key => {
        let total = 0;
        let effectiveMode = mode;
        if (mode === 'MIXED') {
            if (key.length === 4) effectiveMode = 'ANNUAL';       
            else if (key.startsWith('Q')) effectiveMode = 'QUARTERLY';    
            else effectiveMode = 'MONTHLY';                               
        }

        allEvents.filter(h => h.type === 'SPEND' || h.type === 'GENEROSITY' || h.type === 'GENEROSITY_GIFT').forEach(log => {
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

        let displayName = key;
        if (key.includes('-') && key.length === 7) {
           const [y, m] = key.split('-');
           displayName = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString('en-US', { month: 'short', year: '2-digit' });
        }
        return { name: displayName, rawKey: key, value: total };
    });
  };

  const availablePeriods = useMemo(() => {
      const years = new Set<string>();
      const months = new Set<string>();
      const quarters = new Set<string>();

      allEvents.forEach(h => {
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
  }, [allEvents]);

  return { 
    burnHistory, categorySplit, signalLeaderboard: signalStats.leaderboard,
    monthlyStatement, ribbon, bleedForensics, topMerchants,
    getComparatorData, availablePeriods,
    historicalSnapshots // <-- NEW RETURN VARIABLE EXPORTED TO ANALYTICS PAGE
  };
};
