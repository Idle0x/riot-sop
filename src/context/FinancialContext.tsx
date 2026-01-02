import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type Account, type Goal, type Transaction, type Project } from '../types';

interface FinancialContextType {
  accounts: Account[];
  goals: Goal[];
  transactions: Transaction[];
  projects: Project[];
  updateAccountBalance: (id: string, newBalance: number) => void;
  updateGoalAmount: (id: string, amountToAdd: number) => void;
  addTransaction: (tx: Transaction) => void;
  addProject: (project: Project) => void;
  updateProjectStatus: (id: string, status: Project['status']) => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

// --- INITIAL DUMMY DATA (Fallback if storage is empty) ---
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
  // --- LOAD FROM STORAGE OR USE DEFAULT ---
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

  // --- SAVE TO STORAGE EFFECT ---
  useEffect(() => {
    localStorage.setItem('riot_accounts', JSON.stringify(accounts));
    localStorage.setItem('riot_goals', JSON.stringify(goals));
    localStorage.setItem('riot_transactions', JSON.stringify(transactions));
    localStorage.setItem('riot_projects', JSON.stringify(projects));
  }, [accounts, goals, transactions, projects]);

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
      accounts, goals, transactions, projects,
      updateAccountBalance, updateGoalAmount, addTransaction, addProject, updateProjectStatus
    }}>
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancials = () => {
  const context = useContext(FinancialContext);
  if (context === undefined) throw new Error('useFinancials must be used within a FinancialProvider');
  return context;
};
