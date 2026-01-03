import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  type Account, 
  type Goal, 
  type Transaction, 
  type Project, 
  type BudgetCategory, 
  type JournalEntry, 
  type JournalTag 
} from '../types';

interface FinancialContextType {
  accounts: Account[];
  goals: Goal[];
  transactions: Transaction[];
  projects: Project[];
  monthlyBurn: number;
  budgetCategories: BudgetCategory[];
  journalEntries: JournalEntry[]; // NEW
  
  updateAccountBalance: (id: string, newBalance: number) => void;
  updateGoalAmount: (id: string, amountToAdd: number) => void;
  addTransaction: (tx: Transaction) => void;
  addProject: (project: Project) => void;
  updateProjectStatus: (id: string, status: Project['status']) => void;
  updateMonthlyBurn: (amount: number, reason: string) => void;
  resetBalances: () => void;
  
  addBudgetCategory: (category: BudgetCategory) => void;
  logExpense: (amount: number, categoryId: string, description: string) => void;
  resetMonthlyBudget: () => void;
  deleteTransaction: (id: string) => void;

  // NEW ACTIONS
  addJournalEntry: (content: string, tags: JournalTag[]) => void;
  deleteJournalEntry: (id: string) => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

// --- INITIAL DUMMY DATA ---
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

const INITIAL_BUDGET: BudgetCategory[] = [
  { id: '1', name: 'Food & Groceries', limit: 150000, spent: 0, color: 'warning' },
  { id: '2', name: 'Data & Internet', limit: 60000, spent: 0, color: 'info' },
  { id: '3', name: 'Transport / Fuel', limit: 50000, spent: 0, color: 'danger' },
];

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  // --- LOAD FROM STORAGE ---
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

  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>(() => {
    const saved = localStorage.getItem('riot_budget');
    return saved ? JSON.parse(saved) : INITIAL_BUDGET;
  });

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('riot_journal');
    return saved ? JSON.parse(saved) : [];
  });

  // --- SAVE TO STORAGE EFFECT ---
  useEffect(() => {
    localStorage.setItem('riot_accounts', JSON.stringify(accounts));
    localStorage.setItem('riot_goals', JSON.stringify(goals));
    localStorage.setItem('riot_transactions', JSON.stringify(transactions));
    localStorage.setItem('riot_projects', JSON.stringify(projects));
    localStorage.setItem('riot_burn', JSON.stringify(monthlyBurn));
    localStorage.setItem('riot_budget', JSON.stringify(budgetCategories));
    localStorage.setItem('riot_journal', JSON.stringify(journalEntries));
  }, [accounts, goals, transactions, projects, monthlyBurn, budgetCategories, journalEntries]);

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
    addTransaction({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      amount: amount,
      currency: 'USD',
      type: 'expense',
      description: `Living Cost Update: ${reason}`,
      category: 'System'
    });
  };

  const resetBalances = () => {
    setAccounts(prev => prev.map(acc => ({ ...acc, balance: 0 })));
  };

  const addBudgetCategory = (category: BudgetCategory) => {
    setBudgetCategories(prev => [...prev, category]);
  };

  const logExpense = (amount: number, categoryId: string, description: string) => {
    setBudgetCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, spent: cat.spent + amount } : cat
    ));
    setAccounts(prev => prev.map(acc => 
      acc.id === 'payroll' ? { ...acc, balance: acc.balance - amount } : acc
    ));
    addTransaction({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      amount: amount,
      currency: 'NGN',
      type: 'expense',
      category: categoryId,
      description: description
    });
  };

  const resetMonthlyBudget = () => {
    setBudgetCategories(prev => prev.map(cat => ({ ...cat, spent: 0 })));
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    if (tx.type === 'expense') {
      setAccounts(prev => prev.map(acc => 
        acc.id === 'payroll' ? { ...acc, balance: acc.balance + tx.amount } : acc
      ));
      if (tx.category) {
        setBudgetCategories(prev => prev.map(cat => 
          cat.id === tx.category ? { ...cat, spent: Math.max(0, cat.spent - tx.amount) } : cat
        ));
      }
    } 
    else if (tx.type === 'allocation' && tx.relatedGoalId) {
      setGoals(prev => prev.map(g => 
        g.id === tx.relatedGoalId ? { 
          ...g, 
          currentAmount: Math.max(0, g.currentAmount - tx.amount),
          isCompleted: false 
        } : g
      ));
    }
    else if (tx.type === 'drop') {
      setAccounts(prev => prev.map(acc => 
        acc.id === 'treasury' ? { ...acc, balance: Math.max(0, acc.balance - tx.amount) } : acc
      ));
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // --- NEW JOURNAL ACTIONS ---
  const addJournalEntry = (content: string, tags: JournalTag[]) => {
    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      content,
      tags
    };
    setJournalEntries(prev => [newEntry, ...prev]);
  };

  const deleteJournalEntry = (id: string) => {
    setJournalEntries(prev => prev.filter(e => e.id !== id));
  };

  return (
    <FinancialContext.Provider value={{ 
      accounts, goals, transactions, projects, monthlyBurn, budgetCategories, journalEntries,
      updateAccountBalance, updateGoalAmount, addTransaction, addProject, updateProjectStatus, 
      updateMonthlyBurn, resetBalances, addBudgetCategory, logExpense, resetMonthlyBudget,
      deleteTransaction, addJournalEntry, deleteJournalEntry
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
