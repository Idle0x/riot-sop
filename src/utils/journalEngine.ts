import { formatNumber } from './format';
import { type Budget, type Signal, type HistoryLog } from '../types';

export type JournalEventType = 
  | 'BUDGET_SPEND' 
  | 'TRIAGE_DROP' 
  | 'SIGNAL_HARVEST' 
  | 'SIGNAL_KILL' 
  | 'GOAL_FUND' 
  | 'GENEROSITY_DEPLOY' 
  | 'AUDIT_INGEST';

export interface GlobalHydrationState {
  runwayMonths: number;
  unallocatedCash: number;
  budgets: Budget[];
  signals: Signal[];
  history: HistoryLog[];
  recentBleeds: number; 
}

export interface EngineResult {
  synthesis: string;
  prompt: string;
  title: string;
}

// --- THE COMBINATORIAL ENGINE ---
export const generateSmartPrompt = (
  type: JournalEventType, 
  data: any, 
  state: GlobalHydrationState
): EngineResult | null => {

  const { runwayMonths, recentBleeds } = state;
  const isCritical = runwayMonths < 3;

  // 1. BUDGET SPEND HYDRATION
  if (type === 'BUDGET_SPEND') {
    const { amount, budgetName, limit, spentBefore } = data;
    const newTotal = spentBefore + amount;
    const isBreach = newTotal > limit;
    const isSignificant = amount > limit * 0.4; 

    let synthesis = `Deployed ₦${formatNumber(amount)} to ${budgetName}. `;
    let prompt = '';

    if (isBreach) {
      synthesis += `This breaches the operational cap by ₦${formatNumber(newTotal - limit)}. `;
      
      if (isCritical) {
        synthesis += `System is in CRITICAL state (Runway: ${runwayMonths.toFixed(1)}mo). Discretionary overspending during survival mode threatens the architecture. `;
        prompt = "This is a direct violation of survival protocols. What psychological trigger caused this transaction?";
      } else {
        synthesis += `Unallocated holding cash absorbed the deficit, reducing capital velocity for Cold Storage. `;
        prompt = "Is this a one-time anomaly, or a structural lifestyle creep that requires budget expansion?";
      }
    } else if (isSignificant) {
      synthesis += `Capacity consumed rapidly (${((newTotal/limit)*100).toFixed(0)}% full). `;
      prompt = "Large single-ticket deployment detected. Was this forecasted in the Roadmap?";
    } else {
      return null; 
    }

    return { title: `Budget Protocol: ${budgetName}`, synthesis, prompt };
  }

  // 2. TRIAGE HYDRATION
  if (type === 'TRIAGE_DROP') {
    const { amountNGN, amountUSD, opExRouted, bufferRouted, coldRouted } = data;
    
    let synthesis = `Triaged $${formatNumber(amountUSD)} (₦${formatNumber(amountNGN)}). `;
    let prompt = '';

    if (coldRouted > amountNGN * 0.5) {
      synthesis += `Masterful routing. Over 50% of capital cleanly severed into Tier 3 Cold Storage. `;
      if (recentBleeds > 0) synthesis += `However, Data Lake indicates ₦${formatNumber(recentBleeds)} in active systemic leakage. `;
      prompt = "Alpha secured. What is the immediate strategic target for the newly stored liquidity?";
    } else if (opExRouted > 0 && isCritical) {
      synthesis += `Capital injected directly into Tier 2 OpEx. Defensive posture maintained. Runway slightly extended. `;
      prompt = "Survival baseline funded. What is the execution plan to shift from defense back to offense?";
    } else if (bufferRouted === amountNGN) {
      synthesis += `Capital parked entirely in Chaos Buffer. Zero structural allocation. `;
      prompt = "Why was this capital left unallocated? Is there an impending shock forecasted?";
    } else {
       synthesis += `Capital routed across the tri-tier architecture. `;
       prompt = "What is your immediate psychological state following this drop? Check for dopamine drift.";
    }

    return { title: `Capital Influx: $${formatNumber(amountUSD)}`, synthesis, prompt };
  }

  // 3. SIGNAL HARVEST HYDRATION
  if (type === 'SIGNAL_HARVEST') {
    const { signalName, profit, hours } = data;
    const yieldPerHour = hours > 0 ? profit / hours : profit;

    let synthesis = `Extracted ₦${formatNumber(profit)} from [${signalName}]. `;
    let prompt = '';

    if (hours < 10 && profit > 100000) {
      synthesis += `High-velocity strike. Exceptional asymmetric yield (₦${formatNumber(yieldPerHour)}/hr). `;
      prompt = "Brilliant execution. How can the mechanics of this specific asymmetric bet be replicated?";
    } else if (hours > 50) {
      synthesis += `Marathon execution. Heavy time-capital deployed (${hours} hrs) for this yield. `;
      prompt = "The effort-to-reward ratio was heavily strained. Did the thesis play out as expected, or was it forced?";
    } else {
      prompt = "Signal successfully harvested. What was the primary catalyst that made this a win?";
    }

    return { title: `Alpha Harvest: ${signalName}`, synthesis, prompt };
  }

  // 4. SIGNAL KILL HYDRATION
  if (type === 'SIGNAL_KILL') {
    const { signalName, hours } = data;
    let synthesis = `Terminated [${signalName}]. `;
    let prompt = '';

    if (hours > 20) {
      synthesis += `Heavy time loss. ${hours} hours sunk with zero capital extracted. `;
      prompt = "Sunk cost fallacy terminated. What was the exact point of invalidation, and why wasn't it caught earlier?";
    } else {
      synthesis += `Swift pruning. Eliminating noise to protect focus. `;
      prompt = "Why did the initial thesis fail to materialize?";
    }

    return { title: `Pipeline Pruned: ${signalName}`, synthesis, prompt };
  }

  return null;
};
