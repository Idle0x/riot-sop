import { type TelemetryRecord } from '../types';

const classifyTransaction = (rawDescription: string): { merchant: string, category: string } => {
  const desc = rawDescription.toLowerCase();

  if (desc.includes('sportybet') || desc.includes('sporty')) return { merchant: 'SportyBet', category: 'Betting & Gaming' };
  if (desc.includes('bet9ja')) return { merchant: 'Bet9ja', category: 'Betting & Gaming' };
  if (desc.includes('1xbet')) return { merchant: '1xBet', category: 'Betting & Gaming' };
  if (desc.includes('msport')) return { merchant: 'MSport', category: 'Betting & Gaming' };

  if (desc.includes('uber')) return { merchant: 'Uber', category: 'Transport' };
  if (desc.includes('bolt')) return { merchant: 'Bolt', category: 'Transport' };
  if (desc.includes('indrive')) return { merchant: 'inDrive', category: 'Transport' };
  if (desc.includes('lago') || desc.includes('cowry')) return { merchant: 'Public Transit', category: 'Transport' };

  if (desc.includes('mtn') || desc.includes('vtu') || desc.includes('airtime')) return { merchant: 'Telecom / Airtime', category: 'Utilities' };
  if (desc.includes('airtel')) return { merchant: 'Airtel', category: 'Utilities' };
  if (desc.includes('glo') && desc.includes('data')) return { merchant: 'Glo', category: 'Utilities' };
  if (desc.includes('dstv') || desc.includes('multichoice') || desc.includes('gotv')) return { merchant: 'Cable TV', category: 'Subscriptions' };
  if (desc.includes('ikedc') || desc.includes('ekedc') || desc.includes('power') || desc.includes('token') || desc.includes('aedc')) return { merchant: 'Electricity (Power)', category: 'Utilities' };

  if (desc.includes('netflix')) return { merchant: 'Netflix', category: 'Subscriptions' };
  if (desc.includes('apple') || desc.includes('itunes')) return { merchant: 'Apple Services', category: 'Subscriptions' };
  if (desc.includes('spotify')) return { merchant: 'Spotify', category: 'Subscriptions' };
  if (desc.includes('amazon') || desc.includes('aws')) return { merchant: 'Amazon', category: 'Subscriptions' };
  if (desc.includes('google') || desc.includes('gsuite')) return { merchant: 'Google', category: 'Subscriptions' };
  if (desc.includes('openai') || desc.includes('chatgpt')) return { merchant: 'OpenAI', category: 'Software' };
  if (desc.includes('vercel') || desc.includes('github')) return { merchant: 'Dev Tools', category: 'Software' };

  if (desc.includes('shoprite')) return { merchant: 'Shoprite', category: 'Groceries' };
  if (desc.includes('spar')) return { merchant: 'Spar', category: 'Groceries' };
  if (desc.includes('chicken republic')) return { merchant: 'Chicken Republic', category: 'Food & Dining' };
  if (desc.includes('domino') || desc.includes('pizza')) return { merchant: 'Dominos Pizza', category: 'Food & Dining' };
  if (desc.includes('chowdeck') || desc.includes('glovo') || desc.includes('food')) return { merchant: 'Food Delivery', category: 'Food & Dining' };

  if (desc.includes('stamp duty') || desc.includes('fgn') || desc.includes('vat')) return { merchant: 'FGN Stamp Duty/VAT', category: 'Bank Charges' };
  if (desc.includes('sms') || desc.includes('alert')) return { merchant: 'SMS Alert Fee', category: 'Bank Charges' };
  if (desc.includes('maintenance') || desc.includes('card fee')) return { merchant: 'Card Maintenance', category: 'Bank Charges' };
  if (desc.includes('fee') || desc.includes('charge')) return { merchant: 'Bank Fees', category: 'Bank Charges' };

  if (desc.includes('paystack')) return { merchant: 'Paystack Checkout', category: 'Online Payment' };
  if (desc.includes('flutterwave') || desc.includes('flw')) return { merchant: 'Flutterwave', category: 'Online Payment' };
  if (desc.includes('remita')) return { merchant: 'Remita', category: 'Taxes & Levies' };

  if (desc.includes('pos')) return { merchant: 'POS Terminal', category: 'POS / Cash' };
  if (desc.includes('atm') && desc.includes('wdl')) return { merchant: 'ATM Withdrawal', category: 'POS / Cash' };
  if (desc.includes('trf') || desc.includes('transfer') || desc.includes('nip') || desc.includes('ussd')) return { merchant: 'Bank Transfer', category: 'Transfers' };
  if (desc.includes('reversal')) return { merchant: 'Reversal', category: 'Refunds' };

  let cleanMerchant = rawDescription
      .replace(/(POS\/PUR\/|NIP TRF|NIP|TRF|USSD|WDL|WEB\/|MOB\/|kip:)/gi, '') 
      .replace(/[0-9]{6,}/g, '') 
      .split('/')[0] 
      .split('*')[0] 
      .trim();

  cleanMerchant = cleanMerchant.charAt(0).toUpperCase() + cleanMerchant.slice(1).toLowerCase();
  if (cleanMerchant.length > 25) cleanMerchant = cleanMerchant.substring(0, 25) + '...';

  return { merchant: cleanMerchant || 'Unknown Merchant', category: 'Uncategorized' };
};

