import { useState } from 'react';
import { useLedger } from '../context/LedgerContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { 
  Shield, Book, Zap, ChevronDown, ChevronUp, Lock, 
  Anchor, Activity, Skull, AlertTriangle, Eye, CheckCircle2 
} from 'lucide-react';

export const Constitution = () => {
  const [activeTab, setActiveTab] = useState<'CONSTITUTION' | 'PLAYBOOK' | 'MANUAL'>('CONSTITUTION');

  return (
    <div className="max-w-4xl mx-auto p-3 md:p-8 pb-20 md:pb-24 space-y-5 md:space-y-8 animate-fade-in">

      {/* HEADER */}
      <div className="text-center space-y-1 md:space-y-2 mb-5 md:mb-8">
        <Shield className="w-10 h-10 md:w-12 md:h-12 mx-auto text-white mb-2 md:mb-4 opacity-80" />
        <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight">System Core</h1>
        <p className="text-[10px] md:text-sm text-gray-400">Operating Principles & Technical Manual v2.0</p>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex p-1 bg-white/5 rounded-lg md:rounded-xl border border-white/10">
        <button 
          onClick={() => setActiveTab('CONSTITUTION')}
          className={`flex-1 py-2 md:py-3 text-[9px] md:text-sm font-bold rounded-md md:rounded-lg transition-all flex items-center justify-center gap-1.5 md:gap-2 ${activeTab === 'CONSTITUTION' ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'text-gray-400 hover:text-white'}`}
        >
          <Anchor size={14} className="md:w-4 md:h-4"/> 
          <span className="hidden sm:inline">The Constitution</span>
          <span className="sm:hidden">Constitution</span>
        </button>
        <button 
          onClick={() => setActiveTab('PLAYBOOK')}
          className={`flex-1 py-2 md:py-3 text-[9px] md:text-sm font-bold rounded-md md:rounded-lg transition-all flex items-center justify-center gap-1.5 md:gap-2 ${activeTab === 'PLAYBOOK' ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'text-gray-400 hover:text-white'}`}
        >
          <Zap size={14} className="md:w-4 md:h-4"/> 
          <span className="hidden sm:inline">The Playbook</span>
          <span className="sm:hidden">Playbook</span>
        </button>
        <button 
          onClick={() => setActiveTab('MANUAL')}
          className={`flex-1 py-2 md:py-3 text-[9px] md:text-sm font-bold rounded-md md:rounded-lg transition-all flex items-center justify-center gap-1.5 md:gap-2 ${activeTab === 'MANUAL' ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'text-gray-400 hover:text-white'}`}
        >
          <Book size={14} className="md:w-4 md:h-4"/> 
          <span className="hidden sm:inline">System Manual</span>
          <span className="sm:hidden">Manual</span>
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="min-h-[400px] md:min-h-[500px]">
        {activeTab === 'CONSTITUTION' && <ConstitutionTab />}
        {activeTab === 'PLAYBOOK' && <PlaybookTab />}
        {activeTab === 'MANUAL' && <ManualTab />}
      </div>

    </div>
  );
};

