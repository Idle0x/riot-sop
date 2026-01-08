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

  totalLiquid: number;
  runwayMonths: number;
  unallocatedCash: number;
  dailyBurn: number;
  isGhostMode: boolean;

  updateUser: (updates: Partial<UserProfile>) => void;
  updateAccount: (id: AccountType, amount: number) => void;
  addBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;
  logExpense: (budgetId: string | null, amount: number, note: string) => void;
  resetBudgetCycle: () => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  updateSignal: (signal: Signal) => void;
  logSignalTime: (id: string, hours: number) => void; // NEW: Quick Time Logging
  commitAction: (log: HistoryLog) => void;
  deleteTransaction: (id: string) => void;
  nuclearReset: (password: string) => boolean;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

const INITIAL_USER: UserProfile = {
  burnCap: 200000,
  inflationRate: 1.0,
  lastSeen: new Date().toISOString(),
  lastReconciliationDate: new Date().toISOString(),
  runwayEmptySince: null,
  systemVersion: 'v2.3 (Alive)',
  pendingChanges: []
};

const INITIAL_ACCOUNTS: Account[] = [
  { id: 'treasury', name: 'Treasury (Redot)', balance: 0, currency: 'USD' },
  { id: 'payroll', name: 'Payroll (Opay)', balance: 0, currency: 'NGN' },
  { id: 'buffer', name: 'Buffer (Piggy)', balance: 0, currency: 'NGN', isLocked: true },
  { id: 'vault', name: 'The Vault (Locked)', balance: 0, currency: 'NGN', isLocked: true },
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

  useEffect(() => {
    const savedData = localStorage.getItem('riot_financial_os');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.user) setUser(parsed.user);
        
        if (parsed.accounts) {
           const hasVault = parsed.accounts.find((a: Account) => a.id === 'vault');
           if (!hasVault) {
             setAccounts([...parsed.accounts, { id: 'vault', name: 'The Vault (Locked)', balance: 0, currency: 'NGN', isLocked: true }]);
           } else {
             setAccounts(parsed.accounts);
           }
        } else {
          setAccounts(INITIAL_ACCOUNTS);
        }

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

  useEffect(() => {
    if (!isInitialized) return;

    const now = new Date();
    if (user.pendingChanges.length > 0) {
      const activeChanges = user.pendingChanges.filter(c => new Date(c.effectiveDate) <= now);
      if (activeChanges.length > 0) {
         activeChanges.forEach(change => {
            setUser(prev => ({ ...prev, [change.key]: change.value }));
         });
         setUser(prev => ({
           ...prev, 
           pendingChanges: prev.pendingChanges.filter(c => new Date(c.effectiveDate) > now)
         }));
      }
    }

    const currentState = { user, accounts, goals, signals, budgets, history, journal };
    localStorage.setItem('riot_financial_os', JSON.stringify(currentState));
  }, [user, accounts, goals, signals, budgets, history, journal, isInitialized]);

  const exchangeRate = 1500; 
  const totalLiquid = 
    (accounts.find(a => a.id === 'treasury')?.balance || 0) * exchangeRate +
    (accounts.find(a => a.id === 'payroll')?.balance || 0);
  const unallocatedCash = accounts.find(a => a.id === 'holding')?.balance || 0;
  const dailyBurn = calculateDailyBurn(budgets);
  const monthlyBurn = dailyBurn * 30;
  const runwayMonths = monthlyBurn > 0 ? totalLiquid / monthlyBurn : 0;

  const isGhostMode = (new Date().getTime() - new Date(user.lastSeen).getTime()) > (7 * 24 * 60 * 60 * 1000);

  const updateUser = (updates: Partial<UserProfile>) => setUser(prev => ({ ...prev, ...updates }));

  const updateAccount = (id: AccountType, amount: number) => {
    setAccounts(prev => prev.map(acc => 
      acc.id === id ? { ...acc, balance: acc.balance + amount } : acc
    ));
  };

  const addBudget = (budget: Budget) => setBudgets(prev => [...prev, budget]);

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  const logExpense = (budgetId: string | null, amount: number, note: string) => {
    updateAccount('payroll', -amount);
    if (budgetId) {
      setBudgets(prev => prev.map(b => 
        b.id === budgetId ? { ...b, spent: (b.spent || 0) + amount } : b
      ));
    }
    commitAction({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: 'SPEND',
      title: budgetId ? `Spend: ${budgets.find(b => b.id === budgetId)?.name}` : 'Uncategorized Spend',
      amount: amount,
      description: note,
      currency: 'NGN'
    });
  };

  const resetBudgetCycle = () => {
    setBudgets(prev => prev.map(b => ({ ...b, spent: 0 })));
    commitAction({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: 'SYSTEM_EVENT',
      title: 'Budget Cycle Reset',
      description: 'Monthly spend counters reset to zero.'
    });
  };

  const updateGoal = (goal: Goal) => {
    setGoals(prev => {
      const exists = prev.find(g => g.id === goal.id);
      if (exists) return prev.map(g => g.id === goal.id ? goal : g);
      return [...prev, goal];
    });
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const updateSignal = (signal: Signal) => {
    setSignals(prev => {
      const exists = prev.find(s => s.id === signal.id);
      if (exists) return prev.map(s => s.id === signal.id ? signal : s);
      return [...prev, signal];
    });
  };

  // NEW: Quick Time Logging
  const logSignalTime = (id: string, hours: number) => {
    setSignals(prev => prev.map(s => 
      s.id === id ? { ...s, hoursLogged: s.hoursLogged + hours } : s
    ));
  };

  const commitAction = (log: HistoryLog) => {
    setHistory(prev => [log, ...prev]);
    updateUser({ lastSeen: new Date().toISOString() });
  };

  const deleteTransaction = (id: string) => {
    const log = history.find(h => h.id === id);
    if (log && log.type === 'SPEND' && log.amount) {
        updateAccount('payroll', log.amount); 
    }
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const nuclearReset = (password: string) => {
    const storedKey = localStorage.getItem('riot_access_key');
    if (password !== storedKey) return false;

    setAccounts(prev => prev.map(a => ({ ...a, balance: 0 })));
    setHistory([]);
    setGoals([]);
    setSignals([]);
    setBudgets([]);
    setJournal([]);
    return true;
  };

  return (
    <FinancialContext.Provider value={{
      user, accounts, goals, signals, budgets, history, journal,
      totalLiquid, runwayMonths, unallocatedCash, dailyBurn, isGhostMode,
      updateUser, updateAccount, addBudget, deleteBudget, logExpense, resetBudgetCycle,
      updateGoal, deleteGoal, updateSignal, logSignalTime, commitAction, deleteTransaction, nuclearReset
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
