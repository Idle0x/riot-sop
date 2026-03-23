import { useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';

export const useFinancialStats = (timeframe: string = '1M') => {
  const { history, accounts, telemetry, goals } = useLedger();

  return useMemo(() => {
    const now = new Date();
    let currentStart = new Date();
    let prevStart = new Date();
    let prevEnd = new Date();

    // 1. DYNAMIC TIMEFRAME PARSER
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
      case 'MAX':
      default:
        currentStart = new Date(2000, 0, 1); 
        prevEnd = new Date(2000, 0, 1);
        prevStart = new Date(2000, 0, 1);
        break;
    }

    // --- 2. LEGACY DASHBOARD METRICS (Intact) ---
    let inflow = 0;
    let outflow = 0;
    let leakOutflow = 0;
    const chartMap: Record<string, { income: number; expense: number; date: string }> = {};

    // --- 3. TRUE FLOW ENGINE (For Analytics) ---
    let trueInflow = 0;
    let trueOutflow = 0;
    let prevTrueInflow = 0;
    let prevTrueOutflow = 0;
    const merchantTracker: Record<string, number> = {};

    history.forEach(tx => {
      const txDate = new Date(tx.date);
      const isCurrent = txDate >= currentStart && txDate <= now;
      const isPrev = txDate >= prevStart && txDate < prevEnd;

      // Filter to detect True OpEx vs Liquidity Movement
      // UPDATED: Fixed TypeScript check using title/type instead of categoryGroup
      const isInternal = tx.title?.includes('Internal Transfer') || tx.title?.includes('Self Transfer') || tx.type === 'TRANSFER';
      const amount = Math.abs(tx.amount || 0);

      if (isCurrent) {
        // A. Legacy Calculations (Unfiltered)
        if (tx.type === 'DROP' || tx.type === 'TRIAGE_SESSION') inflow += amount;
        if (tx.type === 'SPEND' || tx.type === 'GENEROSITY' || tx.type === 'TRANSFER') outflow += amount;

        // B. Chart Data Aggregation
        const dayKey = txDate.toISOString().split('T')[0];
        if (!chartMap[dayKey]) chartMap[dayKey] = { income: 0, expense: 0, date: dayKey };
        if (tx.type === 'DROP' || tx.type === 'TRIAGE_SESSION') chartMap[dayKey].income += amount;
        if (tx.type === 'SPEND' || tx.type === 'GENEROSITY' || tx.type === 'TRANSFER') chartMap[dayKey].expense += amount;

        // C. True Flow Calculations (Filtered)
        if (!isInternal) {
          if (tx.type === 'DROP' || tx.type === 'TRIAGE_SESSION') trueInflow += amount;
          if (tx.type === 'SPEND' || tx.type === 'GENEROSITY' || tx.type === 'TRANSFER') {
            trueOutflow += amount;

            // D. Vendor Concentration Tracking
            const merchantName = tx.title || 'Unknown';
            merchantTracker[merchantName] = (merchantTracker[merchantName] || 0) + amount;
          }
        }
      } else if (isPrev) {
        // E. Previous Period Baseline
        if (!isInternal) {
          if (tx.type === 'DROP' || tx.type === 'TRIAGE_SESSION') prevTrueInflow += amount;
          if (tx.type === 'SPEND' || tx.type === 'GENEROSITY' || tx.type === 'TRANSFER') prevTrueOutflow += amount;
        }
      }
    });

    // Telemetry Leaks Calculation
    telemetry.forEach(t => {
      const tDate = new Date(t.date);
      if (tDate >= currentStart && tDate <= now && t.highVelocityFlag) {
        leakOutflow += Math.abs(t.amount || 0);
      }
    });

    const chartData = Object.values(chartMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Capital Allocation Map
    const liquid = accounts.filter(a => a.type === 'buffer' || a.type === 'payroll').reduce((sum, a) => sum + a.balance, 0);
    const reserved = accounts.filter(a => a.type === 'vault').reduce((sum, a) => sum + a.balance, 0);
    const idle = accounts.filter(a => a.type === 'holding').reduce((sum, a) => sum + a.balance, 0);
    const generosity = accounts.filter(a => a.type === 'generosity').reduce((sum, a) => sum + a.balance, 0);
    const goalsAllocated = goals.filter(g => !g.isCompleted).reduce((sum, g) => sum + g.currentAmount, 0);

    // Assumes signals yield hit a specifically tracked bucket. 
    // UPDATED: Added (a.type as string) to bypass strict TS literal type checks
    const signalsYield = accounts.filter(a => (a.type as string) === 'signals').reduce((sum, a) => sum + a.balance, 0); 

    // Percentage Math Utility
    const calculateDelta = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Sort Top 10 Vendor Drains
    const topMerchants = Object.entries(merchantTracker)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return {
      // ------------------------------------
      // LEGACY RETURN OBJECT (For Dashboard)
      // ------------------------------------
      netFlow: inflow - outflow,
      inflow,
      outflow,
      leakOutflow,
      burnDelta: calculateDelta(outflow, prevTrueOutflow), 
      chartData,
      allocation: { liquid, reserved, idle, generosity, goals: goalsAllocated, signals: signalsYield },

      // ------------------------------------
      // TRUE FLOW OBJECT (For New Analytics)
      // ------------------------------------
      trueInflow,
      trueOutflow,
      trueNetFlow: trueInflow - trueOutflow,
      prevTrueInflow,
      prevTrueOutflow,
      inflowDelta: calculateDelta(trueInflow, prevTrueInflow),
      outflowDelta: calculateDelta(trueOutflow, prevTrueOutflow),
      topMerchants
    };
  }, [timeframe, history, accounts, telemetry, goals]);
};
