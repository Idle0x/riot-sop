import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { GlassInput } from '../ui/GlassInput';
import { formatNumber } from '../../utils/format';
import { type Signal, type SignalPhase, type HistoryLog, type LifecycleChapter } from '../../types';
import { getDurationDays } from '../../utils/lifecycle'; 
import { 
  X, AlertTriangle, ExternalLink, Wallet, ArrowDownRight, 
  Clock, Calendar, Play, Activity 
} from 'lucide-react';

interface Props {
  signal: Signal;
  onClose: () => void;
  onUpdate: (updatedSignal: Signal, logEntry: string) => void;
}

export const SignalDossierModal = ({ signal, onClose, onUpdate }: Props) => {
  const [activeTab, setActiveTab] = useState<'INTEL' | 'LIFECYCLE' | 'TIMESHEET' | 'TIMELINE' | 'FINANCE'>('INTEL');
  const [logs, setLogs] = useState<any[]>([]);
  const [incomeHistory, setIncomeHistory] = useState<HistoryLog[]>([]);

  const [note, setNote] = useState('');
  const [newUrl, setNewUrl] = useState(signal.research.links.website || '');
  const [newPhase, setNewPhase] = useState<SignalPhase>(signal.phase);
  const [isRedFlag, setIsRedFlag] = useState(false);
  const [sessionHours, setSessionHours] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionNote, setSessionNote] = useState('');
  const [uptime, setUptime] = useState('');

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

  useEffect(() => {
    const fetchData = async () => {
      const { data: logData } = await supabase.from('signal_logs').select('*').eq('signal_id', signal.id).order('created_at', { ascending: false });
      setLogs(logData || []);
      const { data: financeData } = await supabase.from('history').select('*').eq('linked_signal_id', signal.id).eq('type', 'DROP').order('date', { ascending: false });
      setIncomeHistory(financeData || []);
    };
    fetchData();
  }, [signal.id]);

  const getPhaseEffort = (chapter: LifecycleChapter) => {
    const start = chapter.hoursAtEntry || 0;
    const end = chapter.hoursAtExit || (signal.hoursLogged || 0);
    return parseFloat((end - start).toFixed(1));
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 md:p-4 animate-fade-in">
      <GlassCard className="w-full max-w-2xl h-[95vh] md:h-[85vh] flex flex-col relative border-white/20 shadow-2xl p-0 overflow-hidden">

        {/* HEADER */}
        <div className="p-4 md:p-6 border-b border-white/10 flex justify-between items-start bg-black/40 shrink-0">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
              <h2 className="text-lg md:text-2xl font-bold text-white truncate max-w-[200px] sm:max-w-md">{signal.title}</h2>
              <span className="text-[9px] md:text-xs bg-white/10 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-gray-400 font-mono uppercase font-bold border border-white/5 shrink-0">{signal.sector}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1 md:mt-2">
               <div className="flex items-center gap-1.5 text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 md:py-1.5 rounded-lg">
                 <Wallet size={12} className="md:w-3.5 md:h-3.5"/> <span className="font-mono font-bold text-xs md:text-sm tracking-tight">${formatNumber(signal.totalGenerated)}</span>
               </div>
               <div className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 md:py-1.5 rounded-lg">
                 <Clock size={12} className="md:w-3.5 md:h-3.5"/> <span className="font-mono font-bold text-xs md:text-sm tracking-tight">{uptime}</span>
               </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1 bg-white/5 hover:bg-white/10 rounded-full transition-colors shrink-0"><X size={18} className="md:w-5 md:h-5"/></button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-white/10 overflow-x-auto bg-black/60 scrollbar-hide shrink-0">
          {['INTEL', 'LIFECYCLE', 'TIMESHEET', 'TIMELINE', 'FINANCE'].map(tab => (
             <button 
                key={tab} 
                onClick={() => setActiveTab(tab as any)} 
                className={`py-2.5 md:py-3 px-3 md:px-4 text-[9px] md:text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${activeTab === tab ? 'text-white border-b-2 border-green-500 bg-white/5' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
             >
                {tab}
             </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-black/20">

          {/* --- INTEL TAB --- */}
          {activeTab === 'INTEL' && (
            <div className="space-y-4 md:space-y-6">
              <div className="p-3 md:p-4 bg-white/5 rounded-lg md:rounded-xl border border-white/10">
                <label className="text-[10px] md:text-xs text-gray-400 font-bold uppercase mb-2 block tracking-wider">Signal Phase</label>
                <div className="flex gap-1.5 md:gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {['discovery', 'validation', 'contribution', 'delivered', 'graveyard'].map((p) => (
                    <button 
                        key={p} 
                        onClick={() => setNewPhase(p as SignalPhase)} 
                        className={`px-2.5 py-1.5 md:px-3 md:py-2 rounded-md md:rounded-lg text-[10px] md:text-xs whitespace-nowrap border transition-all font-bold uppercase tracking-wider ${newPhase === p ? 'bg-white text-black border-white shadow-md' : 'border-white/10 bg-black/40 text-gray-500 hover:border-white/30 hover:text-gray-300'}`}
                    >
                        {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                 <GlassInput label="Official Website" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
                 <div className="flex items-end pb-1 md:pb-2">
                     <a href={newUrl} target="_blank" rel="noreferrer" className="text-[10px] md:text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-bold bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20 transition-colors">
                        Test Link <ExternalLink size={10} className="md:w-3 md:h-3"/>
                     </a>
                 </div>
              </div>
              <textarea 
                className="w-full h-24 md:h-32 bg-black/40 border border-white/10 rounded-lg md:rounded-xl p-3 md:p-4 text-xs md:text-sm text-white resize-none outline-none focus:border-white/30 transition-colors" 
                placeholder="Log Intel: What changed? New backers? Red flags?" 
                value={note} 
                onChange={(e) => setNote(e.target.value)}
              />
              <button 
                className={`w-full p-3 rounded-lg md:rounded-xl border flex items-center justify-center gap-2 transition-all font-bold text-xs md:text-sm ${isRedFlag ? 'bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10 hover:text-gray-300'}`} 
                onClick={() => setIsRedFlag(!isRedFlag)}
              >
                <AlertTriangle size={16} className={`md:w-[18px] md:h-[18px] ${isRedFlag ? 'animate-pulse' : ''}`}/> Mark as High Risk
              </button>
            </div>
          )}

          {/* --- LIFECYCLE TAB --- */}
          {activeTab === 'LIFECYCLE' && (
            <div className="space-y-4 md:space-y-6 animate-fade-in">

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                 <div className="p-3 md:p-4 bg-white/5 rounded-lg md:rounded-xl border border-white/10">
                    <div className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold mb-0.5 md:mb-1 tracking-wider">Total Age</div>
                    <div className="text-xl md:text-2xl font-mono font-bold text-white flex items-baseline gap-1">
                        {getDurationDays(signal.createdAt)} <span className="text-[10px] md:text-xs text-gray-500 font-sans tracking-wide">Days</span>
                    </div>
                 </div>
                 <div className="p-3 md:p-4 bg-white/5 rounded-lg md:rounded-xl border border-white/10">
                    <div className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold mb-0.5 md:mb-1 tracking-wider">Total Effort</div>
                    <div className="text-xl md:text-2xl font-mono font-bold text-white flex items-baseline gap-1">
                        {signal.hoursLogged} <span className="text-[10px] md:text-xs text-gray-500 font-sans tracking-wide">Hours</span>
                    </div>
                 </div>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-lg md:rounded-xl p-3 md:p-5">
                <h3 className="text-[10px] md:text-xs font-bold text-gray-400 uppercase mb-3 md:mb-4 flex items-center gap-1.5 md:gap-2 tracking-widest">
                    <Activity size={12} className="md:w-3.5 md:h-3.5 text-blue-400"/> Phase Velocity
                </h3>

                <div className="flex w-full h-3 md:h-4 rounded-full overflow-hidden mb-4 md:mb-6 bg-white/5 shadow-inner">
                    {(signal.lifecycle || [{ phase: signal.phase, enteredAt: signal.createdAt, hoursAtEntry: 0 }]).map((chapter, idx) => {
                        const duration = getDurationDays(chapter.enteredAt, chapter.exitedAt);
                        const totalDays = getDurationDays(signal.createdAt);
                        const width = totalDays > 0 ? Math.max(5, (duration / totalDays) * 100) : 100;

                        let color = 'bg-gray-500';
                        if (chapter.phase === 'discovery') color = 'bg-blue-500';
                        if (chapter.phase === 'validation') color = 'bg-yellow-500';
                        if (chapter.phase === 'contribution') color = 'bg-purple-500';
                        if (chapter.phase === 'delivered') color = 'bg-green-500';
                        if (chapter.phase === 'graveyard') color = 'bg-red-500';

                        return (
                            <div key={idx} className={`h-full ${color} opacity-80 hover:opacity-100 transition-all border-r border-black/40`} style={{ width: `${width}%` }} title={`${chapter.phase}: ${duration} days`} />
                        );
                    })}
                </div>

                <div className="space-y-0">
                    <div className="grid grid-cols-12 px-3 md:px-4 py-2 text-[8px] md:text-[10px] uppercase font-bold text-gray-500 tracking-wider border-b border-white/5 mb-1">
                        <div className="col-span-5 md:col-span-4">Phase</div>
                        <div className="col-span-4 md:col-span-3 text-center md:text-left">Duration</div>
                        <div className="col-span-3 hidden md:block">Labor Burn</div>
                        <div className="col-span-3 md:col-span-2 text-right">Status</div>
                    </div>

                    {(signal.lifecycle || [{ phase: signal.phase, enteredAt: signal.createdAt, hoursAtEntry: 0 }]).map((chapter, idx) => {
                        const isCurrent = !chapter.exitedAt;
                        const duration = getDurationDays(chapter.enteredAt, chapter.exitedAt);
                        const effort = getPhaseEffort(chapter as LifecycleChapter);
                        const intensity = duration > 0 ? (effort / duration).toFixed(1) : 0;

                        return (
                            <div key={idx} className={`grid grid-cols-12 items-center px-3 md:px-4 py-2.5 md:py-3 rounded-lg transition-colors border ${isCurrent ? 'bg-white/5 border-white/10 shadow-sm' : 'bg-transparent border-transparent hover:bg-white/5'}`}>
                                <div className="col-span-5 md:col-span-4 flex items-start md:items-center gap-2">
                                    <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full mt-1.5 md:mt-0 shrink-0 ${chapter.phase === 'graveyard' ? 'bg-red-500' : 'bg-green-500'}`}/>
                                    <div className="min-w-0 pr-2">
                                        <div className="text-[10px] md:text-xs font-bold text-white capitalize truncate">{chapter.phase}</div>
                                        <div className="text-[8px] md:text-[10px] text-gray-500 font-mono mt-0.5">{new Date(chapter.enteredAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className="col-span-4 md:col-span-3 text-center md:text-left">
                                    <div className="text-[10px] md:text-xs font-mono font-bold text-gray-300">{duration} Days</div>
                                    {/* Mobile only labor burn summary */}
                                    <div className="md:hidden text-[8px] text-gray-500 font-mono mt-0.5">{effort}h logged</div>
                                </div>
                                <div className="col-span-3 hidden md:block">
                                    <div className="text-xs font-mono font-bold text-white">{effort}h</div>
                                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">{intensity} h/day</div>
                                </div>
                                <div className="col-span-3 md:col-span-2 text-right">
                                    {isCurrent ? (
                                        <span className="text-[8px] md:text-[9px] bg-green-500/20 text-green-400 px-1.5 md:px-2 py-0.5 md:py-1 rounded border border-green-500/30 font-bold tracking-widest inline-block shadow-[0_0_10px_rgba(34,197,94,0.1)]">ACTIVE</span>
                                    ) : (
                                        <span className="text-[8px] md:text-[9px] text-gray-600 font-bold tracking-widest">DONE</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* --- TIMESHEET TAB --- */}
          {activeTab === 'TIMESHEET' && (
            <div className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="p-3 md:p-4 bg-white/5 rounded-lg md:rounded-xl border border-white/10">
                        <div className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold mb-0.5 md:mb-1 tracking-wider">Hard ROI</div>
                        <div className="text-xl md:text-2xl font-mono font-bold text-white flex items-baseline gap-0.5 md:gap-1">
                           ${signal.hoursLogged > 0 ? formatNumber(signal.totalGenerated / signal.hoursLogged) : 0}<span className="text-[10px] md:text-sm text-gray-500 font-sans">/hr</span>
                        </div>
                    </div>
                    <div className="p-3 md:p-4 bg-white/5 rounded-lg md:rounded-xl border border-white/10">
                        <div className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold mb-0.5 md:mb-1 tracking-wider">Labor Logged</div>
                        <div className="text-xl md:text-2xl font-mono font-bold text-white flex items-baseline gap-1">
                           {signal.hoursLogged}h <span className="text-[9px] md:text-xs text-gray-500 font-sans font-normal hidden sm:inline">/ {signal.timeEstimates?.total || '?'}h Est.</span>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 md:p-5 bg-purple-500/10 rounded-lg md:rounded-xl border border-purple-500/20 shadow-inner">
                    <h3 className="font-bold text-white mb-3 md:mb-4 flex items-center gap-1.5 md:gap-2 text-sm md:text-base">
                        <Play size={14} className="text-purple-400 md:w-[18px] md:h-[18px]"/> Log Session
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5 md:gap-3 mb-2.5 md:mb-3">
                        <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg p-2.5 text-white text-[10px] md:text-sm outline-none focus:border-purple-500/50 transition-colors [color-scheme:dark]"/>
                        <input type="number" placeholder="Hours" value={sessionHours} onChange={e => setSessionHours(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg p-2.5 text-white text-[10px] md:text-sm outline-none focus:border-purple-500/50 transition-colors"/>
                    </div>
                    <textarea 
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs md:text-sm text-white h-20 md:h-24 mb-3 resize-none outline-none focus:border-purple-500/50 transition-colors" 
                        placeholder="What did you execute during this session?" 
                        value={sessionNote} 
                        onChange={e => setSessionNote(e.target.value)}
                    />
                    <GlassButton size="sm" onClick={handleLogSession} disabled={!sessionHours || !sessionNote} className="w-full text-xs md:text-sm py-2.5 md:py-3">
                        Commit Session to Ledger
                    </GlassButton>
                </div>

                <div className="space-y-2.5 md:space-y-3 bg-black/40 p-4 md:p-5 rounded-lg md:rounded-xl border border-white/5">
                    <h4 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 md:mb-2">Session History</h4>
                    {signal.sessionLogs?.length === 0 && <div className="text-center py-4 text-[10px] md:text-xs text-gray-600 font-bold italic">No labor logged yet.</div>}
                    {signal.sessionLogs?.map((log, idx) => (
                        <div key={idx} className="flex justify-between items-start p-2.5 md:p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="min-w-0 pr-3">
                                <div className="text-[9px] md:text-[10px] text-gray-400 mb-0.5 md:mb-1 flex items-center gap-1.5 md:gap-2 font-mono">
                                    <Calendar size={10} className="md:w-3 md:h-3"/> {new Date(log.date).toLocaleDateString()}
                                </div>
                                <div className="text-xs md:text-sm text-gray-200 leading-snug">{log.notes}</div>
                            </div>
                            <div className="font-mono font-bold text-purple-400 text-xs md:text-sm shrink-0 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                                +{log.duration}h
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {/* --- TIMELINE TAB --- */}
          {activeTab === 'TIMELINE' && (
            <div className="space-y-3 md:space-y-4 relative pl-3 md:pl-4 ml-1 md:ml-2 border-l border-white/10 py-2">
              {logs.length === 0 && <div className="text-center py-10 text-[10px] md:text-xs text-gray-600 font-bold uppercase tracking-widest">No Intelligence Logs Found</div>}
              {logs.map((log) => (
                <div key={log.id} className="relative group">
                  <div className="absolute -left-[16px] md:-left-[21px] top-1 w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-gray-600 border border-black group-hover:bg-blue-500 transition-colors shadow-sm"/>
                  <div className="text-[9px] md:text-[10px] text-gray-500 mb-1 font-mono font-bold tracking-tight">{new Date(log.created_at).toLocaleString()}</div>
                  <div className="text-xs md:text-sm text-gray-300 bg-white/5 p-2.5 md:p-3 rounded-lg border border-white/5 leading-relaxed group-hover:bg-white/10 transition-colors">
                    {log.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* --- FINANCE TAB --- */}
          {activeTab === 'FINANCE' && (
             <div className="space-y-2 md:space-y-3">
               {incomeHistory.length === 0 && <div className="text-center py-10 text-[10px] md:text-xs text-gray-600 font-bold uppercase tracking-widest">No Harvests Found</div>}
               {incomeHistory.map((h) => (
                 <div key={h.id} className="flex justify-between items-center p-2.5 md:p-4 bg-white/5 rounded-lg md:rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                   <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
                     <div className="p-1.5 md:p-2 bg-green-500/10 text-green-500 rounded-md md:rounded-full shrink-0"><ArrowDownRight size={14} className="md:w-4 md:h-4"/></div>
                     <div className="min-w-0">
                        <div className="text-xs md:text-sm font-bold text-white truncate pr-2">{h.title}</div>
                        <div className="text-[9px] md:text-[10px] text-gray-500 font-mono mt-0.5">{new Date(h.date).toLocaleDateString()}</div>
                     </div>
                   </div>
                   <div className="font-mono font-bold text-green-400 flex items-center gap-0.5 md:gap-1 text-sm md:text-base shrink-0 pl-2">
                      +${formatNumber(h.amount || 0)}
                   </div>
                 </div>
               ))}
             </div>
          )}
        </div>

        <div className="p-4 md:p-6 border-t border-white/10 flex justify-end gap-2 md:gap-3 bg-black/60 shrink-0">
           <GlassButton size="sm" variant="secondary" onClick={onClose} className="text-xs md:text-sm px-4 md:px-6">Close</GlassButton>
           {activeTab === 'INTEL' && <GlassButton size="sm" onClick={handleSubmitIntel} disabled={!note && newPhase === signal.phase} className="text-xs md:text-sm px-4 md:px-6">Commit Updates</GlassButton>}
        </div>
      </GlassCard>
    </div>
  );
};
