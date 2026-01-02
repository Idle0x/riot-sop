export type Currency = 'USD' | 'NGN';

export type AccountType = 'treasury' | 'payroll' | 'buffer' | 'holding';

export interface Account {
  id: AccountType;
  name: string;
  balance: number;
  currency: Currency;
  isLocked?: boolean; // For Buffer
}

export type Phase = 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5';

export interface Goal {
  id: string;
  title: string;
  phase: Phase;
  targetAmount: number;
  currentAmount: number;
  currency: Currency;
  isCompleted: boolean;
  priority: number; // Order in the roadmap
}

export interface Transaction {
  id: string;
  date: string; // ISO String
  amount: number;
  currency: Currency;
  type: 'drop' | 'expense' | 'transfer' | 'allocation';
  category?: string; // e.g., "Food", "Rent"
  description: string;
  relatedGoalId?: string; // If allocated to a goal
  source?: string; // e.g., "Zama Airdrop"
}

// The "Triage Session" - Saving the math logic
export interface TriageCalculation {
  dropId: string;
  totalAmount: number;
  exchangeRate: number; // USD to NGN at that moment
  bufferSplit: number;  // 10%
  taxSplit: number;    // If applicable
  allocations: {
    goalId: string;
    amount: number;
  }[];
}

export type ProjectStatus = 'discovery' | 'validation' | 'contribution' | 'delivered' | 'archived';
export type ProjectType = 'hunter' | 'creator';

export interface Project {
  id: string;
  name: string;
  type: ProjectType; // Hunter (Alpha) or Creator (Building)
  status: ProjectStatus;
  url?: string;
  description: string;
  redFlags: string[];
  greenFlags: string[];
  createdAt: string;
  updatedAt: string;
  timeInvested: number; // in hours
}
