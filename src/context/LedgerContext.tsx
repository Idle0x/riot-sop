import { createContext, useContext, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useUser } from './UserContext';
import { calculateMonthlyBurn } from '../utils/finance';
import { 
  type Account, type Budget, type Goal, type Signal, type HistoryLog, 
  type AccountType 
} from '../types';

interface LedgerContextType {
  accounts: Account[];
  budgets: Budget[];
  goals: Goal[];
  signals: Signal[];
  history: HistoryLog[];
  
  // Computed
  runwayMonths: number;
  monthlyBurn: number; // Replaces dailyBurn
  totalLiquid: number;
  unallocatedCash: number;

  // Actions
  updateAccount: (id: AccountType, amount: number) => void;
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  deleteBudget: (id: string) => void;
  updateBudgetSpent: (id: string, amount: number) => void;
  
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string, reclaimAmount: boolean) => void; // NEW: Reclaim Logic
  
  updateSignal: (signal: Signal) => void;
  addSignal: (signal: Omit<Signal, 'id'>) => void;
  
  commitAction: (log: Omit<HistoryLog, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  
  isSyncing: boolean;
}

const LedgerContext = createContext<LedgerContextType | null>(null);

export const LedgerProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useUser();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  // --- 1. PARALLEL DATA FETCHING ---
  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['accounts', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from('accounts').select('*');
      return data || [];
    }
  });

  const { data: budgets = [], isLoading: loadingBudgets } = useQuery({
    queryKey: ['budgets', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from('budgets').select('*');
      // Map snake_case to camelCase
      return (data || []).map((b: any) => ({
        ...b,
        expiryDate: b.expiry_date,
        autoDeduct: b.auto_deduct,
        lastProcessedAt: b.last_processed_at
      }));
    }
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from('goals').select('*');
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
      const { data } = await supabase.from('signals').select('*');
      return (data || []).map((s: any) => ({
        ...s,
        hoursLogged: s.hours_logged,
        totalGenerated: s.total_generated,
        proofOfWork: s.proof_of_work,
        redFlags: s.red_flags,
        createdAt: s.created_at,
        updatedAt: s.updated_at
      }));
    }
  });

  const { data: history = [] } = useQuery({
    queryKey: ['history', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('history')
        .select('*')
        .order('date', { ascending: false });
      return data || [];
    }
  });

  // --- 2. MUTATIONS (ACTIONS) ---

  // ACCOUNTS
  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: AccountType; amount: number }) => {
      // 1. Get current balance
      const current = accounts.find(a => a.type === id);
      if (!current) throw new Error('Account not found');
      
      const newBalance = Number(current.balance) + amount;

      // 2. Update DB
      const { error } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('type', id) // Assuming 'type' is unique per user
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] })
  });

  // GOALS (With Atomic Delete)
  const deleteGoalMutation = useMutation({
    mutationFn: async ({ id, reclaimAmount }: { id: string; reclaimAmount: boolean }) => {
      const goal = goals.find(g => g.id === id);
      if (!goal) return;

      if (reclaimAmount && goal.currentAmount > 0) {
        // Find Holding Account
        const holding = accounts.find(a => a.type === 'holding');
        if (holding) {
          await supabase.from('accounts').update({ 
            balance: Number(holding.balance) + Number(goal.currentAmount) 
          }).eq('id', holding.id);
          
          // Log the reclaim
          await supabase.from('history').insert({
             user_id: userId,
             date: new Date().toISOString(),
             type: 'TRANSFER',
             title: 'Goal Reclaimed',
             amount: goal.currentAmount,
             description: `Reclaimed funds from deleted goal: ${goal.title}`
          });
        }
      }
      
      // Delete Goal
      await supabase.from('goals').delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
    }
  });

  // HISTORY LOGGING
  const addLogMutation = useMutation({
    mutationFn: async (log: Omit<HistoryLog, 'id'>) => {
       await supabase.from('history').insert({
         ...log,
         user_id: userId,
         linked_goal_id: log.linkedGoalId,
         linked_signal_id: log.linkedSignalId
       });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] })
  });
  
  // BUDGETS
  const addBudgetMutation = useMutation({
    mutationFn: async (budget: Omit<Budget, 'id'>) => {
      await supabase.from('budgets').insert({
        ...budget,
        user_id: userId,
        expiry_date: budget.expiryDate,
        auto_deduct: budget.autoDeduct
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] })
  });
  
  const updateBudgetSpentMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string, amount: number }) => {
        const budget = budgets.find(b => b.id === id);
        if(!budget) return;
        
        await supabase.from('budgets').update({
            spent: Number(budget.spent) + amount
        }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] })
  });

  // SIGNALS
  const updateSignalMutation = useMutation({
    mutationFn: async (signal: Signal) => {
      const { id, ...rest } = signal;
      // Map camelCase back to snake_case for DB
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
        updated_at: new Date().toISOString()
      };
      
      await supabase.from('signals').update(dbSignal).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['signals'] })
  });

  // --- 3. COMPUTED STATE ---
  const monthlyBurn = calculateMonthlyBurn(budgets);
  const totalLiquid = (accounts.find(a => a.type === 'payroll')?.balance || 0) + 
                      (accounts.find(a => a.type === 'treasury')?.balance || 0);
  const unallocatedCash = accounts.find(a => a.type === 'holding')?.balance || 0;
  
  const runwayMonths = monthlyBurn > 0 ? Math.max(0, totalLiquid / monthlyBurn) : 0;

  return (
    <LedgerContext.Provider value={{
      accounts,
      budgets,
      goals,
      signals,
      history,
      runwayMonths,
      monthlyBurn,
      totalLiquid,
      unallocatedCash,
      isSyncing: loadingAccounts || loadingBudgets,

      updateAccount: (id, amount) => updateAccountMutation.mutate({ id, amount }),
      
      addBudget: (b) => addBudgetMutation.mutate(b),
      deleteBudget: (id) => { /* Implement delete mutation */ },
      updateBudgetSpent: (id, amount) => updateBudgetSpentMutation.mutate({ id, amount }),

      addGoal: (g) => { /* Implement add mutation */ },
      updateGoal: (g) => { /* Implement update mutation */ },
      deleteGoal: (id, reclaim) => deleteGoalMutation.mutate({ id, reclaimAmount: reclaim }),

      updateSignal: (s) => updateSignalMutation.mutate(s),
      addSignal: (s) => { /* Implement add mutation */ },
      
      commitAction: (l) => addLogMutation.mutate(l),
      deleteTransaction: (id) => { /* Implement delete mutation */ }
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