// --- TAB 1: THE CONSTITUTION ---
const ConstitutionTab = () => {
  const { commitAction } = useLedger();
  const [isRatified, setIsRatified] = useState(false);

  const handleRatify = () => {
    commitAction({
      date: new Date().toISOString(),
      type: 'CONSTITUTION_AMENDMENT',
      title: 'Constitution Ratified',
      description: 'Operator digitally signed and reaffirmed the core operating principles.',
      tags: ['governance', 'mindset']
    });
    setIsRatified(true);
    setTimeout(() => setIsRatified(false), 3000);
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
        {/* MISSION STATEMENT */}
        <GlassCard className="p-4 md:p-8 border-l-[3px] md:border-l-4 border-green-500">
        <h2 className="text-lg md:text-2xl font-bold text-white mb-3 md:mb-4">The Mission</h2>
        <div className="space-y-3 md:space-y-4 text-gray-300 leading-relaxed text-[11px] md:text-base">
            <p className="font-mono text-green-400 font-bold mb-2 md:mb-4">"My income is not a windfall. It is capital. This system is how I deploy it."</p>
            <ul className="space-y-2 md:space-y-3">
            <li className="flex gap-2.5 md:gap-3">
                <span className="text-green-500 font-bold shrink-0">01.</span>
                <span>I am building this to never go broke and wonder "what happened" again.</span>
            </li>
            <li className="flex gap-2.5 md:gap-3">
                <span className="text-green-500 font-bold shrink-0">02.</span>
                <span>To secure my future, not prove anything to others.</span>
            </li>
            <li className="flex gap-2.5 md:gap-3">
                <span className="text-green-500 font-bold shrink-0">03.</span>
                <span>To buy <strong className="text-white">time, freedom, and options</strong> — not things, status, or validation.</span>
            </li>
            </ul>
        </div>
        </GlassCard>

        {/* CORE PRINCIPLES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <GlassCard className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3 text-blue-400">
            <Shield size={16} className="md:w-5 md:h-5" />
            <h3 className="font-bold text-white text-sm md:text-base">Security First</h3>
            </div>
            <p className="text-[10px] md:text-xs text-gray-400 leading-relaxed font-bold">
            Pay Future Self first, Present Self second. The Buffer (10%) is sacred. My system protects me from others AND from myself.
            </p>
        </GlassCard>

        <GlassCard className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3 text-yellow-400">
            <Eye size={16} className="md:w-5 md:h-5" />
            <h3 className="font-bold text-white text-sm md:text-base">Stealth Wealth</h3>
            </div>
            <p className="text-[10px] md:text-xs text-gray-400 leading-relaxed font-bold">
            Live invisibly secure, not visibly rich. Money in the Treasury does not exist for spending. Silence is my best defense.
            </p>
        </GlassCard>
        </div>

        {/* THE ACCOUNT MAP */}
        <GlassCard className="p-4 md:p-6">
        <h3 className="font-bold text-white mb-4 md:mb-6 flex items-center gap-1.5 md:gap-2 text-sm md:text-base">
            <Activity size={16} className="md:w-[18px] md:h-[18px]"/> The Flow of Capital
        </h3>
        <div className="space-y-4 md:space-y-4 relative">
            <div className="absolute left-[15px] md:left-[19px] top-4 bottom-4 w-[1px] md:w-0.5 bg-white/10" />

            {/* HOLDING */}
            <div className="relative flex items-start gap-3 md:gap-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 z-10 text-white font-bold text-xs md:text-sm">1</div>
            <div>
                <h4 className="text-white font-bold text-xs md:text-sm mt-1 md:mt-0">Holding Pen (USD/NGN)</h4>
                <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1 font-bold">The Quarantine Zone. Receives 100% of drops. Money sits here for 24h+ before Triage.</p>
            </div>
            </div>

            {/* TREASURY */}
            <div className="relative flex items-start gap-3 md:gap-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center shrink-0 z-10 text-blue-400 font-bold text-xs md:text-sm">2</div>
            <div>
                <h4 className="text-blue-400 font-bold text-xs md:text-sm mt-1 md:mt-0">The Treasury (USD)</h4>
                <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1 font-bold">The Runway. Money here is strictly for future salary payments. NEVER accessed directly.</p>
            </div>
            </div>

            {/* PAYROLL */}
            <div className="relative flex items-start gap-3 md:gap-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center shrink-0 z-10 text-green-400 font-bold text-xs md:text-sm">3</div>
            <div>
                <h4 className="text-green-400 font-bold text-xs md:text-sm mt-1 md:mt-0">Payroll (NGN)</h4>
                <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1 font-bold">The Life. Funded monthly via Triage. This is the only money that exists for daily life.</p>
            </div>
            </div>
        </div>
        </GlassCard>

        {/* DIGITAL SIGNATURE / RATIFICATION */}
        <div className="pt-4 md:pt-6 border-t border-white/10 text-center">
            <p className="text-[9px] md:text-xs text-gray-500 mb-3 md:mb-4 font-mono font-bold">By ratifying this document, you reaffirm your commitment to the Sovereign System.</p>
            <GlassButton 
                onClick={handleRatify} 
                disabled={isRatified}
                className={`text-xs md:text-sm py-2 md:py-3 px-6 ${isRatified ? 'bg-green-500/20 text-green-400 border-green-500/50' : ''}`}
            >
                {isRatified ? <><CheckCircle2 size={14} className="md:w-4 md:h-4 mr-1.5 md:mr-2"/> Ratified in Ledger</> : 'Acknowledge & Ratify'}
            </GlassButton>
        </div>
    </div>
  );
};

