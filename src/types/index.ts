export type Currency = 'USD' | 'NGN';

export interface UserProfile {
  burnCap: number;
  inflationRate: number;
  lastSeen: string;
  runwayEmptySince: string | null;
  systemVersion: string;
}

export type AccountType = 'treasury' | 'payroll' | 'buffer' | 'holding';

export interface Account {
  id: AccountType;
  name: string;
  balance: number;
  currency: Currency;
  isLocked?: boolean;
}

export type BudgetFrequency = 'monthly' | 'one-time';

export interface Budget {
  id: string;
  name: string;
  amount: number;
  frequency: BudgetFrequency;
  expiryDate?: string;
  category: string;
  autoDeduct?: boolean;
}

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

export type SignalPhase = 'discovery' | 'validation' | 'contribution' | 'delivered' | 'harvested' | 'graveyard';

export interface Signal {
  id: string;
  title: string;
  sector: string;
  phase: SignalPhase;
  confidence: number;
  effort: 'low' | 'med' | 'high';
  hoursLogged: number;
  totalGenerated: number;
  redFlags: string[];
  proofOfWork: string[];
  createdAt: string;
  updatedAt: string;
}

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
