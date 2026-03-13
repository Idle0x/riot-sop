import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import { processStatement } from '../utils/csvParsers';
import { type HistoryLog } from '../types';

import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { Naira } from '../components/ui/Naira';
import { formatNumber } from '../utils/format';

import { UploadCloud, CheckCircle2, Database, Zap, FileSpreadsheet, AlertTriangle } from 'lucide-react';

export const Ingestion = () => {
  const { session } = useUser();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<Partial<HistoryLog>[]>([]);
  const [uploadStatus, setUploadStatus] = useState<{ imported: number; ignored: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadStatus(null);
    setErrorMsg(null);

    try {
      // The Master Router automatically handles Excel (.xls/.xlsx) or CSV files
      const data = await processStatement(file);
      setPreviewData(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to parse document.");
      console.error(err);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCommitToLedger = async () => {
    if (!session?.user?.id || previewData.length === 0) return;
    setIsUploading(true);
    setErrorMsg(null);

    try {
      // Prepare the payload mapping to snake_case for DB
      const payload = previewData.map(log => ({
        user_id: session.user.id,
        date: log.date,
        type: log.type,
        title: log.title,
        amount: log.amount,
        currency: log.currency,
        description: log.description,
        transaction_ref: log.transactionRef,
        high_velocity_flag: log.highVelocityFlag,
        category_group: log.categoryGroup,
        tags: log.tags
      }));

      // Bulk Insert with Idempotency
      const { data, error } = await supabase
        .from('history')
        .upsert(payload, { onConflict: 'transaction_ref', ignoreDuplicates: true })
        .select();

      if (error) throw error;

      const importedCount = data ? data.length : 0;
      const ignoredCount = payload.length - importedCount;
      
      setUploadStatus({ imported: importedCount, ignored: ignoredCount });
      queryClient.invalidateQueries({ queryKey: ['history'] });
      
    } catch (err: any) {
      setErrorMsg(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const bleedCount = previewData.filter(d => d.highVelocityFlag).length;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 pb-20 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Database className="text-accent-info" /> Data Ingestion
        </h1>
        <p className="text-gray-400 text-sm mt-1">Upload native bank statements. Duplicates are automatically ignored.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CONTROLS */}
        <GlassCard className="p-6 h-fit md:col-span-1">
          <h3 className="font-bold text-white mb-4 uppercase tracking-widest text-xs">Upload Statement</h3>
          
          <label className="border-2 border-dashed border-white/20 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-accent-info/50 hover:bg-white/5 transition-all group">
             <UploadCloud size={32} className="text-gray-500 group-hover:text-accent-info mb-3"/>
             <span className="text-sm font-bold text-white mb-1 text-center">Click to Upload Statement</span>
             <span className="text-xs text-gray-500">.xls, .xlsx, or .csv</span>
             <input 
                type="file" 
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                className="hidden" 
                onChange={handleFileUpload} 
                disabled={isProcessing}
                ref={fileInputRef}
             />
          </label>

          {isProcessing && <div className="mt-4 text-center text-xs text-blue-400 animate-pulse">Extracting Financial Data...</div>}
          
          {errorMsg && (
             <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-start gap-2">
                 <AlertTriangle size={14} className="shrink-0 mt-0.5"/>
                 <div>{errorMsg}</div>
             </div>
          )}
        </GlassCard>

        {/* PREVIEW & TELEMETRY */}
        <GlassCard className="p-0 overflow-hidden flex flex-col md:col-span-2 min-h-[500px]">
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
             <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                   <FileSpreadsheet size={18}/> Telemetry Preview
                </h3>
                <div className="text-xs text-gray-500 mt-1">{previewData.length} records parsed</div>
             </div>
             
             {bleedCount > 0 && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold">
                   <Zap size={14}/> {bleedCount} High-Velocity Bleeds Detected
                </div>
             )}
          </div>

          <div className="flex-1 overflow-y-auto bg-black/20 p-4">
             {previewData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2">
                   <Database size={48} className="opacity-20"/>
                   <p className="text-sm">Awaiting native Excel or CSV payload...</p>
                </div>
             ) : (
                <div className="space-y-2">
                   {previewData.slice(0, 100).map((row, idx) => (
                      <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between text-sm ${row.highVelocityFlag ? 'bg-red-950/20 border-red-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                         <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${row.type === 'DROP' ? 'bg-green-500' : 'bg-red-500'}`}/>
                            <div className="truncate">
                               <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">{row.categoryGroup}</span>
                                  {row.highVelocityFlag && <span className="text-[10px] bg-red-500 text-white px-1.5 rounded uppercase font-bold">Bleed</span>}
                               </div>
                               <div className="text-xs text-gray-500 truncate max-w-[200px] md:max-w-[300px]">{row.description}</div>
                            </div>
                         </div>
                         <div className="text-right shrink-0">
                            <div className={`font-mono font-bold ${row.type === 'DROP' ? 'text-green-400' : 'text-red-400'}`}>
                               {row.type === 'DROP' ? '+' : '-'}<Naira/>{formatNumber(row.amount || 0)}
                            </div>
                            <div className="text-[10px] text-gray-600">{new Date(row.date!).toLocaleDateString()}</div>
                         </div>
                      </div>
                   ))}
                   {previewData.length > 100 && (
                      <div className="text-center py-4 text-xs text-gray-500 italic">...and {previewData.length - 100} more records hidden from preview.</div>
                   )}
                </div>
             )}
          </div>

          {previewData.length > 0 && !uploadStatus && (
             <div className="p-4 bg-black/60 border-t border-white/10 flex justify-end">
                <GlassButton onClick={handleCommitToLedger} disabled={isUploading} className="w-full md:w-auto">
                   {isUploading ? 'Executing Bulk Insert...' : `Commit ${previewData.length} Records to Ledger`}
                </GlassButton>
             </div>
          )}

          {uploadStatus && (
             <div className="p-6 bg-green-950/20 border-t border-green-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3 text-green-400">
                   <CheckCircle2 size={24}/>
                   <div>
                      <div className="font-bold">Ingestion Complete</div>
                      <div className="text-xs text-gray-400">
                         <strong className="text-white">{uploadStatus.imported}</strong> new records added. <strong className="text-gray-500">{uploadStatus.ignored}</strong> duplicates ignored.
                      </div>
                   </div>
                </div>
                <button onClick={() => { setPreviewData([]); setUploadStatus(null); }} className="text-xs text-gray-500 hover:text-white underline">Upload Another</button>
             </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