// --- TAB 2: THE PLAYBOOK (Drills) ---
const PlaybookTab = () => (
  <div className="space-y-3 md:space-y-4 animate-fade-in">
    <Accordion title="Generosity Firewall (The Scripts)" icon={<Shield size={16} className="md:w-[18px] md:h-[18px] text-blue-400"/>}>
      <div className="space-y-3 md:space-y-4">
        <div className="p-2.5 md:p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          <h4 className="text-red-400 font-bold text-[10px] md:text-xs uppercase mb-1.5 md:mb-2">The Auto-NO List</h4>
          <ul className="text-[10px] md:text-xs text-gray-300 space-y-1 list-disc pl-4 font-bold">
            <li>"Just this once" <span className="text-gray-500 font-normal">(It never is)</span></li>
            <li>"I'll pay you back" <span className="text-gray-500 font-normal">(They won't)</span></li>
            <li>"You have money now" <span className="text-gray-500 font-normal">(Guilt trip)</span></li>
            <li>"Are you too big for us?" <span className="text-gray-500 font-normal">(Manipulation)</span></li>
          </ul>
        </div>

        <div className="space-y-2.5 md:space-y-3">
          <ScriptBlock 
            label="For Tier 3 (Acquaintances)" 
            script="I'm on a strict financial plan to secure my family's future. My budget is closed for this month." 
          />
          <ScriptBlock 
            label="For 'Pay Back' Promises" 
            script="I don't lend money. If I help, it's a gift. And I cannot gift right now." 
          />
          <ScriptBlock 
            label="For Entitlement" 
            script="No." 
          />
        </div>
      </div>
    </Accordion>

    <Accordion title="The 72-Hour Rule (Impulse Control)" icon={<Lock size={16} className="md:w-[18px] md:h-[18px] text-yellow-400"/>}>
      <div className="space-y-2 md:space-y-3">
        <p className="text-[10px] md:text-xs text-gray-400 font-bold">For any unplanned purchase over ₦50,000:</p>
        <div className="flex gap-2.5 md:gap-3 items-center p-2.5 md:p-3 bg-white/5 rounded-lg">
          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] md:text-xs font-bold text-white shrink-0">1</div>
          <span className="text-xs md:text-sm text-gray-300 font-bold">Wait 72 Hours. No exceptions.</span>
        </div>
        <div className="flex gap-2.5 md:gap-3 items-center p-2.5 md:p-3 bg-white/5 rounded-lg">
          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] md:text-xs font-bold text-white shrink-0">2</div>
          <span className="text-xs md:text-sm text-gray-300 font-bold">Re-read Page 1 of the Manual.</span>
        </div>
        <div className="flex gap-2.5 md:gap-3 items-start md:items-center p-2.5 md:p-3 bg-white/5 rounded-lg">
          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] md:text-xs font-bold text-white shrink-0 mt-0.5 md:mt-0">3</div>
          <div className="text-xs md:text-sm text-gray-300">
            Ask: Does this buy <strong className="text-white">TIME, FREEDOM, or OPTIONS?</strong>
            <br/>
            <span className="text-[9px] md:text-xs text-gray-500 font-bold block mt-0.5">If NO → Don't buy. If YES → Create a Goal.</span>
          </div>
        </div>
      </div>
    </Accordion>

    <Accordion title="Emergency Protocols" icon={<AlertTriangle size={16} className="md:w-[18px] md:h-[18px] text-red-500"/>}>
      <div className="space-y-3 md:space-y-4">
        <div>
          <h4 className="font-bold text-white text-xs md:text-sm mb-0.5 md:mb-1">Scenario: Ran out of Payroll early</h4>
          <p className="text-[10px] md:text-xs text-gray-400 mb-1.5 md:mb-2 font-bold">DO NOT withdraw from Treasury. DO NOT break a Goal.</p>
          <div className="p-2 bg-white/5 rounded border-l-2 border-green-500 text-[10px] md:text-xs text-gray-300 font-bold">
            PROTOCOL: Survive until the 1st. Eat home. Walk. This is the discipline test.
          </div>
        </div>
        <div>
          <h4 className="font-bold text-white text-xs md:text-sm mb-0.5 md:mb-1">Scenario: Dry Spell (3+ Mo)</h4>
          <p className="text-[10px] md:text-xs text-gray-400 mb-1.5 md:mb-2 font-bold">Panic about future. Urge to trade desperately.</p>
          <div className="p-2 bg-white/5 rounded border-l-2 border-blue-500 text-[10px] md:text-xs text-gray-300 font-bold">
            PROTOCOL: This is why Runway exists. Check Treasury. If &gt;3 months, stay calm and trust the system.
          </div>
        </div>
      </div>
    </Accordion>

    <Accordion title="Big Drop Playbook ($10k+)" icon={<Zap size={16} className="md:w-[18px] md:h-[18px] text-purple-400"/>}>
      <ul className="space-y-2.5 md:space-y-3 text-[11px] md:text-sm text-gray-300 font-bold">
        <li className="flex gap-2.5 md:gap-3">
          <span className="text-purple-400 font-mono shrink-0 w-10">0-24h</span>
          <span><strong>Silence Protocol.</strong> Tell NO ONE. Close the app. Do not triage yet.</span>
        </li>
        <li className="flex gap-2.5 md:gap-3">
          <span className="text-purple-400 font-mono shrink-0 w-10">24-48h</span>
          <span><strong>Review.</strong> Ask: "Who am I becoming? The person who blows it, or the person who builds?"</span>
        </li>
        <li className="flex gap-2.5 md:gap-3">
          <span className="text-purple-400 font-mono shrink-0 w-10">48h+</span>
          <span><strong>Triage Execution.</strong> Calculate Generosity Cap. Fund Buffer. Lock the rest in Cold Storage.</span>
        </li>
      </ul>
    </Accordion>
  </div>
);

