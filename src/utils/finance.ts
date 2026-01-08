import { Budget, Account } from '../types';

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Calculates the daily burn rate based on active budgets.
 * Filters out expired one-time budgets.
 */
export const calculateDailyBurn = (budgets: Budget[]): number => {
  const now = new Date();
  
  const activeTotal = budgets.reduce((sum, budget) => {
    // Skip if one-time and expired
    if (budget.frequency === 'one-time' && budget.expiryDate) {
      if (new Date(budget.expiryDate) < now) return sum;
    }
    return sum + budget.amount;
  }, 0);

  return activeTotal / 30; // Daily burn
};

/**
 * Calculates remaining runway in months.
 * Returns 0 if negative.
 */
export const calculateRunwayMonths = (
  liquidCash: number, 
  monthlyBurn: number
): number => {
  if (monthlyBurn <= 0) return 0;
  const runway = liquidCash / monthlyBurn;
  return Math.max(0, runway); // Never return negative
};

/**
 * Determines the Financial Health State
 */
export const getFinancialState = (months: number) => {
  if (months <= 0) return 'dry';
  if (months < 3) return 'critical';
  if (months < 6) return 'building';
  if (months < 12) return 'secure';
  return 'freedom';
};
