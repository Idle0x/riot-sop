import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { GlassInput } from '../ui/GlassInput';
import { formatNumber } from '../../utils/format';
import { type Signal, type SignalPhase, type HistoryLog } from '../../types';
import { X, Save, AlertTriangle, ExternalLink, Wallet, TrendingUp, ArrowDownRight, Clock, Calendar, Play } from 'lucide-react';

interface Props {
  signal: Signal;
  onClose: () => void;
  onUpdate: (updatedSignal: Signal, logEntry: string) => void;
}

export const SignalDossierModal = ({ signal, onClose, onUpdate }: Props) => {
  const [activeTab, setActiveTab] = useState<'INTEL' | 'TIMELINE' | 'TIMESHEET' | 'FINANCE'>('INTEL');
  const [logs, setLogs] = useState<any[]>([]);
  const [incomeHistory, setIncomeHistory] = useState<HistoryLog[]>([]);
  
  // Form State
  const [note, setNote] = useState('');
  const [newUrl, setNewUrl] = useState(signal.research.links.website || '');
  const [newPhase, setNewPhase] = useState<SignalPhase>(signal.phase);
  const [isRedFlag, setIsRedFlag] = useState(false);
  const [sessionHours, setSessionHours] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionNote, setSessionNote] = useState('');
  const [uptime, setUptime] = useState('');

  // 1. Passive Uptime
  useEffect(() => {
    const created = new Date(signal.createdAt).getTime();
    const updateTime = () => {
      const diff = new Date().getTime() - created;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setUptime(`${days}d ${hours}h`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [signal.createdAt]);

  // 2. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      const { data: logData } = await supabase.from('signal_logs').select('*').eq('signal_id', signal.id).order('created_at', { ascending: false });
      setLogs(logData || []);
      const { data: financeData } = await supabase.from('history').select('*').eq('linked_signal_id', signal.id).eq('type', 'DROP').order('date', { ascending: false });
      setIncomeHistory(financeData || []);
    };
    fetchData();
  }, [signal.id]);

  const handleSubmitIntel = () => {
    const changes: string[] = [];
    const updatedSignal = { ...signal };
    if (note) changes.push(`Analyst Note: "${note}"`);
    if (newUrl !== signal.research.links.website) {
      changes.push(`URL Change: ${newUrl}`);
      updatedSignal.research = { ...signal.research, links: { ...signal.research.links, website: newUrl } };
    }
    if (newPhase !== signal.phase) {
      changes.push(`Phase Shift: ${newPhase}`);
      updatedSignal.phase = newPhase;
    }
    if (isRedFlag) {
      changes.push("Flagged High Risk");
      updatedSignal.redFlags = [...(signal.redFlags || []), `Flagged: ${note}`];
    }
    if (changes.length) {
      onUpdate(updatedSignal, changes.join(' | '));
      onClose();
    }
  };

  const handleLogSession = () => {
    const hours = parseFloat(sessionHours);
    if (!hours && hours !== 0) return;
    const newSession = {
        id: crypto.randomUUID(),
        date: sessionDate,
        duration: hours,
        notes: sessionNote,
        type: hours === 0 ? 'adjustment' : 'active'
    };
    const updatedSignal = { 
        ...signal, 
        hoursLogged: (signal.hoursLogged || 0) + hours,
        sessionLogs: [newSession, ...(signal.sessionLogs || [])] as any,
        lastSessionAt: new Date().toISOString()
    };
    onUpdate(updatedSignal, `Logged Session: ${hours}h - ${sessionNote}`);
    setSessionHours(''); setSessionNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <GlassCard className="w-full max-w-2xl h-[85vh] flex flex-col relative border-white/20 shadow-2xl">
        <div className="p-6 border-b border-white/10 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-white">{signal.title}</h2>
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-400 font-mono uppercase">{signal.sector}</span>
            </div>
            <div className="flex items-center gap-4 mt-2">
               <div className="flex items-center gap-1.5 text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">
                 <Wallet size={14}/> <span className="font-mono font-bold text-sm">${formatNumber(signal.totalGenerated)}</span>
               </div>
               <div className="flex items-center gap-1.5 text-blue-400 bg-blue-400/10 px-2 py-1 rounded-lg">
                 <Clock size={14}/> <span className="font-mono font-bold text-sm">{uptime} Active</span>
               </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={24}/></button>
        </div>

        <div className="flex border-b border-white/10 overflow-x-auto bg-white/5">
          {['INTEL', 'TIMESHEET', 'TIMELINE', 'FINANCE'].map(tab => (
             <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest min-w-[100px] ${activeTab === tab ? 'text-white border-b-2 border-green-500' : 'text-gray-500'}`}>{tab}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'INTEL' && (
            <div className="space-y-6">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <label className="text-xs text-gray-500 font-bold uppercase mb-3 block">Signal Phase</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {['discovery', 'validation', 'contribution', 'delivered', 'graveyard'].map((p) => (
                    <button key={p} onClick={() => setNewPhase(p as SignalPhase)} className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap border transition-all ${newPhase === p ? 'bg-white text-black border-white' : 'border-white/20 text-gray-400 hover:border-white/50'}`}>{p}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <GlassInput label="Official Website" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
                 <div className="flex items-end pb-1"><a href={newUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1">Test Link <ExternalLink size={10}/></a></div>
              </div>
              <textarea className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white resize-none" placeholder="What changed?" value={note} onChange={(e) => setNote(e.target.value)}/>
              <div className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 ${isRedFlag ? 'bg-red-500/10 border-red-500/50' : 'bg-transparent border-white/10'}`} onClick={() => setIsRedFlag(!isRedFlag)}>
                <div className={`p-2 rounded-full ${isRedFlag ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-500'}`}><AlertTriangle size={18}/></div>
                <div className="text-sm font-bold text-gray-400">Mark as High Risk</div>
              </div>
            </div>
          )}

          {activeTab === 'TIMESHEET' && (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Hard ROI</div>
                        <div className="text-xl font-mono font-bold text-white">${signal.hoursLogged > 0 ? formatNumber(signal.totalGenerated / signal.hoursLogged) : 0}<span className="text-sm text-gray-500">/hr</span></div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Labor Logged</div>
                        <div className="text-xl font-mono font-bold text-white">{signal.hoursLogged}h <span className="text-sm text-gray-500">/ {signal.timeEstimates?.total || '?'}h Est.</span></div>
                    </div>
                </div>
                <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
                    <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Play size={16} className="text-purple-400"/> Log Session</h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} className="bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"/>
                        <input type="number" placeholder="Hours" value={sessionHours} onChange={e => setSessionHours(e.target.value)} className="bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"/>
                    </div>
                    <textarea className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white h-20 mb-3 resize-none" placeholder="What did you execute?" value={sessionNote} onChange={e => setSessionNote(e.target.value)}/>
                    <GlassButton size="sm" onClick={handleLogSession} disabled={!sessionHours || !sessionNote}>Confirm Session</GlassButton>
                </div>
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Session Log</h4>
                    {signal.sessionLogs?.map((log, idx) => (
                        <div key={idx} className="flex justify-between items-start p-3 bg-white/5 rounded-lg border border-white/5">
                            <div><div className="text-xs text-gray-400 mb-1 flex items-center gap-2"><Calendar size={10}/> {new Date(log.date).toLocaleDateString()}</div><div className="text-sm text-white">{log.notes}</div></div>
                            <div className="font-mono font-bold text-purple-400 text-sm">+{log.duration}h</div>
                        </div>
                    ))}
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
            </div>
          )}

          {activeTab === 'FINANCE' && (
             <div className="space-y-3">
               {incomeHistory.map((h) => (
                 <div key={h.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-green-500/10 text-green-500 rounded-full"><ArrowDownRight size={16}/></div>
                     <div><div className="text-sm font-bold text-white">{h.title}</div><div className="text-[10px] text-gray-500">{new Date(h.date).toLocaleDateString()}</div></div>
                   </div>
                   <div className="font-mono font-bold text-green-400 flex items-center gap-1">+${formatNumber(h.amount || 0)}</div>
                 </div>
               ))}
             </div>
          )}
        </div>
        
        <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-black/40">
           <GlassButton size="sm" variant="secondary" onClick={onClose}>Close</GlassButton>
           {activeTab === 'INTEL' && <GlassButton size="sm" onClick={handleSubmitIntel} disabled={!note && newPhase === signal.phase}>Update Dossier</GlassButton>}
        </div>
      </GlassCard>
    </div>
  );
};
