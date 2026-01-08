// --- CORE IDENTITY ---
export type Currency = 'USD' | 'NGN';

export interface UserProfile {
  burnCap: number;         // The setting limit (e.g., 200k)
  inflationRate: number;   // e.g., 1.15 (15%)
  lastSeen: string;        // ISO Timestamp
  runwayEmptySince: string | null; // Track duration at zero
  systemVersion: string;   // "v1.6"
}

// --- ACCOUNTING ---
export type AccountType = 'treasury' | 'payroll' | 'buffer' | 'holding';

export interface Account {
  id: AccountType;
  name: string;
  balance: number;
  currency: Currency;
  isLocked?: boolean;
}

// --- BUDGETING (The "Alive" Engine) ---
export type BudgetFrequency = 'monthly' | 'one-time';

export interface Budget {
  id: string;
  name: string;
  amount: number;
  frequency: BudgetFrequency;
  expiryDate?: string;     // For one-time budgets (e.g., Wedding)
  autoDeduct: boolean;     // If true, auto-burns from runway
  category: string;        // Food, Data, etc.
}

// --- GOALS (Focus vs Roadmap) ---
export type Phase = 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6+';

export interface SubGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  isCompleted: boolean;
}

export interface Goal {
  id: string;
  title: string;
  phase: Phase;
  targetAmount: number;
  currentAmount: number;
  currency: Currency;
  isCompleted: boolean;
  priority: number;
  subGoals?: SubGoal[];    // Chunking support
  isFocused?: boolean;     // For "Focus View"
}

// --- SIGNALS (Hunter-Creator Engine) ---
export type SignalPhase = 'discovery' | 'validation' | 'contribution' | 'delivered' | 'harvested' | 'graveyard';
export type SignalEffort = 'low' | 'med' | 'high';
export type SignalConfidence = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Signal {
  id: string;
  title: string;
  sector: string;          // #DePin, #AI, #L2
  phase: SignalPhase;
  confidence: SignalConfidence;
  effort: SignalEffort;
  hoursLogged: number;     // For ROT (Return on Time)
  totalGenerated: number;  // $ USD generated from this
  redFlags: string[];      // List of skepticism notes
  proofOfWork: string[];   // URLs to assets
  createdAt: string;
  updatedAt: string;
}

// --- GENEROSITY (The Firewall) ---
export type RelationshipTier = 'T1' | 'T2' | 'T3' | 'T4';

export interface Beneficiary {
  id: string;
  name: string;
  tier: RelationshipTier;
  totalReceived: number;
  lastHelpDate: string;
  notes: string;
}

// --- HISTORY (The Black Box) ---
export type LogType = 
  | 'DROP' 
  | 'SPEND' 
  | 'TRANSFER' 
  | 'TRIAGE' 
  | 'SIGNAL_UPDATE' 
  | 'GOAL_FUND' 
  | 'SYSTEM_EVENT' 
  | 'JOURNAL'
  | 'EMERGENCY_ACCESS';

export interface HistoryLog {
  id: string;
  date: string;
  type: LogType;
  title: string;
  amount?: number;
  currency?: Currency;
  description?: string;
  linkedSignalId?: string; // Context Linking
  linkedGoalId?: string;
  tags?: string[];
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: 'win' | 'fail' | 'neutral' | 'panic';
  linkedLogId?: string;    // Connect narrative to transaction
}
