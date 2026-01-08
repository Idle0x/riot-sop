import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  UserProfile, Account, Goal, Signal, Budget, HistoryLog, 
  Beneficiary, JournalEntry 
} from '../types';
import { calculateDailyBurn } from '../utils/finance';

interface FinancialContextType {
  // Data
  user: UserProfile;
  accounts: Account[];
  goals: Goal[];
  signals: Signal[];
  budgets: Budget[];
  history: HistoryLog[];
  beneficiaries: Beneficiary[];
  journal: JournalEntry[];

  // Metrics
  totalLiquid: number;
  totalNetWorth: number;
  runwayMonths: number;
  
  // Actions
  commitAction: (log: HistoryLog) => void;
  updateAccount: (id: string, delta: number) => void;
  updateSignal: (signal: Signal) => void;
  performTriage: (dropAmount: number, allocations: any) => void;
  accessBuffer: (amount: number, reason: string) => void;
  
  // System
  isGhostMode: boolean;
  acknowledgeWelcomeBack: () => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  // --- STATE INITIALIZATION (Load from LocalStorage or Defaults) ---
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('riot_user');
    return saved ? JSON.parse(saved) : { 
      burnCap: 200000, 
      inflationRate: 1.0, 
      lastSeen: new Date().toISOString(),
      runwayEmptySince: null,
      systemVersion: '1.6'
    };
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('riot_accounts');
    return saved ? JSON.parse(saved) : [
      { id: 'treasury', name: 'Treasury (RedotPay)', balance: 0, currency: 'USD' },
      { id: 'payroll', name: 'Payroll (Opay)', balance: 0, currency: 'NGN' },
      { id: 'buffer', name: 'Buffer Vault', balance: 0, currency: 'NGN', isLocked: true },
      { id: 'holding', name: 'Holding Pen', balance: 0, currency: 'USD' }
    ];
  });

  // ... (Load other states: goals, signals, budgets, history, beneficiaries) ... 
  // For brevity, assuming standard useState initialization for others
  const [goals, setGoals] = useState<Goal[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);

  // --- DERIVED METRICS ---
  const treasury = accounts.find(a => a.id === 'treasury')?.balance || 0;
  const payroll = accounts.find(a => a.id === 'payroll')?.balance || 0;
  // Note: We need a conversion rate here eventually. For now assuming pre-converted logic or USD display
  const totalLiquid = payroll; // Runway is based on NGN liquid
  const dailyBurn = calculateDailyBurn(budgets);
  const monthlyBurn = dailyBurn * 30;
  const runwayMonths = monthlyBurn > 0 ? Math.max(0, totalLiquid / monthlyBurn) : 0;

  const isGhostMode = (new Date().getTime() - new Date(user.lastSeen).getTime()) > (60 * 24 * 60 * 60 * 1000); // 60 days

  // --- THE "ALIVE" ENGINE: AUTO-BURN & TIME TRACKING ---
  useEffect(() => {
    const now = new Date();
    const lastLogin = new Date(user.lastSeen);
    const diffMs = now.getTime() - lastLogin.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // 1. WELCOME BACK PROTOCOL (If gone > 24 hours)
    if (diffDays >= 1) {
      const estimatedBurn = dailyBurn * diffDays;
      
      // Don't auto-deduct yet, just show the modal (UI will handle confirmation)
      console.log(`Welcome back. Estimated burn while away: ${estimatedBurn}`);
      
      // LOGIC FOR ZERO RUNWAY
      if (totalLiquid <= 0 && !user.runwayEmptySince) {
        setUser(prev => ({ ...prev, runwayEmptySince: now.toISOString() }));
      }
    }

    // 2. UPDATE LAST SEEN
    const interval = setInterval(() => {
      setUser(prev => ({ ...prev, lastSeen: new Date().toISOString() }));
    }, 60000); // Update every minute while active

    return () => clearInterval(interval);
  }, []);

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('riot_user', JSON.stringify(user));
    localStorage.setItem('riot_accounts', JSON.stringify(accounts));
    // ... save others
  }, [user, accounts]);


  // --- ACTIONS ---

  const commitAction = (log: HistoryLog) => {
    setHistory(prev => [log, ...prev]);
  };

  const updateAccount = (id: string, delta: number) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === id) {
        const newBal = Math.max(0, acc.balance + delta);
        // Check Zero State
        if (id === 'payroll' && newBal === 0) {
           setUser(u => ({...u, runwayEmptySince: new Date().toISOString()}));
        }
        return { ...acc, balance: newBal };
      }
      return acc;
    }));
  };

  const accessBuffer = (amount: number, reason: string) => {
    // 1. Deduct Buffer
    updateAccount('buffer', -amount);
    // 2. Add to Payroll
    updateAccount('payroll', amount);
    // 3. Log Panic
    commitAction({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: 'EMERGENCY_ACCESS',
      title: 'Emergency Protocol Activated',
      amount: amount,
      description: reason,
      tags: ['panic', 'buffer_withdrawal']
    });
  };

  // ... (Other actions like Triage, Signal Update would go here)

  return (
    <FinancialContext.Provider value={{
      user, accounts, goals, signals, budgets, history, beneficiaries, journal,
      totalLiquid, totalNetWorth: 0, runwayMonths, // Placeholder
      commitAction, updateAccount, updateSignal: () => {}, performTriage: () => {}, accessBuffer,
      isGhostMode, acknowledgeWelcomeBack: () => {}
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
