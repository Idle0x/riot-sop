import { type TelemetryRecord } from '../types';

const classifyTransaction = (rawDescription: string, type: 'SPEND' | 'DROP', amount: number): { merchant: string, category: string } => {
  const desc = rawDescription.toLowerCase();

  // --------------------------------------------------------------------------------
  // LAYER 0: THE IDENTITY FIREWALL (Anti-Inflation - ENVIRONMENT PROTECTED)
  // --------------------------------------------------------------------------------
  const rawAliases = import.meta.env.VITE_IDENTITY_ALIASES || '';
  const identityAliases = rawAliases.split(',').map((a: string) => a.toLowerCase().trim());
  
  // Check if the transaction description contains any of the protected aliases
  const isSelfTransfer = identityAliases.some((alias: string) => alias && desc.includes(alias));
  
  if (isSelfTransfer) {
      return { merchant: 'Self Transfer / Liquidity', category: 'Self Transfer' };
  }

  // --------------------------------------------------------------------------------
  // LAYER 1: AUTOMATED WEALTH & YIELD
  // --------------------------------------------------------------------------------
  if (desc.includes('owealth') || desc.includes('spend and save') || desc.includes('piggybank')) {
      return { merchant: 'Automated Savings Sweep', category: 'Internal Transfer' };
  }
  if (desc.includes('int.pd') || desc.includes('interest run') || desc.includes('interest') || desc.includes('cap. yield')) {
      return { merchant: 'Bank Interest', category: 'Yield & Returns' };
  }

  // --------------------------------------------------------------------------------
  // LAYER 2: TAXES & BANK CHARGES
  // --------------------------------------------------------------------------------
  if (desc.includes('cbn') || desc.includes('electroniclevy') || desc.includes('stamp duty') || desc.includes('vat')) {
      return { merchant: 'FGN / CBN Taxes', category: 'Taxes & Levies' };
  }
  if (desc.includes('nip-fee') || desc.includes('sms') || desc.includes('alert') || desc.includes('maintenance') || desc.includes('card fee') || desc.includes('charge')) {
      return { merchant: 'Bank Fees', category: 'Bank Charges' };
  }

  // --------------------------------------------------------------------------------
  // LAYER 3: DYNAMIC DIGITAL EXTRACTION (Google, Spotify, Apple, etc.)
  // --------------------------------------------------------------------------------
  if (desc.includes('google')) {
      const googleMatch = rawDescription.match(/GOOGLE\s+([a-zA-Z0-9\s]+?)(?:\s+(?:Lagos|NG|IE|GB|US|\|))/i);
      const appName = googleMatch && googleMatch[1] ? googleMatch[1].trim() : 'Services';
      return { merchant: `Google: ${appName}`, category: 'Software & Apps' };
  }
  if (desc.includes('apple') || desc.includes('itunes')) return { merchant: 'Apple Services', category: 'Software & Apps' };
  if (desc.includes('spotify')) return { merchant: 'Spotify', category: 'Subscriptions' };
  if (desc.includes('netflix')) return { merchant: 'Netflix', category: 'Subscriptions' };
  if (desc.includes('aws') || desc.includes('amazon')) return { merchant: 'Amazon / AWS', category: 'Software & Apps' };
  if (desc.includes('openai') || desc.includes('chatgpt')) return { merchant: 'OpenAI', category: 'Software & Apps' };
  if (desc.includes('dstv') || desc.includes('gotv') || desc.includes('multichoice') || desc.includes('showmax')) return { merchant: 'Cable TV / Streaming', category: 'Subscriptions' };

  // --------------------------------------------------------------------------------
  // LAYER 4: UTILITIES & TELCO
  // --------------------------------------------------------------------------------
  if (desc.includes('mtn') || desc.includes('vtu') || desc.includes('airtime') || desc.includes('recharge')) return { merchant: 'Telecom / Airtime', category: 'Utilities' };
  if (desc.includes('airtel')) return { merchant: 'Airtel', category: 'Utilities' };
  if (desc.includes('glo') && (desc.includes('data') || desc.includes('airtime'))) return { merchant: 'Glo', category: 'Utilities' };
  if (desc.includes('ikedc') || desc.includes('ekedc') || desc.includes('aedc') || desc.includes('buy power') || desc.includes('token') || desc.includes('power')) return { merchant: 'Electricity (Power)', category: 'Utilities' };

  // --------------------------------------------------------------------------------
  // LAYER 5: BETTING & GAMING
  // --------------------------------------------------------------------------------
  if (desc.includes('sportybet') || desc.includes('sporty')) return { merchant: 'SportyBet', category: 'Betting & Gaming' };
  if (desc.includes('bet9ja')) return { merchant: 'Bet9ja', category: 'Betting & Gaming' };
  if (desc.includes('1xbet')) return { merchant: '1xBet', category: 'Betting & Gaming' };
  if (desc.includes('msport')) return { merchant: 'MSport', category: 'Betting & Gaming' };

  // --------------------------------------------------------------------------------
  // LAYER 6: FOOD, GROCERIES & TRANSPORT
  // --------------------------------------------------------------------------------
  if (desc.includes('chowdeck') || desc.includes('glovo') || desc.includes('food')) return { merchant: 'Food Delivery', category: 'Food & Dining' };
  if (desc.includes('chicken republic') || desc.includes('domino') || desc.includes('pizza')) return { merchant: 'Fast Food', category: 'Food & Dining' };
  if (desc.includes('shoprite') || desc.includes('spar')) return { merchant: 'Supermarket', category: 'Groceries' };
  if (desc.includes('uber') || desc.includes('bolt') || desc.includes('indrive') || desc.includes('cowry') || desc.includes('lago')) return { merchant: 'Transport / Ride', category: 'Transport' };
  if (desc.includes('basic feeding')) return { merchant: 'Basic Feeding', category: 'Food & Dining' }; 

  // --------------------------------------------------------------------------------
  // LAYER 7: DYNAMIC ONLINE GATEWAYS (Paystack, Flutterwave)
  // --------------------------------------------------------------------------------
  if (desc.includes('paystack*') || desc.includes('flw*') || desc.includes('paystack') || desc.includes('flutterwave')) {
      let extractedName = rawDescription.split('*')[1]?.split('|')[0]?.trim() || 'Online Merchant';
      extractedName = extractedName.replace(/[0-9]{6,}/g, '').trim(); 
      extractedName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1).toLowerCase();
      return { merchant: `Paystack: ${extractedName}`, category: 'Online Payment' };
  }
  if (desc.includes('remita')) return { merchant: 'Remita Payment', category: 'Taxes & Levies' };

  // --------------------------------------------------------------------------------
  // LAYER 8: DYNAMIC WEB & POS PURCHASES
  // --------------------------------------------------------------------------------
  if (desc.includes('web purchase')) {
      const webMatch = rawDescription.match(/@([a-zA-Z0-9_*]+)/);
      let merchantName = webMatch && webMatch[1] ? webMatch[1].replace('DLO*', '').replace(/_/g, ' ') : 'Online Purchase';
      return { merchant: merchantName, category: 'Online Payment' };
  }
  if (desc.includes('pos/pur') || desc.includes('pos terminal')) {
      let posName = rawDescription.replace(/(POS\/PUR\/[0-9]+\/)/gi, '').split('|')[0].trim();
      posName = posName.charAt(0).toUpperCase() + posName.slice(1).toLowerCase();
      return { merchant: posName || 'POS Terminal', category: 'POS / Cash' };
  }
  if (desc.includes('atm') && (desc.includes('wdl') || desc.includes('withdrawal'))) return { merchant: 'ATM Withdrawal', category: 'POS / Cash' };

  // --------------------------------------------------------------------------------
  // LAYER 9: TRANSFERS & REFUNDS
  // --------------------------------------------------------------------------------
  if (desc.includes('reversal') || desc.includes('rev of') || desc.includes('refund')) return { merchant: 'Reversal / Refund', category: 'Refunds' };
  if (desc.includes('trf') || desc.includes('transfer') || desc.includes('nip') || desc.includes('ussd') || desc.includes('mobile banking')) {
      return { merchant: 'Bank Transfer', category: type === 'DROP' ? 'Inbound Transfer' : 'Outbound Transfer' };
  }

  // --------------------------------------------------------------------------------
  // LAYER 10: THE FALLBACK (Blank Data & Unknowns)
  // --------------------------------------------------------------------------------
  if (desc === 'unknown' || desc.trim() === '') {
      if (type === 'SPEND' && amount === 50) return { merchant: 'System Fee (Inferred)', category: 'Taxes & Levies' };
      if (type === 'SPEND' && amount <= 20) return { merchant: 'Bank Fee (Inferred)', category: 'Bank Charges' };
      return { merchant: 'Unidentified Ledger Entry', category: 'Uncategorized' };
  }

  // Dynamic Merchant Cleanup for anything that slips through the 10 layers
  let cleanMerchant = rawDescription
      .replace(/(POS\/PUR\/|NIP TRF|NIP|TRF|USSD|WDL|WEB\/|MOB\/|kip:)/gi, '') 
      .replace(/[0-9]{6,}/g, '') 
      .split('/')[0] 
      .split('*')[0] 
      .split('|')[0]
      .trim();

  cleanMerchant = cleanMerchant.charAt(0).toUpperCase() + cleanMerchant.slice(1).toLowerCase();
  if (cleanMerchant.length > 25) cleanMerchant = cleanMerchant.substring(0, 25) + '...';

  return { merchant: cleanMerchant || 'Unknown Merchant', category: 'Uncategorized' };
};

export const processStatement = async (file: File): Promise<Partial<TelemetryRecord>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

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

          const { merchant, category } = classifyTransaction(rawDesc, type, amount);

          if (type === 'SPEND') {
              merchantFrequency[merchant] = (merchantFrequency[merchant] || 0) + 1;
          }

          // THE DETERMINISTIC SHA-256 FINGERPRINT ENGINE
          const baseSeed = `${parsedDate.toISOString()}_${type}_${amount}_${rawDesc.trim()}`;
          occurrenceTracker[baseSeed] = (occurrenceTracker[baseSeed] || 0) + 1;
          const finalSeed = `${baseSeed}_${occurrenceTracker[baseSeed]}`;
          
          const encoder = new TextEncoder();
          const data = encoder.encode(finalSeed);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          
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
            transactionRef: fingerprintHex
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
