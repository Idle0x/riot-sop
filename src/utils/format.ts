/**
 * Formats a number with commas and "Zero Floor" logic.
 * RETURNS: String (e.g., "500,000") WITHOUT symbol.
 * Use this next to the <Naira /> component.
 */
export const formatNumber = (amount: number, allowNegative = false) => {
  const safeAmount = (!allowNegative && amount < 0) ? 0 : amount;
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeAmount);
};

/**
 * Full Currency Formatter (Includes Symbol).
 * Use this for USD or text-only exports where the SVG isn't available.
 */
export const formatCurrency = (amount: number, currency = 'NGN', allowNegative = false) => {
  const safeAmount = (!allowNegative && amount < 0) ? 0 : amount;

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeAmount);
};

export const safeParseFloat = (value: any): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};
