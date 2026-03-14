import { useState, useEffect } from 'react';
import { useLedger } from '../../context/LedgerContext';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { BookOpen, X, ChevronRight } from 'lucide-react';

export const AutoJournalModal = () => {
  const { activeJournalPrompt, closeJournalPrompt, addJournalEntry } = useLedger();
  const [userResponse, setUserResponse] = useState('');

  // Reset text field when a new prompt triggers
  useEffect(() => {
    setUserResponse('');
  }, [activeJournalPrompt]);

  if (!activeJournalPrompt) return null;

  const { engineResult, type } = activeJournalPrompt;

  const handleSave = () => {
    // Combine the machine's context and the human's response
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
        
        <button onClick={closeJournalPrompt} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10">
            <X size={20}/>
        </button>

        {/* HEADER */}
        <div className="p-6 border-b border-white/10 bg-blue-950/20">
           <div className="flex items-center gap-3 text-blue-400 mb-1">
             <BookOpen size={20}/>
             <span className="text-xs font-bold uppercase tracking-widest">System Intercept: Journal Event</span>
           </div>
           <h2 className="text-2xl font-bold text-white">{engineResult.title}</h2>
        </div>

        {/* MACHINE SYNTHESIS (The Hydrated Context) */}
        <div className="p-6 bg-black/40 text-gray-300 text-sm leading-relaxed border-b border-white/5 font-mono">
           <span className="text-blue-500 font-bold uppercase text-[10px] block mb-2 tracking-widest">Context Hydration</span>
           {engineResult.synthesis}
        </div>

        {/* PSYCHOLOGICAL PROMPT */}
        <div className="p-6 bg-black/60">
           <div className="flex items-start gap-2 text-white font-bold mb-4">
             <ChevronRight className="text-blue-500 shrink-0 mt-0.5" size={16}/>
             <span>{engineResult.prompt}</span>
           </div>
           
           <textarea 
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors min-h-[120px] resize-none"
              placeholder="Enter operator notes..."
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              autoFocus
           />
        </div>

        {/* ACTION FOOTER */}
        <div className="p-4 bg-black/80 flex justify-between items-center border-t border-white/10">
           <button onClick={closeJournalPrompt} className="text-xs text-gray-500 hover:text-white transition-colors">Dismiss (Skip Journal)</button>
           <GlassButton onClick={handleSave} disabled={!userResponse.trim()}>
             Commit Ledger Entry
           </GlassButton>
        </div>

      </GlassCard>
    </div>
  );
};
