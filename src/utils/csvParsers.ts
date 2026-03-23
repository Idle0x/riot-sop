import { type TelemetryRecord } from '../types';

// Robust list of Nigerian banks and fintechs to ignore when extracting human names
const BANK_BLACKLIST = [
    'palmpay', 'opay', 'kuda', 'moniepoint', 'gtbank', 'uba', 'zenith',
    'access', 'stanbic', 'first bank', 'fcmb', 'wema', 'polaris', 'sterling',
    'keystone', 'union bank', 'fidelity', 'ecobank', 'standard chartered',
    'providus', 'taj', 'jaiz', 'suntrust', 'titan', 'globus', 'optimus', 'rubies',
    'vfd', 'mint', 'kuda mfb', 'stanbicibtc bank', 'paycom', 'monie point',
    'firstcity monument', 'guaranty trust'
];

// --- THE PRE-STEP: SMART ENTITY EXTRACTION & PERMUTATION ---
const extractEntityName = (rawDesc: string): string => {
    let name = '';
    const desc = rawDesc.trim();

    // 1. Slashes Format (e.g., Name/Account/Bank)
    if (desc.includes('/')) {
        name = desc.split('/')[0];
    }
    // 2. Transfer To/From Format
    else if (/transfer (to|from)\s+/i.test(desc)) {
        name = desc.replace(/.*?transfer (to|from)\s+/i, '').split('|')[0];
    }
    // 3. Pipe Format (The Smart Scanner)
    else if (desc.includes('|')) {
        const parts = desc.split('|').map(p => p.trim());
        const validPart = parts.find(p => {
            const pLower = p.toLowerCase();
            const isLongID = /^[0-9A-Z]{10,}$/i.test(p);
            const isBank = BANK_BLACKLIST.some(bank => pLower === bank || pLower.includes(bank));
            const hasLetters = /[a-zA-Z]{3,}/.test(p);
            return !isLongID && !isBank && hasLetters;
        });
        name = validPart || parts[0];
    }
    // 4. Web & POS Format
    else if (desc.includes('@')) {
        name = desc.split('@')[1];
    } 
    else {
        name = desc;
    }

    // Clean up banking noise
    let cleanName = name
        .replace(/^(MB TRF|TRF|NIP TRF|NIP|USSD_|-|REV -MB TRF|REV:|REV-|REV\s)\s*/i, '') 
        .replace(/(POS\/PUR\/|WEB PURCHASE\s*@|ATM CASH WITHDRAWAL@|DLO\*)/gi, '') 
        .replace(/[0-9]{6,}/g, '') 
        .replace(/\s+/g, ' ') 
        .trim();

    if (cleanName) {
        // The Permutation Engine: Sort human names alphabetically to prevent duplicate profiles
        // Only applies to strings with just letters and spaces (2 to 4 words long)
        if (/^[a-zA-Z\s]{5,40}$/.test(cleanName)) {
            const words = cleanName.split(/\s+/);
            if (words.length >= 2 && words.length <= 4) {
                cleanName = words.sort((a, b) => a.localeCompare(b)).join(' ');
            }
        }

        // Title Case Conversion
        cleanName = cleanName.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        
        if (cleanName.length > 30) cleanName = cleanName.substring(0, 30) + '...';
        return cleanName;
    }

    return 'Unknown Merchant';
};

