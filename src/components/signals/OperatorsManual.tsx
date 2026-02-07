import { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { 
  X, ChevronRight, BookOpen, Anchor, Activity, Dumbbell, 
  ShieldAlert, Wrench, Archive, Zap, ArrowRight, Copy 
} from 'lucide-react';

// --- (Keep all your existing Interfaces and MANUAL_CHAPTERS const here) ---
// I'm assuming you have the MANUAL_CHAPTERS constant defined as in your snippet.
// If you moved it to a separate file, import it. Otherwise keep it here.
import { MANUAL_CHAPTERS } from './manualContent'; // OR define it locally as you did

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialChapterId?: string; 
  onAction?: (actionId: string) => void;
}

export const OperatorsManual = ({ isOpen, onClose, initialChapterId, onAction }: Props) => {
  // Safe default
  const defaultChapterId = MANUAL_CHAPTERS?.[0]?.id || 'manifesto';
  const [activeChapterId, setActiveChapterId] = useState(initialChapterId || defaultChapterId);

  useEffect(() => { 
    if (initialChapterId) {
      setActiveChapterId(initialChapterId);
    }
  }, [initialChapterId]);

  const activeChapter = MANUAL_CHAPTERS.find(c => c.id === activeChapterId) || MANUAL_CHAPTERS[0];

  const getIcon = (name: string) => {
    switch(name) {
      case 'Anchor': return <Anchor size={18}/>;
      case 'Activity': return <Activity size={18}/>;
      case 'Dumbbell': return <Dumbbell size={18}/>;
      case 'ShieldAlert': return <ShieldAlert size={18}/>;
      case 'Wrench': return <Wrench size={18}/>;
      case 'Archive': return <Archive size={18}/>;
      default: return <BookOpen size={18}/>;
    }
  };

  return (
    <div 
      className={`
        fixed inset-0 z-[200] 
        transition-transform duration-500 ease-in-out 
        flex flex-col 
        bg-black/95 backdrop-blur-xl 
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}
      `}
    >
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 z-[210] p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors shadow-lg border border-white/10"
        title="Close Manual"
      >
        <X size={24}/>
      </button>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full md:p-8 overflow-hidden pt-16 md:pt-8">
        {/* SIDEBAR */}
        <div className="w-full md:w-1/4 md:h-full border-b md:border-b-0 md:border-r border-white/10 overflow-y-auto p-4 bg-black/40 md:bg-transparent shrink-0">
          <div className="mb-6 hidden md:block">
            <h2 className="text-2xl font-bold text-white">The Codex</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Operator's Manual v2.0</p>
          </div>
          <div className="space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-visible pb-2 md:pb-0 gap-2 md:gap-0">
            {MANUAL_CHAPTERS.map(chapter => (
              <button 
                key={chapter.id} 
                onClick={() => setActiveChapterId(chapter.id)} 
                className={`
                  w-auto md:w-full flex items-center justify-between p-3 md:p-4 rounded-xl border transition-all whitespace-nowrap md:whitespace-normal
                  ${activeChapterId === chapter.id 
                    ? 'bg-white/10 border-white/20 text-white shadow-lg' 
                    : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}
                `}
              >
                <div className="flex items-center gap-3">
                  {getIcon(chapter.icon)}
                  <span className="font-bold text-sm">{chapter.title}</span>
                </div>
                {activeChapterId === chapter.id && <ChevronRight size={16} className="hidden md:block"/>}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 h-full overflow-y-auto p-6 md:pl-12 pb-32">
          <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
             {/* ... (Existing Content Rendering Logic) ... */}
            {activeChapter.content.map((block: any, idx: number) => (
              <div key={idx}>
                {block.type === 'header' && (
                  <div className="mb-6 border-b border-white/10 pb-4">
                    <h1 className="text-3xl font-bold text-white mb-2">{block.text}</h1>
                    <p className="text-gray-400">{block.description}</p>
                  </div>
                )}
                {/* ... (Rest of your block renderers here) ... */}
                {/* To save space I am not pasting the massive renderer block again 
                    as your logic there was perfect. Just keep the render logic from your snippet. 
                */}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
