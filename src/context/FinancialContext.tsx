import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type Account, type Goal, type Transaction, type Project, type BudgetCategory } from '../types';

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
  budgetCategories: BudgetCategory[];
  addBudgetCategory: (category: BudgetCategory) => void;
  logExpense: (amount: number, categoryId: string, description: string) => void;
  resetMonthlyBudget: () => void; // For the 1st of the month
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

const INITIAL_BUDGET: BudgetCategory[] = [
  { id: '1', name: 'Food & Groceries', limit: 150000, spent: 0, color: 'warning' },
  { id: '2', name: 'Data & Internet', limit: 60000, spent: 0, color: 'info' },
  { id: '3', name: 'Transport / Fuel', limit: 50000, spent: 0, color: 'danger' },
];

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  // ... existing state ...

  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>(() => {
    const saved = localStorage.getItem('riot_budget');
    return saved ? JSON.parse(saved) : INITIAL_BUDGET;
  });

  // Save on change
  useEffect(() => {
    localStorage.setItem('riot_budget', JSON.stringify(budgetCategories));
  }, [budgetCategories]);

  // --- ACTIONS ---

  const addBudgetCategory = (category: BudgetCategory) => {
    setBudgetCategories(prev => [...prev, category]);
  };

  const logExpense = (amount: number, categoryId: string, description: string) => {
    // 1. Update the Category Spent Amount
    setBudgetCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, spent: cat.spent + amount } : cat
    ));

    // 2. Deduct from Payroll Account (OpEx)
    setAccounts(prev => prev.map(acc => 
      acc.id === 'payroll' ? { ...acc, balance: acc.balance - amount } : acc
    ));

    // 3. Log the Transaction
    addTransaction({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      amount: amount,
      currency: 'NGN',
      type: 'expense',
      category: categoryId, // We store ID here, UI can look up name
      description: description
    });
  };

  const resetMonthlyBudget = () => {
    setBudgetCategories(prev => prev.map(cat => ({ ...cat, spent: 0 })));
  };

  return (
    <FinancialContext.Provider value={{ 
      accounts, goals, transactions, projects, monthlyBurn,
      updateAccountBalance, updateGoalAmount, addTransaction, addProject, updateProjectStatus, updateMonthlyBurn, resetBalances,
      // NEW EXPORTS
      budgetCategories, addBudgetCategory, logExpense, resetMonthlyBudget
    }}>
      {children}
    </FinancialContext.Provider>
  );
};
