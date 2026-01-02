import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type Account, type Goal, type Transaction, type Project } from '../types';

interface FinancialContextType {
  // Financial Data
  accounts: Account[];
  goals: Goal[];
  transactions: Transaction[];
  monthlyBurn: number; // Living Cost
  
  // Research/Signal Data
  projects: Project[];

  // Actions
  updateAccountBalance: (id: string, newBalance: number) => void;
  updateGoalAmount: (id: string, amountToAdd: number) => void;
  addTransaction: (tx: Transaction) => void;
  addProject: (project: Project) => void;
  updateProjectStatus: (id: string, status: Project['status']) => void;
  updateMonthlyBurn: (amount: number, reason: string) => void;
  resetBalances: () => void; // Nuclear Reset
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

// --- INITIAL FALLBACK DATA ---
const INITIAL_ACCOUNTS: Account[] = [
  { id: 'treasury', name: 'Treasury (RedotPay)', balance: 0, currency: 'USD' },
  { id: 'payroll', name: 'Payroll (Opay)', balance: 0, currency: 'NGN' },
  { id: 'buffer', name: 'Buffer Vault (Piggyvest)', balance: 0, currency: 'NGN', isLocked: true },
  { id: 'holding', name: 'Holding Pen (Binance)', balance: 0, currency: 'USD' },
];

const INITIAL_GOALS: Goal[] = [
  { id: '1', title: 'Laptop Upgrade', phase: 'P1', targetAmount: 2500, currentAmount: 0, currency: 'USD', isCompleted: false, priority: 1 },
  { id: '2', title: 'Apartment Fund', phase: 'P1', targetAmount: 2000000, currentAmount: 0, currency: 'NGN', isCompleted: false, priority: 2 },
];

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  
  // --- STATE INITIALIZATION (Load from Storage) ---
  
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('riot_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('riot_goals');
    return saved ? JSON.parse(saved) : INITIAL_GOALS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('riot_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('riot_projects');
    return saved ? JSON.parse(saved) : [];
  });

  const [monthlyBurn, setMonthlyBurn] = useState<number>(() => {
    const saved = localStorage.getItem('riot_burn');
    return saved ? JSON.parse(saved) : 1500;
  });

  // --- PERSISTENCE EFFECTS (Save on Change) ---

  useEffect(() => {
    localStorage.setItem('riot_accounts', JSON.stringify(accounts));
    localStorage.setItem('riot_goals', JSON.stringify(goals));
    localStorage.setItem('riot_transactions', JSON.stringify(transactions));
    localStorage.setItem('riot_projects', JSON.stringify(projects));
    localStorage.setItem('riot_burn', JSON.stringify(monthlyBurn));
  }, [accounts, goals, transactions, projects, monthlyBurn]);

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

  const updateMonthlyBurn = (amount: number, reason: string) => {
    setMonthlyBurn(amount);
    // Log the configuration change as a system event
    addTransaction({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      amount: amount,
      currency: 'USD',
      type: 'expense',
      category: 'System',
      description: `Living Cost Update: ${reason}`
    });
  };

  // THE NUCLEAR OPTION: Zeros out balances but keeps history
  const resetBalances = () => {
    setAccounts(prev => prev.map(acc => ({ ...acc, balance: 0 })));
  };

  return (
    <FinancialContext.Provider value={{ 
      accounts, 
      goals, 
      transactions, 
      projects,
      monthlyBurn,
      updateAccountBalance, 
      updateGoalAmount, 
      addTransaction, 
      addProject, 
      updateProjectStatus,
      updateMonthlyBurn,
      resetBalances
    }}>
      {children}
    </FinancialContext.Provider>
  );
};

// --- HOOK EXPORT ---

export const useFinancials = () => {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancials must be used within a FinancialProvider');
  }
  return context;
};
