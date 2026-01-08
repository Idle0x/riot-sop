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
  lastReconciliationDate: string; 
  runwayEmptySince: string | null;
  systemVersion: string;     
  pendingChanges: PendingChange[]; 
}

// --- ACCOUNTING ---
export type AccountType = 'treasury' | 'payroll' | 'buffer' | 'holding' | 'vault';

export interface Account {
  id: AccountType;
  name: string;
  balance: number;
  currency: Currency;
  isLocked?: boolean;
}

// --- BUDGETING ---
export type BudgetFrequency = 'monthly' | 'one-time';

export interface Budget {
  id: string;
  name: string;
  amount: number;       
  spent: number;        
  frequency: BudgetFrequency;
  expiryDate?: string;  
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
  type: 'single' | 'container'; 
  subGoals: SubGoal[];          
  isHidden?: boolean;        
}

// --- SIGNALS (The Research Engine) ---
export type SignalPhase = 'discovery' | 'validation' | 'contribution' | 'delivered' | 'harvested' | 'graveyard';

// NEW: Timeline Entry for Context-Aware History
export interface SignalTimelineEntry {
  date: string;
  phase: SignalPhase;
  context: string; // "Passed 5-min filter", "Entry Strategy: Node", etc.
  meta?: Record<string, any>; // Flexible storage for specific questions answers
}

export interface Signal {
  id: string;
  title: string;
  sector: string;            
  phase: SignalPhase;
  confidence: number;        
  effort: 'low' | 'med' | 'high';
  
  // THE INVESTOR MEMO
  thesis: {
    alpha: string;        
    catalyst: string;     
    invalidation: string; 
    expectedValue: number;
  };

  // THE INTELLIGENCE DOSSIER
  research: {
    links: {
      website?: string;
      github?: string;
      twitter?: string;
      docs?: string;
    };
    token: {
      status: 'live' | 'pending' | 'none';
      utility?: string;       
      tgeDate?: string;       
      launchPlan?: string;    
    };
    findings: string;         
    pickReason: string;       
    drillNotes: Record<string, string>; 
  };

  // NEW: OUTCOME TRACKING (Context-Aware Death)
  outcome?: {
    status: 'active' | 'retired_winner' | 'failure' | 'rejected';
    reason: string; // "Rugged", "No Seasons", "Failed Filter"
    finalRoi?: number;
  };

  // NEW: NARRATIVE HISTORY
  timeline: SignalTimelineEntry[];

  hoursLogged: number;       
  totalGenerated: number;    
  redFlags: string[];
  proofOfWork: string[];     
  createdAt: string;
  updatedAt: string;
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
