import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { GlassInput } from '../ui/GlassInput';
import { Naira } from '../ui/Naira'; // Ensure you have this
import { formatNumber } from '../../utils/format';
import { type Signal, type SignalPhase, type HistoryLog } from '../../types';
import { X, Save, AlertTriangle, ExternalLink, Wallet, TrendingUp, ArrowDownRight } from 'lucide-react';

interface Props {
  signal: Signal;
  onClose: () => void;
  onUpdate: (updatedSignal: Signal, logEntry: string) => void;
}

export const SignalDossierModal = ({ signal, onClose, onUpdate }: Props) => {
  const [activeTab, setActiveTab] = useState<'INTEL' | 'TIMELINE' | 'FINANCE'>('INTEL');
  const [logs, setLogs] = useState<any[]>([]);
  const [incomeHistory, setIncomeHistory] = useState<HistoryLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [note, setNote] = useState('');
  const [newUrl, setNewUrl] = useState(signal.research.links.website || '');
  const [newPhase, setNewPhase] = useState<SignalPhase>(signal.phase);
  const [isRedFlag, setIsRedFlag] = useState(false);

  // Fetch Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 1. Fetch Field Reports (Logs)
      const { data: logData } = await supabase
        .from('signal_logs')
        .select('*')
        .eq('signal_id', signal.id)
        .order('created_at', { ascending: false });
      setLogs(logData || []);

      // 2. Fetch Financial History (Ledger Drops)
      const { data: financeData } = await supabase
        .from('history')
        .select('*')
        .eq('linked_signal_id', signal.id)
        .eq('type', 'DROP') // Only care about income generated
        .order('date', { ascending: false });
      setIncomeHistory(financeData || []);

      setLoading(false);
    };
    fetchData();
  }, [signal.id]);

  const handleSubmit = () => {
    const changes: string[] = [];
    const updatedSignal = { ...signal };

    if (note) changes.push(`Analyst Note: "${note}"`);
    if (newUrl !== signal.research.links.website) {
      changes.push(`URL Change: ${signal.research.links.website} -> ${newUrl}`);
      updatedSignal.research = { ...signal.research, links: { ...signal.research.links, website: newUrl } };
    }
    if (newPhase !== signal.phase) {
      changes.push(`Phase Shift: ${signal.phase} -> ${newPhase}`);
      updatedSignal.phase = newPhase;
    }
    if (isRedFlag) {
      changes.push("Flagged as High Risk");
      updatedSignal.redFlags = [...(signal.redFlags || []), `Flagged on ${new Date().toLocaleDateString()}: ${note}`];
    }

    if (changes.length === 0) return;
    onUpdate(updatedSignal, changes.join(' | '));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <GlassCard className="w-full max-w-2xl h-[85vh] flex flex-col relative border-white/20 shadow-2xl">
        
        {/* HEADER */}
        <div className="p-6 border-b border-white/10 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-white">{signal.title}</h2>
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-400 font-mono uppercase">{signal.sector}</span>
            </div>
            {/* FINANCIAL HEADER BADGE */}
            <div className="flex items-center gap-4 mt-2">
               <div className="flex items-center gap-1.5 text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">
                 <Wallet size={14}/>
                 <span className="font-mono font-bold text-sm"><Naira/>{formatNumber(signal.totalGenerated)} Generated</span>
               </div>
               <div className="text-xs text-gray-500">
                  Total ROI: {signal.hoursLogged > 0 ? formatNumber(signal.totalGenerated / signal.hoursLogged) : 0}/hr
               </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={24}/></button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-white/10 overflow-x-auto">
          <button onClick={() => setActiveTab('INTEL')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest min-w-[100px] ${activeTab === 'INTEL' ? 'bg-white/5 text-white border-b-2 border-green-500' : 'text-gray-500'}`}>Update Intel</button>
          <button onClick={() => setActiveTab('TIMELINE')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest min-w-[100px] ${activeTab === 'TIMELINE' ? 'bg-white/5 text-white border-b-2 border-blue-500' : 'text-gray-500'}`}>History ({logs.length})</button>
          <button onClick={() => setActiveTab('FINANCE')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest min-w-[100px] ${activeTab === 'FINANCE' ? 'bg-white/5 text-white border-b-2 border-yellow-500' : 'text-gray-500'}`}>Revenue ({incomeHistory.length})</button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {activeTab === 'INTEL' && (
            <div className="space-y-6">
              {/* Status Control */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <label className="text-xs text-gray-500 font-bold uppercase mb-3 block">Signal Phase</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {['discovery', 'validation', 'contribution', 'delivered', 'graveyard'].map((p) => (
                    <button key={p} onClick={() => setNewPhase(p as SignalPhase)} className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap border transition-all ${newPhase === p ? 'bg-white text-black border-white' : 'border-white/20 text-gray-400 hover:border-white/50'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <GlassInput label="Official Website" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
                 <div className="flex items-end pb-1"><a href={newUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1">Test Link <ExternalLink size={10}/></a></div>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Field Report</label>
                <textarea className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-green-500/50 focus:outline-none resize-none" placeholder="What changed? Why are we updating this?" value={note} onChange={(e) => setNote(e.target.value)}/>
              </div>

              <div className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-colors ${isRedFlag ? 'bg-red-500/10 border-red-500/50' : 'bg-transparent border-white/10 hover:bg-white/5'}`} onClick={() => setIsRedFlag(!isRedFlag)}>
                <div className={`p-2 rounded-full ${isRedFlag ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-500'}`}><AlertTriangle size={18}/></div>
                <div><div className={`text-sm font-bold ${isRedFlag ? 'text-red-400' : 'text-gray-400'}`}>Mark as High Risk</div><div className="text-[10px] text-gray-500">Adds a visible warning flag to the dashboard.</div></div>
              </div>
            </div>
          )}

          {activeTab === 'TIMELINE' && (
            <div className="space-y-4 relative pl-4 border-l border-white/10">
              {logs.map((log) => (
                <div key={log.id} className="relative group">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-gray-600 border border-black group-hover:bg-green-500 transition-colors"/>
                  <div className="text-[10px] text-gray-500 mb-1">{new Date(log.created_at).toLocaleString()}</div>
                  <div className="text-sm text-gray-300 bg-white/5 p-3 rounded-lg border border-white/5">{log.content}</div>
                </div>
              ))}
              {logs.length === 0 && !loading && <div className="text-gray-500 text-xs italic">No prior field reports found.</div>}
            </div>
          )}

          {activeTab === 'FINANCE' && (
             <div className="space-y-3">
               {incomeHistory.map((h) => (
                 <div key={h.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-green-500/10 text-green-500 rounded-full"><ArrowDownRight size={16}/></div>
                     <div>
                       <div className="text-sm font-bold text-white">{h.title}</div>
                       <div className="text-[10px] text-gray-500">{new Date(h.date).toLocaleDateString()}</div>
                     </div>
                   </div>
                   <div className="font-mono font-bold text-green-400 flex items-center gap-1">
                     +<Naira/>{formatNumber(h.amount || 0)}
                   </div>
                 </div>
               ))}
               {incomeHistory.length === 0 && !loading && (
                 <div className="text-center py-8">
                   <TrendingUp className="mx-auto text-gray-600 mb-2" size={32}/>
                   <p className="text-gray-500 text-xs">No income generated yet.</p>
                   <p className="text-gray-600 text-[10px]">Use Triage to drop funds into this signal.</p>
                 </div>
               )}
             </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-black/40">
           <GlassButton size="sm" variant="secondary" onClick={onClose}>Cancel</GlassButton>
           {activeTab === 'INTEL' && (
             <GlassButton size="sm" onClick={handleSubmit} disabled={!note && newPhase === signal.phase && newUrl === signal.research.links.website}>
               <Save size={16} className="mr-2"/> Update Dossier
             </GlassButton>
           )}
        </div>

      </GlassCard>
    </div>
  );
};
