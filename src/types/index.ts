export type Currency = 'USD' | 'NGN';

// --- USER & SYSTEM STATE ---
export interface PendingChange {
  id: string;
  key: keyof UserProfile;
  value: any;
  effectiveDate: string; // ISO String
}

export interface UserProfile {
  burnCap: number;           
  inflationRate: number;     
  lastSeen: string;          
  lastReconciliationDate: string; // NEW: For "Welcome Back" Logic
  runwayEmptySince: string | null;
  systemVersion: string;     
  pendingChanges: PendingChange[]; // NEW: 7-Day Cooldown Queue
}

// --- ACCOUNTING ---
// UPDATE: Added 'vault'
export type AccountType = 'treasury' | 'payroll' | 'buffer' | 'holding' | 'vault';

export interface Account {
  id: AccountType;
  name: string;
  balance: number;
  currency: Currency;
  isLocked?: boolean;
}

// --- BUDGETING (Spending Engine) ---
export type BudgetFrequency = 'monthly' | 'one-time';

export interface Budget {
  id: string;
  name: string;
  amount: number;       // The Limit
  spent: number;        // NEW: Actual spent this cycle
  frequency: BudgetFrequency;
  expiryDate?: string;  // For auto-delete
  category: string;
  autoDeduct?: boolean;
}

// --- GOALS ---
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
  subGoals?: SubGoal[];      
  isHidden?: boolean;        
}

// --- SIGNALS (Hunter-Creator) ---
export type SignalPhase = 'discovery' | 'validation' | 'contribution' | 'delivered' | 'harvested' | 'graveyard';

export interface Signal {
  id: string;
  title: string;
  sector: string;            
  phase: SignalPhase;
  confidence: number;        
  effort: 'low' | 'med' | 'high';
  
  // NEW: Investor Thesis (The Memo)
  thesis: {
    alpha: string;        // "Why is this unique?"
    catalyst: string;     // "What triggers the payout?"
    invalidation: string; // "When do I quit?"
    expectedValue: number;// "Target Price/Amount"
  };

  hoursLogged: number;       
  totalGenerated: number;    
  redFlags: string[];
  proofOfWork: string[];     
  createdAt: string;
  updatedAt: string;
  checklist?: {
    hasTeam: boolean;
    hasProduct: boolean;
    hasToken: boolean;
  };
}

// --- HISTORY ---
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
