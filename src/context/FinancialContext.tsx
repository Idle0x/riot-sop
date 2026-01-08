import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  type Account, 
  type Goal, 
  type Signal, 
  type Budget, 
  type HistoryLog, 
  type JournalEntry, 
  type UserProfile,
  type AccountType
} from '../types';
import { calculateDailyBurn } from '../utils/finance';

interface FinancialContextType {
  user: UserProfile;
  accounts: Account[];
  goals: Goal[];
  signals: Signal[];
  budgets: Budget[];
  history: HistoryLog[];
  journal: JournalEntry[];
  
  // Computed
  totalLiquid: number;
  runwayMonths: number;
  unallocatedCash: number;
  dailyBurn: number;
  isGhostMode: boolean;

  // Actions
  updateUser: (updates: Partial<UserProfile>) => void;
  updateAccount: (id: AccountType, amount: number) => void;
  addBudget: (budget: Budget) => void;
  updateSignal: (signal: Signal) => void;
  commitAction: (log: HistoryLog) => void;
  deleteTransaction: (id: string) => void;
  nuclearReset: () => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

// Dummy Initial Data
const INITIAL_USER: UserProfile = {
  burnCap: 200000,
  inflationRate: 1.0,
  lastSeen: new Date().toISOString(),
  runwayEmptySince: null,
  systemVersion: 'v1.6'
};

const INITIAL_ACCOUNTS: Account[] = [
  { id: 'treasury', name: 'Treasury (Redot)', balance: 1500, currency: 'USD' },
  { id: 'payroll', name: 'Payroll (Opay)', balance: 45000, currency: 'NGN' },
  { id: 'buffer', name: 'Buffer (Piggy)', balance: 500000, currency: 'NGN', isLocked: true },
  { id: 'holding', name: 'Holding Pen', balance: 0, currency: 'NGN' }
];

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // --- Persistence Engine (Fixes unused useEffect & setJournal) ---
  
  // 1. Hydrate from LocalStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('riot_financial_os');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.user) setUser(parsed.user);
        if (parsed.accounts) setAccounts(parsed.accounts);
        if (parsed.goals) setGoals(parsed.goals);
        if (parsed.signals) setSignals(parsed.signals);
        if (parsed.budgets) setBudgets(parsed.budgets);
        if (parsed.history) setHistory(parsed.history);
        if (parsed.journal) setJournal(parsed.journal);
      } catch (e) {
        console.error("Failed to load financial data", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // 2. Auto-save when state changes (only after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    
    const currentState = {
      user,
      accounts,
      goals,
      signals,
      budgets,
      history,
      journal
    };
    localStorage.setItem('riot_financial_os', JSON.stringify(currentState));
  }, [user, accounts, goals, signals, budgets, history, journal, isInitialized]);


  // --- Computed Metrics ---
  const exchangeRate = 1500; // Static for MVP, usually fetched
  
  const totalLiquid = 
    (accounts.find(a => a.id === 'treasury')?.balance || 0) * exchangeRate +
    (accounts.find(a => a.id === 'payroll')?.balance || 0);

  const unallocatedCash = accounts.find(a => a.id === 'holding')?.balance || 0;

  const dailyBurn = calculateDailyBurn(budgets);
  const monthlyBurn = dailyBurn * 30;
  
  // Avoid division by zero
  const runwayMonths = monthlyBurn > 0 ? totalLiquid / monthlyBurn : 0;

  const isGhostMode = (new Date().getTime() - new Date(user.lastSeen).getTime()) > (7 * 24 * 60 * 60 * 1000);

  // --- Actions ---
  const updateUser = (updates: Partial<UserProfile>) => setUser(prev => ({ ...prev, ...updates }));

  const updateAccount = (id: AccountType, amount: number) => {
    setAccounts(prev => prev.map(acc => 
      acc.id === id ? { ...acc, balance: acc.balance + amount } : acc
    ));
  };

  const addBudget = (budget: Budget) => setBudgets(prev => [...prev, budget]);
  
  const updateSignal = (signal: Signal) => {
    setSignals(prev => {
      const exists = prev.find(s => s.id === signal.id);
      if (exists) return prev.map(s => s.id === signal.id ? signal : s);
      return [...prev, signal];
    });
  };

  const commitAction = (log: HistoryLog) => {
    setHistory(prev => [log, ...prev]);
    updateUser({ lastSeen: new Date().toISOString() });
  };

  const deleteTransaction = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
    // In a real app, you would reverse the financial effect here
  };

  const nuclearReset = () => {
    setAccounts(prev => prev.map(a => ({ ...a, balance: 0 })));
    setHistory([]);
    setGoals([]);
    setSignals([]);
    setBudgets([]);
    setJournal([]);
    // Keep user settings, wipe data
  };

  return (
    <FinancialContext.Provider value={{
      user, accounts, goals, signals, budgets, history, journal,
      totalLiquid, runwayMonths, unallocatedCash, dailyBurn, isGhostMode,
      updateUser, updateAccount, addBudget, updateSignal, commitAction, 
      deleteTransaction, nuclearReset
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
