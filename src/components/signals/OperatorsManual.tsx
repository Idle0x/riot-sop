import { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { 
  X, ChevronRight, BookOpen, Anchor, Activity, Dumbbell, 
  ShieldAlert, Wrench, Archive, Zap, ArrowRight, Copy 
} from 'lucide-react';

// --- DATA STRUCTURE ---
interface ManualBlock {
  type: 'header' | 'action' | 'section' | 'callout' | 'card_grid' | 'code_block' | 'table' | 'accordion' | 'process_flow';
  [key: string]: any;
}

interface ManualChapter {
  id: string;
  title: string;
  icon: string;
  content: ManualBlock[];
}

// --- FULL CONTENT DATA ---
export const MANUAL_CHAPTERS: ManualChapter[] = [
  {
    id: 'manifesto',
    title: 'I. The Manifesto',
    icon: 'Anchor',
    content: [
      { type: 'header', text: 'The 4 Core Rules', description: 'My operating philosophy.' },
      {
        type: 'card_grid',
        items: [
          { title: 'Signal > Noise', body: 'I am a contributor, not a farmer. I add value, I do not just extract it.' },
          { title: 'Leverage > Loyalty', body: 'My work is a portable asset (my resume). I build my brand, not just their project.' },
          { title: 'PoW is Meta', body: 'I build provable assets (code, guides, dashboards) that bots cannot fake.' },
          { title: 'Skepticism is Filter', body: 'I cut losses immediately. Sunk cost is the enemy.' }
        ]
      },
      {
        type: 'callout',
        variant: 'success',
        text: 'Daily Affirmation: "I am building a portfolio, not chasing handouts. My consistency is my advantage. In six months, I will be undeniable."'
      },
      {
        type: 'section',
        title: 'The Sovereign Mindset',
        body: `Why do we use "Burn Cap"? Because lifestyle creep kills freedom faster than market crashes.\nWhy "Ghost Mode"? Because silence is the best defense against social engineering.\nThis app is not a calculator. It is a behavior modification engine.`
      }
    ]
  },
  {
    id: 'engine',
    title: 'II. The Engine',
    icon: 'Activity',
    content: [
      { type: 'header', text: 'The Hunter-Creator Loop', description: 'The two-part engine my daily habits serve.' },
      {
        type: 'process_flow',
        steps: [
          { 
            title: '1. The Hunter (Find Alpha)', 
            desc: 'Goal: Find high-value projects before the crowd. Filter out 95% of noise.',
            tools: [{ label: 'DefiLlama', url: 'https://defillama.com' }]
          },
          { 
            title: '2. The Creator (Build Proof)', 
            desc: 'Goal: Turn activity into a public, portable asset.',
            tools: [{ label: 'Mirror', url: 'https://mirror.xyz' }]
          }
        ]
      },
      {
        type: 'section',
        title: 'AI Leverage (2026)',
        body: 'Do not read whitepapers raw. Use LLMs to "Roast this tokenomics model looking for inflation cliffs." Use Perplexity to "Find the VC backing for [Project]."'
      }
    ]
  },
  {
    id: 'gym',
    title: 'III. The Gym',
    icon: 'Dumbbell',
    content: [
      { type: 'header', text: 'The 10 Skills', description: 'Menu for "Block 3: Skill Grind". Pick one to build your weekly asset.' },
      { type: 'action', actionId: 'open_drill', label: '⚡ Initiate New Drill Sequence', variant: 'primary' },
      {
        type: 'accordion',
        items: [
          { title: '1. Mastering Research (Hunter)', content: 'Action: Track 5 VC wallets on Arkham. Set alerts for new seed investments.' },
          { title: '2. On-Chain Investigation', content: 'Action: Fork a Dune dashboard. Change one parameter (e.g., 30d to 90d view).' },
          { title: '3. Technical Writing', content: 'Action: Write a "Micro-Guide" for a node error you just solved. Post on X.' }
        ]
      }
    ]
  },
  {
    id: 'filters',
    title: 'IV. The Filters',
    icon: 'ShieldAlert',
    content: [
      { type: 'header', text: 'Red Flag Library', description: 'If you see these, RUN. Do not "fix" them.' },
      { type: 'action', actionId: 'open_triage', label: '💸 Go to Triage (Secure Funds)', variant: 'secondary' },
      {
        type: 'card_grid',
        variant: 'danger',
        items: [
          { title: 'The Hypocrite', body: 'Complains about "farmers" but only offers Galxe/Zealy quests.' },
          { title: 'No Product', body: 'Roadmap is all "Community" and "TBD". No testnet, no mainnet.' }
        ]
      },
      {
        type: 'section',
        title: 'Security 2.0 (AI Defense)',
        body: `**The Discord Clone:** AI bots now clone entire servers. Always verify the "Mutual Servers" or use the official website link every time.\n**The Deepfake Call:** Never trust a video call for money transfers. Voice/Video can be faked in real-time.`
      }
    ]
  },
  {
    id: 'toolkit',
    title: 'V. The Toolkit',
    icon: 'Wrench',
    content: [
      { type: 'header', text: 'Communication Templates', description: 'Copy, paste, edit. Don\'t start from blank.' },
      {
        type: 'code_block',
        label: 'Discovery Post (X/Twitter)',
        code: `Looked at [Project] today.\n\nInitial checks:\n- GitHub: [Active/Dead]\n- Product: [Working/Vaporware]\n- Backing: [VC names]\n\nResult: [Pass/Reject] because [reason].\n\nNext: Digging into docs + Discord.`
      }
    ]
  },
  {
    id: 'protocol_z',
    title: 'VII. Protocol Z',
    icon: 'Archive',
    content: [
      { type: 'header', text: 'Maintenance & Compliance', description: 'How to survive the game (Burnout & Taxes).' },
      {
        type: 'section',
        title: 'The Burnout Protocol',
        body: `1. **Liquidate:** Close high-maintenance positions.\n2. **Disconnect:** Unfollow all "News" accounts.\n3. **Touch Grass:** 3 days minimum.`
      },
      { type: 'callout', variant: 'warning', text: 'NTA 2026 Tax Doctrine (Nigeria Context)' },
      {
        type: 'table',
        headers: ['Income Band', 'Tax Rate'],
        rows: [
          ['First ₦800,000', '0% (Exempt)'],
          ['Next ₦2.2 Million', '15%'],
          ['Next ₦9.0 Million', '18%'],
          ['Next ₦13.0 Million', '21%'],
          ['Next ₦25.0 Million', '23%'],
          ['Above ₦50 Million', '25%']
        ]
      },
      {
        type: 'section',
        title: 'Compliance Rule',
        body: 'Freelance foreign earnings must be declared in Naira at official CBN rates. Use the "Tax Shield" slider in Triage to auto-save these percentages.'
      }
    ]
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialChapterId?: string; 
  onAction?: (actionId: string) => void;
}

export const OperatorsManual = ({ isOpen, onClose, initialChapterId, onAction }: Props) => {
  const [activeChapterId, setActiveChapterId] = useState(initialChapterId || MANUAL_CHAPTERS[0].id);

  // Deep Link Observer
  useEffect(() => { 
    if (initialChapterId && isOpen) {
      setActiveChapterId(initialChapterId);
    }
  }, [initialChapterId, isOpen]);

  const activeChapter = MANUAL_CHAPTERS.find(c => c.id === activeChapterId) || MANUAL_CHAPTERS[0];

  const getIcon = (name: string) => {
    const props = { size: 14, className: "md:w-[18px] md:h-[18px]" };
    switch(name) {
      case 'Anchor': return <Anchor {...props}/>;
      case 'Activity': return <Activity {...props}/>;
      case 'Dumbbell': return <Dumbbell {...props}/>;
      case 'ShieldAlert': return <ShieldAlert {...props}/>;
      case 'Wrench': return <Wrench {...props}/>;
      case 'Archive': return <Archive {...props}/>;
      default: return <BookOpen {...props}/>;
    }
  };

  return (
    <div 
      className={`
        fixed inset-0 z-[200] flex flex-col bg-black/95 backdrop-blur-xl 
        transition-transform duration-500 ease-in-out
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}
      `}
    >
      <button 
        onClick={onClose} 
        className="absolute top-4 md:top-6 right-4 md:right-6 z-[210] p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors border border-white/10"
      >
        <X className="w-5 h-5 md:w-6 md:h-6"/>
      </button>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full md:p-8 overflow-hidden pt-14 md:pt-8">

        {/* SIDEBAR NAVIGATION */}
        <div className="w-full md:w-1/4 border-b md:border-b-0 md:border-r border-white/10 overflow-y-auto p-3 md:p-4 bg-black/40 md:bg-transparent shrink-0">
          <div className="mb-6 hidden md:block">
            <h2 className="text-2xl font-bold text-white">The Codex</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Operator's Manual v2.0</p>
          </div>
          <div className="space-y-2 flex flex-row md:flex-col overflow-x-auto gap-2 md:gap-0 scrollbar-hide">
            {MANUAL_CHAPTERS.map(chapter => (
              <button 
                key={chapter.id} 
                onClick={() => setActiveChapterId(chapter.id)} 
                className={`
                  w-auto md:w-full flex items-center justify-between p-2.5 md:p-4 rounded-lg md:rounded-xl border transition-all whitespace-nowrap
                  ${activeChapterId === chapter.id 
                    ? 'bg-white/10 border-white/20 text-white shadow-lg' 
                    : 'bg-transparent border-transparent text-gray-500 hover:text-white hover:bg-white/5'}
                `}
              >
                <div className="flex items-center gap-2 md:gap-3">
                  {getIcon(chapter.icon)}
                  <span className="font-bold text-xs md:text-sm">{chapter.title}</span>
                </div>
                {activeChapterId === chapter.id && <ChevronRight size={16} className="hidden md:block"/>}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT RENDERING ENGINE */}
        <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 md:pl-12 pb-24 md:pb-32">
          <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 animate-fade-in">
            {activeChapter.content.map((block: any, idx: number) => (
              <div key={idx}>
                {block.type === 'header' && (
                  <div className="mb-4 md:mb-6 border-b border-white/10 pb-3 md:pb-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-1.5 md:mb-2 tracking-tight">{block.text}</h1>
                    <p className="text-xs md:text-sm text-gray-400">{block.description}</p>
                  </div>
                )}

                {block.type === 'action' && (
                  <button 
                    onClick={() => { if (onAction) onAction(block.actionId); onClose(); }} 
                    className={`w-full p-3 md:p-4 rounded-xl font-bold text-sm md:text-base flex items-center justify-center gap-2 md:gap-3 transition-all transform hover:scale-[1.02] shadow-lg ${block.variant === 'primary' ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'}`}
                  >
                    {block.variant === 'primary' ? <Zap size={16} className="md:w-[18px] md:h-[18px]"/> : <ArrowRight size={16} className="md:w-[18px] md:h-[18px]"/>}
                    {block.label}
                  </button>
                )}

                {block.type === 'section' && (
                  <GlassCard className="p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3">{block.title}</h3>
                    <div className="text-gray-300 text-xs md:text-sm whitespace-pre-wrap leading-relaxed">{block.body}</div>
                  </GlassCard>
                )}

                {block.type === 'callout' && (
                  <div className={`p-3 md:p-4 rounded-lg md:rounded-xl border-l-[3px] md:border-l-4 mb-3 md:mb-4 ${block.variant === 'success' ? 'bg-green-500/10 border-green-500 text-green-300' : 'bg-yellow-500/10 border-yellow-500 text-yellow-300'}`}>
                    <p className="font-bold text-xs md:text-sm italic">"{block.text}"</p>
                  </div>
                )}

                {block.type === 'card_grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                    {block.items?.map((item: any, i: number) => (
                      <div key={i} className={`p-3 md:p-4 rounded-lg md:rounded-xl border bg-white/5 ${block.variant === 'danger' ? 'border-red-500/30' : 'border-white/10'}`}>
                        <h4 className={`font-bold text-xs md:text-sm mb-1.5 md:mb-2 ${block.variant === 'danger' ? 'text-red-400' : 'text-white'}`}>{item.title}</h4>
                        <p className="text-[10px] md:text-xs text-gray-400">{item.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                {block.type === 'code_block' && (
                  <div className="mb-4 md:mb-6">
                    <div className="flex justify-between items-center mb-1.5 md:mb-2">
                      <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">{block.label}</span>
                      <button onClick={() => navigator.clipboard.writeText(block.code)} className="text-[10px] md:text-xs text-blue-400 flex items-center gap-1 hover:text-white font-bold p-1">
                        <Copy size={12}/> Copy
                      </button>
                    </div>
                    <pre className="bg-black/50 p-3 md:p-4 rounded-lg md:rounded-xl border border-white/10 text-[10px] md:text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto">{block.code}</pre>
                  </div>
                )}

                {block.type === 'table' && (
                  <div className="overflow-x-auto mb-4 md:mb-6 rounded-lg md:rounded-xl border border-white/10">
                    <table className="w-full text-left text-xs md:text-sm text-gray-300 min-w-[300px]">
                      <thead className="bg-white/10 text-white uppercase text-[10px] md:text-xs tracking-wider">
                        <tr>{block.headers?.map((h: string, i: number) => (<th key={i} className="p-2 md:p-3 font-bold">{h}</th>))}</tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {block.rows?.map((row: string[], r: number) => (
                          <tr key={r} className="hover:bg-white/5">
                            {row.map((cell, c) => (<td key={c} className="p-2 md:p-3 font-mono">{cell}</td>))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {block.type === 'accordion' && (
                   <div className="space-y-2">
                      {block.items.map((item: any, i: number) => (
                          <div key={i} className="p-3 md:p-4 rounded-lg md:rounded-xl border border-white/10 bg-white/5">
                             <h4 className="font-bold text-white text-xs md:text-sm mb-1">{item.title}</h4>
                             <p className="text-[10px] md:text-xs text-gray-400">{item.content}</p>
                          </div>
                      ))}
                   </div>
                )}

                {block.type === 'process_flow' && (
                    <div className="space-y-3 md:space-y-4">
                        {block.steps.map((step: any, i: number) => (
                            <div key={i} className="flex gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl border border-white/10 bg-white/5 items-start">
                                <div className="text-[10px] md:text-xs font-bold bg-white/10 px-2 py-1 rounded text-white shrink-0">{i + 1}</div>
                                <div>
                                    <h4 className="font-bold text-white text-xs md:text-sm mb-0.5 md:mb-1">{step.title}</h4>
                                    <p className="text-[10px] md:text-xs text-gray-400 mb-2">{step.desc}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {step.tools.map((t: any, k: number) => (
                                            <a key={k} href={t.url} target="_blank" rel="noreferrer" className="text-[9px] md:text-[10px] text-blue-400 hover:text-white border border-blue-400/30 px-2 py-0.5 rounded hover:bg-blue-400/20 font-bold uppercase tracking-wider">
                                                {t.label}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
