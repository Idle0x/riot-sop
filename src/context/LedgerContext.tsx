import { createContext, useContext, useState, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useUser } from './UserContext';
import { calculateMonthlyBurn } from '../utils/finance';
import { generateSmartPrompt } from '../utils/journalEngine';
import { formatNumber } from '../utils/format';
import { 
  type Account, type Budget, type Goal, type Signal, type HistoryLog, 
  type AccountType, type LogType, type TelemetryRecord, type JournalEntry,
  type JournalPromptPayload, type ActiveJournalPrompt
} from '../types';

export type ResetModule = 'dashboard' | 'goals' | 'signals' | 'budgets' | 'journal' | 'generosity' | 'telemetry' | 'all';

interface LedgerContextType {
  accounts: Account[];
  budgets: Budget[];
  goals: Goal[];
  signals: Signal[];
  history: HistoryLog[];
  telemetry: TelemetryRecord[];
  journals: JournalEntry[];

  runwayMonths: number;
  realRunwayMonths: number;
  monthlyBurn: number;
  totalLiquid: number;
  unallocatedCash: number;
  isSyncing: boolean;

  activeJournalPrompt: ActiveJournalPrompt | null;
  triggerJournalPrompt: (payload: JournalPromptPayload) => void;
  closeJournalPrompt: () => void;

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

  insertTelemetryBatch: (records: Omit<TelemetryRecord, 'id'>[]) => Promise<{ imported: number, ignored: number }>;
  addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void;

  resetModule: (module: ResetModule) => void;
  recordGenerosity: (name: string, tier: 'T1' | 'T2' | 'T3', amount: number, notes?: string) => void;
  logWorkSession: (signalId: string, title: string, hours: number, notes: string) => void;
}

const LedgerContext = createContext<LedgerContextType | null>(null);

