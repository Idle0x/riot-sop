import { createContext, useContext, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useUser } from './UserContext';
import { calculateMonthlyBurn } from '../utils/finance';
import { 
  type Account, type Budget, type Goal, type Signal, type HistoryLog, 
  type AccountType, type LogType 
} from '../types';

export type ResetModule = 'dashboard' | 'goals' | 'signals' | 'budgets' | 'journal' | 'generosity' | 'all';

interface LedgerContextType {
  accounts: Account[];
  budgets: Budget[];
  goals: Goal[];
  signals: Signal[];
  history: HistoryLog[];

  runwayMonths: number;
  realRunwayMonths: number;
  monthlyBurn: number;
  totalLiquid: number;
  unallocatedCash: number;
  isSyncing: boolean;

  updateAccount: (id: AccountType, amount: number) => void;
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  deleteBudget: (id: string) => void;
  updateBudgetSpent: (id: string, amount: number) => void;
  resetBudgetCounters: () => void;

  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (goal: Goal) => void;
  fundGoal: (id: string, amount: number) => void;
  deleteGoal: (id: string, reclaimAmount: boolean) => void;

  updateSignal: (signal: Signal) => void;
  addSignal: (signal: Omit<Signal, 'id'>) => void;

  commitAction: (log: Omit<HistoryLog, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  
  // NEW FEATURES
  resetModule: (module: ResetModule) => void;
  recordGenerosity: (name: string, tier: 'T1' | 'T2' | 'T3', amount: number, notes?: string) => void;
  logWorkSession: (signalId: string, title: string, hours: number, notes: string) => void;
}

const LedgerContext = createContext<LedgerContextType | null>(null);

export const LedgerProvider = ({ children }: { children: ReactNode }) => {
  const { session, user } = useUser();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  // --- QUERIES ---
  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['accounts', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('accounts').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: budgets = [], isLoading: loadingBudgets } = useQuery({
    queryKey: ['budgets', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('budgets').select('*');
      if (error) throw error;
      return (data || []).map((b: any) => ({
        ...b,
        expiryDate: b.expiry_date,
        autoDeduct: b.auto_deduct,
        lastProcessedAt: b.last_processed_at,
        subscriptionDay: b.subscription_day
      }));
    }
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('goals').select('*');
      if (error) throw error;
      return (data || []).map((g: any) => ({
        ...g,
        targetAmount: g.target_amount,
        currentAmount: g.current_amount,
        isCompleted: g.is_completed,
        subGoals: g.sub_goals
      }));
    }
  });

  const { data: signals = [] } = useQuery({
    queryKey: ['signals', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('signals').select('*');
      if (error) throw error;
      // Map DB snake_case to CamelCase types
      return (data || []).map((s: any) => ({
        ...s,
        hoursLogged: s.hours_logged,
        totalGenerated: s.total_generated,
        proofOfWork: s.proof_of_work,
        redFlags: s.red_flags,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        // New Time Fields
        timeEstimates: s.time_estimates,
        sessionLogs: s.session_logs,
        lastSessionAt: s.last_session_at
      }));
    }
  });

  const { data: history = [] } = useQuery({
    queryKey: ['history', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('history').select('*').order('date', { ascending: false });
      if (error) throw error;
      return data.map((h: any) => ({
          ...h,
          linkedSignalId: h.linked_signal_id,
          linkedGoalId: h.linked_goal_id,
          recipientName: h.recipient_name,
          recipientTier: h.recipient_tier,
          efficiencyRating: h.efficiency_rating
      }));
    }
  });

  // --- HELPER: AUTO LOGGER ---
  const autoLog = async (type: LogType, title: string, desc?: string, amount?: number, signalId?: string, goalId?: string) => {
    await supabase.from('history').insert({
      user_id: userId,
      date: new Date().toISOString(),
      type,
      title,
      description: desc || '',
      amount: amount || 0,
      linked_signal_id: signalId,
      linked_goal_id: goalId
    });
    queryClient.invalidateQueries({ queryKey: ['history'] });
  };

