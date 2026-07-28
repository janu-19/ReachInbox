import React, { useState } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Mail, 
  Users, 
  Zap, 
  AlertCircle
} from 'lucide-react';

export interface PreviewData {
  previews: Array<{
    email: string;
    subject: string;
    body: string;
    scheduledTime: string;
  }>;
  statistics: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
  };
  validationWarnings: Array<{
    row: number;
    email: string;
    type: string;
    message: string;
  }>;
  spamWarnings: Array<{
    type: string;
    message: string;
  }>;
  estimatedDurationSeconds: number;
  estimatedFinishTime: string;
}

interface CampaignSummary {
  name: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  recipientCount: number;
  startTime: string;
  delaySeconds: number;
  hourlyLimit: number;
}

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  campaignSummary: CampaignSummary;
  previewData: PreviewData;
  submitting: boolean;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  campaignSummary,
  previewData,
  submitting
}) => {
  const [recipientIndex, setRecipientIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'previews' | 'warnings' | 'timeline'>('previews');

  if (!isOpen) return null;

  const currentPreview = previewData.previews[recipientIndex];
  const { statistics, validationWarnings, spamWarnings, estimatedFinishTime } = previewData;

  const handlePrev = () => {
    if (recipientIndex > 0) setRecipientIndex(recipientIndex - 1);
  };

  const handleNext = () => {
    if (recipientIndex < previewData.previews.length - 1) {
      setRecipientIndex(recipientIndex + 1);
    }
  };

  // Helper to format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    return parts.join(' ');
  };

  // Helper to format dates cleanly
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <Zap className="text-indigo-400" size={18} />
              Review Campaign Before Scheduling
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Verify templates, inspect target validations, check rate-limits, and estimate dispatch completion logs.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Summary and Stats */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* Campaign Summary Panel */}
            <div className="p-5 bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users size={14} className="text-slate-500" />
                Campaign Metadata
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-slate-500">Name:</span>
                  <span className="text-slate-300 font-medium truncate max-w-[150px]">{campaignSummary.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-slate-500">Sender Profile:</span>
                  <span className="text-slate-300 font-medium truncate max-w-[150px]" title={campaignSummary.senderEmail}>
                    {campaignSummary.senderName || campaignSummary.senderEmail}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-slate-500">Total Recipients:</span>
                  <span className="text-slate-300 font-medium">{statistics.total}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-slate-500">Delay Interval:</span>
                  <span className="text-slate-300 font-medium">{campaignSummary.delaySeconds}s</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-slate-500">Hourly Rate Limit:</span>
                  <span className="text-slate-300 font-medium">{campaignSummary.hourlyLimit} / hr</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-slate-500">Scheduled Start:</span>
                  <span className="text-indigo-400 font-semibold">{formatDate(campaignSummary.startTime)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                  <span className="text-slate-500">Estimated Duration:</span>
                  <span className="text-slate-300 font-medium">{formatDuration(previewData.estimatedDurationSeconds)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Finish:</span>
                  <span className="text-indigo-400 font-semibold">{formatDate(estimatedFinishTime)}</span>
                </div>
              </div>
            </div>

            {/* Statistics Card */}
            <div className="p-5 bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Recipient Import Audit
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-center">
                  <div className="text-lg font-bold text-indigo-400">{statistics.total}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Total Upload</div>
                </div>
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center">
                  <div className="text-lg font-bold text-emerald-400">{statistics.valid}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Valid List</div>
                </div>
                <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl text-center">
                  <div className="text-lg font-bold text-rose-400">{statistics.invalid}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Invalid Format</div>
                </div>
                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-center">
                  <div className="text-lg font-bold text-amber-400">{statistics.duplicates}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Duplicates</div>
                </div>
              </div>
            </div>

            {/* Spam Warnings Panel */}
            <div className="p-5 bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Spam Score Assessment
              </h3>
              {spamWarnings.length === 0 ? (
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center space-x-2 text-emerald-400 text-xs">
                  <CheckCircle size={16} />
                  <span>Looks safe! Clear of common spam headers.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {spamWarnings.map((w, index) => (
                    <div key={index} className="p-2.5 bg-amber-500/5 border border-amber-500/10 text-amber-300 rounded-xl flex items-start space-x-2 text-xs">
                      <AlertTriangle className="mt-0.5 flex-shrink-0" size={14} />
                      <span>{w.message}</span>
                    </div>
                  ))}
                  <p className="text-[10px] text-slate-500 mt-1 italic leading-relaxed">
                    Spam warnings are suggestions only. They will not block scheduling.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Previews, Warnings List, or Timeline */}
          <div className="lg:col-span-2 flex flex-col space-y-4">
            
            {/* View Selection Tabs */}
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setActiveTab('previews')}
                className={`pb-3 px-4 text-xs font-semibold border-b-2 transition ${
                  activeTab === 'previews'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Personalized Previews ({previewData.previews.length})
              </button>
              <button
                onClick={() => setActiveTab('warnings')}
                className={`pb-3 px-4 text-xs font-semibold border-b-2 transition relative ${
                  activeTab === 'warnings'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                CSV Warnings ({validationWarnings.length})
                {validationWarnings.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-rose-600 text-white rounded-full text-[9px] font-bold">
                    {validationWarnings.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`pb-3 px-4 text-xs font-semibold border-b-2 transition ${
                  activeTab === 'timeline'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Scheduled Timeline Checkpoints
              </button>
            </div>

            {/* Content Switcher */}
            <div className="flex-1 min-h-[350px] flex flex-col">
              
              {/* Previews View */}
              {activeTab === 'previews' && (
                <div className="flex-1 flex flex-col space-y-4">
                  {previewData.previews.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl p-8">
                      <Mail size={32} className="mb-2 text-slate-600" />
                      <p className="text-xs">No valid previews generated. Correct validation errors.</p>
                    </div>
                  ) : (
                    <>
                      {/* Recipient Navigator Controls */}
                      <div className="flex items-center justify-between bg-slate-950/20 border border-slate-800 p-3 rounded-xl">
                        <span className="text-xs text-slate-400">
                          Recipient Profile: <strong className="text-slate-200 font-semibold">{currentPreview?.email || 'N/A'}</strong>
                        </span>
                        <div className="flex items-center space-x-2.5">
                          <button
                            onClick={handlePrev}
                            disabled={recipientIndex === 0}
                            className="p-1 bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 rounded-lg transition"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span className="text-[11px] font-medium text-slate-300">
                            {recipientIndex + 1} of {previewData.previews.length}
                          </span>
                          <button
                            onClick={handleNext}
                            disabled={recipientIndex === previewData.previews.length - 1}
                            className="p-1 bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 rounded-lg transition"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Render Box */}
                      <div className="flex-1 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col overflow-hidden">
                        {/* Headers details */}
                        <div className="p-4 bg-slate-950/30 border-b border-slate-800/80 space-y-2 text-xs">
                          <div className="flex">
                            <span className="w-14 text-slate-500">To:</span>
                            <span className="text-slate-300 font-semibold">{currentPreview?.email}</span>
                          </div>
                          <div className="flex">
                            <span className="w-14 text-slate-500">Subject:</span>
                            <span className="text-indigo-300 font-semibold">{currentPreview?.subject}</span>
                          </div>
                          <div className="flex">
                            <span className="w-14 text-slate-500">Send At:</span>
                            <span className="text-slate-400 font-medium">{formatDate(currentPreview?.scheduledTime)}</span>
                          </div>
                        </div>
                        {/* Email Body HTML render */}
                        <div 
                          className="flex-1 p-6 text-sm text-slate-300 overflow-y-auto prose prose-invert max-w-none prose-xs leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: currentPreview?.body }}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Warnings List View */}
              {activeTab === 'warnings' && (
                <div className="flex-1 overflow-y-auto space-y-3 max-h-[400px] pr-2">
                  {validationWarnings.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl py-16">
                      <CheckCircle size={32} className="mb-2 text-emerald-500" />
                      <p className="text-xs font-medium text-slate-300">Clean Validation Audit!</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">No format, duplicate, or missing merge tags detected.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-3 bg-rose-500/5 border border-rose-500/10 text-rose-300 text-xs rounded-xl flex items-start space-x-2">
                        <AlertCircle className="mt-0.5 flex-shrink-0 text-rose-500" size={16} />
                        <div>
                          <strong className="font-semibold text-rose-200">Validation Warnings Found</strong>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Some rows contain issues that could result in sending errors. Double check the details below. Duplicate records will be automatically bypassed.
                          </p>
                        </div>
                      </div>
                      
                      {validationWarnings.map((w, index) => (
                        <div 
                          key={index} 
                          className="p-3 bg-slate-950/20 border border-slate-800/80 hover:border-slate-800 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-[9px] font-bold rounded">
                                Row {w.row}
                              </span>
                              {w.email && (
                                <span className="text-slate-400 font-mono truncate max-w-[200px]" title={w.email}>
                                  {w.email}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-300 text-[11px]">{w.message}</p>
                          </div>
                          
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                            w.type === 'DUPLICATE'
                              ? 'bg-amber-500/5 border-amber-500/20 text-amber-400'
                              : 'bg-rose-500/5 border-rose-500/20 text-rose-400'
                          }`}>
                            {w.type.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Timeline Preview View */}
              {activeTab === 'timeline' && (
                <div className="flex-1 flex flex-col space-y-4">
                  <div className="bg-slate-950/20 border border-slate-800 p-4 rounded-xl text-xs text-slate-400">
                    <p className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
                      <Clock size={14} className="text-indigo-400" />
                      Queue Staggering Log
                    </p>
                    Emails are spaced by <strong className="text-slate-200">{campaignSummary.delaySeconds}s</strong> delay, up to a maximum limit of <strong className="text-slate-200">{campaignSummary.hourlyLimit} emails</strong> per hour bucket.
                  </div>

                  {/* Render timeline track */}
                  <div className="flex-1 overflow-y-auto max-h-[300px] border border-slate-800 rounded-2xl p-4 bg-slate-950/40 space-y-3.5 pr-2">
                    {previewData.previews.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-12">No timeline available.</p>
                    ) : (
                      <div className="relative border-l border-slate-800 ml-4 space-y-6 py-2">
                        {/* Map out first 3, middle one (if large), and the last recipient */}
                        {previewData.previews.map((item, idx, arr) => {
                          const isFirst = idx === 0;
                          const isSecond = idx === 1;
                          const isThird = idx === 2;
                          const isLast = idx === arr.length - 1;
                          
                          // Only render first few and the absolute final recipient to keep clean UI
                          const shouldRender = isFirst || isSecond || isThird || isLast;
                          
                          if (!shouldRender) {
                            if (idx === 3 && arr.length > 4) {
                              return (
                                <div key={idx} className="relative pl-6">
                                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-slate-800 border-2 border-slate-900" />
                                  <div className="text-[10px] text-slate-500 italic py-1">
                                    ... {arr.length - 4} recipient dispatches pending in staggered rate queues ...
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }

                          return (
                            <div key={idx} className="relative pl-6">
                              {/* Indicator Dot */}
                              <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                                isLast ? 'bg-emerald-500' : isFirst ? 'bg-indigo-500' : 'bg-slate-500'
                              }`} />
                              
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-1">
                                <div>
                                  <span className="font-semibold text-slate-200">{item.email}</span>
                                  {isFirst && <span className="ml-2 px-1.5 py-0.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-[8px] font-bold rounded">START</span>}
                                  {isLast && <span className="ml-2 px-1.5 py-0.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold rounded">FINISH</span>}
                                </div>
                                <span className="text-slate-400 font-mono text-[11px]">
                                  {formatDate(item.scheduledTime)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* Footer Confirmation dialog */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="text-xs text-slate-400 hidden sm:block">
            {statistics.invalid > 0 ? (
              <span className="text-rose-400 flex items-center gap-1">
                <AlertTriangle size={14} />
                Warnings present! Duplicates will be bypassed.
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle size={14} />
                All checks passed! Ready to schedule.
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3.5">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={submitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition disabled:opacity-50 shadow-lg shadow-indigo-600/25"
            >
              {submitting ? (
                <>
                  <Clock className="animate-spin" size={14} />
                  <span>Scheduling Campaign...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={14} />
                  <span>Confirm Schedule</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
