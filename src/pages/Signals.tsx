import { useState } from 'react';
import { useFinancials } from '../context/FinancialContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { GlassInput } from '../components/ui/GlassInput';
import { Plus, Trash2, Clock, DollarSign } from 'lucide-react';
import { type ProjectStatus } from '../types';
import { cn } from '../utils/cn';

export const Signals = () => {
  const { projects, transactions, addProject, updateProjectStatus } = useFinancials(); // Pull transactions
  const [isAdding, setIsAdding] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'hunter' | 'creator'>('hunter');
  const [newDesc, setNewDesc] = useState('');

  const columns: { id: ProjectStatus; label: string; color: string }[] = [
    { id: 'discovery', label: 'Discovery', color: 'text-gray-400' },
    { id: 'validation', label: 'Validation', color: 'text-accent-info' },
    { id: 'contribution', label: 'Contribution', color: 'text-accent-warning' },
    { id: 'delivered', label: 'Shipped', color: 'text-accent-success' },
  ];

  const handleAddProject = () => {
    if (!newName) return;
    addProject({
      id: crypto.randomUUID(),
      name: newName,
      type: newType,
      status: 'discovery',
      description: newDesc,
      redFlags: [],
      greenFlags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeInvested: 0
    });
    setIsAdding(false);
    setNewName('');
    setNewDesc('');
  };

  // Helper to calculate earnings
  const getProjectEarnings = (projectId: string) => {
    return transactions
      .filter(t => t.projectId === projectId && t.type === 'drop')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const formatUSD = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 animate-fade-in h-[calc(100vh-140px)] flex flex-col">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Signal Intelligence</h1>
          <p className="text-gray-400">Hunter / Creator Pipeline</p>
        </div>
        <GlassButton onClick={() => setIsAdding(!isAdding)}>
          <Plus className="w-4 h-4 mr-2" />
          New Signal
        </GlassButton>
      </div>

      {isAdding && (
        <GlassCard className="p-6 border-accent-info/30">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-bold text-white">Level 0: The Screen</h3>
            <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-white">Close</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <GlassInput placeholder="Project Name" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
            <div className="flex gap-2">
              <button onClick={() => setNewType('hunter')} className={cn("flex-1 rounded-xl border font-bold transition-all", newType === 'hunter' ? "bg-accent-info/20 border-accent-info text-accent-info" : "border-glass-border text-gray-500 hover:border-white/20")}>HUNTER</button>
              <button onClick={() => setNewType('creator')} className={cn("flex-1 rounded-xl border font-bold transition-all", newType === 'creator' ? "bg-accent-warning/20 border-accent-warning text-accent-warning" : "border-glass-border text-gray-500 hover:border-white/20")}>CREATOR</button>
            </div>
          </div>
          <textarea className="w-full bg-black/20 border border-glass-border rounded-xl p-4 text-white placeholder:text-gray-600 focus:border-accent-info outline-none resize-none mb-4" rows={2} placeholder="Quick notes: VCs, GitHub activity..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          <div className="flex justify-between items-center">
            <button className="text-xs text-accent-danger font-bold flex items-center hover:text-red-400"><Trash2 className="w-3 h-3 mr-1" /> REJECT (DEAD)</button>
            <GlassButton onClick={handleAddProject} disabled={!newName}>Add to Discovery</GlassButton>
          </div>
        </GlassCard>
      )}

      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-hidden min-h-[500px]">
        {columns.map((col) => (
          <div key={col.id} className="flex flex-col h-full bg-white/5 rounded-2xl border border-glass-border">
            <div className={cn("p-4 border-b border-glass-border font-bold uppercase text-xs tracking-wider", col.color)}>
              {col.label}
            </div>
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {projects.filter(p => p.status === col.id).map(project => {
                const earnings = getProjectEarnings(project.id);
                return (
                  <div key={project.id} className="group relative bg-glass hover:bg-white/10 border border-glass-border rounded-xl p-4 transition-all hover:-translate-y-1 hover:shadow-lg cursor-grab active:cursor-grabbing">
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border", project.type === 'hunter' ? "bg-accent-info/10 text-accent-info border-accent-info/20" : "bg-accent-warning/10 text-accent-warning border-accent-warning/20")}>{project.type}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {col.id !== 'discovery' && <button onClick={() => updateProjectStatus(project.id, columns[columns.findIndex(c => c.id === col.id) - 1].id)} className="p-1 hover:bg-white/20 rounded">←</button>}
                        {col.id !== 'delivered' && <button onClick={() => updateProjectStatus(project.id, columns[columns.findIndex(c => c.id === col.id) + 1].id)} className="p-1 hover:bg-white/20 rounded">→</button>}
                      </div>
                    </div>
                    <h4 className="font-bold text-white mb-1">{project.name}</h4>
                    <p className="text-xs text-gray-400 line-clamp-2">{project.description}</p>
                    
                    {/* FOOTER: ROI Badge */}
                    <div className="mt-3 pt-3 border-t border-glass-border flex justify-between items-center text-xs text-gray-500">
                      <div className="flex items-center gap-1"><Clock size={12} /> {project.timeInvested}h</div>
                      {earnings > 0 && (
                        <div className="flex items-center gap-1 font-bold text-accent-success bg-accent-success/10 px-2 py-0.5 rounded-full border border-accent-success/20">
                          <DollarSign size={10} /> {formatUSD(earnings)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
