import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { 
  type Account, type Goal, type Signal, type Budget, type HistoryLog, 
  type JournalEntry, type UserProfile, type AccountType 
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
  isLoading: boolean;

  updateUser: (updates: Partial<UserProfile>) => void;
  updateAccount: (id: AccountType, amount: number) => void;
  addBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;
  logExpense: (budgetId: string | null, amount: number, note: string) => void;
  resetBudgetCycle: () => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  updateSignal: (signal: Signal) => void;
  logSignalTime: (id: string, hours: number) => void;
  commitAction: (log: HistoryLog) => void;
  deleteTransaction: (id: string) => void;
  nuclearReset: (password: string) => boolean;
  syncLocalData: () => Promise<void>;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

const INITIAL_USER: UserProfile = {
  burnCap: 200000,
  annualRent: 0, // NEW DEFAULT
  inflationRate: 1.0,
  lastSeen: new Date().toISOString(),
  lastReconciliationDate: new Date().toISOString(),
  runwayEmptySince: null,
  systemVersion: 'v3.0 (Cloud)',
  pendingChanges: []
};

const DEFAULT_ACCOUNTS = [
  { id: 'treasury', name: 'Treasury (Redot)', balance: 0, currency: 'USD', isLocked: false },
  { id: 'payroll', name: 'Payroll (Opay)', balance: 0, currency: 'NGN', isLocked: false },
  { id: 'buffer', name: 'Buffer (Piggy)', balance: 0, currency: 'NGN', isLocked: true },
  { id: 'vault', name: 'The Vault (Locked)', balance: 0, currency: 'NGN', isLocked: true },
  { id: 'holding', name: 'Holding Pen', balance: 0, currency: 'NGN', isLocked: false }
];

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS as Account[]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchCloudData(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchCloudData(session.user.id);
      else setIsInitialized(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCloudData = async (userId: string) => {
    try {
      let { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (profile) {
         setUser({
            burnCap: profile.burn_cap,
            annualRent: profile.annual_rent || 0, // NEW MAP
            inflationRate: profile.inflation_rate,
            lastSeen: profile.last_seen || new Date().toISOString(),
            lastReconciliationDate: profile.last_reconciliation_date || new Date().toISOString(),
            runwayEmptySince: profile.runway_empty_since,
            systemVersion: profile.system_version,
            pendingChanges: profile.pending_changes || []
         });
      }

      const { data: accs } = await supabase.from('accounts').select('*').eq('user_id', userId);
      if (accs && accs.length > 0) {
        const mappedAccounts = DEFAULT_ACCOUNTS.map(def => {
           const found = accs.find(a => a.type === def.id); 
           return found ? { ...def, balance: found.balance } : def;
        });
        setAccounts(mappedAccounts);
      } else {
        await Promise.all(DEFAULT_ACCOUNTS.map(acc => 
           supabase.from('accounts').insert({ user_id: userId, type: acc.id, name: acc.name, balance: 0, currency: acc.currency, is_locked: acc.isLocked })
        ));
      }

      const { data: b } = await supabase.from('budgets').select('*').eq('user_id', userId);
      if (b) setBudgets(b.map((x: any) => ({...x, autoDeduct: x.auto_deduct, expiryDate: x.expiry_date})));

      const { data: g } = await supabase.from('goals').select('*').eq('user_id', userId);
      if (g) setGoals(g.map((x: any) => ({...x, targetAmount: x.target_amount, currentAmount: x.current_amount, isCompleted: x.is_completed, subGoals: x.sub_goals})));

      const { data: s } = await supabase.from('signals').select('*').eq('user_id', userId);
      if (s) setSignals(s.map((x: any) => ({...x, hoursLogged: x.hours_logged, totalGenerated: x.total_generated, redFlags: x.red_flags, proofOfWork: x.proof_of_work, createdAt: x.created_at, updatedAt: x.updated_at})));

      const { data: h } = await supabase.from('history').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (h) setHistory(h.map((x: any) => ({...x, linkedSignalId: x.linked_signal_id, linkedGoalId: x.linked_goal_id})));

      const { data: j } = await supabase.from('journal').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (j) setJournal(j.map((x: any) => ({...x, linkedLogId: x.linked_log_id})));

      setIsInitialized(true);
    } catch (error) {
      console.error('Data Load Error:', error);
    }
  };

  const updateUser = async (updates: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updates }));
    if (!session) return;
    
    const dbUpdates: any = {};
    if (updates.burnCap) dbUpdates.burn_cap = updates.burnCap;
    if (updates.annualRent !== undefined) dbUpdates.annual_rent = updates.annualRent; // NEW WRITE
    if (updates.lastSeen) dbUpdates.last_seen = updates.lastSeen;
    if (updates.lastReconciliationDate) dbUpdates.last_reconciliation_date = updates.lastReconciliationDate;
    if (updates.pendingChanges) dbUpdates.pending_changes = updates.pendingChanges;

    await supabase.from('profiles').update(dbUpdates).eq('id', session.user.id);
  };

  const updateAccount = async (id: AccountType, amount: number) => {
    setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, balance: acc.balance + amount } : acc));
    if (!session) return;
    const currentAccount = accounts.find(a => a.id === id);
    if (currentAccount) {
       const newBalance = currentAccount.balance + amount;
       await supabase.from('accounts').update({ balance: newBalance }).eq('user_id', session.user.id).eq('type', id);
    }
  };

  const addBudget = async (budget: Budget) => {
    setBudgets(prev => [...prev, budget]);
    if (!session) return;
    await supabase.from('budgets').insert({
      id: budget.id, user_id: session.user.id, name: budget.name, amount: budget.amount, 
      spent: budget.spent, frequency: budget.frequency, category: budget.category, auto_deduct: budget.autoDeduct
    });
  };

  const deleteBudget = async (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
    if (session) await supabase.from('budgets').delete().eq('id', id);
  };

  const logExpense = async (budgetId: string | null, amount: number, note: string) => {
    updateAccount('payroll', -amount);
    if (budgetId) {
      setBudgets(prev => prev.map(b => b.id === budgetId ? { ...b, spent: (b.spent || 0) + amount } : b));
      if (session) {
         const b = budgets.find(b => b.id === budgetId);
         if (b) await supabase.from('budgets').update({ spent: b.spent + amount }).eq('id', budgetId);
      }
    }
    commitAction({
      id: crypto.randomUUID(), date: new Date().toISOString(), type: 'SPEND',
      title: budgetId ? 'Categorized Spend' : 'Uncategorized Spend',
      amount, description: note, currency: 'NGN'
    });
  };

  const resetBudgetCycle = async () => {
    setBudgets(prev => prev.map(b => ({ ...b, spent: 0 })));
    if (session) await supabase.from('budgets').update({ spent: 0 }).eq('user_id', session.user.id);
    commitAction({ id: crypto.randomUUID(), date: new Date().toISOString(), type: 'SYSTEM_EVENT', title: 'Budget Reset' });
  };

  const updateGoal = async (goal: Goal) => {
    setGoals(prev => {
      const exists = prev.find(g => g.id === goal.id);
      if (exists) return prev.map(g => g.id === goal.id ? goal : g);
      return [...prev, goal];
    });
    if (!session) return;
    
    const { data } = await supabase.from('goals').select('id').eq('id', goal.id).single();
    const payload = {
       id: goal.id, user_id: session.user.id, title: goal.title, phase: goal.phase, 
       target_amount: goal.targetAmount, current_amount: goal.currentAmount, 
       is_completed: goal.isCompleted, priority: goal.priority, type: goal.type, sub_goals: goal.subGoals
    };
    if (data) await supabase.from('goals').update(payload).eq('id', goal.id);
    else await supabase.from('goals').insert(payload);
  };

  const deleteGoal = async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    if (session) await supabase.from('goals').delete().eq('id', id);
  };

  const updateSignal = async (signal: Signal) => {
    setSignals(prev => {
      const exists = prev.find(s => s.id === signal.id);
      if (exists) return prev.map(s => s.id === signal.id ? signal : s);
      return [...prev, signal];
    });
    if (!session) return;

    const { data } = await supabase.from('signals').select('id').eq('id', signal.id).single();
    const payload = {
       id: signal.id, user_id: session.user.id, title: signal.title, sector: signal.sector, 
       phase: signal.phase, confidence: signal.confidence, effort: signal.effort, 
       hours_logged: signal.hoursLogged, total_generated: signal.totalGenerated, 
       red_flags: signal.redFlags, thesis: signal.thesis, research: signal.research, 
       outcome: signal.outcome, timeline: signal.timeline, updated_at: new Date().toISOString()
    };
    if (data) await supabase.from('signals').update(payload).eq('id', signal.id);
    else await supabase.from('signals').insert(payload);
  };

  const logSignalTime = async (id: string, hours: number) => {
    setSignals(prev => prev.map(s => s.id === id ? { ...s, hoursLogged: s.hoursLogged + hours } : s));
    if (session) {
       const s = signals.find(x => x.id === id);
       if (s) await supabase.from('signals').update({ hours_logged: s.hoursLogged + hours }).eq('id', id);
    }
  };

  const commitAction = async (log: HistoryLog) => {
    setHistory(prev => [log, ...prev]);
    updateUser({ lastSeen: new Date().toISOString() });
    if (!session) return;
    await supabase.from('history').insert({
       id: log.id, user_id: session.user.id, date: log.date, type: log.type, title: log.title, 
       amount: log.amount, currency: log.currency, description: log.description, tags: log.tags, 
       linked_signal_id: log.linkedSignalId, linked_goal_id: log.linkedGoalId
    });
  };

  const deleteTransaction = async (id: string) => {
    const log = history.find(h => h.id === id);
    if (log && log.type === 'SPEND' && log.amount) updateAccount('payroll', log.amount); 
    setHistory(prev => prev.filter(h => h.id !== id));
    if (session) await supabase.from('history').delete().eq('id', id);
  };

  const syncLocalData = async () => {
     const local = localStorage.getItem('riot_financial_os');
     if (!local || !session) return;
     const data = JSON.parse(local);
     
     if (data.accounts) {
        for (const acc of data.accounts) {
           await supabase.from('accounts').update({ balance: acc.balance }).eq('user_id', session.user.id).eq('type', acc.id);
        }
     }
     if (data.goals) {
        for (const g of data.goals) await updateGoal(g);
     }
     if (data.signals) {
        for (const s of data.signals) await updateSignal(s);
     }
     alert('Migration Complete. Please refresh.');
  };

  const nuclearReset = (password: string) => { return false; }; 

  const exchangeRate = 1500; 
  const totalLiquid = 
    (accounts.find(a => a.id === 'treasury')?.balance || 0) * exchangeRate +
    (accounts.find(a => a.id === 'payroll')?.balance || 0);
  const unallocatedCash = accounts.find(a => a.id === 'holding')?.balance || 0;
  const dailyBurn = calculateDailyBurn(budgets);
  const monthlyBurn = dailyBurn * 30;
  const runwayMonths = monthlyBurn > 0 ? totalLiquid / monthlyBurn : 0;
  const isGhostMode = (new Date().getTime() - new Date(user.lastSeen).getTime()) > (7 * 24 * 60 * 60 * 1000);

  return (
    <FinancialContext.Provider value={{
      user, accounts, goals, signals, budgets, history, journal,
      totalLiquid, runwayMonths, unallocatedCash, dailyBurn, isGhostMode, isLoading: !isInitialized,
      updateUser, updateAccount, addBudget, deleteBudget, logExpense, resetBudgetCycle,
      updateGoal, deleteGoal, updateSignal, logSignalTime, commitAction, deleteTransaction, nuclearReset, syncLocalData
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
