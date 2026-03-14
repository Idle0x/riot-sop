import { type TelemetryRecord } from '../types';

// --- THE SMART CLASSIFIER DICTIONARY ---
// This engine scrubs raw bank narrations into clean, macro-level categories and merchants.
const classifyTransaction = (rawDescription: string): { merchant: string, category: string } => {
  const desc = rawDescription.toLowerCase();

  // 1. Betting & Gaming
  if (desc.includes('sportybet') || desc.includes('sporty')) return { merchant: 'SportyBet', category: 'Betting & Gaming' };
  if (desc.includes('bet9ja')) return { merchant: 'Bet9ja', category: 'Betting & Gaming' };
  if (desc.includes('1xbet')) return { merchant: '1xBet', category: 'Betting & Gaming' };
  if (desc.includes('msport')) return { merchant: 'MSport', category: 'Betting & Gaming' };

  // 2. Transport & Mobility
  if (desc.includes('uber')) return { merchant: 'Uber', category: 'Transport' };
  if (desc.includes('bolt')) return { merchant: 'Bolt', category: 'Transport' };
  if (desc.includes('indrive')) return { merchant: 'inDrive', category: 'Transport' };
  if (desc.includes('lago') || desc.includes('cowry')) return { merchant: 'Public Transit', category: 'Transport' };

  // 3. Telecom & Utilities
  if (desc.includes('mtn') || desc.includes('vtu') || desc.includes('airtime')) return { merchant: 'Telecom / Airtime', category: 'Utilities' };
  if (desc.includes('airtel')) return { merchant: 'Airtel', category: 'Utilities' };
  if (desc.includes('glo') && desc.includes('data')) return { merchant: 'Glo', category: 'Utilities' };
  if (desc.includes('dstv') || desc.includes('multichoice') || desc.includes('gotv')) return { merchant: 'Cable TV', category: 'Subscriptions' };
  if (desc.includes('ikedc') || desc.includes('ekedc') || desc.includes('power') || desc.includes('token') || desc.includes('aedc')) return { merchant: 'Electricity (Power)', category: 'Utilities' };

  // 4. Global Subscriptions & Software
  if (desc.includes('netflix')) return { merchant: 'Netflix', category: 'Subscriptions' };
  if (desc.includes('apple') || desc.includes('itunes')) return { merchant: 'Apple Services', category: 'Subscriptions' };
  if (desc.includes('spotify')) return { merchant: 'Spotify', category: 'Subscriptions' };
  if (desc.includes('amazon') || desc.includes('aws')) return { merchant: 'Amazon', category: 'Subscriptions' };
  if (desc.includes('google') || desc.includes('gsuite')) return { merchant: 'Google', category: 'Subscriptions' };
  if (desc.includes('openai') || desc.includes('chatgpt')) return { merchant: 'OpenAI', category: 'Software' };
  if (desc.includes('vercel') || desc.includes('github')) return { merchant: 'Dev Tools', category: 'Software' };

  // 5. Food & Groceries
  if (desc.includes('shoprite')) return { merchant: 'Shoprite', category: 'Groceries' };
  if (desc.includes('spar')) return { merchant: 'Spar', category: 'Groceries' };
  if (desc.includes('chicken republic')) return { merchant: 'Chicken Republic', category: 'Food & Dining' };
  if (desc.includes('domino') || desc.includes('pizza')) return { merchant: 'Dominos Pizza', category: 'Food & Dining' };
  if (desc.includes('chowdeck') || desc.includes('glovo') || desc.includes('food')) return { merchant: 'Food Delivery', category: 'Food & Dining' };

  // 6. Bank Charges & Taxes
  if (desc.includes('stamp duty') || desc.includes('fgn') || desc.includes('vat')) return { merchant: 'FGN Stamp Duty/VAT', category: 'Bank Charges' };
  if (desc.includes('sms') || desc.includes('alert')) return { merchant: 'SMS Alert Fee', category: 'Bank Charges' };
  if (desc.includes('maintenance') || desc.includes('card fee')) return { merchant: 'Card Maintenance', category: 'Bank Charges' };
  if (desc.includes('fee') || desc.includes('charge')) return { merchant: 'Bank Fees', category: 'Bank Charges' };

  // 7. Gateways & Infrastructure 
  if (desc.includes('paystack')) return { merchant: 'Paystack Checkout', category: 'Online Payment' };
  if (desc.includes('flutterwave') || desc.includes('flw')) return { merchant: 'Flutterwave', category: 'Online Payment' };
  if (desc.includes('remita')) return { merchant: 'Remita', category: 'Taxes & Levies' };

  // 8. General Transfers & POS
  if (desc.includes('pos')) return { merchant: 'POS Terminal', category: 'POS / Cash' };
  if (desc.includes('atm') && desc.includes('wdl')) return { merchant: 'ATM Withdrawal', category: 'POS / Cash' };
  if (desc.includes('trf') || desc.includes('transfer') || desc.includes('nip') || desc.includes('ussd')) return { merchant: 'Bank Transfer', category: 'Transfers' };
  if (desc.includes('reversal')) return { merchant: 'Reversal', category: 'Refunds' };

  // --- FALLBACK CLEANUP ---
  let cleanMerchant = rawDescription
      .replace(/(POS\/PUR\/|NIP TRF|NIP|TRF|USSD|WDL|WEB\/|MOB\/)/gi, '') // Strip prefixes
      .replace(/[0-9]{8,}/g, '') // Strip long reference numbers
      .split('/')[0] // Take first meaningful chunk before slashes
      .split('*')[0] // Take chunks before asterisks
      .trim();

  cleanMerchant = cleanMerchant.charAt(0).toUpperCase() + cleanMerchant.slice(1).toLowerCase();
  
  if (cleanMerchant.length > 25) cleanMerchant = cleanMerchant.substring(0, 25) + '...';

  return { 
      merchant: cleanMerchant || 'Unknown Merchant', 
      category: 'Uncategorized' 
  };
};

