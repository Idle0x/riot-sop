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

  // 7. Gateways & Infrastructure (When the specific merchant isn't clear)
  if (desc.includes('paystack')) return { merchant: 'Paystack Checkout', category: 'Online Payment' };
  if (desc.includes('flutterwave') || desc.includes('flw')) return { merchant: 'Flutterwave', category: 'Online Payment' };
  if (desc.includes('remita')) return { merchant: 'Remita', category: 'Taxes & Levies' };

  // 8. General Transfers & POS
  if (desc.includes('pos')) return { merchant: 'POS Terminal', category: 'POS / Cash' };
  if (desc.includes('atm') && desc.includes('wdl')) return { merchant: 'ATM Withdrawal', category: 'POS / Cash' };
  if (desc.includes('trf') || desc.includes('transfer') || desc.includes('nip') || desc.includes('ussd')) return { merchant: 'Bank Transfer', category: 'Transfers' };
  if (desc.includes('reversal')) return { merchant: 'Reversal', category: 'Refunds' };

  // --- FALLBACK CLEANUP ---
  // If we don't recognize it, we aggressively clean the garbage text to find a readable name.
  // We remove common banking junk text like "POS/PUR/", "NIP TRF/", dates, and reference numbers.
  let cleanMerchant = rawDescription
      .replace(/(POS\/PUR\/|NIP TRF|NIP|TRF|USSD|WDL|WEB\/|MOB\/)/gi, '') // Strip prefixes
      .replace(/[0-9]{8,}/g, '') // Strip long reference numbers
      .split('/')[0] // Take the first meaningful chunk before slashes
      .split('*')[0] // Take chunks before asterisks
      .trim();

  // Capitalize properly
  cleanMerchant = cleanMerchant.charAt(0).toUpperCase() + cleanMerchant.slice(1).toLowerCase();
  
  // Ensure it's not too long for the UI
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
        const rows = text.split('\n').map(row => row.split(','));
        if (rows.length < 2) throw new Error("File appears empty or invalid.");

        // Heuristic Header Detection
        const headers = rows[0].map(h => h.toLowerCase().replace(/["\r]/g, '').trim());
        
        const dateIdx = headers.findIndex(h => h.includes('date'));
        const descIdx = headers.findIndex(h => h.includes('description') || h.includes('narration') || h.includes('remarks') || h.includes('details'));
        const debitIdx = headers.findIndex(h => h.includes('debit') || h.includes('withdrawal'));
        const creditIdx = headers.findIndex(h => h.includes('credit') || h.includes('deposit'));
        const amountIdx = headers.findIndex(h => h === 'amount');

        if (dateIdx === -1 || descIdx === -1) {
           throw new Error("Could not detect standard 'Date' or 'Description' columns.");
        }

        const parsedData: Partial<TelemetryRecord>[] = [];

        // Track merchant frequency for the High-Velocity / Bleed detector
        const merchantFrequency: Record<string, number> = {};

        // Parse Phase
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length <= Math.max(dateIdx, descIdx)) continue;

          const rawDate = row[dateIdx]?.replace(/["\r]/g, '');
          const rawDesc = row[descIdx]?.replace(/["\r]/g, '') || 'Unknown';
          
          let amount = 0;
          let type: 'SPEND' | 'DROP' = 'SPEND';

          if (amountIdx !== -1 && row[amountIdx]) {
             const val = parseFloat(row[amountIdx].replace(/[^0-9.-]+/g, ''));
             amount = Math.abs(val);
             type = val < 0 ? 'SPEND' : 'DROP';
          } else {
             const debitVal = parseFloat(row[debitIdx]?.replace(/[^0-9.-]+/g, '') || '0');
             const creditVal = parseFloat(row[creditIdx]?.replace(/[^0-9.-]+/g, '') || '0');
             if (debitVal > 0) { amount = debitVal; type = 'SPEND'; }
             else if (creditVal > 0) { amount = creditVal; type = 'DROP'; }
          }

          if (!amount || isNaN(amount) || !rawDate) continue;

          // 1. Run the Smart Classifier
          const { merchant, category } = classifyTransaction(rawDesc);

          // Track frequency to detect systemic leakage (only for spending)
          if (type === 'SPEND') {
              merchantFrequency[merchant] = (merchantFrequency[merchant] || 0) + 1;
          }

          parsedData.push({
            date: new Date(rawDate).toISOString(),
            type,
            title: merchant,           // The clean Merchant name
            description: rawDesc,      // The original raw string (kept for forensics)
            amount,
            categoryGroup: category,   // The macro category
            currency: 'NGN',
            transactionRef: crypto.randomUUID()
          });
        }

        // 2. The Anomaly / High-Velocity Circuit Breaker
        // If you hit the same merchant more than 3 times in one statement, it flags as a "Bleed"
        const finalData = parsedData.map(record => {
            const isHighVelocity = record.type === 'SPEND' && merchantFrequency[record.title!] > 3;
            return {
                ...record,
                highVelocityFlag: isHighVelocity
            };
        });

        resolve(finalData);

      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
};
