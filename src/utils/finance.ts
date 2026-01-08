import { Budget } from '../types';

export const calculateDailyBurn = (budgets: Budget[]): number => {
  const now = new Date();
  
  const activeTotal = budgets.reduce((sum, budget) => {
    // Skip expired one-time budgets
    if (budget.frequency === 'one-time' && budget.expiryDate) {
      if (new Date(budget.expiryDate) < now) return sum;
    }
    return sum + budget.amount;
  }, 0);

  return activeTotal / 30; // Daily burn rate
};

export const getFinancialState = (months: number) => {
  if (months <= 0) return 'dry';
  if (months < 3) return 'critical';
  if (months < 6) return 'building';
  if (months < 12) return 'secure';
  return 'freedom';
};
