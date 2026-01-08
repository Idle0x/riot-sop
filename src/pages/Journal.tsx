import { useState } from 'react';
import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { Hash, Calendar, Tag } from 'lucide-react';

const AVAILABLE_TAGS = ['Win', 'Fail', 'Lesson', 'Idea', 'Note', 'System'];

export const Journal = () => {
  const { journal, commitAction } = useFinancials(); // Now accessing 'journal' state
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
    commitAction({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: 'JOURNAL',
      title: 'Captain\'s Log',
      description: content,
      tags: selectedTags
    });
    // In a real app with backend, we'd sync this to a separate Journal DB table.
    // For MVP context, commitAction adds it to History, but we should also update the local journal state if we want a dedicated view.
    // Ideally, the Context should have a specialized 'addJournalEntry' action, but for now we rely on the History log or we can patch the context to save to 'journal' array.
    // Note: The previous Context code didn't export 'addJournalEntry', so for this specific view to work 100% as a dedicated journal, 
    // we assume 'history' filters for 'JOURNAL' type, OR we assume the context was updated to populate 'journal'. 
    // Let's rely on filtering 'history' for JOURNAL types for the view below, which is safer given the current context.
    
    setContent('');
    setSelectedTags([]);
  };

  // Filter history for Journal entries to display the timeline
  // This ensures data consistency without needing a separate 'addJournalEntry' function right now.
  const { history } = useFinancials();
  const journalEntries = history.filter(h => h.type === 'JOURNAL');

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8 pb-20 animate-fade-in">
      <h1 className="text-3xl font-bold text-white">Captain's Log</h1>

      {/* WRITE AREA */}
      <GlassCard className="p-6">
        <textarea 
          className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 min-h-[150px] outline-none focus:border-white/30 resize-none"
          placeholder="What happened today? What did you learn?"
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        
        {/* Tag Selector */}
        <div className="flex flex-wrap gap-2 mt-4 mb-4">
          {AVAILABLE_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                selectedTags.includes(tag) 
                  ? 'bg-white text-black border-white' 
                  : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-500'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-white/10">
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <Calendar size={14}/> {new Date().toLocaleDateString()}
          </div>
          <GlassButton onClick={handleSave} disabled={!content} size="sm">Log Entry</GlassButton>
        </div>
      </GlassCard>

      {/* READ TIMELINE */}
      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
        {journalEntries.map(entry => (
          <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            
            {/* Dot */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/20 bg-black shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <Hash size={16} className="text-gray-400"/>
            </div>
            
            {/* Card */}
            <GlassCard className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6">
              <div className="flex justify-between items-start mb-2">
                <time className="font-mono text-xs text-gray-500">{new Date(entry.date).toLocaleString()}</time>
                <div className="flex gap-1">
                  {entry.tags?.map(t => (
                    <span key={t} className="text-[10px] bg-white/10 px-1.5 rounded text-gray-300">#{t}</span>
                  ))}
                </div>
              </div>
              <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                {entry.description}
              </p>
            </GlassCard>
          </div>
        ))}
      </div>
    </div>
  );
};
