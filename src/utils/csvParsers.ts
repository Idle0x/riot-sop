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
// This scans past the bank metadata (Name, Period, etc) to find the actual table
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

// --- 4. BRUTE FORCE SEQUENCE PARSER (For Mangled PDF Conversions) ---
const parseMangledSequence = (data: any[][]): RawTransaction[] => {
  const sequence: string[] = [];
  data.forEach(row => {
    if (Array.isArray(row)) {
        row.forEach(cell => {
        if (typeof cell === 'string' && cell.trim()) sequence.push(cell.trim());
        });
    }
  });

  const transactions: RawTransaction[] = [];
  
  for (let i = 0; i < sequence.length; i++) {
    const token = sequence[i];
    
    // Look for OPay Timestamp: e.g., "29 Oct 2022 22:06:16"
    const dateMatch = token.match(/^(\d{2}\s[a-zA-Z]{3}\s\d{4}\s\d{2}:\d{2}:\d{2})/);
    if (dateMatch) {
      const dateStr = dateMatch[1];
      let desc = sequence[i + 1] || 'Unknown Transaction';
      let amount = 0;
      let isSpend = false;
      let ref = `RECOVERY-${crypto.randomUUID().slice(0, 8)}`;

      for (let j = 1; j <= 6; j++) {
        const lookAhead = sequence[i + j];
        if (!lookAhead) break;
        
        // Match mangled OPay financials: "--1,000.001,000.00Mobile"
        const opayFinMatch = lookAhead.match(/^(--|[\d,]+\.\d{2})(--|[\d,]+\.\d{2})([\d,]+\.\d{2})/);
        if (opayFinMatch) {
          const debitStr = opayFinMatch[1];
          const creditStr = opayFinMatch[2];
          
          if (debitStr !== '--') {
            amount = parseFloat(debitStr.replace(/,/g, ''));
            isSpend = true;
          } else if (creditStr !== '--') {
            amount = parseFloat(creditStr.replace(/,/g, ''));
            isSpend = false;
          }
          
          ref = sequence[i + j + 1] || ref;
          break;
        }
      }

      if (amount > 0) {
        if (desc.includes('OWealth') && sequence[i+2]?.includes('Transaction')) {
            desc = desc + " " + sequence[i+2];
        }
        transactions.push({
          date: new Date(dateStr).toISOString(),
          description: desc,
          amount,
          type: isSpend ? 'SPEND' : 'DROP',
          reference: ref.replace(/[^a-zA-Z0-9-]/g, '')
        });
      }
    }
  }
  return transactions;
};

// --- 5. THE VELOCITY ALGORITHM (Circuit Breaker) ---
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

// --- 6. EXCEL PROCESSING ENGINE ---
const processExcel = async (file: File): Promise<Partial<HistoryLog>[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // { header: 1 } forces SheetJS to output a 2D Array (rows and columns) instead of objects.
  // This completely bypasses the metadata junk at the top of the file.
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];
  
  if (!rawData || rawData.length === 0) throw new Error("The Excel file is empty.");
  
  const transactions = extractFrom2DArray(rawData);
  if (transactions.length === 0) throw new Error("Could not extract financial data. The file may be heavily corrupted.");
  
  return applyTelemetryFlags(transactions);
};

// --- 7. CSV PROCESSING ENGINE ---
const processCSVFile = async (file: File): Promise<Partial<HistoryLog>[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false, // Force 2D Array mode to match Excel logic
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rawData = results.data as any[][];
          if (!rawData || rawData.length === 0) throw new Error("The CSV file is empty.");

          let transactions = extractFrom2DArray(rawData);

          // Fallback to Regex parser if the file is a corrupted PDF conversion
          if (transactions.length === 0) {
             transactions = parseMangledSequence(rawData);
          }

          if (transactions.length === 0) {
             throw new Error("Parser failed. Please ensure you are downloading the native Excel or CSV file directly from the OPay/Kuda app, not a PDF converter.");
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

// --- 8. MASTER ROUTER ---
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
