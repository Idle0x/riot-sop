import { type Budget } from '../types';

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

// NEW: Generosity Logic
export const calculateGenerosityCap = (runwayMonths: number): number => {
  const ABSOLUTE_MAX = 300000;

  if (runwayMonths <= 3) return 0;       // CRITICAL: Locked
  if (runwayMonths < 6) return 50000;    // BUILDING: Restricted
  if (runwayMonths < 12) return 150000;  // SECURE: Moderate
  
  return ABSOLUTE_MAX; // FREEDOM
};

export const getTierColor = (tier: string) => {
  switch (tier) {
    case 'T1': return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'T2': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'T3': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case 'T4': return 'bg-red-500/10 text-red-400 border-red-500/20';
    default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
};
