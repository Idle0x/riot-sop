import { Account, Budget, Goal, Signal, HistoryLog, TelemetryRecord, JournalEntry, AccountType, LogType } from '../types';

class GuestDatabase {
  accounts: Account[] = [];
  budgets: Budget[] = [];
  goals: Goal[] = [];
  signals: Signal[] = [];
  history: HistoryLog[] = [];
  telemetry: TelemetryRecord[] = [];
  journals: JournalEntry[] = [];

  constructor() {
    this.initialize();
  }

  // Hydrates the entire system with realistic 6-month demo data
  initialize() {
     const now = new Date();

     // 1. Accounts
     this.accounts = [
       { id: 'a1', type: 'treasury', name: 'Treasury', balance: 35000, currency: 'USD' },
       { id: 'a2', type: 'payroll', name: 'Payroll', balance: 1250000, currency: 'NGN' },
       { id: 'a3', type: 'buffer', name: 'Chaos Buffer', balance: 5000000, currency: 'NGN' },
       { id: 'a4', type: 'holding', name: 'Holding Pen', balance: 850000, currency: 'NGN' },
       { id: 'a5', type: 'vault', name: 'Cold Vault', balance: 25000000, currency: 'NGN' },
       { id: 'a6', type: 'generosity', name: 'Generosity', balance: 450000, currency: 'NGN' }
     ];

     // 2. Budgets
     this.budgets = [
       { id: 'b1', name: 'Rent Allocation', amount: 400000, spent: 400000, frequency: 'monthly', category: 'Rent' },
       { id: 'b2', name: 'Food & Dining', amount: 300000, spent: 285000, frequency: 'monthly', category: 'Food' },
       { id: 'b3', name: 'Utilities', amount: 150000, spent: 120000, frequency: 'monthly', category: 'Utilities' },
       { id: 'b4', name: 'Software & Apps', amount: 50000, spent: 45000, frequency: 'monthly', category: 'Software' },
       { id: 'b5', name: 'Black Tax / Family', amount: 200000, spent: 150000, frequency: 'monthly', category: 'Family' },
     ];

     // 3. Goals
     this.goals = [
        { id: 'g1', title: 'Relocate to Dubai (Q3)', phase: 'P3', targetAmount: 15000000, currentAmount: 8500000, isCompleted: false, priority: 1, type: 'single', subGoals: [] },
        { id: 'g2', title: 'Validator Node Setup', phase: 'P2', targetAmount: 4500000, currentAmount: 4500000, isCompleted: true, priority: 2, type: 'single', subGoals: [] },
        { id: 'g3', title: 'Emergency Offshore Stash', phase: 'P1', targetAmount: 10000000, currentAmount: 2500000, isCompleted: false, priority: 3, type: 'container', subGoals: [
           { id: 'sg1', title: 'USDC Ledger', targetAmount: 5000000, currentAmount: 2500000, isCompleted: false, priority: 1, type: 'single', subGoals: [] }
        ]}
     ];

     // 4. Signals
     this.signals = [
        {
           id: 's1', title: 'Xandeum Pulse Node', sector: 'DePin', phase: 'harvested', confidence: 8, effort: 'high', hoursLogged: 120, totalGenerated: 4500,
           redFlags: [], proofOfWork: ['https://github.com/idle0x/xandeum'], createdAt: new Date(now.getTime() - 90*24*60*60*1000).toISOString(), updatedAt: now.toISOString(),
           thesis: { alpha: 'Early validator incentive program.', catalyst: 'Mainnet launch Q2', invalidation: 'Team delays token generation.', expectedValue: 10000 },
           research: { links: { website: 'https://xandeum.network' }, token: { status: 'pending' }, findings: 'Strong community, solid tech.', pickReason: 'High APY for early runners.', drillNotes: {} },
           lifecycle: [{ phase: 'discovery', enteredAt: new Date(now.getTime() - 90*24*60*60*1000).toISOString(), exitedAt: new Date(now.getTime() - 80*24*60*60*1000).toISOString(), hoursAtEntry: 0, hoursAtExit: 10 },
                       { phase: 'harvested', enteredAt: new Date(now.getTime() - 10*24*60*60*1000).toISOString(), hoursAtEntry: 120 }],
           timeline: []
        },
        {
           id: 's2', title: 'Riot SOP Build', sector: 'SaaS', phase: 'contribution', confidence: 9, effort: 'high', hoursLogged: 65, totalGenerated: 0,
           redFlags: [], proofOfWork: [], createdAt: new Date(now.getTime() - 15*24*60*60*1000).toISOString(), updatedAt: now.toISOString(),
           thesis: { alpha: 'Personal sovereign operating system.', catalyst: 'Self-discipline', invalidation: 'Abandonment', expectedValue: 0 },
           research: { links: {}, token: { status: 'none' }, findings: 'Needs strict data isolation.', pickReason: 'Fixes personal financial leaks.', drillNotes: {} },
           lifecycle: [{ phase: 'discovery', enteredAt: new Date(now.getTime() - 15*24*60*60*1000).toISOString(), hoursAtEntry: 0 }],
           timeline: []
        }
     ];

     // 5. Telemetry (Simulating the Data Lake)
     this.telemetry = Array.from({ length: 50 }).map((_, i) => {
        const txDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        const isDrop = Math.random() > 0.85;
        const amount = isDrop ? Math.floor(Math.random() * 500000) + 100000 : Math.floor(Math.random() * 50000) + 5000;
        const categories = ['Food & Dining', 'Transport', 'Subscriptions', 'Online Payment', 'Groceries'];
        const category = isDrop ? 'Inbound Transfer' : categories[Math.floor(Math.random() * categories.length)];
        
        return {
           id: `t${i}`, batchId: 'GUEST-BATCH-001', date: txDate.toISOString(), type: isDrop ? 'DROP' : 'SPEND',
           title: isDrop ? 'Upwork Escrow' : (category === 'Food & Dining' ? 'Uber Eats' : 'Merchant POS'),
           description: 'Guest transaction', amount, currency: 'NGN', transactionRef: `REF-${i}`,
           categoryGroup: category, highVelocityFlag: amount > 20000 && !isDrop && Math.random() > 0.7
        };
     });

     // 6. History (Correlated with telemetry)
     this.history = this.telemetry.map(t => ({
         id: `h${t.id}`, date: t.date, type: t.type as any, title: t.title, amount: t.amount, description: t.categoryGroup
     }));

     // Add specific systemic events to history
     this.history.push({
         id: 'h-triage1', date: new Date(now.getTime() - 5*24*60*60*1000).toISOString(), type: 'TRIAGE_SESSION', title: 'Income Drop: $4,500', amount: 5400000, description: 'Harvest from Xandeum',
         linkedSignalId: 's1', metadata: { phase: 'harvested', hoursLogged: 120, efficiency: 37.5 }
     });

     // 7. Journals
     this.journals = [
        { id: 'j1', date: new Date(now.getTime() - 2*24*60*60*1000).toISOString(), content: "System Audit Review\n\nOperator Response:\n> The recent leaks on Uber Eats are unacceptable. I'm instituting the 72-hour rule immediately.", tags: ['system_audit'] },
        { id: 'j2', date: new Date(now.getTime() - 6*24*60*60*1000).toISOString(), content: "Successfully harvested the Xandeum node drop. The discipline paid off.", tags: ['Win'] }
     ];
  }

