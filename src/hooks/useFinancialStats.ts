import { useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';

export const useFinancialStats = () => {
  const { history, telemetry, accounts, signals } = useLedger();

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonthKey = now.toISOString().slice(0, 7); // "2026-03"
    const lastMonthKey = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);

    let thisMonthIn = 0;
    let thisMonthOut = 0;
    let lastMonthOut = 0;
    let thisMonthLeakage = 0; 

    // 1. Chart Data Construction (Last 6 Months)
    const monthsMap = new Map<string, { name: string; income: number; expense: number }>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      monthsMap.set(key, { 
        name: d.toLocaleDateString('en-US', { month: 'short' }), 
        income: 0, 
        expense: 0 
      });
    }

    // 2. Process Live Ledger (System Routing & Manual Logs)
    history.forEach(log => {
      const logMonth = log.date.slice(0, 7);
      const amount = log.amount || 0;

      if (logMonth === currentMonthKey) {
        if (log.type === 'DROP' || log.type === 'TRIAGE_SESSION') thisMonthIn += amount;
        if (log.type === 'SPEND' || log.type === 'GENEROSITY' || (log.type === 'TRANSFER' && log.tags?.includes('risk'))) {
            thisMonthOut += amount;
        }
      }
      if (logMonth === lastMonthKey) {
        if (log.type === 'SPEND' || log.type === 'GENEROSITY') lastMonthOut += amount;
      }

      if (monthsMap.has(logMonth)) {
        const entry = monthsMap.get(logMonth)!;
        if (log.type === 'DROP' || log.type === 'TRIAGE_SESSION') entry.income += amount;
        else if (log.type === 'SPEND' || log.type === 'GENEROSITY') entry.expense += amount;
      }
    });

    // 3. Process Data Lake (Bank Truth & Bleed Telemetry)
    telemetry.forEach(log => {
      const logMonth = log.date.slice(0, 7);
      const amount = log.amount || 0;

      if (logMonth === currentMonthKey) {
        if (log.type === 'DROP') thisMonthIn += amount;
        if (log.type === 'SPEND') {
            thisMonthOut += amount;
            if (log.highVelocityFlag) thisMonthLeakage += amount;
        }
      }
      if (logMonth === lastMonthKey) {
        if (log.type === 'SPEND') lastMonthOut += amount;
      }

      if (monthsMap.has(logMonth)) {
        const entry = monthsMap.get(logMonth)!;
        if (log.type === 'DROP') entry.income += amount;
        else if (log.type === 'SPEND') entry.expense += amount;
      }
    });

    // 4. Asset Allocation
    const allocation = {
      liquid: accounts.reduce((sum, a) => (a.type === 'treasury' || a.type === 'payroll') ? sum + a.balance : sum, 0),
      reserved: accounts.reduce((sum, a) => (a.type === 'vault' || a.type === 'buffer') ? sum + a.balance : sum, 0),
      generosity: accounts.find(a => a.type === 'generosity')?.balance || 0,
      idle: accounts.find(a => a.type === 'holding')?.balance || 0,
      signals: signals.reduce((sum, s) => sum + s.totalGenerated, 0)
    };

    // 5. Burn Delta (Month-over-Month)
    const burnDelta = lastMonthOut > 0 ? ((thisMonthOut - lastMonthOut) / lastMonthOut) * 100 : 0;

    return {
      netFlow: thisMonthIn - thisMonthOut,
      inflow: thisMonthIn,
      outflow: thisMonthOut,
      leakOutflow: thisMonthLeakage, 
      burnDelta,
      chartData: Array.from(monthsMap.values()),
      allocation
    };
  }, [history, telemetry, accounts, signals]);

  return stats;
};