// --- TAB 3: SYSTEM MANUAL (User Guide) ---
const ManualTab = () => (
  <div className="space-y-4 md:space-y-6 animate-fade-in">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">

      <GlassCard className="p-4 md:p-5">
        <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 text-white">
          <Eye size={14} className="md:w-4 md:h-4"/> <h3 className="font-bold text-xs md:text-sm">Ghost Mode</h3>
        </div>
        <p className="text-[10px] md:text-xs text-gray-400 mb-2 md:mb-3 font-bold">
          A privacy layer for public environments. Grayscales the interface and dims values to prevent shoulder-surfing.
        </p>
        <div className="text-[9px] md:text-[10px] text-gray-500 font-mono bg-white/5 p-1.5 md:p-2 rounded font-bold">
          STATUS: Toggle via System Configuration (Settings).
        </div>
      </GlassCard>

      <GlassCard className="p-4 md:p-5">
        <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 text-white">
          <Lock size={14} className="md:w-4 md:h-4"/> <h3 className="font-bold text-xs md:text-sm">Sovereign Typer</h3>
        </div>
        <p className="text-[10px] md:text-xs text-gray-400 mb-2 md:mb-3 font-bold">
          Cognitive friction security. Before accessing critical settings (Nuke/Reset), you must type a randomly generated command phrase exactly.
        </p>
        <div className="text-[9px] md:text-[10px] text-gray-500 font-mono bg-white/5 p-1.5 md:p-2 rounded font-bold">
          PURPOSE: Prevents accidental or emotional destruction of data.
        </div>
      </GlassCard>

      <GlassCard className="p-4 md:p-5">
        <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 text-white">
          <Zap size={14} className="md:w-4 md:h-4"/> <h3 className="font-bold text-xs md:text-sm">Smart Auto-Journal</h3>
        </div>
        <p className="text-[10px] md:text-xs text-gray-400 mb-2 md:mb-3 font-bold">
          The system actively watches your decisions (Budget breaches, Signal kills, CSV Data Lake ingests) and prompts you for psychological context.
        </p>
        <div className="text-[9px] md:text-[10px] text-gray-500 font-mono bg-white/5 p-1.5 md:p-2 rounded font-bold">
          ACTION: Logs are saved to the Journal tab alongside manual entries.
        </div>
      </GlassCard>

      <GlassCard className="p-4 md:p-5 border-red-500/20">
        <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 text-red-400">
          <Skull size={14} className="md:w-4 md:h-4"/> <h3 className="font-bold text-xs md:text-sm">Nuclear Protocols</h3>
        </div>
        <p className="text-[10px] md:text-xs text-gray-400 mb-2 md:mb-3 font-bold">
          Located in Settings. Allows granular wiping of specific databases (e.g., wipe only Goals, or wipe only Ingestions).
        </p>
        <div className="text-[9px] md:text-[10px] text-red-400/80 font-mono bg-red-500/10 p-1.5 md:p-2 rounded border border-red-500/20 font-bold">
          WARNING: Action is irreversible. History Ledger will record the event.
        </div>
      </GlassCard>

    </div>
  </div>
);

// --- HELPER COMPONENTS ---
const ScriptBlock = ({ label, script }: { label: string, script: string }) => (
  <div className="space-y-0.5 md:space-y-1">
    <span className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase">{label}</span>
    <div className="p-2 md:p-3 bg-white/5 rounded-lg border-l-2 border-white/20 text-[11px] md:text-xs text-white italic font-bold">
      "{script}"
    </div>
  </div>
);

const Accordion = ({ title, icon, children }: { title: string, icon: any, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-lg md:rounded-xl overflow-hidden bg-white/5 transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 md:p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 md:gap-3">
          {icon}
          <span className="font-bold text-white text-xs md:text-sm">{title}</span>
        </div>
        {isOpen ? <ChevronUp size={14} className="md:w-4 md:h-4 text-gray-500"/> : <ChevronDown size={14} className="md:w-4 md:h-4 text-gray-500"/>}
      </button>
      {isOpen && (
        <div className="p-3 md:p-4 pt-0 border-t border-white/5 animate-fade-in mt-2 md:mt-4">
          {children}
        </div>
      )}
    </div>
  );
};
