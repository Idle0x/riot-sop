import { useState } from 'react';
import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { PenTool, Hash, Link } from 'lucide-react';

export const Journal = () => {
  const { journal, commitAction } = useFinancials();
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const handleSave = () => {
    // In real app, update 'journal' state in context. 
    // Here we use commitAction to log it to history for MVP.
    commitAction({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: 'JOURNAL',
      title: 'Captain\'s Log',
      description: content,
      tags: tags
    });
    setContent(''); setTags([]);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8 pb-20 animate-fade-in">
      <h1 className="text-3xl font-bold text-white">Captain's Log</h1>

      <GlassCard className="p-6">
        <textarea 
          className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 min-h-[150px] outline-none focus:border-white/30"
          placeholder="What happened today?"
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2 text-gray-500">
            <button className="hover:text-white"><Hash size={18}/></button>
            <button className="hover:text-white"><Link size={18}/></button>
          </div>
          <GlassButton onClick={handleSave} disabled={!content}>Log Entry</GlassButton>
        </div>
      </GlassCard>

      <div className="space-y-6">
        {/* Simplified Read View */}
        {/* In full app, map through 'journal' state */}
      </div>
    </div>
  );
};
