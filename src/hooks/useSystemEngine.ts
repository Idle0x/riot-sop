import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useLedger } from '../context/LedgerContext';

export const useSystemEngine = () => {
  const { user, updateProfile } = useUser();
  const { 
    signals, budgets, accounts, monthlyBurn,
    updateSignal, deleteBudget, updateAccount, commitAction 
  } = useLedger();

  // State for the Monthly Checkpoint Modal
  const [showModal, setShowModal] = useState(false);
  const [pendingBurn, setPendingBurn] = useState(0);
  const [monthsMissed, setMonthsMissed] = useState(0);

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
            // Note: redFlags is handled in the LedgerContext mutation or passed here if needed
            // For now, we just move it. You can add a specific mutation for this if redFlags updates are critical.
          });

          commitAction({
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
            date: now.toISOString(),
            type: 'SYSTEM_EVENT',
            title: 'Budget Expired',
            description: `Auto-deleted one-time budget: ${budget.name}.`,
            amount: 0
          });
        }
      }
    });

    // --- 3. MONTHLY CHECKPOINT (Replaces Daily Decay) ---
    if (user?.lastReconciliationDate) {
      const lastRun = new Date(user.lastReconciliationDate);
      
      // Check if we are in a different month AND later in time
      const isNewMonth = now.getMonth() !== lastRun.getMonth() || now.getFullYear() !== lastRun.getFullYear();
      const isLater = now > lastRun;

      if (isNewMonth && isLater) {
        const diffMonths = (now.getFullYear() - lastRun.getFullYear()) * 12 + (now.getMonth() - lastRun.getMonth());
        
        if (diffMonths > 0) {
          setMonthsMissed(diffMonths);
          setPendingBurn(monthlyBurn * diffMonths); // Calculates full liability
          setShowModal(true); // Triggers the modal instead of auto-burning
        }
      }
    }
  }, [user?.lastReconciliationDate, monthlyBurn, signals.length, budgets.length]); // Dependencies ensure it runs when data loads

  // --- THE CONFIRMATION LOGIC ---
  const confirmReconciliation = async () => {
    const totalLiquid = (accounts.find(a => a.type === 'payroll')?.balance || 0) + 
                        (accounts.find(a => a.type === 'treasury')?.balance || 0);

    // ZERO FLOOR ENFORCEMENT
    // If debt is 500k but you have 0, we deduct 0.
    const actualDeduction = Math.min(pendingBurn, totalLiquid);

    if (actualDeduction > 0) {
      // Prioritize Payroll, then Treasury
      const payroll = accounts.find(a => a.type === 'payroll');
      let remaining = actualDeduction;

      if (payroll && payroll.balance > 0) {
        const takeFromPayroll = Math.min(payroll.balance, remaining);
        updateAccount('payroll', -takeFromPayroll);
        remaining -= takeFromPayroll;
      }

      if (remaining > 0) {
        updateAccount('treasury', -remaining);
      }

      commitAction({
        date: new Date().toISOString(),
        type: 'SYSTEM_EVENT',
        title: 'Monthly Fiscal Close',
        description: `Executed burn for ${monthsMissed} month(s).`,
        amount: -actualDeduction,
        tags: ['auto_reconciliation']
      });
    } else {
      // Log the skipped payment (Insolvency Protection)
      commitAction({
        date: new Date().toISOString(),
        type: 'SYSTEM_EVENT',
        title: 'Fiscal Close (Skipped)',
        description: `Insufficient funds to cover ${monthsMissed} months of burn. System paused debt.`,
        amount: 0,
        tags: ['insolvency_protection']
      });
    }

    // Fast-forward the date
    updateProfile({ lastReconciliationDate: new Date().toISOString() });
    setShowModal(false);
  };

  return { showModal, monthsMissed, pendingBurn, confirmReconciliation };
};
