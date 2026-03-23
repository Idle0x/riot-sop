import { useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';

export const useFinancialStats = (timeframe: string = '1M', customStart?: string, customEnd?: string) => {
  const { history, accounts, telemetry, goals } = useLedger();

  return useMemo(() => {
    const now = new Date();
    let currentStart = new Date();
    let prevStart = new Date();
    let prevEnd = new Date();

    // 1. DYNAMIC TIMEFRAME PARSER (NOW INCLUDES YTD & CUSTOM)
    switch (timeframe) {
      case '24H':
        currentStart.setHours(now.getHours() - 24);
        prevEnd = new Date(currentStart);
        prevStart = new Date(prevEnd);
        prevStart.setHours(prevStart.getHours() - 24);
        break;
      case '3D':
        currentStart.setDate(now.getDate() - 3);
        prevEnd = new Date(currentStart);
        prevStart = new Date(prevEnd);
        prevStart.setDate(prevStart.getDate() - 3);
        break;
      case '7D':
        currentStart.setDate(now.getDate() - 7);
        prevEnd = new Date(currentStart);
        prevStart = new Date(prevEnd);
        prevStart.setDate(prevStart.getDate() - 7);
        break;
      case '1M':
        currentStart.setMonth(now.getMonth() - 1);
        prevEnd = new Date(currentStart);
        prevStart = new Date(prevEnd);
        prevStart.setMonth(prevStart.getMonth() - 1);
        break;
      case '3M':
        currentStart.setMonth(now.getMonth() - 3);
        prevEnd = new Date(currentStart);
        prevStart = new Date(prevEnd);
        prevStart.setMonth(prevStart.getMonth() - 3);
        break;
      case '6M':
        currentStart.setMonth(now.getMonth() - 6);
        prevEnd = new Date(currentStart);
        prevStart = new Date(prevEnd);
        prevStart.setMonth(prevStart.getMonth() - 6);
        break;
      case 'YTD': // NEW YTD LOGIC
        currentStart = new Date(now.getFullYear(), 0, 1);
        prevEnd = new Date(currentStart);
        prevStart = new Date(prevEnd);
        prevStart.setFullYear(prevStart.getFullYear() - 1);
        break;
      case '1Y':
        currentStart.setFullYear(now.getFullYear() - 1);
        prevEnd = new Date(currentStart);
        prevStart = new Date(prevEnd);
        prevStart.setFullYear(prevStart.getFullYear() - 1);
        break;
      case '5Y':
        currentStart.setFullYear(now.getFullYear() - 5);
        prevEnd = new Date(currentStart);
        prevStart = new Date(prevEnd);
        prevStart.setFullYear(prevStart.getFullYear() - 5);
        break;
      case 'CUSTOM': // NEW CUSTOM RANGE LOGIC
        if (customStart && customEnd) {
           currentStart = new Date(customStart);
           const end = new Date(customEnd);
           end.setHours(23, 59, 59, 999);
           // Mock previous period for custom by shifting back the exact duration
           const duration = end.getTime() - currentStart.getTime();
           prevEnd = new Date(currentStart);
           prevStart = new Date(currentStart.getTime() - duration);
        }
        break;
      case 'MAX':
      default:
        currentStart = new Date(2000, 0, 1); 
        prevEnd = new Date(2000, 0, 1);
        prevStart = new Date(2000, 0, 1);
        break;
    }

    let inflow = 0;
    let outflow = 0;
    let leakOutflow = 0;
    const chartMap: Record<string, { income: number; expense: number; date: string }> = {};

    let trueInflow = 0;
    let trueOutflow = 0;
    let prevTrueInflow = 0;
    let prevTrueOutflow = 0;
    const merchantTracker: Record<string, number> = {};

    history.forEach(tx => {
      const txDate = new Date(tx.date);
      // For CUSTOM, we cap the 'now' comparison to the customEnd
      const effectiveEnd = timeframe === 'CUSTOM' && customEnd ? new Date(customEnd) : now;
      if (timeframe === 'CUSTOM' && customEnd) effectiveEnd.setHours(23, 59, 59, 999);

      const isCurrent = txDate >= currentStart && txDate <= effectiveEnd;
      const isPrev = txDate >= prevStart && txDate < prevEnd;

      const isInternal = tx.title?.includes('Internal Transfer') || tx.title?.includes('Self Transfer') || tx.type === 'TRANSFER';
      const amount = Math.abs(tx.amount || 0);

      if (isCurrent) {
        if (tx.type === 'DROP' || tx.type === 'TRIAGE_SESSION') inflow += amount;
        if (tx.type === 'SPEND' || tx.type === 'GENEROSITY' || tx.type === 'TRANSFER') outflow += amount;

        const dayKey = txDate.toISOString().split('T')[0];
        if (!chartMap[dayKey]) chartMap[dayKey] = { income: 0, expense: 0, date: dayKey };
        if (tx.type === 'DROP' || tx.type === 'TRIAGE_SESSION') chartMap[dayKey].income += amount;
        if (tx.type === 'SPEND' || tx.type === 'GENEROSITY' || tx.type === 'TRANSFER') chartMap[dayKey].expense += amount;

        if (!isInternal) {
          if (tx.type === 'DROP' || tx.type === 'TRIAGE_SESSION') trueInflow += amount;
          if (tx.type === 'SPEND' || tx.type === 'GENEROSITY' || tx.type === 'TRANSFER') {
            trueOutflow += amount;
            const merchantName = tx.title || 'Unknown';
            merchantTracker[merchantName] = (merchantTracker[merchantName] || 0) + amount;
          }
        }
      } else if (isPrev) {
        if (!isInternal) {
          if (tx.type === 'DROP' || tx.type === 'TRIAGE_SESSION') prevTrueInflow += amount;
          if (tx.type === 'SPEND' || tx.type === 'GENEROSITY' || tx.type === 'TRANSFER') prevTrueOutflow += amount;
        }
      }
    });

    telemetry.forEach(t => {
      const tDate = new Date(t.date);
      const effectiveEnd = timeframe === 'CUSTOM' && customEnd ? new Date(customEnd) : now;
      if (timeframe === 'CUSTOM' && customEnd) effectiveEnd.setHours(23, 59, 59, 999);
      
      if (tDate >= currentStart && tDate <= effectiveEnd && t.highVelocityFlag) {
        leakOutflow += Math.abs(t.amount || 0);
      }
    });

    const chartData = Object.values(chartMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const liquid = accounts.filter(a => a.type === 'buffer' || a.type === 'payroll').reduce((sum, a) => sum + a.balance, 0);
    const reserved = accounts.filter(a => a.type === 'vault').reduce((sum, a) => sum + a.balance, 0);
    const idle = accounts.filter(a => a.type === 'holding').reduce((sum, a) => sum + a.balance, 0);
    const generosity = accounts.filter(a => a.type === 'generosity').reduce((sum, a) => sum + a.balance, 0);
    const goalsAllocated = goals.filter(g => !g.isCompleted).reduce((sum, g) => sum + g.currentAmount, 0);
    const signalsYield = accounts.filter(a => (a.type as string) === 'signals').reduce((sum, a) => sum + a.balance, 0); 

    const calculateDelta = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const topMerchants = Object.entries(merchantTracker)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return {
      netFlow: inflow - outflow,
      inflow,
      outflow,
      leakOutflow,
      burnDelta: calculateDelta(outflow, prevTrueOutflow), 
      chartData,
      allocation: { liquid, reserved, idle, generosity, goals: goalsAllocated, signals: signalsYield },
      trueInflow,
      trueOutflow,
      trueNetFlow: trueInflow - trueOutflow,
      prevTrueInflow,
      prevTrueOutflow,
      inflowDelta: calculateDelta(trueInflow, prevTrueInflow),
      outflowDelta: calculateDelta(trueOutflow, prevTrueOutflow),
      topMerchants
    };
  }, [timeframe, customStart, customEnd, history, accounts, telemetry, goals]);
};
