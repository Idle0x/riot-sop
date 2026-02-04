// src/utils/format.ts

/**
 * Global Currency Formatter
 * Enforces the "Zero Floor" visual rule for runway and balances.
 * * @param amount - The raw number (e.g., -500000)
 * @param currency - The currency code (default 'NGN')
 * @param allowNegative - If true, it shows "-₦500,000". If false, it clamps to "₦0".
 */
export const formatCurrency = (amount: number, currency = 'NGN', allowNegative = false) => {
  // SAFETY: If it's a balance check, never show negative. 
  // We allow negative only for specific "debt" contexts if explicitly asked.
  const safeAmount = (!allowNegative && amount < 0) ? 0 : amount;

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeAmount);
};

/**
 * Safe Number Parser
 * Prevents "NaN" errors crashing the dashboard.
 */
export const safeParseFloat = (value: any): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};
