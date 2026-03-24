import { useState } from 'react';
import { useLedger } from '../context/LedgerContext'; 
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { Hash, Calendar, ShieldAlert, User, Cpu } from 'lucide-react';

const AVAILABLE_TAGS = ['Win', 'Fail', 'Lesson', 'Idea', 'Note', 'System'];

export const Journal = () => {
  const { commitAction, addJournalEntry, journals } = useLedger(); 
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const handleSave = () => {
    // 1. Add to Journal Table (The readable text)
    addJournalEntry({
      date: new Date().toISOString(),
      content: content,
      tags: selectedTags
    });

    // 2. Ping Ledger (The chronological autobiography)
    commitAction({
      date: new Date().toISOString(),
      type: 'JOURNAL',
      title: 'Manual Operator Log',
      description: content.slice(0, 50) + '...',
      tags: selectedTags
    });

    setContent('');
    setSelectedTags([]);
  };

  return (
    <div className="max-w-3xl mx-auto p-3 md:p-8 space-y-5 md:space-y-8 pb-16 md:pb-20 animate-fade-in">
      <h1 className="text-xl md:text-3xl font-bold text-white flex items-center gap-2 md:gap-3">
         Captain's Log
      </h1>

      {/* WRITE AREA */}
      <GlassCard className="p-4 md:p-6">
        <textarea 
          className="w-full bg-black/20 border border-white/10 rounded-lg md:rounded-xl p-3 md:p-4 text-sm text-white placeholder:text-gray-600 min-h-[100px] md:min-h-[150px] outline-none focus:border-white/30 resize-none transition-colors"
          placeholder="What happened today? What did you learn?"
          value={content}
          onChange={e => setContent(e.target.value)}
        />

        {/* Tag Selector */}
        <div className="flex flex-wrap gap-1.5 md:gap-2 mt-3 md:mt-4 mb-3 md:mb-4">
          {AVAILABLE_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold border transition-colors ${
                selectedTags.includes(tag) 
                  ? 'bg-white text-black border-white' 
                  : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-500'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center pt-3 md:pt-4 border-t border-white/10">
          <div className="text-[10px] md:text-xs text-gray-500 flex items-center gap-1.5 md:gap-2 font-mono">
            <Calendar size={12} className="md:w-3.5 md:h-3.5"/> {new Date().toLocaleDateString()}
          </div>
          <GlassButton onClick={handleSave} disabled={!content} size="sm" className="text-[10px] md:text-xs px-3 py-1.5 md:py-2">Log Entry</GlassButton>
        </div>
      </GlassCard>

      {/* READ TIMELINE */}
      <div className="space-y-6 md:space-y-8 relative before:absolute before:inset-0 before:ml-4 md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
        {journals.map(entry => {
            // Determine if this is a System Intercept or a Manual Entry
            const isSystemAudit = entry.tags?.includes('system_audit');
            const parts = entry.content.split('Operator Response:');

            // Format the content
            const systemSynthesis = isSystemAudit ? parts[0] : null;
            const operatorResponse = isSystemAudit && parts.length > 1 ? parts[1].replace('>', '').trim() : entry.content;

            return (
              <div key={entry.id} className="relative flex items-start md:items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">

                {/* Center Node */}
                <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full border shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 mt-3 md:mt-0 
                   ${isSystemAudit ? 'bg-blue-950 border-blue-500/50' : 'bg-black border-white/20'}`
                }>
                  {isSystemAudit ? <Cpu size={14} className="md:w-4 md:h-4 text-blue-400"/> : <Hash size={14} className="md:w-4 md:h-4 text-gray-400"/>}
                </div>

                {/* Card */}
                <GlassCard className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-0 overflow-hidden ${isSystemAudit ? 'border-blue-500/30' : 'border-white/5 hover:border-white/10 transition-colors'}`}>

                  {isSystemAudit && (
                     <div className="p-2 md:p-3 bg-blue-500/10 border-b border-blue-500/20 flex items-center gap-1.5 md:gap-2 text-blue-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">
                        <ShieldAlert size={12} className="md:w-3.5 md:h-3.5"/> System Intercept Record
                     </div>
                  )}

                  <div className="p-4 md:p-6">
                      <div className="flex justify-between items-start mb-3 md:mb-4 gap-2">
                        <time className="font-mono text-[10px] md:text-xs text-gray-500">{new Date(entry.date).toLocaleString()}</time>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {entry.tags?.map(t => (
                            <span key={t} className={`text-[8px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded uppercase font-bold tracking-widest ${t === 'system_audit' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-white/10 text-gray-300 border border-white/5'}`}>
                                {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {isSystemAudit ? (
                          <div className="space-y-3 md:space-y-4">
                              <div className="font-mono text-[11px] md:text-xs text-gray-400 leading-relaxed border-l-2 border-blue-500/30 pl-2.5 md:pl-3">
                                  {systemSynthesis}
                              </div>
                              <div className="pt-3 md:pt-4 border-t border-white/5">
                                  <div className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1 mb-1.5 md:mb-2">
                                      <User size={10}/> Operator Log
                                  </div>
                                  <p className="text-gray-200 text-xs md:text-sm whitespace-pre-wrap leading-relaxed">
                                      {operatorResponse}
                                  </p>
                              </div>
                          </div>
                      ) : (
                          <p className="text-gray-300 text-xs md:text-sm whitespace-pre-wrap leading-relaxed">
                            {entry.content}
                          </p>
                      )}
                  </div>
                </GlassCard>
              </div>
            );
        })}
      </div>
    </div>
  );
};
