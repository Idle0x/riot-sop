import { useState } from 'react';
import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { PenTool, Trash2, Hash } from 'lucide-react';
import { cn } from '../utils/cn';
import { type JournalTag } from '../types';

export const Journal = () => {
  const { journalEntries, addJournalEntry, deleteJournalEntry } = useFinancials();
  
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<JournalTag[]>([]);

  const AVAILABLE_TAGS: { id: JournalTag; label: string; color: string }[] = [
    { id: 'win', label: 'Win', color: 'bg-accent-success/20 text-accent-success border-accent-success/30' },
    { id: 'fail', label: 'Fail', color: 'bg-accent-danger/20 text-accent-danger border-accent-danger/30' },
    { id: 'lesson', label: 'Lesson', color: 'bg-accent-warning/20 text-accent-warning border-accent-warning/30' },
    { id: 'idea', label: 'Idea', color: 'bg-accent-info/20 text-accent-info border-accent-info/30' },
    { id: 'note', label: 'Note', color: 'bg-white/10 text-gray-400 border-white/20' },
  ];

  const toggleTag = (tag: JournalTag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const handleSave = () => {
    if (!content.trim()) return;
    addJournalEntry(content, selectedTags.length > 0 ? selectedTags : ['note']);
    setContent('');
    setSelectedTags([]);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-20">
      
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Captain's Log</h1>
        <p className="text-gray-400">Wins, Fails, and Strategic Lessons</p>
      </div>

      {/* INPUT AREA */}
      <GlassCard className="p-6">
        <textarea 
          className="w-full bg-black/20 border border-glass-border rounded-xl p-4 text-white placeholder:text-gray-600 focus:border-accent-info outline-none resize-none min-h-[120px]"
          placeholder="What happened today?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-4">
          {/* Tag Selector */}
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TAGS.map(tag => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold border transition-all",
                  selectedTags.includes(tag.id) ? tag.color : "border-transparent bg-black/20 text-gray-500 hover:bg-white/5"
                )}
              >
                {tag.label}
              </button>
            ))}
          </div>

          <GlassButton onClick={handleSave} disabled={!content.trim()}>
            <PenTool className="w-4 h-4 mr-2" /> Log Entry
          </GlassButton>
        </div>
      </GlassCard>

      {/* FEED */}
      <div className="space-y-6">
        {journalEntries.map(entry => (
          <div key={entry.id} className="relative pl-8 border-l border-glass-border group">
            {/* Timeline Dot */}
            <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-glass-border group-hover:bg-accent-info transition-colors" />
            
            <div className="bg-glass border border-glass-border rounded-xl p-6 hover:border-white/20 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                  {entry.tags.map(tagId => {
                    const tagInfo = AVAILABLE_TAGS.find(t => t.id === tagId);
                    return (
                      <span key={tagId} className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded border", tagInfo?.color)}>
                        {tagInfo?.label}
                      </span>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500 font-mono">{formatDate(entry.date)}</span>
                  <button 
                    onClick={() => { if(confirm("Delete entry?")) deleteJournalEntry(entry.id); }}
                    className="text-gray-600 hover:text-accent-danger opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{entry.content}</p>
            </div>
          </div>
        ))}

        {journalEntries.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <Hash className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Log is empty. Start writing.</p>
          </div>
        )}
      </div>

    </div>
  );
};
