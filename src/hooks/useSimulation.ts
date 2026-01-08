import { useState, useEffect } from 'react';
import { useFinancials } from '../context/FinancialContext';

export const useSimulation = () => {
  const { 
    user, dailyBurn, budgets, runwayMonths, totalLiquid, signals,
    updateUser, updateAccount, commitAction, deleteBudget, updateSignal 
  } = useFinancials();

  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [decayAmount, setDecayAmount] = useState(0);
  const [daysMissed, setDaysMissed] = useState(0);

  useEffect(() => {
    const now = new Date();
    
    // --- 1. SIGNAL AUTO-ARCHIVE (The Alpha Engine) ---
    // Rule: If in 'discovery' for > 7 days, move to 'graveyard'
    signals.forEach(signal => {
      if (signal.phase === 'discovery') {
        const created = new Date(signal.createdAt);
        const ageInDays = (now.getTime() - created.getTime()) / (1000 * 3600 * 24);
        
        if (ageInDays > 7) {
          updateSignal({ 
            ...signal, 
            phase: 'graveyard', 
            updatedAt: now.toISOString(),
            redFlags: [...(signal.redFlags || []), 'Auto-Archived: Stagnant (>7 days)'] 
          });
          
          commitAction({
            id: crypto.randomUUID(),
            date: now.toISOString(),
            type: 'SIGNAL_UPDATE',
            title: 'Signal Auto-Archived',
            description: `Moved ${signal.title} to Graveyard due to inactivity.`,
            linkedSignalId: signal.id
          });
        }
      }
    });

    // --- 2. BUDGET GARBAGE COLLECTOR ---
    budgets.forEach(budget => {
      if (budget.frequency === 'one-time' && budget.expiryDate) {
        if (new Date(budget.expiryDate) < now) {
          deleteBudget(budget.id);
          commitAction({
            id: crypto.randomUUID(),
            date: now.toISOString(),
            type: 'SYSTEM_EVENT',
            title: 'Budget Expired',
            description: `Auto-deleted one-time budget: ${budget.name}.`,
            amount: 0
          });
        }
      }
    });

    // --- 3. RUNWAY DECAY & SNAPSHOT ENGINE ---
    const lastRec = new Date(user.lastReconciliationDate);
    const diffTime = Math.abs(now.getTime() - lastRec.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 1) {
       commitAction({
         id: crypto.randomUUID(),
         date: now.toISOString(),
         type: 'SYSTEM_EVENT',
         title: 'Daily Snapshot',
         description: `Runway: ${runwayMonths.toFixed(2)}mo | Liquid: ${totalLiquid}`,
         amount: runwayMonths,
         tags: ['SNAPSHOT']
       });
    }

    if (diffDays > 0) {
      const estimatedBurn = diffDays * dailyBurn;

      if (diffDays > 7) {
        setDaysMissed(diffDays);
        setDecayAmount(estimatedBurn);
        setShowWelcomeBack(true);
      } else {
        updateAccount('payroll', -estimatedBurn);
        updateUser({ lastReconciliationDate: now.toISOString() });
        
        if (estimatedBurn > 0) {
          commitAction({
            id: crypto.randomUUID(),
            date: now.toISOString(),
            type: 'SYSTEM_EVENT',
            title: 'Runway Decay',
            description: `Auto-burned ${diffDays} days of OpEx.`,
            amount: estimatedBurn
          });
        }
      }
    }
  }, []); 

  const confirmReconciliation = () => {
    updateAccount('payroll', -decayAmount);
    updateUser({ lastReconciliationDate: new Date().toISOString() });
    
    commitAction({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: 'SYSTEM_EVENT',
      title: 'Protocol Restore',
      description: `Reconciled ${daysMissed} days of inactivity.`,
      amount: decayAmount
    });
    
    setShowWelcomeBack(false);
  };

  return { showWelcomeBack, daysMissed, decayAmount, confirmReconciliation };
};
