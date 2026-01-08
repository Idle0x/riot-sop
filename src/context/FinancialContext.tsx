import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  UserProfile, Account, Goal, Signal, Budget, HistoryLog, JournalEntry 
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
  
  // Metrics
  totalLiquid: number;
  runwayMonths: number;
  dailyBurn: number;
  isGhostMode: boolean;
  unallocatedCash: number;

  // Actions
  updateUser: (updates: Partial<UserProfile>) => void;
  updateAccount: (id: string, delta: number) => void;
  addBudget: (budget: Budget) => void;
  updateSignal: (signal: Signal) => void;
  commitAction: (log: HistoryLog) => void;
  deleteTransaction: (id: string) => void; // For 1-hour undo
  nuclearReset: () => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  // --- LOAD STATE ---
  const [user, setUser] = useState<UserProfile>(() => JSON.parse(localStorage.getItem('riot_user') || '{"burnCap": 200000, "inflationRate": 1.0, "lastSeen": "", "systemVersion": "1.6"}'));
  const [accounts, setAccounts] = useState<Account[]>(() => JSON.parse(localStorage.getItem('riot_accounts') || JSON.stringify([
    { id: 'treasury', name: 'Treasury', balance: 0, currency: 'USD' },
    { id: 'payroll', name: 'Payroll', balance: 0, currency: 'NGN' },
    { id: 'buffer', name: 'Buffer', balance: 0, currency: 'NGN', isLocked: true },
    { id: 'holding', name: 'Holding Pen', balance: 0, currency: 'USD' } // Unallocated
  ])));
  const [goals, setGoals] = useState<Goal[]>(() => JSON.parse(localStorage.getItem('riot_goals') || '[]'));
  const [signals, setSignals] = useState<Signal[]>(() => JSON.parse(localStorage.getItem('riot_signals') || '[]'));
  const [budgets, setBudgets] = useState<Budget[]>(() => JSON.parse(localStorage.getItem('riot_budgets') || '[]'));
  const [history, setHistory] = useState<HistoryLog[]>(() => JSON.parse(localStorage.getItem('riot_history') || '[]'));
  const [journal, setJournal] = useState<JournalEntry[]>(() => JSON.parse(localStorage.getItem('riot_journal') || '[]'));

  // --- CALCULATED METRICS ---
  const payroll = accounts.find(a => a.id === 'payroll')?.balance || 0;
  const holding = accounts.find(a => a.id === 'holding')?.balance || 0;
  const dailyBurn = calculateDailyBurn(budgets);
  const monthlyBurn = dailyBurn * 30;
  const runwayMonths = monthlyBurn > 0 ? Math.max(0, payroll / monthlyBurn) : 0;
  
  const now = new Date();
  const lastSeenDate = user.lastSeen ? new Date(user.lastSeen) : now;
  const isGhostMode = (now.getTime() - lastSeenDate.getTime()) > (60 * 24 * 60 * 60 * 1000); // 60 days

  // --- THE ALIVE ENGINE (Runway Decay) ---
  useEffect(() => {
    if (!user.lastSeen) {
      setUser(prev => ({ ...prev, lastSeen: now.toISOString() }));
      return;
    }

    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // If away > 1 day, run Auto-Burn
    if (diffDays >= 1 && dailyBurn > 0) {
      const burnAmount = Math.floor(dailyBurn * diffDays);
      
      if (burnAmount > 0 && payroll > 0) {
        // Auto-Deduct
        setAccounts(prev => prev.map(a => 
          a.id === 'payroll' ? { ...a, balance: Math.max(0, a.balance - burnAmount) } : a
        ));
        
        // Log System Event
        const newLog: HistoryLog = {
          id: crypto.randomUUID(),
          date: now.toISOString(),
          type: 'SYSTEM_EVENT',
          title: 'Auto-Burn Applied',
          amount: burnAmount,
          description: `User away for ${diffDays.toFixed(1)} days. Runway decay applied.`,
          currency: 'NGN'
        };
        setHistory(prev => [newLog, ...prev]);
      }
    }

    // Update Presence
    const interval = setInterval(() => {
      setUser(prev => ({ ...prev, lastSeen: new Date().toISOString() }));
    }, 60000);

    return () => clearInterval(interval);
  }, [dailyBurn]); // Re-run if burn rate changes

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('riot_user', JSON.stringify(user));
    localStorage.setItem('riot_accounts', JSON.stringify(accounts));
    localStorage.setItem('riot_goals', JSON.stringify(goals));
    localStorage.setItem('riot_signals', JSON.stringify(signals));
    localStorage.setItem('riot_budgets', JSON.stringify(budgets));
    localStorage.setItem('riot_history', JSON.stringify(history));
    localStorage.setItem('riot_journal', JSON.stringify(journal));
  }, [user, accounts, goals, signals, budgets, history, journal]);

  // --- ACTIONS ---
  const commitAction = (log: HistoryLog) => setHistory(prev => [log, ...prev]);
  
  const updateUser = (updates: Partial<UserProfile>) => {
    setUser(prev => ({...prev, ...updates}));
    commitAction({
      id: crypto.randomUUID(), date: new Date().toISOString(), type: 'SYSTEM_EVENT',
      title: 'Settings Updated', description: JSON.stringify(updates)
    });
  };

  const updateAccount = (id: string, delta: number) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, balance: a.balance + delta } : a));
  };

  const addBudget = (budget: Budget) => {
    setBudgets(prev => [...prev, budget]);
    commitAction({
      id: crypto.randomUUID(), date: new Date().toISOString(), type: 'SYSTEM_EVENT',
      title: `Budget Added: ${budget.name}`, amount: budget.amount, currency: 'NGN'
    });
  };

  const updateSignal = (signal: Signal) => {
    setSignals(prev => {
      const exists = prev.find(s => s.id === signal.id);
      return exists ? prev.map(s => s.id === signal.id ? signal : s) : [...prev, signal];
    });
  };

  const deleteTransaction = (id: string) => {
    const tx = history.find(h => h.id === id);
    if (!tx) return;
    // Reverse Logic (Simplified for brevity)
    if (tx.type === 'SPEND' && tx.amount) updateAccount('payroll', tx.amount);
    // Remove log
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const nuclearReset = () => {
    setAccounts(prev => prev.map(a => ({ ...a, balance: 0 })));
    setGoals(prev => prev.map(g => ({ ...g, currentAmount: 0, isCompleted: false })));
    commitAction({
      id: crypto.randomUUID(), date: new Date().toISOString(), type: 'SYSTEM_EVENT',
      title: 'NUCLEAR RESET EXECUTED', description: 'All balances wiped.'
    });
  };

  return (
    <FinancialContext.Provider value={{
      user, accounts, goals, signals, budgets, history, journal,
      totalLiquid: payroll, runwayMonths, dailyBurn, isGhostMode, unallocatedCash: holding,
      updateUser, updateAccount, addBudget, updateSignal, commitAction, deleteTransaction, nuclearReset
    }}>
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancials = () => {
  const context = useContext(FinancialContext);
  if (!context) throw new Error("useFinancials must be used within FinancialProvider");
  return context;
};
