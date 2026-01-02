import { createContext, useContext, useState, type ReactNode } from 'react';
import { type Account, type Goal, type Transaction, type Project } from '../types';

// Define what the Global Memory holds
interface FinancialContextType {
  // Financial Data
  accounts: Account[];
  goals: Goal[];
  transactions: Transaction[];
  updateAccountBalance: (id: string, newBalance: number) => void;
  updateGoalAmount: (id: string, amountToAdd: number) => void;
  addTransaction: (tx: Transaction) => void;

  // Signal/Project Data (NEW)
  projects: Project[];
  addProject: (project: Project) => void;
  updateProjectStatus: (id: string, status: Project['status']) => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

// --- INITIAL DUMMY DATA ---

const INITIAL_ACCOUNTS: Account[] = [
  { id: 'treasury', name: 'Treasury (RedotPay)', balance: 12450, currency: 'USD' },
  { id: 'payroll', name: 'Payroll (Opay)', balance: 450000, currency: 'NGN' },
  { id: 'buffer', name: 'Buffer Vault (Piggyvest)', balance: 2000000, currency: 'NGN', isLocked: true },
  { id: 'holding', name: 'Holding Pen (Binance)', balance: 0, currency: 'USD' },
];

const INITIAL_GOALS: Goal[] = [
  { id: '1', title: 'Laptop Upgrade', phase: 'P1', targetAmount: 2500, currentAmount: 1200, currency: 'USD', isCompleted: false, priority: 1 },
  { id: '2', title: 'Apartment Fund', phase: 'P1', targetAmount: 2000000, currentAmount: 500000, currency: 'NGN', isCompleted: false, priority: 2 },
  { id: '3', title: 'Debt Clearance', phase: 'P1', targetAmount: 500000, currentAmount: 500000, currency: 'NGN', isCompleted: true, priority: 0 },
];

const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Zama Network',
    type: 'creator',
    status: 'contribution',
    description: 'FHE Layer 1. Running node + writing guide.',
    redFlags: [],
    greenFlags: ['Paradigm Backed', 'Active Devs'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeInvested: 12
  },
  {
    id: '2',
    name: 'Hyperliquid',
    type: 'hunter',
    status: 'validation',
    description: 'Tracking perp volume and vault flows.',
    redFlags: [],
    greenFlags: ['High TVL', 'Real Revenue'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeInvested: 4
  }
];

// --- PROVIDER COMPONENT ---

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  // State Containers
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);

  // --- ACTIONS ---

  const updateAccountBalance = (id: string, newBalance: number) => {
    setAccounts(prev => prev.map(acc => 
      acc.id === id ? { ...acc, balance: newBalance } : acc
    ));
  };

  const updateGoalAmount = (id: string, amountToAdd: number) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id === id) {
        const newAmount = goal.currentAmount + amountToAdd;
        return { 
          ...goal, 
          currentAmount: Math.min(newAmount, goal.targetAmount),
          isCompleted: newAmount >= goal.targetAmount
        };
      }
      return goal;
    }));
  };

  const addTransaction = (tx: Transaction) => {
    setTransactions(prev => [tx, ...prev]);
  };

  const addProject = (project: Project) => {
    setProjects(prev => [project, ...prev]);
  };

  const updateProjectStatus = (id: string, status: Project['status']) => {
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
    ));
  };

  return (
    <FinancialContext.Provider value={{ 
      accounts, 
      goals, 
      transactions,
      projects,
      updateAccountBalance,
      updateGoalAmount,
      addTransaction,
      addProject,
      updateProjectStatus
    }}>
      {children}
    </FinancialContext.Provider>
  );
};

// --- HOOK ---

export const useFinancials = () => {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancials must be used within a FinancialProvider');
  }
  return context;
};
