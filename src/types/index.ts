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

export interface SignalSession {
  id: string;
  date: string;
  duration: number; // in hours
  notes: string;
  type: 'active' | 'adjustment';
}

// NEW: Lifecycle Engine Structure
export interface LifecycleChapter {
  phase: SignalPhase;
  enteredAt: string;        // ISO Date
  exitedAt?: string;        // ISO Date (undefined = currently active)
  hoursAtEntry: number;     // Total hours logged when this phase started
  hoursAtExit?: number;     // Total hours logged when this phase ended
  notes?: string;           // Optional context
}

export interface Signal {
  id: string;
  title: string;
  sector: string;            
  phase: SignalPhase;
  confidence: number;        
  effort: 'low' | 'med' | 'high';

  // Time Architecture
  timeEstimates?: {
    weekly: number;        
    total: number;         
    completionDate: string; 
  };
  sessionLogs?: SignalSession[]; 
  lastSessionAt?: string;      

  // NEW: Lifecycle History
  lifecycle: LifecycleChapter[]; 

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
export type LogType = 
  // Financial
  'DROP' | 'SPEND' | 'TRANSFER' | 'TRIAGE' | 'TRIAGE_SESSION' | 'TAX_ALLOCATION' | 'GENEROSITY' | 'GENEROSITY_GIFT' |
  // Signals
  'SIGNAL_CREATE' | 'SIGNAL_PROMOTE' | 'SIGNAL_KILL' | 'SIGNAL_REVIVE' | 'SIGNAL_UPDATE' | 'SIGNAL_HARVEST' | 'SIGNAL_ADVANCE' | 'FIELD_REPORT' | 'WORK_SESSION' |
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
  amount?: number; // Used for Currency OR Hours (context dependent)
  currency?: Currency;
  description?: string;

  // Linkage
  linkedSignalId?: string;
  linkedGoalId?: string;
  tags?: string[];

  // Forensic Metadata
  efficiencyRating?: number; // $/hr
  recipientName?: string;    // Generosity
  recipientTier?: 'T1' | 'T2' | 'T3' | 'T4'; // Generosity

  // Telemetry & Ingestion Metadata
  transactionRef?: string;     // Unique bank reference to prevent duplicate CSV uploads
  highVelocityFlag?: boolean;  // True if this is part of a micro-bleed cluster
  categoryGroup?: string;      // Normalized merchant category (e.g., 'Telecom', 'Betting')

  // Snapshot Data (Treasury)
  metadata?: {
    phase?: SignalPhase;
    hoursLogged?: number;
    efficiency?: number;
    sector?: string;
    [key: string]: any;
  };
}

// The Studio Palette: Professional, high-contrast, dark-mode friendly
const SECTOR_PALETTE = [
  // 1. Emerald (Growth/Money)
  { border: 'border-emerald-500', shadow: 'shadow-emerald-500/10', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  // 2. Blue (Tech/Stability)
  { border: 'border-blue-500', shadow: 'shadow-blue-500/10', text: 'text-blue-400', bg: 'bg-blue-500/10' },
  // 3. Violet (Deep Work/L2)
  { border: 'border-violet-500', shadow: 'shadow-violet-500/10', text: 'text-violet-400', bg: 'bg-violet-500/10' },
  // 4. Rose (Passion/Speculation)
  { border: 'border-rose-500', shadow: 'shadow-rose-500/10', text: 'text-rose-400', bg: 'bg-rose-500/10' },
  // 5. Amber (Infrastructure/Building)
  { border: 'border-amber-500', shadow: 'shadow-amber-500/10', text: 'text-amber-400', bg: 'bg-amber-500/10' },
  // 6. Cyan (Future/AI)
  { border: 'border-cyan-500', shadow: 'shadow-cyan-500/10', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  // 7. Indigo (Corporate/Formal)
  { border: 'border-indigo-500', shadow: 'shadow-indigo-500/10', text: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  // 8. Lime (Experimental)
  { border: 'border-lime-500', shadow: 'shadow-lime-500/10', text: 'text-lime-400', bg: 'bg-lime-500/10' },
];

export const getSectorStyle = (sectorName: string) => {
  if (!sectorName) return SECTOR_PALETTE[1]; // Default to Blue

  let hash = 0;
  for (let i = 0; i < sectorName.length; i++) {
    hash = sectorName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % SECTOR_PALETTE.length;
  return SECTOR_PALETTE[index];
};

export const generateAssetID = (title: string, dateStr: string) => {
  // Generates something like "SUP-07"
  const prefix = title.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const suffix = new Date(dateStr).getDate().toString().padStart(2, '0');
  return `${prefix}-${suffix}`;
};
