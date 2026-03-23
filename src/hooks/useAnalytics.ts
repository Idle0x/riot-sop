import { useState, useEffect, useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';
import { supabase } from '../lib/supabase';

export type ComparatorMetric = 'BURN' | 'INCOME' | 'NET_WORTH' | 'RUNWAY' | 'GOALS' | 'IDLE' | 'YIELD';

export const useAnalytics = (timeframe: string = 'MAX', customStart?: string, customEnd?: string) => {
  const { history, telemetry, signals } = useLedger();

  const [historicalSnapshots, setHistoricalSnapshots] = useState<any[]>([]);

  useEffect(() => {
    const fetchSnapshots = async () => {
      const { data, error } = await supabase.from('daily_snapshots').select('*').order('date', { ascending: true });
      if (error) { console.error(error); return; }
      
      const formattedData = data.map(snap => ({
        ...snap,
        month: new Date(snap.date).toLocaleString('en-US', { month: 'short', day: 'numeric' }), 
        netWorth: Number(snap.net_worth || 0),
        runway: Number(snap.runway_months || 0),
        goals: Number(snap.allocated_goals || 0),
        idle: Number(snap.idle_holding || 0),
        generosity: Number(snap.generosity_wallet || 0),
        signalYield: Number(snap.total_signal_yield || 0),
        rollingBurn: Number(snap.rolling_30d_burn || 0),
        budgetCap: Number(snap.total_budget_cap || 0)
      }));
      
      setHistoricalSnapshots(formattedData);
    };
    fetchSnapshots();
  }, []);

  // --- GLOBAL TIMEFRAME CONTROLLER ---
  const { startDate, endDate } = useMemo(() => {
    const start = new Date();
    let end = new Date();
    switch(timeframe) {
      case '24H': start.setHours(start.getHours() - 24); break;
      case '3D': start.setDate(start.getDate() - 3); break;
      case '7D': start.setDate(start.getDate() - 7); break;
      case '1M': start.setMonth(start.getMonth() - 1); break;
      case '3M': start.setMonth(start.getMonth() - 3); break;
      case '6M': start.setMonth(start.getMonth() - 6); break;
      case 'YTD': start.setMonth(0, 1); start.setHours(0,0,0,0); break;
      case '1Y': start.setFullYear(start.getFullYear() - 1); break;
      case '5Y': start.setFullYear(start.getFullYear() - 5); break;
      case 'CUSTOM': 
        if (customStart && customEnd) {
           return { startDate: new Date(customStart), endDate: new Date(`${customEnd}T23:59:59`) };
        }
        break;
      case 'MAX': return { startDate: new Date(0), endDate: end };
      default: return { startDate: new Date(0), endDate: end };
    }
    return { startDate: start, endDate: end };
  }, [timeframe, customStart, customEnd]);

  // Aggregate Data Pipelines
  const allEvents = useMemo(() => {
      const hEvents = history.map(h => ({ id: h.id, date: h.date, type: h.type, amount: h.amount, title: h.title, isTelemetry: false, categoryGroup: undefined }));
      const tEvents = telemetry.map(t => ({ id: t.id, date: t.date, type: t.type, amount: t.amount, title: t.title, isTelemetry: true, categoryGroup: t.categoryGroup }));
      return [...hEvents, ...tEvents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [history, telemetry]);

  const filteredEvents = useMemo(() => allEvents.filter(e => {
      const d = new Date(e.date); return d >= startDate && d <= endDate;
  }), [allEvents, startDate, endDate]);

  const filteredTelemetry = useMemo(() => telemetry.filter(t => {
      const d = new Date(t.date); return d >= startDate && d <= endDate;
  }), [telemetry, startDate, endDate]);

  const filteredSnapshots = useMemo(() => historicalSnapshots.filter(s => {
      const d = new Date(s.date); return d >= startDate && d <= endDate;
  }), [historicalSnapshots, startDate, endDate]);

  // --- STRICT EXCLUSION UTILITY ---
  const isInternalTransfer = (cat: string, title: string, type: string) => {
      return cat === 'Internal Transfer' || cat === 'Self Transfer' || cat === 'Outbound Transfer' || cat === 'Inbound Transfer' || title.includes('Internal Transfer') || title.includes('Self Transfer') || type === 'TRANSFER';
  };

  // --- CHART DATA GENERATORS ---
  const burnHistory = useMemo(() => {
    if (filteredEvents.length === 0) return [];
    const isDaily = ['24H', '3D', '7D', '1M'].includes(timeframe);
    const dataMap: Record<string, { date: string; burn: number }> = {};
    
    filteredEvents.forEach(e => {
      const isInternal = isInternalTransfer(e.categoryGroup || '', e.title || '', e.type);
      
      if (!isInternal && (e.type === 'SPEND' || e.type === 'GENEROSITY' || e.type === 'GENEROSITY_GIFT')) {
        const d = new Date(e.date);
        let sortKey = isDaily ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        let displayKey = isDaily ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

        if (!dataMap[sortKey]) dataMap[sortKey] = { date: displayKey, burn: 0 };
        dataMap[sortKey].burn += Math.abs(e.amount || 0);
      }
    });
    return Object.keys(dataMap).sort().map(k => dataMap[k]);
  }, [filteredEvents, timeframe]);

  const categorySplit = useMemo(() => {
    const map: Record<string, number> = {};
    
    filteredEvents.forEach(e => {
        const isInternal = isInternalTransfer(e.categoryGroup || '', e.title || '', e.type);
        if (e.type === 'SPEND' && !isInternal) {
            const key = e.categoryGroup || 'Uncategorized';
            map[key] = (map[key] || 0) + Math.abs(e.amount || 0);
        }
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredEvents]);

  const topMerchants = useMemo(() => {
    const map: Record<string, { merchant: string; total: number; count: number; category: string }> = {};
    
    filteredTelemetry.forEach(t => {
       const isInternal = isInternalTransfer(t.categoryGroup || '', t.title || '', t.type);
       if (t.type === 'SPEND' && !isInternal) {
           const m = t.title || 'Unknown Merchant';
           if (!map[m]) map[m] = { merchant: m, total: 0, count: 0, category: t.categoryGroup || 'General' };
           map[m].total += Math.abs(t.amount);
           map[m].count += 1;
       }
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 15);
  }, [filteredTelemetry]);

  // STRICT TIMEFRAME BINDING FOR SIGNALS
  const filteredSignals = useMemo(() => signals.filter(s => {
      const d = new Date(s.updatedAt || s.createdAt);
      return d >= startDate && d <= endDate;
  }), [signals, startDate, endDate]);

  const signalStats = useMemo(() => {
    const data = filteredSignals.filter(s => s.totalGenerated > 0 || s.hoursLogged > 0).map(s => ({
        id: s.id, name: s.title, sector: s.sector, effort: s.hoursLogged, profit: s.totalGenerated,
        roi: s.hoursLogged > 0 ? (s.totalGenerated / s.hoursLogged) : 0
      })).sort((a, b) => b.roi - a.roi);

    const funnel = [
        { name: 'Active', value: filteredSignals.filter(s => s.phase !== 'harvested' && s.phase !== 'graveyard').length, fill: '#3b82f6' },
        { name: 'Harvested', value: filteredSignals.filter(s => s.phase === 'harvested').length, fill: '#10b981' },
        { name: 'Graveyard', value: filteredSignals.filter(s => s.phase === 'graveyard').length, fill: '#ef4444' }
    ].filter(f => f.value > 0);

    const totalProfit = data.reduce((sum, s) => sum + s.profit, 0);
    const totalEffort = data.reduce((sum, s) => sum + s.effort, 0);
    const globalYield = totalEffort > 0 ? totalProfit / totalEffort : 0;
    
    return { leaderboard: data, funnel, globalYield };
  }, [filteredSignals]);

  const monthlyStatement = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    filteredEvents.forEach(log => {
      const isInternal = isInternalTransfer(log.categoryGroup || '', log.title || '', log.type);
      
      if (!isInternal) {
          const key = log.date.slice(0, 7); 
          if (!map.has(key)) map.set(key, { income: 0, expense: 0 });
          const entry = map.get(key)!;
          if (log.type === 'DROP' || log.type === 'TRIAGE_SESSION') entry.income += Math.abs(log.amount || 0);
          if (log.type === 'SPEND' || log.type === 'GENEROSITY' || log.type === 'GENEROSITY_GIFT') entry.expense += Math.abs(log.amount || 0);
      }
    });
    return Array.from(map.entries()).map(([month, data]) => {
      const net = data.income - data.expense;
      return { month, ...data, net, savingsRate: data.income > 0 ? (net / data.income) * 100 : 0 };
    }).sort((a, b) => b.month.localeCompare(a.month)); 
  }, [filteredEvents]);

  const ribbon = useMemo(() => {
    const largestLeak = categorySplit[0] ? { name: categorySplit[0].name, amount: categorySplit[0].value } : null;
    return { alphaYield: signalStats.globalYield, largestLeak };
  }, [categorySplit, signalStats]);

  const bleedForensics = useMemo(() => {
    const map: Record<string, { desc: string; category: string; count: number; total: number; latestDate: string }> = {};
    filteredTelemetry.filter(t => t.highVelocityFlag).forEach(b => {
        const isInternal = isInternalTransfer(b.categoryGroup || '', b.title || '', b.type);
        if (!isInternal) {
            const rawDesc = (b.description || b.title || 'Unknown Friction').split(' - ')[0].trim();
            if (!map[rawDesc]) map[rawDesc] = { desc: rawDesc, category: b.categoryGroup || 'General', count: 0, total: 0, latestDate: b.date };
            map[rawDesc].count += 1;
            map[rawDesc].total += Math.abs(b.amount || 0);
            if (new Date(b.date) > new Date(map[rawDesc].latestDate)) map[rawDesc].latestDate = b.date;
        }
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredTelemetry]);

  // --- UPGRADED UNIVERSAL COMPARATOR ENGINE ---
  const getComparatorData = (keys: string[], mode: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'MIXED', metric: ComparatorMetric = 'BURN') => {
    return keys.map(key => {
        let total = 0;
        let effectiveMode = mode;
        if (mode === 'MIXED') {
            if (key.length === 4) effectiveMode = 'ANNUAL';       
            else if (key.startsWith('Q')) effectiveMode = 'QUARTERLY';    
            else effectiveMode = 'MONTHLY';                               
        }

        let yearStr = '';
        let startMonth = 1;
        let endMonth = 12;
        let prefix = '';

        if (effectiveMode === 'ANNUAL') {
            yearStr = key;
            prefix = key;
        } else if (effectiveMode === 'MONTHLY') {
            yearStr = key.slice(0, 4);
            startMonth = parseInt(key.slice(5, 7));
            endMonth = startMonth;
            prefix = key;
        } else if (effectiveMode === 'QUARTERLY') {
            const parts = key.split(' ');
            yearStr = parts[1];
            const qNum = parseInt(parts[0].replace('Q', ''));
            startMonth = (qNum - 1) * 3 + 1;
            endMonth = startMonth + 2;
        }

        if (metric === 'BURN' || metric === 'INCOME') {
            allEvents.forEach(log => {
                const dateStr = log.date; 
                const logYear = dateStr.slice(0, 4);
                const logMonth = parseInt(dateStr.slice(5, 7)); 

                let inPeriod = false;
                if (effectiveMode === 'ANNUAL' && logYear === yearStr) inPeriod = true;
                else if (effectiveMode === 'MONTHLY' && dateStr.startsWith(prefix)) inPeriod = true;
                else if (effectiveMode === 'QUARTERLY' && logYear === yearStr && logMonth >= startMonth && logMonth <= endMonth) inPeriod = true;

                if (inPeriod) {
                    const isInternal = isInternalTransfer(log.categoryGroup || '', log.title || '', log.type);
                    if (!isInternal) {
                        const isBurn = log.type === 'SPEND' || log.type === 'GENEROSITY' || log.type === 'GENEROSITY_GIFT';
                        const isIncome = log.type === 'DROP' || log.type === 'TRIAGE_SESSION';

                        if (metric === 'BURN' && isBurn) total += Math.abs(log.amount || 0);
                        if (metric === 'INCOME' && isIncome) total += Math.abs(log.amount || 0);
                    }
                }
            });
        } else {
            const snapshotsInPeriod = historicalSnapshots.filter(snap => {
                const d = new Date(snap.date);
                const snapYear = d.getFullYear().toString();
                const snapMonth = d.getMonth() + 1;

                if (effectiveMode === 'ANNUAL' && snapYear === yearStr) return true;
                if (effectiveMode === 'MONTHLY' && snapYear === yearStr && snapMonth === startMonth) return true;
                if (effectiveMode === 'QUARTERLY' && snapYear === yearStr && snapMonth >= startMonth && snapMonth <= endMonth) return true;
                return false;
            }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            if (snapshotsInPeriod.length > 0) {
                const latest = snapshotsInPeriod[0]; 
                if (metric === 'NET_WORTH') total = latest.netWorth;
                if (metric === 'RUNWAY') total = latest.runway;
                if (metric === 'GOALS') total = latest.goals;
                if (metric === 'IDLE') total = latest.idle;
                if (metric === 'YIELD') total = latest.signalYield;
            }
        }

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
      return { years: Array.from(years).sort().reverse(), quarters: Array.from(quarters).sort().reverse(), months: Array.from(months).sort().reverse() };
  }, [allEvents]);

  return { 
    burnHistory, categorySplit, 
    signalLeaderboard: signalStats.leaderboard, signalFunnel: signalStats.funnel,
    monthlyStatement, ribbon, bleedForensics, topMerchants,
    getComparatorData, availablePeriods,
    filteredSnapshots,
    filteredEvents // Exported for the Category Drawer
  };
};
