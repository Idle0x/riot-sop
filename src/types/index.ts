export type Currency = 'USD' | 'NGN';

// --- USER & SYSTEM STATE ---
export interface UserProfile {
  burnCap: number;           // The setting limit (e.g., 200k)
  inflationRate: number;     // e.g., 1.15
  lastSeen: string;          // ISO Timestamp for Ghost Mode
  runwayEmptySince: string | null;
  systemVersion: string;     // e.g., "v1.6"
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
  expiryDate?: string;       // For one-time budgets (auto-delete)
  category: string;
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
  isCompleted: boolean;
  priority: number;
  subGoals?: SubGoal[];      // Chunking
  isHidden?: boolean;        // For Focus View
}

// --- SIGNALS (Hunter-Creator) ---
export type SignalPhase = 'discovery' | 'validation' | 'contribution' | 'delivered' | 'harvested' | 'graveyard';

export interface Signal {
  id: string;
  title: string;
  sector: string;            // #DePin, #AI
  phase: SignalPhase;
  confidence: number;        // 1-10
  effort: 'low' | 'med' | 'high';
  hoursLogged: number;       // ROI on Time
  totalGenerated: number;    // $ generated
  redFlags: string[];
  proofOfWork: string[];     // URLs
  createdAt: string;
  updatedAt: string;
}

// --- HISTORY (The Black Box) ---
export type LogType = 'DROP' | 'SPEND' | 'TRANSFER' | 'TRIAGE' | 'SIGNAL_UPDATE' | 'GOAL_FUND' | 'SYSTEM_EVENT' | 'JOURNAL' | 'EMERGENCY_ACCESS';

export interface HistoryLog {
  id: string;
  date: string;
  type: LogType;
  title: string;
  amount?: number;
  currency?: Currency;
  description?: string;
  linkedSignalId?: string;
  linkedGoalId?: string;
  tags?: string[];
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  tags: string[];
  linkedLogId?: string;
}
