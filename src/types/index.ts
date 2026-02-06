export type Currency = 'USD' | 'NGN';

// --- USER & SYSTEM STATE ---
export interface PendingChange {
  id: string;
  key: keyof UserProfile;
  value: any;
  effectiveDate: string; 
}

export interface UserProfile {
  id: string; 
  burnCap: number;           
  annualRent: number; 
  inflationRate: number;     
  lastSeen: string;          
  lastReconciliationDate: string; 
  runwayEmptySince: string | null;
  systemVersion: string;     
  pendingChanges: PendingChange[];
  currencyCode?: string; 
  settings?: {
    allowNegativeBalance: boolean;
    monthlyCheckpointDay: number;
    masterKey?: string;
  };
}

// --- ACCOUNTING ---
export type AccountType = 'treasury' | 'payroll' | 'buffer' | 'holding' | 'vault' | 'generosity';

export interface Account {
  id: string; 
  type: AccountType; 
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
  lastProcessedAt?: string; 
  subscriptionDay?: number; 
}

// --- GOALS ---
export type Phase = 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6+';

export interface SubGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  isCompleted: boolean;
  priority: number;
  type: 'single' | 'container'; 
  subGoals: SubGoal[];          
  isHidden?: boolean;        
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

// --- SIGNALS ---
export type SignalPhase = 'discovery' | 'validation' | 'contribution' | 'delivered' | 'harvested' | 'graveyard';

export interface SignalTimelineEntry {
  date: string;
  phase: SignalPhase;
  context: string; 
  meta?: Record<string, any>; 
}

export interface Signal {
  id: string;
  title: string;
  sector: string;            
  phase: SignalPhase;
  confidence: number;        
  effort: 'low' | 'med' | 'high';

  thesis: {
    alpha: string;        
    catalyst: string;     
    invalidation: string; 
    expectedValue: number;
  };

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

  outcome?: {
    status: 'active' | 'retired_winner' | 'failure' | 'rejected';
    reason: string;
    finalRoi?: number;
  };

  timeline: SignalTimelineEntry[];

  hoursLogged: number;       
  totalGenerated: number;    
  redFlags: string[];
  proofOfWork: string[];     
  createdAt: string;
  updatedAt: string;
}

// --- HISTORY (BLACK BOX) ---
// UPDATED: Comprehensive Log Types
export type LogType = 
  // Financial
  'DROP' | 'SPEND' | 'TRANSFER' | 'TRIAGE' | 'TAX_ALLOCATION' | 'GENEROSITY' |
  // Signals
  'SIGNAL_CREATE' | 'SIGNAL_PROMOTE' | 'SIGNAL_KILL' | 'SIGNAL_REVIVE' | 'SIGNAL_UPDATE' | 'SIGNAL_HARVEST' |
  // Goals & Budgets
  'GOAL_CREATE' | 'GOAL_FUND' | 'GOAL_DELETE' | 
  'BUDGET_CREATE' | 'BUDGET_DELETE' |
  // System
  'SYSTEM_EVENT' | 'JOURNAL' | 'EMERGENCY_ACCESS';

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