  // --- MUTATIONS ---
  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: AccountType; amount: number }) => {
      const { data: current } = await supabase.from('accounts').select('balance').eq('type', id).eq('user_id', userId).single();
      if (!current) throw new Error(`Account '${id}' not found.`);
      const newBalance = Number(current.balance) + amount;
      await supabase.from('accounts').update({ balance: newBalance }).eq('type', id).eq('user_id', userId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] })
  });

  const fundGoalMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const goal = goals.find(g => g.id === id);
      if (!goal) return;
      const newAmount = Number(goal.currentAmount) + amount;
      const isCompleted = newAmount >= goal.targetAmount;
      await supabase.from('goals').update({ current_amount: newAmount, is_completed: isCompleted }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] })
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async ({ id, reclaimAmount }: { id: string; reclaimAmount: boolean }) => {
      const goal = goals.find(g => g.id === id);
      if (!goal) return;
      if (reclaimAmount && goal.currentAmount > 0) {
         const { data: current } = await supabase.from('accounts').select('balance').eq('type', 'holding').eq('user_id', userId).single();
         if (current) {
             await supabase.from('accounts').update({ balance: current.balance + goal.currentAmount }).eq('type', 'holding').eq('user_id', userId);
             autoLog('GOAL_DELETE', `Reclaimed Funds: ${goal.title}`, 'Moved funds back to Holding', goal.currentAmount);
         }
      } else {
        autoLog('GOAL_DELETE', `Deleted Goal: ${goal.title}`, 'No funds reclaimed');
      }
      await supabase.from('goals').delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    }
  });

  const addLogMutation = useMutation({
    mutationFn: async (log: Omit<HistoryLog, 'id'>) => {
       const { error } = await supabase.from('history').insert({
         user_id: userId,
         ...log,
         linked_signal_id: log.linkedSignalId,
         linked_goal_id: log.linkedGoalId,
         recipient_name: log.recipientName,
         recipient_tier: log.recipientTier,
         efficiency_rating: log.efficiencyRating
       });
       if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] })
  });

  const addBudgetMutation = useMutation({
    mutationFn: async (budget: Omit<Budget, 'id'>) => {
      const dbBudget = {
        user_id: userId,
        name: budget.name,
        amount: budget.amount,
        spent: budget.spent,
        frequency: budget.frequency,
        category: budget.category,
        expiry_date: budget.expiryDate,
        auto_deduct: budget.autoDeduct,
        subscription_day: budget.subscriptionDay
      };
      await supabase.from('budgets').insert(dbBudget);
      autoLog('BUDGET_CREATE', `Budget: ${budget.name}`, `Cap: ${budget.amount} | Freq: ${budget.frequency}`, budget.amount);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] })
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: string) => {
      const budget = budgets.find(b => b.id === id);
      await supabase.from('budgets').delete().eq('id', id);
      if (budget) autoLog('BUDGET_DELETE', `Deleted Budget: ${budget.name}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] })
  });

  const updateBudgetSpentMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string, amount: number }) => {
        const budget = budgets.find(b => b.id === id);
        if(!budget) return;
        await supabase.from('budgets').update({ spent: Number(budget.spent) + amount }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] })
  });

  const resetBudgetCountersMutation = useMutation({
    mutationFn: async () => {
      await supabase.from('budgets').update({ spent: 0 }).eq('user_id', userId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] })
  });

  const updateSignalMutation = useMutation({
    mutationFn: async (signal: Signal) => {
      const { id, ...rest } = signal;
      // Convert to DB Columns
      const dbSignal = {
        title: rest.title,
        sector: rest.sector,
        phase: rest.phase,
        confidence: rest.confidence,
        effort: rest.effort,
        hours_logged: rest.hoursLogged,
        total_generated: rest.totalGenerated,
        red_flags: rest.redFlags,
        proof_of_work: rest.proofOfWork,
        thesis: rest.thesis,
        research: rest.research,
        outcome: rest.outcome,
        timeline: rest.timeline,
        updated_at: new Date().toISOString(),
        // New Time Fields
        time_estimates: rest.timeEstimates,
        session_logs: rest.sessionLogs,
        last_session_at: rest.lastSessionAt
      };
      await supabase.from('signals').update(dbSignal).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['signals'] })
  });

  const addSignalMutation = useMutation({
    mutationFn: async (signal: Omit<Signal, 'id'>) => {
       const dbSignal = {
        user_id: userId,
        title: signal.title,
        sector: signal.sector,
        phase: signal.phase,
        confidence: signal.confidence,
        effort: signal.effort,
        hours_logged: signal.hoursLogged,
        total_generated: signal.totalGenerated,
        red_flags: signal.redFlags,
        proof_of_work: signal.proofOfWork,
        thesis: signal.thesis,
        research: signal.research,
        outcome: signal.outcome,
        timeline: signal.timeline,
        created_at: signal.createdAt,
        updated_at: signal.updatedAt,
        time_estimates: signal.timeEstimates,
        session_logs: signal.sessionLogs,
        last_session_at: signal.lastSessionAt
      };
      const { data } = await supabase.from('signals').insert(dbSignal).select('id').single();
      if (data) autoLog('SIGNAL_CREATE', `New Signal: ${signal.title}`, `Sector: ${signal.sector}`, 0, data.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['signals'] })
  });

  const addGoalMutation = useMutation({
    mutationFn: async (goal: Omit<Goal, 'id'>) => {
       const dbGoal = {
         user_id: userId,
         title: goal.title,
         phase: goal.phase,
         target_amount: goal.targetAmount,
         current_amount: goal.currentAmount,
         type: goal.type,
         sub_goals: goal.subGoals
       };
       const { data } = await supabase.from('goals').insert(dbGoal).select('id').single();
       if (data) autoLog('GOAL_CREATE', `New Mission: ${goal.title}`, `Target: ${goal.targetAmount}`, goal.targetAmount, undefined, data.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] })
  });

  const updateGoalMutation = useMutation({
    mutationFn: async (goal: Goal) => {
       await supabase.from('goals').update({
         current_amount: goal.currentAmount,
         is_completed: goal.isCompleted
       }).eq('id', goal.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] })
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const log = history.find(h => h.id === id);
      if (!log) return;
      if (log.type === 'SPEND' && log.amount) {
         const { data: pay } = await supabase.from('accounts').select('balance').eq('type', 'payroll').eq('user_id', userId).single();
         if(pay) await supabase.from('accounts').update({ balance: pay.balance + log.amount }).eq('type', 'payroll').eq('user_id', userId);
      }
      if (log.type === 'DROP' && log.amount) {
         const { data: hold } = await supabase.from('accounts').select('balance').eq('type', 'holding').eq('user_id', userId).single();
         if(hold) await supabase.from('accounts').update({ balance: hold.balance - log.amount }).eq('type', 'holding').eq('user_id', userId);
      }
      if (log.type === 'GENEROSITY_GIFT' && log.amount) {
         const { data: gen } = await supabase.from('accounts').select('balance').eq('type', 'generosity').eq('user_id', userId).single();
         if(gen) await supabase.from('accounts').update({ balance: gen.balance + log.amount }).eq('type', 'generosity').eq('user_id', userId);
      }
      await supabase.from('history').delete().eq('id', id);
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['history'] });
       queryClient.invalidateQueries({ queryKey: ['accounts'] });
    }
  });

  // --- NEW FEATURES (MUTATIONS) ---

  const recordGenerosityMutation = useMutation({
    mutationFn: async ({ name, tier, amount, notes }: { name: string, tier: 'T1'|'T2'|'T3', amount: number, notes?: string }) => {
        // 1. Deduct from Generosity Wallet
        const { data: current } = await supabase.from('accounts').select('balance').eq('type', 'generosity').eq('user_id', userId).single();
        if (!current || current.balance < amount) throw new Error("Insufficient Generosity funds");
        
        await supabase.from('accounts').update({ balance: current.balance - amount }).eq('type', 'generosity').eq('user_id', userId);

        // 2. Log History
        await supabase.from('history').insert({
            user_id: userId,
            date: new Date().toISOString(),
            type: 'GENEROSITY_GIFT',
            title: `Gift to ${name}`,
            description: notes || `Tier ${tier} Assistance`,
            amount: amount,
            recipient_name: name,
            recipient_tier: tier
        });
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
        queryClient.invalidateQueries({ queryKey: ['history'] });
    }
  });

  const logWorkSessionMutation = useMutation({
    mutationFn: async ({ signalId, title, hours, notes }: { signalId: string, title: string, hours: number, notes: string }) => {
        await supabase.from('history').insert({
            user_id: userId,
            date: new Date().toISOString(),
            type: 'WORK_SESSION',
            title: title,
            description: notes,
            amount: hours, // Storing HOURS in the amount field
            linked_signal_id: signalId
        });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] })
  });

  const resetModuleMutation = useMutation({
    mutationFn: async (module: ResetModule) => {
      if (module === 'dashboard' || module === 'all') {
        await supabase.from('accounts').update({ balance: 0 }).eq('user_id', userId);
        await autoLog('SYSTEM_EVENT', 'Dashboard Balance Reset', 'All accounts set to 0');
      }
      if (module === 'generosity' || module === 'all') {
        await supabase.from('accounts').update({ balance: 0 }).eq('user_id', userId).eq('type', 'generosity');
        await autoLog('SYSTEM_EVENT', 'Generosity Wallet Emptied', 'Funds cleared');
      }
      if (module === 'goals' || module === 'all') {
        await supabase.from('goals').delete().eq('user_id', userId);
        await autoLog('SYSTEM_EVENT', 'Goals Database Wiped', 'All missions deleted');
      }
      if (module === 'signals' || module === 'all') {
        await supabase.from('signals').delete().eq('user_id', userId);
        await autoLog('SYSTEM_EVENT', 'Signals Database Wiped', 'All deal flow deleted');
      }
      if (module === 'budgets' || module === 'all') {
        await supabase.from('budgets').delete().eq('user_id', userId);
        await autoLog('SYSTEM_EVENT', 'Budgets Database Wiped', 'Recurring expenses cleared');
      }
      if (module === 'journal' || module === 'all') {
        await autoLog('SYSTEM_EVENT', 'Journal Entries Wiped', 'Personal notes cleared');
      }
      if (module === 'all') {
        await autoLog('SYSTEM_EVENT', 'FACTORY RESET EXECUTED', 'Complete system wipe initiated');
      }
    },
    onSuccess: () => queryClient.invalidateQueries(),
    onError: (e) => alert(`Reset Failed: ${e.message}`)
  });

  // --- COMPUTED LOGIC ---
  const monthlyBurn = calculateMonthlyBurn(budgets);
  const totalLiquid = (accounts.find(a => a.type === 'payroll')?.balance || 0) + 
                      (accounts.find(a => a.type === 'treasury')?.balance || 0);
  const unallocatedCash = accounts.find(a => a.type === 'holding')?.balance || 0;

  const runwayMonths = monthlyBurn > 0 ? Math.max(0, totalLiquid / monthlyBurn) : 0;
  const inflationRate = (user?.inflationRate || 0) / 100;
  const monthlyInflation = inflationRate / 12;

  let realRunwayMonths = 0;
  if (monthlyBurn > 0 && monthlyInflation > 0) {
    const numerator = Math.log((totalLiquid * monthlyInflation / monthlyBurn) + 1);
    const denominator = Math.log(1 + monthlyInflation);
    realRunwayMonths = numerator / denominator;
  } else {
    realRunwayMonths = runwayMonths; 
  }

  return (
    <LedgerContext.Provider value={{
      accounts,
      budgets,
      goals,
      signals,
      history,
      runwayMonths,
      realRunwayMonths, 
      monthlyBurn,
      totalLiquid,
      unallocatedCash,
      isSyncing: loadingAccounts || loadingBudgets,

      updateAccount: (id, amount) => updateAccountMutation.mutate({ id, amount }),
      addBudget: (b) => addBudgetMutation.mutate(b),
      deleteBudget: (id) => deleteBudgetMutation.mutate(id),
      updateBudgetSpent: (id, amount) => updateBudgetSpentMutation.mutate({ id, amount }),
      resetBudgetCounters: () => resetBudgetCountersMutation.mutate(), 

      addGoal: (g) => addGoalMutation.mutate(g),
      updateGoal: (g) => updateGoalMutation.mutate(g),
      fundGoal: (id, amount) => fundGoalMutation.mutate({ id, amount }), 
      deleteGoal: (id, reclaim) => deleteGoalMutation.mutate({ id, reclaimAmount: reclaim }),

      updateSignal: (s) => updateSignalMutation.mutate(s),
      addSignal: (s) => addSignalMutation.mutate(s),

      commitAction: (l) => addLogMutation.mutate(l),
      deleteTransaction: (id) => deleteTransactionMutation.mutate(id),

      resetModule: (m) => resetModuleMutation.mutate(m),
      recordGenerosity: (name, tier, amount, notes) => recordGenerosityMutation.mutate({ name, tier, amount, notes }),
      logWorkSession: (signalId, title, hours, notes) => logWorkSessionMutation.mutate({ signalId, title, hours, notes })
    }}>
      {children}
    </LedgerContext.Provider>
  );
};

export const useLedger = () => {
  const context = useContext(LedgerContext);
  if (!context) throw new Error('useLedger must be used within LedgerProvider');
  return context;
};
