import { useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';

export const useFinancialStats = (timeframe: string = '1M') => {
  const { history, telemetry, accounts, goals, signals } = useLedger();

  // --- 1. TIMEFRAME FILTERING ENGINE ---
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
      case 'MAX': return new Date(0); // 1970
      default: date.setMonth(date.getMonth() - 1);
    }
    return date;
  }, [timeframe]);

  // Combine and filter data by the selected timeframe
  const filteredEvents = useMemo(() => {
    const combined = [
        ...history.map(h => ({ ...h, isTelemetry: false })),
        ...telemetry.map(t => ({ ...t, isTelemetry: true }))
    ];
    return combined.filter(e => new Date(e.date) >= startDate);
  }, [history, telemetry, startDate]);

  // --- 2. CALCULATE FLOWS ---
  const { inflow, outflow, leakOutflow } = useMemo(() => {
    let inFlow = 0;
    let outFlow = 0;
    let leak = 0;

    filteredEvents.forEach(e => {
        if (e.type === 'DROP' || e.type === 'TRIAGE_SESSION') {
            inFlow += Math.abs(e.amount || 0);
        } else if (e.type === 'SPEND' || e.type === 'GENEROSITY' || e.type === 'TRANSFER') {
            outFlow += Math.abs(e.amount || 0);
            if (e.isTelemetry && (e as any).highVelocityFlag) {
                leak += Math.abs(e.amount || 0);
            }
        }
    });

    return { inflow: inFlow, outflow: outFlow, leakOutflow: leak };
  }, [filteredEvents]);

  const netFlow = inflow - outflow;

  // --- 3. CHART DATA GENERATOR ---
  const chartData = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    
    filteredEvents.forEach(e => {
        const d = new Date(e.date);
        let key = '';

        // Dynamically format the X-Axis based on how wide the timeframe is
        if (timeframe === '24H') key = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        else if (['3D', '7D', '1M'].includes(timeframe)) key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        else if (['3M', '6M', '1Y'].includes(timeframe)) key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        else key = d.getFullYear().toString();

        if (!map[key]) map[key] = { income: 0, expense: 0 };
        
        if (e.type === 'DROP' || e.type === 'TRIAGE_SESSION') map[key].income += Math.abs(e.amount || 0);
        if (e.type === 'SPEND' || e.type === 'GENEROSITY' || e.type === 'TRANSFER') map[key].expense += Math.abs(e.amount || 0);
    });

    // We don't sort chronologically here because JS objects iterate unpredictably.
    // Instead, we trust the original sort order of the data.
    return Object.keys(map).map(name => ({ name, ...map[name] }));
  }, [filteredEvents, timeframe]);

  // --- 4. ASSET ALLOCATION ---
  const allocation = useMemo(() => {
    const liquid = accounts.find(a => a.type === 'payroll')?.balance || 0;
    const reserved = accounts.find(a => a.type === 'treasury')?.balance || 0;
    const generosity = accounts.find(a => a.type === 'generosity')?.balance || 0;
    const idle = accounts.find(a => a.type === 'holding')?.balance || 0;
    
    const signalsGen = signals.reduce((sum, s) => sum + (s.totalGenerated || 0), 0);
    const goalsTotal = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);

    return { liquid, reserved, generosity, idle, signals: signalsGen, goals: goalsTotal };
  }, [accounts, signals, goals]);

  // Delta calculation (Mock logic for now, compares current outflow to total burn)
  const burnDelta = 0; 

  return { netFlow, inflow, outflow, leakOutflow, burnDelta, chartData, allocation };
};