export const processStatement = async (file: File): Promise<Partial<TelemetryRecord>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n');
        if (rows.length < 2) throw new Error("File appears empty or invalid.");

        let headerRowIndex = -1;
        let headers: string[] = [];
        let dateIdx = -1, descIdx = -1, debitIdx = -1, creditIdx = -1, amountIdx = -1;

        // 1. SCANNER: Hunt down the actual table headers (skipping bank metadata junk at the top)
        for (let i = 0; i < Math.min(rows.length, 50); i++) {
            const rowCols = rows[i].split(',');
            const tempHeaders = rowCols.map(h => h.toLowerCase().replace(/["\r]/g, '').trim());
            
            const tempDateIdx = tempHeaders.findIndex(h => h === 'date' || h.includes('date') || h === 'value date' || h === 'txn date');
            const tempDescIdx = tempHeaders.findIndex(h => h.includes('description') || h.includes('narration') || h.includes('remarks') || h.includes('details'));
            
            if (tempDateIdx !== -1 && tempDescIdx !== -1) {
                headerRowIndex = i;
                headers = tempHeaders;
                dateIdx = tempDateIdx;
                descIdx = tempDescIdx;
                debitIdx = headers.findIndex(h => h.includes('debit') || h.includes('withdrawal'));
                creditIdx = headers.findIndex(h => h.includes('credit') || h.includes('deposit'));
                amountIdx = headers.findIndex(h => h === 'amount');
                break;
            }
        }

        if (headerRowIndex === -1) {
           throw new Error("Could not detect standard 'Date' or 'Description' columns.");
        }

        const parsedData: Partial<TelemetryRecord>[] = [];
        const merchantFrequency: Record<string, number> = {};

        // 2. PARSE PHASE: Start reading strictly *after* the header row
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const rawRow = rows[i];
          if (!rawRow.trim()) continue; 

          // Robust CSV Splitter: Ignores commas that are trapped inside quotation marks
          let cols = [];
          let inQuotes = false;
          let colStr = '';
          for (let char of rawRow) {
              if (char === '"') {
                  inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                  cols.push(colStr);
                  colStr = '';
              } else {
                  colStr += char;
              }
          }
          cols.push(colStr); 

          if (cols.length <= Math.max(dateIdx, descIdx)) continue;

          const rawDate = cols[dateIdx]?.replace(/["\r]/g, '').trim();
          const rawDesc = cols[descIdx]?.replace(/["\r]/g, '').trim() || 'Unknown';
          
          let amount = 0;
          let type: 'SPEND' | 'DROP' = 'SPEND';

          // Extract Amount
          if (amountIdx !== -1 && cols[amountIdx]) {
             const val = parseFloat(cols[amountIdx].replace(/[^0-9.-]+/g, ''));
             if (!isNaN(val)) {
                amount = Math.abs(val);
                type = val < 0 ? 'SPEND' : 'DROP';
             }
          } else {
             const debitStr = cols[debitIdx]?.replace(/[^0-9.-]+/g, '');
             const creditStr = cols[creditIdx]?.replace(/[^0-9.-]+/g, '');
             const debitVal = debitStr ? parseFloat(debitStr) : 0;
             const creditVal = creditStr ? parseFloat(creditStr) : 0;
             
             if (debitVal > 0) { amount = debitVal; type = 'SPEND'; }
             else if (creditVal > 0) { amount = creditVal; type = 'DROP'; }
          }

          if (!amount || isNaN(amount) || !rawDate) continue;

          // Verify Date
          const parsedDate = new Date(rawDate);
          if (isNaN(parsedDate.getTime())) continue;

          // Scrub through Classifier
          const { merchant, category } = classifyTransaction(rawDesc);

          if (type === 'SPEND') {
              merchantFrequency[merchant] = (merchantFrequency[merchant] || 0) + 1;
          }

          parsedData.push({
            date: parsedDate.toISOString(),
            type,
            title: merchant,
            description: rawDesc,
            amount,
            categoryGroup: category,
            currency: 'NGN',
            transactionRef: crypto.randomUUID()
          });
        }

        // 3. APPLY ANOMALY FLAGS
        const finalData = parsedData.map(record => ({
            ...record,
            highVelocityFlag: record.type === 'SPEND' && merchantFrequency[record.title!] > 3
        }));

        resolve(finalData);

      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
};
