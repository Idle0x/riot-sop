import Papa from 'papaparse';
import { differenceInHours } from 'date-fns';
import { type HistoryLog } from '../types';

export type RawTransaction = {
  date: string;
  description: string;
  amount: number;
  type: 'DROP' | 'SPEND';
  reference: string;
};

// --- 1. CATEGORIZATION ENGINE ---
export const categorizeTransaction = (description: string): string => {
  const desc = description.toLowerCase();
  
  if (desc.includes('sportybet') || desc.includes('bet9ja') || desc.includes('1xbet')) return 'Betting';
  if (desc.includes('airtime') || desc.includes('datamtn') || desc.includes('dataglo') || desc.includes('telecom')) return 'Telecom';
  if (desc.includes('food') || desc.includes('restaurant') || desc.includes('item 7') || desc.includes('bakery') || desc.includes('ice cream')) return 'Food';
  if (desc.includes('pos') || desc.includes('azeezat') || desc.includes('mulat')) return 'POS/Cash';
  if (desc.includes('owealth')) return 'Internal Routing';
  
  return 'General';
};

// --- 2. BANK NORMALIZERS ---
const parseAmount = (val: string) => {
  if (!val) return 0;
  return parseFloat(val.replace(/,/g, '').replace(/N/g, '').replace(/#/g, '').trim());
};

const parseDate = (dateStr: string) => {
  // Try to create a valid ISO date string from common NG formats
  try {
    const parts = dateStr.split(' ');
    if (parts.length >= 2) {
        // e.g., "29 Oct 2022 22:06:16"
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d.toISOString();
    }
    // Fallback parsing logic can be expanded here based on strict formats
    return new Date(dateStr).toISOString();
  } catch (e) {
    return new Date().toISOString(); // Ultimate fallback
  }
};

export const normalizeOPay = (data: any[]): RawTransaction[] => {
  return data
    .filter(row => row['Trans. Time'] && row['Value Date']) // Skip empty rows
    .map(row => {
      const debit = parseAmount(row['Debit']);
      const credit = parseAmount(row['Credit']);
      const isSpend = debit > 0;
      
      return {
        date: parseDate(row['Trans. Time']),
        description: row['Description'] || 'OPay Transaction',
        amount: isSpend ? debit : credit,
        type: isSpend ? 'SPEND' : 'DROP',
        reference: row['Transaction Reference'] || crypto.randomUUID()
      };
    });
};

export const normalizeKuda = (data: any[]): RawTransaction[] => {
  return data
    .filter(row => row['Date/Time']) 
    .map(row => {
      const moneyIn = parseAmount(row['Money In'] || row['Money in']);
      const moneyOut = parseAmount(row['Money out']);
      const isSpend = moneyOut > 0;

      return {
        date: parseDate(row['Date/Time']),
        description: row['Description'] || row['Category'] || 'Kuda Transaction',
        amount: isSpend ? moneyOut : moneyIn,
        type: isSpend ? 'SPEND' : 'DROP',
        reference: `KUDA-${parseDate(row['Date/Time'])}-${isSpend ? moneyOut : moneyIn}` // Kuda often lacks strict refs in CSVs
      };
    });
};

// --- 3. THE VELOCITY ALGORITHM (Circuit Breaker) ---
export const applyTelemetryFlags = (transactions: RawTransaction[]): Partial<HistoryLog>[] => {
  // Sort chronologically (oldest first) to track time windows accurately
  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const flaggedData: Partial<HistoryLog>[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const category = categorizeTransaction(current.description);
    let isHighVelocity = false;

    // Only check velocity for specific high-risk bleed categories
    if (current.type === 'SPEND' && ['Betting', 'Telecom', 'Food', 'POS/Cash'].includes(category)) {
      let countInWindow = 1; // Start with current transaction

      // Look backwards to see how many similar transactions occurred within 48 hours
      for (let j = i - 1; j >= 0; j--) {
        const prev = sorted[j];
        if (prev.type !== 'SPEND' || categorizeTransaction(prev.description) !== category) continue;

        const hoursDiff = differenceInHours(new Date(current.date), new Date(prev.date));
        
        // If we've looked past 48 hours, stop checking backwards
        if (hoursDiff > 48) break;

        countInWindow++;
      }

      // If 3 or more transactions of the same category happened within 48 hours, flag it
      if (countInWindow >= 3) {
        isHighVelocity = true;
      }
    }

    flaggedData.push({
      date: current.date,
      type: current.type,
      title: category,
      description: current.description,
      amount: current.amount,
      currency: 'NGN',
      transactionRef: current.reference,
      categoryGroup: category,
      highVelocityFlag: isHighVelocity,
      tags: ['csv_import']
    });
  }

  // Reverse back to newest first for UI display
  return flaggedData.reverse();
};

// --- 4. MAIN EXECUTOR ---
export const processCSV = async (file: File, bankType: 'OPAY' | 'KUDA'): Promise<Partial<HistoryLog>[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rawData = results.data;
          const normalized = bankType === 'OPAY' ? normalizeOPay(rawData) : normalizeKuda(rawData);
          const telemetryApplied = applyTelemetryFlags(normalized);
          resolve(telemetryApplied);
        } catch (err) {
          reject(err);
        }
      },
      error: (error) => reject(error)
    });
  });
};