export const processStatement = async (file: File): Promise<Partial<TelemetryRecord>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    // Changed to async to allow cryptographic hashing
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;

        const rows: string[] = [];
        let currentRow = '';
        let inQuotesForSplit = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '"') {
                inQuotesForSplit = !inQuotesForSplit;
                currentRow += char;
            } else if (char === '\n' && !inQuotesForSplit) {
                rows.push(currentRow);
                currentRow = '';
            } else {
                currentRow += char;
            }
        }
        if (currentRow) rows.push(currentRow);

        if (rows.length < 2) throw new Error("File appears empty or invalid.");

        let headerRowIndex = -1;
        let headers: string[] = [];
        let dateIdx = -1, descIdx = -1, debitIdx = -1, creditIdx = -1, amountIdx = -1;

        for (let i = 0; i < Math.min(rows.length, 50); i++) {
            let cols = [];
            let inQ = false;
            let colStr = '';
            for (let char of rows[i]) {
                if (char === '"') inQ = !inQ;
                else if (char === ',' && !inQ) { cols.push(colStr); colStr = ''; }
                else colStr += char;
            }
            cols.push(colStr);

            const tempHeaders = cols.map(h => h.toLowerCase().replace(/["\r]/g, '').trim());

            const tempDateIdx = tempHeaders.findIndex(h => h === 'date' || h.includes('date') || h === 'value date' || h === 'txn date' || h === 'date/time');

            // Priorities Description over Category
            let tempDescIdx = tempHeaders.findIndex(h => h === 'description' || h === 'narration' || h === 'details' || h === 'remarks');
            if (tempDescIdx === -1) tempDescIdx = tempHeaders.findIndex(h => h === 'category');

            if (tempDateIdx !== -1 && tempDescIdx !== -1) {
                headerRowIndex = i;
                headers = tempHeaders;
                dateIdx = tempDateIdx;
                descIdx = tempDescIdx;
                debitIdx = headers.findIndex(h => h.includes('debit') || h.includes('withdrawal') || h.includes('money out') || h.includes('paid out'));
                creditIdx = headers.findIndex(h => h.includes('credit') || h.includes('deposit') || h.includes('money in') || h.includes('paid in'));
                amountIdx = headers.findIndex(h => h === 'amount');
                break;
            }
        }

        if (headerRowIndex === -1) throw new Error("Could not detect standard 'Date' or 'Description' columns.");

        const parsedData: Partial<TelemetryRecord>[] = [];
        const merchantFrequency: Record<string, number> = {};
        
        // NEW: Memory bank to track identical transactions on the exact same day
        const occurrenceTracker: Record<string, number> = {};

        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const rawRow = rows[i];
          if (!rawRow.trim()) continue; 

          let cols = [];
          let inQuotes = false;
          let colStr = '';
          for (let char of rawRow) {
              if (char === '"') { inQuotes = !inQuotes; colStr += char; } 
              else if (char === ',' && !inQuotes) { cols.push(colStr); colStr = ''; } 
              else { colStr += char; }
          }
          cols.push(colStr); 

          if (cols.length <= Math.max(dateIdx, descIdx)) continue;

          let rawDate = cols[dateIdx]?.replace(/["\r]/g, '').trim();
          const rawDesc = cols[descIdx]?.replace(/["\r\n]/g, ' ').trim() || 'Unknown';

          let amount = 0;
          let type: 'SPEND' | 'DROP' = 'SPEND';

          if (amountIdx !== -1 && cols[amountIdx]) {
             const val = parseFloat(cols[amountIdx].replace(/[^0-9.-]+/g, ''));
             if (!isNaN(val)) { amount = Math.abs(val); type = val < 0 ? 'SPEND' : 'DROP'; }
          } else {
             const debitStr = cols[debitIdx]?.replace(/[^0-9.-]+/g, '');
             const creditStr = cols[creditIdx]?.replace(/[^0-9.-]+/g, '');
             const debitVal = debitStr ? parseFloat(debitStr) : 0;
             const creditVal = creditStr ? parseFloat(creditStr) : 0;

             if (debitVal > 0) { amount = debitVal; type = 'SPEND'; }
             else if (creditVal > 0) { amount = creditVal; type = 'DROP'; }
          }

          if (!amount || isNaN(amount) || !rawDate) continue;

          rawDate = rawDate.replace(/\n/g, ' ');

          let parsedDate = new Date(rawDate);

          if (isNaN(parsedDate.getTime())) {
             const dateParts = rawDate.split(' ')[0].split(/[-/]/);
             if (dateParts.length >= 3) {
                 let day = dateParts[0].padStart(2, '0');
                 let month = dateParts[1].padStart(2, '0');
                 let year = dateParts[2];

                 if (dateParts[0].length === 4) { 
                    year = dateParts[0];
                    month = dateParts[1].padStart(2, '0');
                    day = dateParts[2].padStart(2, '0');
                 } else if (year.length === 2) {
                    year = '20' + year; 
                 }

                 const timePart = rawDate.split(' ')[1] || '12:00:00';
                 parsedDate = new Date(`${year}-${month}-${day}T${timePart}Z`); 
             }
          }

          if (isNaN(parsedDate.getTime())) continue;

          const { merchant, category } = classifyTransaction(rawDesc);

          if (type === 'SPEND') {
              merchantFrequency[merchant] = (merchantFrequency[merchant] || 0) + 1;
          }

          // -------------------------------------------------------------------
          // THE DETERMINISTIC SHA-256 FINGERPRINT ENGINE
          // -------------------------------------------------------------------
          
          // 1. Create a normalized string based on the raw facts of the transaction
          const baseSeed = `${parsedDate.toISOString()}_${type}_${amount}_${rawDesc.trim()}`;
          
          // 2. Track occurrences (fixes the "two identical coffees on the same day" bug)
          occurrenceTracker[baseSeed] = (occurrenceTracker[baseSeed] || 0) + 1;
          const finalSeed = `${baseSeed}_${occurrenceTracker[baseSeed]}`;
          
          // 3. Hash the string using the browser's native cryptographic engine
          const encoder = new TextEncoder();
          const data = encoder.encode(finalSeed);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          
          // 4. Convert the binary hash into a readable Hexadecimal string
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const fingerprintHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

          parsedData.push({
            date: parsedDate.toISOString(),
            type,
            title: merchant,
            description: rawDesc,
            amount,
            categoryGroup: category,
            currency: 'NGN',
            transactionRef: fingerprintHex // The titanium lock!
          });
        }

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
