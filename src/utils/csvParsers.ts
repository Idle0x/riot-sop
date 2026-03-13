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
  const desc = (description || '').toLowerCase();
  
  if (desc.includes('sportybet') || desc.includes('bet9ja') || desc.includes('1xbet')) return 'Betting';
  if (desc.includes('airtime') || desc.includes('datamtn') || desc.includes('dataglo') || desc.includes('telecom')) return 'Telecom';
  if (desc.includes('food') || desc.includes('restaurant') || desc.includes('item 7') || desc.includes('bakery') || desc.includes('ice cream')) return 'Food';
  if (desc.includes('pos') || desc.includes('azeezat') || desc.includes('mulat')) return 'POS/Cash';
  if (desc.includes('owealth')) return 'Internal Routing';
  
  return 'General';
};

// --- 2. FUZZY DATA EXTRACTORS ---
const getVal = (row: any, keywords: string[]): string => {
  const key = Object.keys(row).find(k => keywords.some(kw => k.toLowerCase().includes(kw)));
  return key ? String(row[key]) : '';
};

const parseAmount = (val: string) => {
  if (!val) return 0;
  const clean = val.replace(/,/g, '').replace(/N/g, '').replace(/#/g, '').trim();
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
};

const parseDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString();
    return new Date().toISOString(); 
  } catch (e) {
    return new Date().toISOString();
  }
};

// Unified Fuzzy Normalizer for both OPay and Kuda messy CSVs
export const normalizeData = (data: any[]): RawTransaction[] => {
  return data
    .map(row => {
      // Fuzzy match column names because PDF-to-CSV converters mangle headers
      const dateStr = getVal(row, ['time', 'date']);
      const descStr = getVal(row, ['description', 'category', 'details']);
      const moneyInStr = getVal(row, ['credit', 'money in', 'deposit']);
      const moneyOutStr = getVal(row, ['debit', 'money out', 'withdrawal']);
      const refStr = getVal(row, ['reference', 'ref']);

      if (!dateStr || (!moneyInStr && !moneyOutStr)) return null;

      const moneyIn = parseAmount(moneyInStr);
      const moneyOut = parseAmount(moneyOutStr);
      const isSpend = moneyOut > 0;
      const amount = isSpend ? moneyOut : moneyIn;

      // Skip rows with 0 amount (often header artifacts)
      if (amount === 0) return null;

      return {
        date: parseDate(dateStr),
        description: descStr || 'Unknown Transaction',
        amount: amount,
        type: isSpend ? 'SPEND' : 'DROP',
        reference: refStr || `AUTO-REF-${dateStr}-${amount}` // Fallback reference for idempotency
      };
    })
    .filter(Boolean) as RawTransaction[]; // Remove nulls
};

// --- 3. THE VELOCITY ALGORITHM ---
export const applyTelemetryFlags = (transactions: RawTransaction[]): Partial<HistoryLog>[] => {
  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const flaggedData: Partial<HistoryLog>[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const category = categorizeTransaction(current.description);
    let isHighVelocity = false;

    if (current.type === 'SPEND' && ['Betting', 'Telecom', 'Food', 'POS/Cash'].includes(category)) {
      let countInWindow = 1; 

      for (let j = i - 1; j >= 0; j--) {
        const prev = sorted[j];
        if (prev.type !== 'SPEND' || categorizeTransaction(prev.description) !== category) continue;

        const hoursDiff = Math.abs(differenceInHours(new Date(current.date), new Date(prev.date)));
        if (hoursDiff > 48) break;
        countInWindow++;
      }

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

  return flaggedData.reverse();
};

// --- 4. MAIN EXECUTOR ---
export const processCSV = async (file: File): Promise<Partial<HistoryLog>[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rawData = results.data;
          if (!rawData || rawData.length === 0) {
              reject(new Error("The CSV file is empty."));
              return;
          }
          const normalized = normalizeData(rawData);
          if (normalized.length === 0) {
              reject(new Error("Could not find valid Date and Amount columns in the CSV."));
              return;
          }
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