// --- THE 11-LAYER TRIAGE ENGINE ---
const classifyTransaction = (rawDescription: string, type: 'SPEND' | 'DROP', amount: number, extractedName: string): { merchant: string, category: string } => {
  const desc = rawDescription.toLowerCase();
  const nameLower = extractedName.toLowerCase();

  // --------------------------------------------------------------------------------
  // LAYER 0: THE IDENTITY FIREWALL (Anti-Inflation - ENVIRONMENT PROTECTED)
  // --------------------------------------------------------------------------------
  const rawAliases = import.meta.env.VITE_IDENTITY_ALIASES || '';
  const identityAliases = rawAliases.split(',').map((a: string) => a.toLowerCase().trim());

  const isSelfTransfer = identityAliases.some((alias: string) => alias && (desc.includes(alias) || nameLower.includes(alias)));

  if (isSelfTransfer) {
      return { merchant: 'Self Transfer / Liquidity', category: 'Self Transfer' };
  }

  // --------------------------------------------------------------------------------
  // LAYER 1: AUTOMATED WEALTH & YIELD
  // --------------------------------------------------------------------------------
  if (desc.includes('owealth') || desc.includes('spend and save') || desc.includes('piggybank') || desc.includes('piggyvest') || desc.includes('cowrywise') || desc.includes('savings')) {
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
  if (desc.includes('nip-fee') || desc.includes('sms') || desc.includes('alert') || desc.includes('maintenance') || desc.includes('card fee') || desc.includes('charge') || desc.includes('issuance')) {
      return { merchant: 'Bank Fees', category: 'Bank Charges' };
  }

  // --------------------------------------------------------------------------------
  // LAYER 3: DYNAMIC DIGITAL EXTRACTION (Google, Spotify, Apple, etc.)
  // --------------------------------------------------------------------------------
  if (desc.includes('google')) {
      const googleMatch = rawDescription.match(/(@DLO\*GOOGLE|\*GOOGLE|GOOGLE)\s+([a-zA-Z0-9\s]+?)(?:\s+(?:Lagos|NG|IE|GB|US|\|))/i);
      const appName = googleMatch && googleMatch[2] ? googleMatch[2].trim() : 'Services';
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
  if (desc.includes('mtn') || desc.includes('vtu') || desc.includes('airtime') || desc.includes('recharge') || desc.includes('mobile data')) return { merchant: 'Telecom / Airtime', category: 'Utilities' };
  if (desc.includes('airtel')) return { merchant: 'Airtel', category: 'Utilities' };
  if (desc.includes('glo') && (desc.includes('data') || desc.includes('airtime') || desc.includes('glo-'))) return { merchant: 'Glo', category: 'Utilities' };
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
  if (desc.includes('item 7') || desc.includes('item7') || desc.includes('chicken republic') || desc.includes('domino') || desc.includes('pizza') || desc.includes('basic feeding')) return { merchant: 'Fast Food', category: 'Food & Dining' };
  if (desc.includes('shoprite') || desc.includes('spar')) return { merchant: 'Supermarket', category: 'Groceries' };
  if (desc.includes('uber') || desc.includes('bolt') || desc.includes('indrive') || desc.includes('cowry') || desc.includes('lago')) return { merchant: 'Transport / Ride', category: 'Transport' };

  // --------------------------------------------------------------------------------
  // LAYER 6.5: GENEROSITY & SOCIAL TAX
  // --------------------------------------------------------------------------------
  if (desc.includes('gift') || desc.includes('donation') || desc.includes('tithe') || desc.includes('offering') || desc.includes('party') || desc.includes('birthday') || desc.includes('love ')) {
      return { merchant: extractedName !== 'Unknown Merchant' ? extractedName : 'Social Spend', category: 'Generosity' };
  }

  // --------------------------------------------------------------------------------
  // LAYER 7: DYNAMIC ONLINE GATEWAYS (Paystack, Flutterwave)
  // --------------------------------------------------------------------------------
  if (desc.includes('paystack*') || desc.includes('flw*') || desc.includes('paystack') || desc.includes('flutterwave')) {
      let gwName = rawDescription.split('*')[1]?.split('|')[0]?.trim() || extractedName;
      gwName = gwName.replace(/[0-9]{6,}/g, '').trim(); 
      gwName = gwName.charAt(0).toUpperCase() + gwName.slice(1).toLowerCase();
      return { merchant: `Paystack: ${gwName}`, category: 'Online Payment' };
  }
  if (desc.includes('remita')) return { merchant: 'Remita Payment', category: 'Taxes & Levies' };

  // --------------------------------------------------------------------------------
  // LAYER 8: DYNAMIC WEB & POS PURCHASES
  // --------------------------------------------------------------------------------
  if (desc.includes('web purchase')) {
      return { merchant: extractedName || 'Online Purchase', category: 'Online Payment' };
  }
  if (desc.includes('pos/pur') || desc.includes('pos terminal') || desc.includes('pos payment') || desc.includes('pos purchase')) {
      return { merchant: extractedName !== 'Unknown Merchant' ? extractedName : 'POS Terminal', category: 'POS / Cash' };
  }
  if (desc.includes('atm') && (desc.includes('wdl') || desc.includes('withdrawal') || desc.includes('purchase'))) {
      return { merchant: extractedName !== 'Unknown Merchant' ? extractedName : 'ATM Withdrawal', category: 'POS / Cash' };
  }

  // --------------------------------------------------------------------------------
  // LAYER 9: TRANSFERS, REFUNDS & P2P CONTACTS
  // --------------------------------------------------------------------------------
  if (desc.includes('reversal') || desc.includes('rev of') || desc.includes('refund') || desc.includes('rev-') || desc.includes('rev:') || desc.includes('rev ')) {
      return { merchant: 'Reversal / Refund', category: 'Refunds' };
  }
  if (desc.includes('trf') || desc.includes('transfer') || desc.includes('nip') || desc.includes('ussd') || desc.includes('mobile banking')) {
      if (extractedName && extractedName !== 'Unknown Merchant') {
          return { merchant: extractedName, category: 'Contacts & P2P' };
      }
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

  if (extractedName && extractedName !== 'Unknown Merchant') {
      return { merchant: extractedName, category: 'Uncategorized' };
  }

  return { merchant: 'Unknown Merchant', category: 'Uncategorized' };
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

        // PASS 1: PARSING, EXTRACTION, AND MEMORY ACCUMULATION
        const preParsedRows: any[] = [];
        const uniqueNames = new Set<string>();

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

          // EXTRACT THE CLEAN ENTITY NAME FIRST
          const extractedName = extractEntityName(rawDesc);

          if (extractedName && extractedName !== 'Unknown Merchant') {
              uniqueNames.add(extractedName);
          }

          // Store the row in memory instead of resolving immediately
          preParsedRows.push({
              parsedDate,
              type,
              amount,
              rawDesc,
              extractedName
          });
        }

        // --- SUBSET MERGER (2-PASS RESOLUTION) ---
        const aliasMap: Record<string, string> = {};
        const nameList = Array.from(uniqueNames).sort((a, b) => b.length - a.length); // Longest first

        nameList.forEach(shortName => {
            const shortWords = shortName.toLowerCase().split(' ');
            if (shortWords.length < 2) return; // Only merge names with 2+ words

            const parentName = nameList.find(longName => {
                if (longName === shortName || longName.length <= shortName.length) return false;
                const longWords = longName.toLowerCase().split(' ');
                // Check if every word in the short name exists in the long name
                return shortWords.every(sw => longWords.includes(sw));
            });

            if (parentName) {
                aliasMap[shortName] = parentName;
            }
        });

        // --- PASS 2: FINAL CLASSIFICATION & HASHING ---
        for (const row of preParsedRows) {
            const { parsedDate, type, amount, rawDesc, extractedName } = row;

            // Apply the memory map to merge sub-names (e.g., Damola Muritala -> Damola Muritala Kabeerat)
            const resolvedName = aliasMap[extractedName] || extractedName;

            // PASS IT TO THE CLASSIFICATION ENGINE
            const { merchant, category } = classifyTransaction(rawDesc, type, amount, resolvedName);

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
