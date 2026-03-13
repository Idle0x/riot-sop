import Papa from 'papaparse';
import * as XLSX from 'xlsx';
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
  if (!row || typeof row !== 'object') return '';
  const key = Object.keys(row).find(k => keywords.some(kw => k.toLowerCase().includes(kw)));
  return key ? String(row[key]) : '';
};

const parseAmount = (val: string | number) => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  
  const clean = String(val).replace(/,/g, '').replace(/N/g, '').replace(/#/g, '').trim();
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : Math.abs(parsed); // Ensure positive absolute value
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

// Universal Normalizer for standard tabular data (Excel or clean CSV)
export const normalizeStandardData = (data: any[]): RawTransaction[] => {
  return data.map(row => {
      const dateStr = getVal(row, ['time', 'date']);
      const descStr = getVal(row, ['description', 'category', 'details', 'remarks']);
      
      // OPay separates columns, Kuda often puts it in one or uses 'Money In'/'Money Out'
      const moneyInStr = getVal(row, ['credit', 'money in', 'deposit', 'inward']);
      const moneyOutStr = getVal(row, ['debit', 'money out', 'withdrawal', 'outward']);
      const amountStr = getVal(row, ['amount']); // Fallback if single column
      const refStr = getVal(row, ['reference', 'ref', 'transaction id']);

      if (!dateStr) return null;

      let amount = 0;
      let isSpend = false;

      // Determine amount and type based on columns available
      if (moneyOutStr && parseAmount(moneyOutStr) > 0) {
          amount = parseAmount(moneyOutStr);
          isSpend = true;
      } else if (moneyInStr && parseAmount(moneyInStr) > 0) {
          amount = parseAmount(moneyInStr);
          isSpend = false;
      } else if (amountStr) {
          // If the bank uses a single amount column (negative for spend)
          const rawAmt = parseFloat(String(amountStr).replace(/,/g, ''));
          if (isNaN(rawAmt) || rawAmt === 0) return null;
          amount = Math.abs(rawAmt);
          isSpend = rawAmt < 0;
      } else {
          return null;
      }

      return {
        date: parseDate(dateStr),
        description: descStr || 'Unknown Transaction',
        amount: amount,
        type: isSpend ? 'SPEND' : 'DROP',
        reference: refStr || `AUTO-REF-${dateStr}-${amount}` 
      };
    }).filter(Boolean) as RawTransaction[]; 
};

// --- 3. THE VELOCITY ALGORITHM (Circuit Breaker) ---
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
      tags: ['imported_statement']
    });
  }

  return flaggedData.reverse();
};

// --- 4. EXCEL PROCESSING ENGINE ---
const processExcel = async (file: File): Promise<Partial<HistoryLog>[]> => {
  const data = await file.arrayBuffer();
  // Read workbook
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert sheet to array of JSON objects. defval ensures empty cells aren't skipped.
  const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
  
  if (!rawData || rawData.length === 0) throw new Error("The Excel file is empty or formatted incorrectly.");
  
  const transactions = normalizeStandardData(rawData);
  if (transactions.length === 0) throw new Error("Could not extract valid financial rows from the Excel file.");
  
  return applyTelemetryFlags(transactions);
};

// --- 5. CSV PROCESSING ENGINE ---
const processCSVFile = async (file: File): Promise<Partial<HistoryLog>[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true, 
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rawData = results.data;
          if (!rawData || rawData.length === 0) throw new Error("The CSV file is empty.");

          const transactions = normalizeStandardData(rawData);
          if (transactions.length === 0) throw new Error("Could not extract financial data. Ensure this is a clean CSV, not a mangled PDF conversion.");

          resolve(applyTelemetryFlags(transactions));
        } catch (err) {
          reject(err);
        }
      },
      error: (error) => reject(error)
    });
  });
};

// --- 6. MASTER ROUTER ---
export const processStatement = async (file: File): Promise<Partial<HistoryLog>[]> => {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
      return await processExcel(file);
  } else if (fileName.endsWith('.csv')) {
      return await processCSVFile(file);
  } else {
      throw new Error("Unsupported file type. Please upload .csv, .xls, or .xlsx files.");
  }
};
