import { createContext, useContext, useState, ReactNode } from 'react';
import { Account, Goal, Transaction } from '../types';

// Define what the Context holds
interface FinancialContextType {
  accounts: Account[];
  goals: Goal[];
  transactions: Transaction[];
  updateAccountBalance: (id: string, newBalance: number) => void;
  addTransaction: (tx: Transaction) => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

// Initial Dummy Data (Matches your manual)
const INITIAL_ACCOUNTS: Account[] = [
  { id: 'treasury', name: 'Treasury (RedotPay)', balance: 12450, currency: 'USD' },
  { id: 'payroll', name: 'Payroll (Opay)', balance: 450000, currency: 'NGN' },
  { id: 'buffer', name: 'Buffer Vault (Piggyvest)', balance: 2000000, currency: 'NGN', isLocked: true },
  { id: 'holding', name: 'Holding Pen (Binance)', balance: 0, currency: 'USD' },
];

const INITIAL_GOALS: Goal[] = [
  { id: '1', title: 'Laptop Upgrade', phase: 'P1', targetAmount: 2500, currentAmount: 1200, currency: 'USD', isCompleted: false, priority: 1 },
  { id: '2', title: 'Apartment Fund', phase: 'P1', targetAmount: 2000000, currentAmount: 500000, currency: 'NGN', isCompleted: false, priority: 2 },
];

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Function to manually update a balance (Phase 2 feature)
  const updateAccountBalance = (id: string, newBalance: number) => {
    setAccounts(prev => prev.map(acc => 
      acc.id === id ? { ...acc, balance: newBalance } : acc
    ));
  };

  const addTransaction = (tx: Transaction) => {
    setTransactions(prev => [tx, ...prev]);
  };

  return (
    <FinancialContext.Provider value={{ 
      accounts, 
      goals, 
      transactions,
      updateAccountBalance,
      addTransaction
    }}>
      {children}
    </FinancialContext.Provider>
  );
};

// Custom Hook to use the data easily
export const useFinancials = () => {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancials must be used within a FinancialProvider');
  }
  return context;
};
