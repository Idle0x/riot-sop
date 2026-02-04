import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useLedger } from '../context/LedgerContext';

export const useMonthlyReconciliation = () => {
  const { user, updateProfile } = useUser();
  const { monthlyBurn, accounts, updateAccount, commitAction } = useLedger();
  
  const [showModal, setShowModal] = useState(false);
  const [pendingBurn, setPendingBurn] = useState(0);
  const [monthsMissed, setMonthsMissed] = useState(0);

  useEffect(() => {
    if (!user?.lastReconciliationDate) return;

    const lastRun = new Date(user.lastReconciliationDate);
    const now = new Date();

    // Check if we are in a different month (and later in time)
    const isNewMonth = now.getMonth() !== lastRun.getMonth() || now.getFullYear() !== lastRun.getFullYear();
    const isLater = now > lastRun;

    if (isNewMonth && isLater) {
      // Calculate how many months passed (simple diff)
      const diffMonths = (now.getFullYear() - lastRun.getFullYear()) * 12 + (now.getMonth() - lastRun.getMonth());
      
      if (diffMonths > 0) {
        setMonthsMissed(diffMonths);
        setPendingBurn(monthlyBurn * diffMonths); // Total liability
        setShowModal(true);
      }
    }
  }, [user?.lastReconciliationDate, monthlyBurn]);

  const confirmReconciliation = async () => {
    const totalLiquid = (accounts.find(a => a.type === 'payroll')?.balance || 0) + 
                        (accounts.find(a => a.type === 'treasury')?.balance || 0);

    // ZERO FLOOR LOGIC:
    // We cannot burn more than we have. 
    // If debt is 500k but we have 0, we deduct 0.
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
      // Log the skipped payment
      commitAction({
        date: new Date().toISOString(),
        type: 'SYSTEM_EVENT',
        title: 'Fiscal Close (Skipped)',
        description: `Insufficient funds to cover ${monthsMissed} months of burn. System paused debt.`,
        amount: 0,
        tags: ['insolvency_protection']
      });
    }

    // Update the date so it doesn't ask again until next month
    updateProfile({ lastReconciliationDate: new Date().toISOString() });
    setShowModal(false);
  };

  return { showModal, monthsMissed, pendingBurn, confirmReconciliation };
};
