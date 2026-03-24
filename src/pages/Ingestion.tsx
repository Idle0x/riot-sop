import { useState, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '../context/UserContext';
import { useLedger } from '../context/LedgerContext';
import { processStatement } from '../utils/csvParsers';
import { type TelemetryRecord } from '../types';

import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { Naira } from '../components/ui/Naira';
import { formatNumber } from '../utils/format';

import { 
  UploadCloud, CheckCircle2, Database, Zap, 
  AlertTriangle, TrendingDown, Clock, Activity, Fingerprint 
} from 'lucide-react';

export const Ingestion = () => {
  const { session } = useUser();
  const queryClient = useQueryClient();
  const { budgets, insertTelemetryBatch, commitAction, triggerJournalPrompt } = useLedger();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<Partial<TelemetryRecord>[]>([]);
  const [uploadStatus, setUploadStatus] = useState<{ imported: number; ignored: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [batchSignature, setBatchSignature] = useState('');

  const calculateBatchSignature = (data: Partial<TelemetryRecord>[]) => {
    if (data.length === 0) return "Empty Audit";

    const dates = data.map(d => new Date(d.date!).getTime()).sort((a, b) => a - b);
    const minDate = new Date(dates[0]);
    const maxDate = new Date(dates[dates.length - 1]);

    const diffDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 3600 * 24));

    const formatShort = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const formatMonthYear = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (diffDays <= 7) return `Weekly Audit: ${formatShort(minDate)} - ${formatShort(maxDate)}`;
    if (diffDays <= 21) return `Sprint Audit: ${formatShort(minDate)} - ${formatShort(maxDate)}`;
    if (diffDays <= 35) return `Monthly Audit: ${formatMonthYear(maxDate)}`;
    return `Macro Audit: ${formatMonthYear(minDate)} - ${formatMonthYear(maxDate)}`;
  };

  const auditReport = useMemo(() => {
    if (previewData.length === 0) return null;

    let bleedCount = 0;
    let totalBleed = 0;
    const categorySpend: Record<string, number> = {};

    previewData.forEach(log => {
      if (log.highVelocityFlag) {
        bleedCount++;
        totalBleed += (log.amount || 0);
      }
      if (log.type === 'SPEND') {
        const cat = log.categoryGroup || 'General';
        categorySpend[cat] = (categorySpend[cat] || 0) + (log.amount || 0);
      }
    });

    const anomalies: { category: string, spent: number, limit: number, deficit: number, unbudgeted: boolean }[] = [];

    Object.entries(categorySpend).forEach(([cat, spent]) => {
      const budget = budgets.find(b => b.name.toLowerCase().includes(cat.toLowerCase()) || b.category.toLowerCase() === cat.toLowerCase());

      if (budget && spent > budget.amount) {
         anomalies.push({ category: cat, spent, limit: budget.amount, deficit: spent - budget.amount, unbudgeted: false });
      } else if (!budget && spent > 15000 && cat !== 'General' && cat !== 'Transfer') { 
         anomalies.push({ category: cat, spent, limit: 0, deficit: spent, unbudgeted: true });
      }
    });

    return { bleedCount, totalBleed, anomalies };
  }, [previewData, budgets]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadStatus(null);
    setErrorMsg(null);

    try {
      const data = await processStatement(file);
      setPreviewData(data);
      const sig = calculateBatchSignature(data);
      setBatchSignature(sig);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to parse document.");
      console.error(err);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCommitAudit = async () => {
    if (!session?.user?.id || previewData.length === 0) return;
    setIsUploading(true);
    setErrorMsg(null);

    try {
      const { imported, ignored } = await insertTelemetryBatch(previewData.map(log => ({
        batchId: batchSignature,
        date: log.date!,
        type: log.type as 'DROP' | 'SPEND',
        title: log.title || 'Unknown',
        description: log.description || '',
        amount: log.amount || 0,
        currency: log.currency || 'NGN',
        transactionRef: log.transactionRef || crypto.randomUUID(),
        categoryGroup: log.categoryGroup || 'General',
        highVelocityFlag: log.highVelocityFlag || false
      })));

      commitAction({
          date: new Date().toISOString(),
          type: 'AUDIT_COMPLETED',
          title: `Data Lake Sync: ${batchSignature}`,
          description: `Ingested ${imported} records. Detected ${auditReport?.bleedCount} bleeds.`,
          tags: ['telemetry_sync']
      });

      triggerJournalPrompt({
          type: 'AUDIT_INGEST',
          data: {
              recordCount: imported,
              totalBleed: auditReport?.totalBleed || 0,
              bleedCount: auditReport?.bleedCount || 0,
              anomaliesCount: auditReport?.anomalies.length || 0,
              batchSignature
          }
      });

      setUploadStatus({ imported, ignored });
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['telemetry'] });

    } catch (err: any) {
      setErrorMsg(`Audit Commit failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-3 md:p-8 space-y-5 md:space-y-8 pb-16 md:pb-20 animate-fade-in">
      <div>
        <h1 className="text-xl md:text-3xl font-bold text-white flex items-center gap-2 md:gap-3">
          <Database className="text-accent-info w-5 h-5 md:w-8 md:h-8" /> Telemetry & Audit Engine
        </h1>
        <p className="text-gray-400 text-[10px] md:text-sm mt-1">Ingest raw statements to run anomaly detection. Data routes safely to the Lake.</p>
      </div>

      {uploadStatus && (
          <div className="p-4 md:p-6 bg-green-950/20 border border-green-500/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in shadow-[0_0_20px_rgba(34,197,94,0.1)]">
            <div className="flex items-center gap-3 text-green-400">
                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 shrink-0"/>
                <div>
                  <div className="font-bold text-sm md:text-base">Audit Successfully Committed to Data Lake</div>
                  <div className="text-[10px] md:text-xs text-gray-400 mt-0.5">
                      <strong className="text-white">{uploadStatus.imported}</strong> new records synced. <strong className="text-gray-500">{uploadStatus.ignored}</strong> duplicates ignored.
                  </div>
                </div>
            </div>
            <button onClick={() => { setPreviewData([]); setUploadStatus(null); }} className="w-full sm:w-auto text-xs md:text-sm font-bold text-white bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-lg transition-colors">Start New Audit</button>
          </div>
      )}

      {!uploadStatus && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">

          <div className="lg:col-span-4 space-y-4 md:space-y-6">
              <GlassCard className="p-4 md:p-6">
                  <h3 className="font-bold text-white mb-3 md:mb-4 uppercase tracking-widest text-[10px] md:text-xs flex items-center gap-1.5 md:gap-2">
                      <UploadCloud size={14} className="md:w-4 md:h-4"/> Statement Drop
                  </h3>
                  <label className="border-2 border-dashed border-white/20 rounded-xl md:rounded-2xl p-5 md:p-8 flex flex-col items-center justify-center cursor-pointer hover:border-accent-info/50 hover:bg-white/5 transition-all group">
                    <Database className="w-6 h-6 md:w-8 md:h-8 text-gray-500 group-hover:text-accent-info mb-2 md:mb-3 transition-colors"/>
                    <span className="text-xs md:text-sm font-bold text-white mb-0.5 md:mb-1 text-center">Click to Drop Statement</span>
                    <span className="text-[9px] md:text-xs text-gray-500 text-center">.xls, .xlsx, or .csv</span>
                    <input 
                        type="file" 
                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                        className="hidden" 
                        onChange={handleFileUpload} 
                        disabled={isProcessing}
                        ref={fileInputRef}
                    />
                  </label>

                  {isProcessing && <div className="mt-3 md:mt-4 text-center text-[10px] md:text-xs text-blue-400 animate-pulse">Running ETL Pipeline...</div>}

                  {errorMsg && (
                    <div className="mt-3 md:mt-4 p-2.5 md:p-3 bg-red-500/10 border border-red-500/30 rounded-lg md:rounded-xl text-red-400 text-[10px] md:text-xs flex items-start gap-2">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5"/>
                        <div>{errorMsg}</div>
                    </div>
                  )}
              </GlassCard>

              {previewData.length > 0 && (
                  <GlassCard className="p-4 md:p-6 border-blue-500/20 bg-blue-950/10">
                      <h3 className="font-bold text-blue-400 mb-3 md:mb-4 uppercase tracking-widest text-[10px] md:text-xs flex items-center gap-1.5 md:gap-2">
                          <Activity size={14} className="md:w-4 md:h-4"/> Batch Metadata
                      </h3>
                      <div className="space-y-3 md:space-y-4">
                          <div>
                              <div className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold">System Signature</div>
                              <div className="font-bold text-white font-mono text-xs md:text-sm mt-1 bg-black/40 p-2 rounded border border-white/10 truncate">{batchSignature}</div>
                          </div>
                          <div className="flex justify-between items-center border-b border-white/5 pb-1.5 md:pb-2">
                              <span className="text-[10px] md:text-xs text-gray-400 font-bold">Total Records</span>
                              <span className="font-mono text-white font-bold text-xs md:text-sm">{previewData.length}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-white/5 pb-1.5 md:pb-2">
                              <span className="text-[10px] md:text-xs text-gray-400 font-bold">Time Span</span>
                              <span className="font-mono text-white text-[10px] md:text-xs">
                                 {new Date(previewData[0]?.date || '').toLocaleDateString()} - {new Date(previewData[previewData.length - 1]?.date || '').toLocaleDateString()}
                              </span>
                          </div>
                      </div>
                  </GlassCard>
              )}
          </div>

          <div className="lg:col-span-8 flex flex-col gap-4 md:gap-6">
              {previewData.length === 0 ? (
                  <GlassCard className="p-0 flex-1 flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px] border-dashed border-white/10">
                     <Clock className="w-10 h-10 md:w-12 md:h-12 opacity-20 text-gray-500 mb-3 md:mb-4"/>
                     <p className="text-gray-400 font-mono text-[10px] md:text-sm tracking-widest">AWAITING_PAYLOAD</p>
                  </GlassCard>
              ) : (
                  <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                          <GlassCard className={`p-4 md:p-5 transition-colors ${auditReport?.bleedCount ? 'border-red-500/40 bg-red-950/10' : 'border-green-500/20'}`}>
                             <div className="flex justify-between items-start mb-2">
                                <div className={`flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-bold ${auditReport?.bleedCount ? 'text-red-400' : 'text-green-400'}`}>
                                   <Zap size={14} className="md:w-4 md:h-4"/> High-Velocity Bleeds
                                </div>
                             </div>
                             {auditReport?.bleedCount ? (
                                <div>
                                    <div className="text-2xl md:text-3xl font-mono font-bold text-red-500 mb-1">
                                        <Naira/>{formatNumber(auditReport.totalBleed)}
                                    </div>
                                    <div className="text-[10px] md:text-xs text-red-400/80 font-bold">From {auditReport.bleedCount} unbatched micro-transactions.</div>
                                </div>
                             ) : (
                                <div className="text-xs md:text-sm text-green-500/80 mt-2 font-bold">Zero systemic friction detected. Batched architecture is holding.</div>
                             )}
                          </GlassCard>

                          <GlassCard className={`p-4 md:p-5 transition-colors ${auditReport?.anomalies.length ? 'border-orange-500/40 bg-orange-950/10' : 'border-green-500/20'}`}>
                             <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-bold text-orange-400 mb-3 md:mb-4">
                                <TrendingDown size={14} className="md:w-4 md:h-4"/> Structural Anomalies
                             </div>
                             {auditReport?.anomalies.length ? (
                                <div className="space-y-2 md:space-y-3 h-20 md:h-24 overflow-y-auto pr-1 md:pr-2 scrollbar-hide">
                                    {auditReport.anomalies.map((a, i) => (
                                        <div key={i} className="flex justify-between items-center text-[10px] md:text-xs">
                                            <span className="text-white font-bold truncate pr-2">{a.category}</span>
                                            <div className="text-right shrink-0">
                                                <span className="font-mono text-orange-400 font-bold">Deficit: ₦{formatNumber(a.deficit)}</span>
                                                {a.unbudgeted && <span className="block text-[8px] md:text-[9px] text-gray-500 uppercase mt-0.5">Unbudgeted Category</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             ) : (
                                <div className="text-xs md:text-sm text-green-500/80 mt-2 font-bold">All spending categories within OpEx operational limits.</div>
                             )}
                          </GlassCard>
                      </div>

                      {/* EXECUTION ACTION */}
                      <GlassCard className="p-4 md:p-6 border-blue-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                              <h3 className="font-bold text-white flex items-center gap-1.5 md:gap-2 text-sm md:text-base">
                                 <Fingerprint size={14} className="md:w-4 md:h-4 text-blue-400"/> Authorize Data Sync
                              </h3>
                              <p className="text-[10px] md:text-xs text-gray-400 mt-1">This will commit the records to the Data Lake and trigger the Journal engine.</p>
                          </div>
                          <GlassButton 
                              onClick={handleCommitAudit} 
                              disabled={isUploading}
                              className="w-full sm:w-auto text-xs md:text-sm py-2.5 md:py-3"
                          >
                              {isUploading ? 'Executing Sync...' : 'Commit Data & Trigger Audit'}
                          </GlassButton>
                      </GlassCard>
                  </>
              )}
          </div>
        </div>
      )}
    </div>
  );
};
