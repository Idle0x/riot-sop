import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  type UserProfile, type Account, type Budget, type Goal, type Signal, type HistoryLog,
  type AccountType
} from '../types';
import { calculateDailyBurn } from '../utils/finance';

// --- TYPES ---
interface FinancialContextType {
  user: UserProfile;
  accounts: Account[];
  budgets: Budget[];
  goals: Goal[];
  signals: Signal[];
  history: HistoryLog[];
  
  // Computed
  runwayMonths: number;
  dailyBurn: number;
  totalLiquid: number;
  unallocatedCash: number;
  isGhostMode: boolean;

  // Actions
  updateUser: (data: Partial<UserProfile>) => void;
  updateAccount: (id: AccountType, amount: number) => void; // Adds/Subtracts
  addBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;
  logExpense: (budgetId: string | null, amount: number, note?: string) => void;
  resetBudgetCycle: () => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void; // <--- FIXED: Added
  updateSignal: (signal: Signal) => void;
  commitAction: (log: HistoryLog) => void;
  deleteTransaction: (id: string) => void;
  nuclearReset: (password: string) => boolean;
  syncLocalData: () => void; // <--- FIXED: Added
}

const FinancialContext = createContext<FinancialContextType | null>(null);

// --- DEFAULTS ---
const defaultUser: UserProfile = {
  burnCap: 500000,
  annualRent: 0, // <--- FIXED: Added to match UserProfile type
  inflationRate: 18.5,
  lastSeen: new Date().toISOString(),
  lastReconciliationDate: new Date().toISOString(),
  runwayEmptySince: null,
  systemVersion: '1.6.0',
  pendingChanges: []
};

const defaultAccounts: Account[] = [
  { id: 'treasury', name: 'Main Ops', balance: 0, currency: 'NGN' },
  { id: 'payroll', name: 'Runway', balance: 0, currency: 'NGN' },
  { id: 'buffer', name: 'Safety Net', balance: 0, currency: 'NGN', isLocked: true },
  { id: 'holding', name: 'Inflow Pen', balance: 0, currency: 'NGN' },
  { id: 'vault', name: 'Wealth Vault', balance: 0, currency: 'NGN', isLocked: true },
];

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  // --- STATE ---
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('riot_user');
    return saved ? JSON.parse(saved) : defaultUser;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('riot_accounts');
    return saved ? JSON.parse(saved) : defaultAccounts;
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('riot_budgets');
    return saved ? JSON.parse(saved) : [];
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('riot_goals');
    return saved ? JSON.parse(saved) : [];
  });

  const [signals, setSignals] = useState<Signal[]>(() => {
    const saved = localStorage.getItem('riot_signals');
    return saved ? JSON.parse(saved) : [];
  });

  const [history, setHistory] = useState<HistoryLog[]>(() => {
    const saved = localStorage.getItem('riot_history');
    return saved ? JSON.parse(saved) : [];
  });

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem('riot_user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('riot_accounts', JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { localStorage.setItem('riot_budgets', JSON.stringify(budgets)); }, [budgets]);
  useEffect(() => { localStorage.setItem('riot_goals', JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem('riot_signals', JSON.stringify(signals)); }, [signals]);
  useEffect(() => { localStorage.setItem('riot_history', JSON.stringify(history)); }, [history]);

  // --- ACTIONS ---
  const updateUser = (data: Partial<UserProfile>) => setUser(prev => ({ ...prev, ...data }));

  const updateAccount = (id: AccountType, amount: number) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, balance: a.balance + amount } : a));
  };

  const addBudget = (b: Budget) => setBudgets(prev => [...prev, b]);
  const deleteBudget = (id: string) => setBudgets(prev => prev.filter(b => b.id !== id));
  
  const resetBudgetCycle = () => {
    setBudgets(prev => prev.map(b => ({ ...b, spent: 0 })));
    commitAction({
      id: crypto.randomUUID(), date: new Date().toISOString(), type: 'SYSTEM_EVENT',
      title: 'Cycle Reset', description: 'Monthly budget counters reset.'
    });
  };

  const logExpense = (budgetId: string | null, amount: number, note?: string) => {
    if (budgetId) {
      setBudgets(prev => prev.map(b => b.id === budgetId ? { ...b, spent: (b.spent || 0) + amount } : b));
    }
    // Pull from Payroll (OpEx)
    updateAccount('payroll', -amount);
    commitAction({
      id: crypto.randomUUID(), date: new Date().toISOString(), type: 'SPEND',
      title: budgetId ? budgets.find(b => b.id === budgetId)?.name || 'Expense' : 'Uncategorized',
      amount, description: note
    });
  };

  const updateGoal = (g: Goal) => {
    setGoals(prev => {
      const exists = prev.find(item => item.id === g.id);
      if (exists) return prev.map(item => item.id === g.id ? g : item);
      return [...prev, g];
    });
  };

  // <--- FIXED: Missing function added
  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const updateSignal = (s: Signal) => {
    setSignals(prev => {
      const exists = prev.find(item => item.id === s.id);
      if (exists) return prev.map(item => item.id === s.id ? s : item);
      return [...prev, s];
    });
  };

  const commitAction = (log: HistoryLog) => setHistory(prev => [log, ...prev]);

  const deleteTransaction = (id: string) => {
    const log = history.find(h => h.id === id);
    if (!log) return;
    
    // Simple Reversal Logic (Naive)
    if (log.type === 'SPEND' && log.amount) updateAccount('payroll', log.amount);
    
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const nuclearReset = (password: string) => {
    if (password === 'PROTOCOL_ZERO') {
      localStorage.clear();
      return true;
    }
    return false;
  };

  // <--- FIXED: Missing function added
  const syncLocalData = () => {
    const backup = { user, accounts, budgets, goals, signals, history, timestamp: new Date() };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riot_sync_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- COMPUTED ---
  const dailyBurn = calculateDailyBurn(budgets);
  const totalLiquid = (accounts.find(a => a.id === 'payroll')?.balance || 0) + (accounts.find(a => a.id === 'treasury')?.balance || 0);
  const unallocatedCash = accounts.find(a => a.id === 'holding')?.balance || 0;
  
  // Runway = Liquid Cash / Monthly Burn
  const monthlyBurn = dailyBurn * 30;
  const runwayMonths = monthlyBurn > 0 ? totalLiquid / monthlyBurn : 0;
  const isGhostMode = false; // Placeholder for future feature

  return (
    <FinancialContext.Provider value={{
      user, accounts, budgets, goals, signals, history,
      runwayMonths, dailyBurn, totalLiquid, unallocatedCash, isGhostMode,
      updateUser, updateAccount, addBudget, deleteBudget, logExpense, 
      resetBudgetCycle, updateGoal, deleteGoal, updateSignal, commitAction, // Added deleteGoal
      deleteTransaction, nuclearReset, syncLocalData // Added syncLocalData
    }}>
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancials = () => {
  const context = useContext(FinancialContext);
  if (!context) throw new Error('useFinancials must be used within FinancialProvider');
  return context;
};