  // --- CRUD INTERCEPTORS ---
  updateAccount(id: AccountType, amount: number) {
      const acc = this.accounts.find(a => a.type === id);
      if (acc) acc.balance += amount;
  }
  addBudget(b: Omit<Budget, 'id'>) { this.budgets.push({ ...b, id: crypto.randomUUID() } as Budget); }
  deleteBudget(id: string) { this.budgets = this.budgets.filter(b => b.id !== id); }
  updateBudgetSpent(id: string, amount: number) {
      const b = this.budgets.find(x => x.id === id);
      if (b) b.spent += amount;
  }
  resetBudgetCounters() { this.budgets.forEach(b => b.spent = 0); }
  
  addGoal(g: Omit<Goal, 'id'>) { this.goals.push({ ...g, id: crypto.randomUUID() } as Goal); }
  updateGoal(g: Goal) { this.goals = this.goals.map(x => x.id === g.id ? g : x); }
  fundGoal(id: string, amount: number) {
      const g = this.goals.find(x => x.id === id);
      if (g) { g.currentAmount += amount; g.isCompleted = g.currentAmount >= g.targetAmount; }
  }
  deleteGoal(id: string) { this.goals = this.goals.filter(g => g.id !== id); }

  updateSignal(s: Signal) { this.signals = this.signals.map(x => x.id === s.id ? s : x); }
  addSignal(s: Omit<Signal, 'id'>) { this.signals.push({ ...s, id: crypto.randomUUID() } as Signal); }

  commitAction(l: Omit<HistoryLog, 'id'>) { this.history.unshift({ ...l, id: crypto.randomUUID() }); }
  deleteTransaction(id: string) { this.history = this.history.filter(h => h.id !== id); }

  insertTelemetryBatch(records: Omit<TelemetryRecord, 'id'>[]) {
      const newRecords = records.map(r => ({ ...r, id: crypto.randomUUID() }));
      this.telemetry.unshift(...newRecords);
      return { imported: newRecords.length, ignored: 0 };
  }
  addJournalEntry(e: Omit<JournalEntry, 'id'>) { this.journals.unshift({ ...e, id: crypto.randomUUID() }); }
  
  resetModule(module: string) {
      if (module === 'signals' || module === 'all') this.signals = [];
      if (module === 'goals' || module === 'all') this.goals = [];
      if (module === 'budgets' || module === 'all') this.budgets = [];
      if (module === 'journal' || module === 'all') this.journals = [];
      if (module === 'telemetry' || module === 'all') this.telemetry = [];
      if (module === 'dashboard' || module === 'all') this.accounts.forEach(a => a.balance = 0);
      if (module === 'generosity' || module === 'all') { const acc = this.accounts.find(a => a.type === 'generosity'); if(acc) acc.balance = 0; }
  }
  
  recordGenerosity(name: string, tier: string, amount: number, notes?: string) {
      this.updateAccount('generosity', -amount);
      this.commitAction({ date: new Date().toISOString(), type: 'GENEROSITY_GIFT', title: `Gift to ${name}`, amount, description: notes || `Tier ${tier} Assistance`, recipientName: name, recipientTier: tier as any });
  }
  
  logWorkSession(signalId: string, title: string, hours: number, notes: string) {
      this.commitAction({ date: new Date().toISOString(), type: 'WORK_SESSION', title, amount: hours, description: notes, linkedSignalId: signalId });
  }
}

export const guestDB = new GuestDatabase();