export const LedgerProvider = ({ children }: { children: ReactNode }) => {
  const { session, user } = useUser();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const [activeJournalPrompt, setActiveJournalPrompt] = useState<ActiveJournalPrompt | null>(null);

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
      return (data || []).map((s: any) => ({
        ...s,
        hoursLogged: s.hours_logged,
        totalGenerated: s.total_generated,
        proofOfWork: s.proof_of_work,
        redFlags: s.red_flags,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        timeEstimates: s.time_estimates,
        sessionLogs: s.session_logs,
        lastSessionAt: s.last_session_at
      }));
    }
  });

  // UNLOCKED: Recursive Paginator for History (Bypasses 1,000 row limit)
  const { data: history = [] } = useQuery({
    queryKey: ['history', userId],
    enabled: !!userId,
    queryFn: async () => {
      let allData: any[] = [];
      let from = 0;
      const step = 1000;
      
      while (true) {
        const { data, error } = await supabase.from('history')
            .select('*')
            .order('date', { ascending: false })
            .range(from, from + step - 1);
            
        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allData = [...allData, ...data];
        if (data.length < step) break;
        from += step;
      }

      return allData.map((h: any) => ({
          ...h,
          linkedSignalId: h.linked_signal_id,
          linkedGoalId: h.linked_goal_id,
          recipientName: h.recipient_name,
          recipientTier: h.recipient_tier,
          efficiencyRating: h.efficiency_rating
      }));
    }
  });

  // UNLOCKED: Recursive Paginator for Telemetry (Bypasses 1,000 row limit)
  const { data: telemetry = [] } = useQuery({
    queryKey: ['telemetry', userId],
    enabled: !!userId,
    queryFn: async () => {
      let allData: any[] = [];
      let from = 0;
      const step = 1000;
      
      while (true) {
        const { data, error } = await supabase.from('telemetry_raw')
            .select('*')
            .order('date', { ascending: false })
            .range(from, from + step - 1);
            
        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allData = [...allData, ...data];
        if (data.length < step) break;
        from += step;
      }

      return allData.map((t: any) => ({
          ...t,
          batchId: t.batch_id,
          transactionRef: t.transaction_ref,
          categoryGroup: t.category_group,
          highVelocityFlag: t.high_velocity_flag
      }));
    }
  });

  const { data: journals = [] } = useQuery({
    queryKey: ['journals', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('journal').select('*').order('date', { ascending: false });
      if (error) throw error;
      return data.map((j: any) => ({
          ...j,
          linkedLogId: j.linked_log_id,
          auditBatchId: j.audit_batch_id
      }));
    }
  });

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

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const recentBleeds = telemetry
    .filter(t => t.date.startsWith(currentMonthKey) && t.highVelocityFlag)
    .reduce((sum, t) => sum + t.amount, 0);

  const triggerJournalPrompt = (payload: JournalPromptPayload) => {
    const globalState = { runwayMonths, unallocatedCash, budgets, signals, history, recentBleeds };
    const engineResult = generateSmartPrompt(payload.type, payload.data, globalState);
    if (engineResult) {
      setActiveJournalPrompt({ ...payload, engineResult });
    }
  };

  const closeJournalPrompt = () => setActiveJournalPrompt(null);

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
       const { data, error } = await supabase.from('goals').insert(dbGoal).select('id').single();
       if (error) throw error;
       if (data) autoLog('GOAL_CREATE', `New Target Locked: ${goal.title}`, `Requires ₦${formatNumber(goal.targetAmount)}`, goal.targetAmount, undefined, data.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] })
  });

  const updateGoalMutation = useMutation({
    mutationFn: async (goal: Goal) => {
       const oldGoal = goals.find(g => g.id === goal.id);
       
       const { error } = await supabase.from('goals').update({
         target_amount: goal.targetAmount,
         current_amount: goal.currentAmount,
         is_completed: goal.isCompleted
       }).eq('id', goal.id);
       if (error) throw error;

       if (oldGoal) {
          if (!oldGoal.isCompleted && goal.isCompleted) {
              autoLog('GOAL_ACHIEVED', `Target Eliminated: ${goal.title}`, `Capital deployed successfully.`, goal.targetAmount, undefined, goal.id);
          } else if (oldGoal.targetAmount !== goal.targetAmount) {
              autoLog('GOAL_UPDATE', `Target Adjusted: ${goal.title}`, `Shifted from ₦${formatNumber(oldGoal.targetAmount)} to ₦${formatNumber(goal.targetAmount)}`, goal.targetAmount, undefined, goal.id);
          }
       }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] })
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
             autoLog('GOAL_DELETE', `Reclaimed Capital: ${goal.title}`, `₦${formatNumber(goal.currentAmount)} routed back to Holding.`, goal.currentAmount);
         }
      } else {
        autoLog('GOAL_DELETE', `Abandoned Target: ${goal.title}`, 'No funds reclaimed.');
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
      autoLog('BUDGET_CREATE', `Cap Established: ${budget.name}`, `Limit: ₦${formatNumber(budget.amount)} | Freq: ${budget.frequency}`, budget.amount);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] })
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: string) => {
      const budget = budgets.find(b => b.id === id);
      await supabase.from('budgets').delete().eq('id', id);
      if (budget) autoLog('BUDGET_DELETE', `Cap Removed: ${budget.name}`, 'Liability eliminated.');
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
      const oldSignal = signals.find(s => s.id === signal.id);

      const { id, ...rest } = signal;
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
        time_estimates: rest.timeEstimates,
        session_logs: rest.sessionLogs,
        last_session_at: rest.lastSessionAt,
        lifecycle: rest.lifecycle // Important: Save the lifecycle history array
      };
      await supabase.from('signals').update(dbSignal).eq('id', id);

      if (oldSignal && oldSignal.phase !== signal.phase) {
          let type: LogType = 'SIGNAL_ADVANCE';
          let title = `Signal Advanced: ${signal.title}`;
          let desc = `Shifted from ${oldSignal.phase.toUpperCase()} to ${signal.phase.toUpperCase()}`;

          // VERCEL CACHE BYPASS
          const newPhase = signal.phase as string;
          const oldPhase = oldSignal.phase as string;

          if (newPhase === 'graveyard') {
              type = 'SIGNAL_KILL';
              title = `Signal Terminated: ${signal.title}`;
          } else if (newPhase === 'harvested') {
              type = 'SIGNAL_HARVEST';
              title = `Alpha Harvested: ${signal.title}`;
          } else if (oldPhase === 'graveyard' && newPhase !== 'graveyard') {
              type = 'SIGNAL_REVIVE';
              title = `Signal Revived: ${signal.title}`;
          }
          
          autoLog(type, title, desc, undefined, signal.id);
      }
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
        last_session_at: signal.lastSessionAt,
        lifecycle: signal.lifecycle
      };
      const { data } = await supabase.from('signals').insert(dbSignal).select('id').single();
      if (data) autoLog('SIGNAL_CREATE', `New Deal Sourced: ${signal.title}`, `Sector: ${signal.sector}`, undefined, data.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['signals'] })
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

  const insertTelemetryBatchMutation = useMutation({
    mutationFn: async (records: Omit<TelemetryRecord, 'id'>[]) => {
      const payload = records.map(r => ({
        user_id: userId,
        batch_id: r.batchId,
        date: r.date,
        type: r.type,
        title: r.title,
        description: r.description,
        amount: r.amount,
        currency: r.currency,
        transaction_ref: r.transactionRef,
        category_group: r.categoryGroup,
        high_velocity_flag: r.highVelocityFlag
      }));

      const { data, error } = await supabase
        .from('telemetry_raw')
        .upsert(payload, { onConflict: 'transaction_ref', ignoreDuplicates: true })
        .select();

      if (error) throw error;
      
      return {
          imported: data ? data.length : 0,
          ignored: payload.length - (data ? data.length : 0)
      };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['telemetry'] })
  });

  const addJournalEntryMutation = useMutation({
    mutationFn: async (entry: Omit<JournalEntry, 'id'>) => {
        const { data, error } = await supabase.from('journal').insert({
            user_id: userId,
            date: entry.date,
            content: entry.content,
            tags: entry.tags,
            linked_log_id: entry.linkedLogId,
            audit_batch_id: entry.auditBatchId
        }).select('id').single();
        
        if (error) throw error;

        if (data) {
            const isAudit = entry.tags?.includes('system_audit');
            autoLog('JOURNAL_LOGGED', isAudit ? 'Audit Reviewed & Signed' : 'Operator Log Committed', undefined, undefined, undefined, undefined);
        }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journals'] })
  });

  const recordGenerosityMutation = useMutation({
    mutationFn: async ({ name, tier, amount, notes }: { name: string, tier: 'T1'|'T2'|'T3', amount: number, notes?: string }) => {
        const { data: current } = await supabase.from('accounts').select('balance').eq('type', 'generosity').eq('user_id', userId).single();
        if (!current || current.balance < amount) throw new Error("Insufficient Generosity funds");
        await supabase.from('accounts').update({ balance: current.balance - amount }).eq('type', 'generosity').eq('user_id', userId);
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
            amount: hours, 
            linked_signal_id: signalId
        });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] })
  });

  const resetModuleMutation = useMutation({
    mutationFn: async (module: ResetModule) => {
      if (module === 'signals' || module === 'all') {
        await supabase.from('history').update({ linked_signal_id: null }).eq('user_id', userId);
        await supabase.from('signals').delete().eq('user_id', userId);
        await autoLog('SYSTEM_RESET', 'Signals Database Wiped', 'All deal flow deleted');
      }
      
      if (module === 'goals' || module === 'all') {
        await supabase.from('history').update({ linked_goal_id: null }).eq('user_id', userId);
        await supabase.from('goals').delete().eq('user_id', userId);
        await autoLog('SYSTEM_RESET', 'Goals Database Wiped', 'All missions deleted');
      }

      if (module === 'budgets' || module === 'all') {
        await supabase.from('budgets').delete().eq('user_id', userId);
        await autoLog('SYSTEM_RESET', 'Budgets Database Wiped', 'Recurring expenses cleared');
      }
      
      if (module === 'journal' || module === 'all') {
        await supabase.from('journal').delete().eq('user_id', userId);
        await autoLog('SYSTEM_RESET', 'Journal Entries Wiped', 'Personal notes cleared');
      }
      
      if (module === 'telemetry' || module === 'all') {
        await supabase.from('telemetry_raw').delete().eq('user_id', userId);
        await autoLog('SYSTEM_RESET', 'Data Lake Cleared', 'All raw telemetry data purged');
      }

      if (module === 'dashboard' || module === 'all') {
        await supabase.from('accounts').update({ balance: 0 }).eq('user_id', userId);
        await autoLog('SYSTEM_RESET', 'Dashboard Balance Reset', 'All accounts set to 0');
      }
      
      if (module === 'generosity' || module === 'all') {
        await supabase.from('accounts').update({ balance: 0 }).eq('type', 'generosity').eq('user_id', userId);
        await autoLog('SYSTEM_RESET', 'Generosity Wallet Emptied', 'Funds cleared');
      }
      
      if (module === 'all') {
        await autoLog('SYSTEM_RESET', 'FACTORY RESET EXECUTED', 'Complete system wipe initiated');
      }
    },
    onSuccess: () => queryClient.invalidateQueries(),
    onError: (e: any) => alert(`Reset Blocked by Database: ${e.message}`)
  });

  return (
    <LedgerContext.Provider value={{
      accounts, budgets, goals, signals, history, telemetry, journals,
      runwayMonths, realRunwayMonths, monthlyBurn, totalLiquid, unallocatedCash, isSyncing: loadingAccounts || loadingBudgets,
      
      activeJournalPrompt,
      triggerJournalPrompt,
      closeJournalPrompt,

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
      insertTelemetryBatch: (records) => insertTelemetryBatchMutation.mutateAsync(records),
      addJournalEntry: (entry) => addJournalEntryMutation.mutate(entry),
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
