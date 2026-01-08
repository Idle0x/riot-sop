import { useState, useEffect } from 'react';
import { useFinancials } from '../context/FinancialContext';

export const useSimulation = () => {
  const { user, dailyBurn, updateUser, updateAccount, commitAction } = useFinancials();
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [decayAmount, setDecayAmount] = useState(0);
  const [daysMissed, setDaysMissed] = useState(0);

  useEffect(() => {
    const now = new Date();
    const lastRec = new Date(user.lastReconciliationDate);
    
    // Calculate difference in days (ignoring milliseconds/seconds for stability)
    const diffTime = Math.abs(now.getTime() - lastRec.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      const burn = diffDays * dailyBurn * 30; // Daily burn is monthly/30, so just use monthly burn fraction? 
      // Actually dailyBurn in context is (sum / 30). So burn = diffDays * dailyBurn.
      // Wait, dailyBurn in context is number. 
      const estimatedBurn = diffDays * dailyBurn;

      if (diffDays > 7) {
        // Mode 1: Major Reconciliation (Welcome Back)
        setDaysMissed(diffDays);
        setDecayAmount(estimatedBurn);
        setShowWelcomeBack(true);
      } else {
        // Mode 2: Silent Decay (Standard Operation)
        // We auto-deduct, but we log it so the user sees it in history
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
  }, []); // Run once on mount

  const confirmReconciliation = () => {
    // User accepts the major burn
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
