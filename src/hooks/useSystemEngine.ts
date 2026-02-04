import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useLedger } from '../context/LedgerContext';

export const useSystemEngine = () => {
  const { user, updateProfile } = useUser();
  const { 
    signals, budgets, accounts, monthlyBurn,
    updateSignal, deleteBudget, updateAccount, commitAction, resetBudgetCounters // NEW
  } = useLedger();

  // State for the Monthly Checkpoint Modal
  const [showModal, setShowModal] = useState(false);
  const [pendingBurn, setPendingBurn] = useState(0);
  const [monthsMissed, setMonthsMissed] = useState(0);

  useEffect(() => {
    const now = new Date();

    // --- 1. SIGNAL AUTO-ARCHIVE ---
    signals.forEach(signal => {
      if (signal.phase === 'discovery') {
        const created = new Date(signal.createdAt);
        const ageInDays = (now.getTime() - created.getTime()) / (1000 * 3600 * 24);

        if (ageInDays > 7) {
          updateSignal({ 
            ...signal, 
            phase: 'graveyard', 
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

    // --- 3. MONTHLY CHECKPOINT ---
    if (user?.lastReconciliationDate) {
      const lastRun = new Date(user.lastReconciliationDate);
      
      const isNewMonth = now.getMonth() !== lastRun.getMonth() || now.getFullYear() !== lastRun.getFullYear();
      const isLater = now > lastRun;

      if (isNewMonth && isLater) {
        const diffMonths = (now.getFullYear() - lastRun.getFullYear()) * 12 + (now.getMonth() - lastRun.getMonth());
        
        if (diffMonths > 0) {
          setMonthsMissed(diffMonths);
          setPendingBurn(monthlyBurn * diffMonths); 
          setShowModal(true); 
        }
      }
    }
  }, [user?.lastReconciliationDate, monthlyBurn, signals.length, budgets.length]);

  // --- THE CONFIRMATION LOGIC ---
  const confirmReconciliation = async () => {
    const totalLiquid = (accounts.find(a => a.type === 'payroll')?.balance || 0) + 
                        (accounts.find(a => a.type === 'treasury')?.balance || 0);

    const actualDeduction = Math.min(pendingBurn, totalLiquid);

    if (actualDeduction > 0) {
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
      commitAction({
        date: new Date().toISOString(),
        type: 'SYSTEM_EVENT',
        title: 'Fiscal Close (Skipped)',
        description: `Insufficient funds to cover ${monthsMissed} months of burn. System paused debt.`,
        amount: 0,
        tags: ['insolvency_protection']
      });
    }

    // CRITICAL FIX: Reset the budget progress bars for the new month
    resetBudgetCounters(); 

    updateProfile({ lastReconciliationDate: new Date().toISOString() });
    setShowModal(false);
  };

  return { showModal, monthsMissed, pendingBurn, confirmReconciliation };
};
