import { useState, useEffect } from 'react';
import { useLedger } from '../../context/LedgerContext';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { BookOpen, X, ChevronRight } from 'lucide-react';

export const AutoJournalModal = () => {
  const { activeJournalPrompt, closeJournalPrompt, addJournalEntry } = useLedger();
  const [userResponse, setUserResponse] = useState('');

  useEffect(() => {
    setUserResponse('');
  }, [activeJournalPrompt]);

  if (!activeJournalPrompt) return null;

  const { engineResult, type } = activeJournalPrompt;

  const handleSave = () => {
    const fullContent = `${engineResult.synthesis}\n\nOperator Response:\n> ${userResponse}`;

    addJournalEntry({
      date: new Date().toISOString(),
      content: fullContent,
      tags: ['system_audit', type.toLowerCase()]
    });

    closeJournalPrompt();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <GlassCard className="w-full max-w-2xl p-0 overflow-hidden relative shadow-[0_0_40px_rgba(59,130,246,0.15)] border-blue-500/30">

        <button onClick={closeJournalPrompt} className="absolute top-3 md:top-4 right-3 md:right-4 text-gray-500 hover:text-white transition-colors z-10">
            <X size={18} className="md:w-5 md:h-5"/>
        </button>

        {/* HEADER */}
        <div className="p-4 md:p-6 border-b border-white/10 bg-blue-950/20">
           <div className="flex items-center gap-2 md:gap-3 text-blue-400 mb-1">
             <BookOpen size={16} className="md:w-5 md:h-5"/>
             <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">System Intercept: Journal</span>
           </div>
           <h2 className="text-xl md:text-2xl font-bold text-white pr-6">{engineResult.title}</h2>
        </div>

        {/* MACHINE SYNTHESIS */}
        <div className="p-4 md:p-6 bg-black/40 text-gray-300 text-xs md:text-sm leading-relaxed border-b border-white/5 font-mono max-h-[150px] md:max-h-none overflow-y-auto">
           <span className="text-blue-500 font-bold uppercase text-[9px] md:text-[10px] block mb-1.5 md:mb-2 tracking-widest">Context Hydration</span>
           {engineResult.synthesis}
        </div>

        {/* PSYCHOLOGICAL PROMPT */}
        <div className="p-4 md:p-6 bg-black/60">
           <div className="flex items-start gap-1.5 md:gap-2 text-white font-bold mb-3 md:mb-4 text-sm md:text-base">
             <ChevronRight className="text-blue-500 shrink-0 mt-0.5 md:w-4 md:h-4" size={14} />
             <span>{engineResult.prompt}</span>
           </div>

           <textarea 
              className="w-full bg-white/5 border border-white/10 rounded-lg md:rounded-xl p-3 md:p-4 text-xs md:text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors min-h-[90px] md:min-h-[120px] resize-none"
              placeholder="Enter operator notes..."
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              autoFocus
           />
        </div>

        {/* ACTION FOOTER */}
        <div className="p-3 md:p-4 bg-black/80 flex justify-between items-center border-t border-white/10">
           <button onClick={closeJournalPrompt} className="text-[10px] md:text-xs text-gray-500 hover:text-white transition-colors font-bold uppercase tracking-widest">Skip</button>
           <GlassButton onClick={handleSave} disabled={!userResponse.trim()} className="text-[10px] md:text-sm py-2 px-4 md:py-2.5 md:px-6">
             Commit Entry
           </GlassButton>
        </div>

      </GlassCard>
    </div>
  );
};
