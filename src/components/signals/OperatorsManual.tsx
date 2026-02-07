import { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { MANUAL_CHAPTERS } from '../../data/manual_content';
import { X, ChevronRight, BookOpen, Anchor, Activity, Dumbbell, ShieldAlert, Wrench, Archive, Zap, ArrowRight, Copy } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialChapterId?: string; 
  onAction?: (actionId: string) => void;
}

export const OperatorsManual = ({ isOpen, onClose, initialChapterId, onAction }: Props) => {
  const [activeChapterId, setActiveChapterId] = useState(initialChapterId || MANUAL_CHAPTERS[0].id);

  useEffect(() => { if (initialChapterId) setActiveChapterId(initialChapterId); }, [initialChapterId]);

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
    <div className={`fixed inset-0 z-[200] transition-transform duration-500 ease-in-out flex flex-col bg-black/95 backdrop-blur-xl ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
      <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-white/10 rounded-full text-white md:hidden"><X size={20}/></button>
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full md:p-8 overflow-hidden">
        <div className="w-full md:w-1/4 md:h-full border-b md:border-b-0 md:border-r border-white/10 overflow-y-auto p-4 bg-black/40 md:bg-transparent shrink-0">
          <div className="mb-6 hidden md:block"><h2 className="text-2xl font-bold text-white">The Codex</h2><p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Operator's Manual v2.0</p></div>
          <div className="space-y-2">
            {MANUAL_CHAPTERS.map(chapter => (
              <button key={chapter.id} onClick={() => setActiveChapterId(chapter.id)} className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${activeChapterId === chapter.id ? 'bg-white/10 border-white/20 text-white shadow-lg' : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
                <div className="flex items-center gap-3">{getIcon(chapter.icon)}<span className="font-bold text-sm">{chapter.title}</span></div>
                {activeChapterId === chapter.id && <ChevronRight size={16}/>}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 h-full overflow-y-auto p-6 md:pl-12 pb-24">
          <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            {activeChapter.content.map((block: any, idx: number) => (
              <div key={idx}>
                {block.type === 'header' && <div className="mb-6 border-b border-white/10 pb-4"><h1 className="text-3xl font-bold text-white mb-2">{block.text}</h1><p className="text-gray-400">{block.description}</p></div>}
                {block.type === 'action' && <button onClick={() => { if (onAction) onAction(block.actionId); onClose(); }} className={`w-full p-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-lg ${block.variant === 'primary' ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'}`}>{block.variant === 'primary' ? <Zap size={18}/> : <ArrowRight size={18}/>}{block.label}</button>}
                {block.type === 'section' && <GlassCard className="p-6"><h3 className="text-xl font-bold text-white mb-3">{block.title}</h3><div className="text-gray-300 text-sm whitespace-pre-wrap">{block.body}</div></GlassCard>}
                {block.type === 'callout' && <div className={`p-4 rounded-xl border-l-4 mb-4 ${block.variant === 'success' ? 'bg-green-500/10 border-green-500 text-green-300' : 'bg-blue-500/10 border-blue-500 text-blue-300'}`}><p className="font-bold text-sm italic">"{block.text}"</p></div>}
                {block.type === 'card_grid' && <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">{block.items?.map((item: any, i: number) => (<div key={i} className={`p-4 rounded-xl border bg-white/5 ${block.variant === 'danger' ? 'border-red-500/30' : 'border-white/10'}`}><h4 className={`font-bold text-sm mb-2 ${block.variant === 'danger' ? 'text-red-400' : 'text-white'}`}>{item.title}</h4><p className="text-xs text-gray-400">{item.body}</p></div>))}</div>}
                {block.type === 'code_block' && <div className="mb-6"><div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-gray-500 uppercase">{block.label}</span><button onClick={() => navigator.clipboard.writeText(block.code)} className="text-xs text-blue-400 flex items-center gap-1 hover:text-white"><Copy size={12}/> Copy</button></div><pre className="bg-black/50 p-4 rounded-xl border border-white/10 text-xs text-gray-300 font-mono whitespace-pre-wrap">{block.code}</pre></div>}
                {block.type === 'table' && <div className="overflow-x-auto mb-6 rounded-xl border border-white/10"><table className="w-full text-left"><thead className="bg-white/10 text-white text-xs uppercase"><tr>{block.headers?.map((h: string, i: number) => (<th key={i} className="p-3 font-bold">{h}</th>))}</tr></thead><tbody className="divide-y divide-white/5 text-sm text-gray-300">{block.rows?.map((row: string[], r: number) => (<tr key={r} className="hover:bg-white/5">{row.map((cell, c) => (<td key={c} className="p-3">{cell}</td>))}</tr>))}</tbody></table></div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
