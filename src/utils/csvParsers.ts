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

// --- 1. CATEGORIZATION ENGINE (Refactored for Behaviors, not Nouns) ---
export const categorizeTransaction = (description: string): string => {
  const desc = (description || '').toLowerCase();
  
  // Match structural financial behaviors, completely ignoring specific merchant names
  if (desc.match(/\b(pos|atm|cash withdrawal|withdrawal)\b/)) return 'Cash/POS';
  if (desc.match(/\b(airtime|data|vtu|recharge|telecom)\b/)) return 'Telecom';
  if (desc.match(/\b(bet|betting|gaming|casino|sporty|1xbet|bet9ja)\b/)) return 'Betting'; 
  if (desc.match(/\b(fee|charge|sms alert|stamp duty|vat|maintenance)\b/)) return 'Bank Fees';
  if (desc.match(/\b(owealth|spend\+save|interest)\b/)) return 'Internal Routing';
  if (desc.match(/\b(transfer|trf|nip)\b/)) return 'Transfer';
  
  return 'General';
};

// --- 2. UTILITIES ---
const parseAmount = (val: any) => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  
  // Strip NGN symbols, commas, and whitespace
  const clean = String(val).replace(/,/g, '').replace(/N/g, '').replace(/₦/g, '').replace(/#/g, '').trim();
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : Math.abs(parsed); // Ensure absolute positive value
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

// --- 3. DYNAMIC HEADER HUNTER & EXTRACTOR ---
// Scans past the bank metadata (Name, Period, etc) to find the actual table
const extractFrom2DArray = (rows: any[][]): RawTransaction[] => {
  const transactions: RawTransaction[] = [];
  let headerRowIndex = -1;
  let colMap = { date: -1, desc: -1, debit: -1, credit: -1, amount: -1, ref: -1 };

  // 1. Hunt for the true table headers (Scan first 50 rows)
  for (let i = 0; i < Math.min(rows.length, 50); i++) {
    if (!rows[i] || !Array.isArray(rows[i])) continue;
    
    const rowStrings = rows[i].map(c => String(c || '').toLowerCase().trim());
    
    const hasDate = rowStrings.findIndex(c => c.includes('date') || c.includes('time'));
    const hasDesc = rowStrings.findIndex(c => c.includes('description') || c.includes('category') || c.includes('details') || c.includes('remarks'));
    const hasDebit = rowStrings.findIndex(c => c.includes('debit') || c === 'money out' || c.includes('withdrawal'));
    const hasCredit = rowStrings.findIndex(c => c.includes('credit') || c === 'money in' || c.includes('deposit'));
    const hasAmount = rowStrings.findIndex(c => c === 'amount');
    
    // If we find a Date column AND a Money column, we found the start of the table.
    if (hasDate !== -1 && (hasDebit !== -1 || hasAmount !== -1 || hasCredit !== -1)) {
      headerRowIndex = i;
      colMap.date = hasDate;
      colMap.desc = hasDesc;
      colMap.debit = hasDebit;
      colMap.credit = hasCredit;
      colMap.amount = hasAmount;
      colMap.ref = rowStrings.findIndex(c => c.includes('reference') || c.includes('transaction id') || c === 'ref');
      break;
    }
  }

  // 2. Extract the Data
  if (headerRowIndex !== -1) {
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !Array.isArray(row) || row.length === 0) continue;

      const dateVal = row[colMap.date];
      if (!dateVal) continue; // Skip empty rows

      let amount = 0;
      let isSpend = false;

      const debitVal = colMap.debit !== -1 ? parseAmount(row[colMap.debit]) : 0;
      const creditVal = colMap.credit !== -1 ? parseAmount(row[colMap.credit]) : 0;
      
      let amtVal = 0;
      if (colMap.amount !== -1 && row[colMap.amount] !== undefined) {
         amtVal = parseFloat(String(row[colMap.amount]).replace(/,/g, ''));
      }

      // Determine flow direction
      if (debitVal > 0) {
        amount = debitVal;
        isSpend = true;
      } else if (creditVal > 0) {
        amount = creditVal;
        isSpend = false;
      } else if (!isNaN(amtVal) && amtVal !== 0) {
        amount = Math.abs(amtVal);
        isSpend = amtVal < 0;
      } else {
        continue; // No money moved on this row
      }

      const desc = colMap.desc !== -1 && row[colMap.desc] ? String(row[colMap.desc]) : 'Bank Transaction';
      const ref = colMap.ref !== -1 && row[colMap.ref] ? String(row[colMap.ref]) : `AUTO-${dateVal}-${amount}`;

      transactions.push({
        date: parseDate(String(dateVal)),
        description: desc,
        amount,
        type: isSpend ? 'SPEND' : 'DROP',
        reference: String(ref).replace(/[^a-zA-Z0-9-]/g, '')
      });
    }
  }

  return transactions;
};

// --- 4. THE VELOCITY ALGORITHM (Circuit Breaker) ---
export const applyTelemetryFlags = (transactions: RawTransaction[]): Partial<HistoryLog>[] => {
  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const flaggedData: Partial<HistoryLog>[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const category = categorizeTransaction(current.description);
    let isHighVelocity = false;

    // Only flag high-velocity bleed for specific consumption categories
    if (current.type === 'SPEND' && ['Betting', 'Telecom', 'Cash/POS'].includes(category)) {
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
      title: category === 'General' ? current.description.slice(0, 30) : category, // Fallback to raw desc if generic
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

// --- 5. EXCEL PROCESSING ENGINE (With HTML Disguise Bypass) ---
const processExcel = async (file: File): Promise<Partial<HistoryLog>[]> => {
  try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];
      
      if (!rawData || rawData.length === 0) throw new Error("The Excel file is empty.");
      
      const transactions = extractFrom2DArray(rawData);
      if (transactions.length > 0) return applyTelemetryFlags(transactions);
      
      throw new Error("Standard extraction failed.");
  } catch (err) {
      // THE HTML BYPASS: If the bank provided an HTML file disguised as .xls
      const text = await file.text();
      if (text.toLowerCase().includes('<table') || text.toLowerCase().includes('<html')) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'text/html');
          
          const rows = Array.from(doc.querySelectorAll('tr'));
          const rawData = rows.map(tr => {
              const cells = Array.from(tr.querySelectorAll('td, th'));
              return cells.map(td => td.textContent?.trim() || '');
          });

          if (rawData.length > 0) {
              const transactions = extractFrom2DArray(rawData);
              if (transactions.length > 0) return applyTelemetryFlags(transactions);
          }
      }
      throw new Error("Could not extract financial data. The file appears to be corrupted or in an unsupported structure.");
  }
};

// --- 6. CSV PROCESSING ENGINE ---
const processCSVFile = async (file: File): Promise<Partial<HistoryLog>[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false, 
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rawData = results.data as any[][];
          if (!rawData || rawData.length === 0) throw new Error("The CSV file is empty.");

          const transactions = extractFrom2DArray(rawData);

          if (transactions.length === 0) {
             throw new Error("Parser failed to locate header columns (Date, Amount, etc).");
          }

          resolve(applyTelemetryFlags(transactions));
        } catch (err) {
          reject(err);
        }
      },
      error: (error) => reject(error)
    });
  });
};

// --- 7. MASTER ROUTER ---
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
