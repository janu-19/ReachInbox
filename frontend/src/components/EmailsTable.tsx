import React from 'react';
import { MailOpen, ChevronLeft, ChevronRight } from 'lucide-react';

export interface EmailRow {
  id: string;
  recipient: string;
  variables: any;
  scheduledTime: string;
  sentTime: string | null;
  status: 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED';
  error: string | null;
  jobId: string | null;
  idempotencyKey: string;
  createdAt: string;
  campaign: {
    name: string;
    subject: string;
    body: string;
  };
}

interface EmailsTableProps {
  emails: EmailRow[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showSentTime?: boolean;
  showScheduledTime?: boolean;
  onInspect: (email: EmailRow) => void;
  emptyMessage?: string;
}

export const EmailsTable: React.FC<EmailsTableProps> = ({
  emails,
  loading,
  page,
  totalPages,
  onPageChange,
  showSentTime = true,
  showScheduledTime = true,
  onInspect,
  emptyMessage = 'No matching email logs found.',
}) => {
  if (loading) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm font-mono animate-pulse">
        Loading records...
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="glass-panel p-12 text-center rounded-2xl border border-slate-900 space-y-3 font-mono">
        <MailOpen size={32} className="mx-auto text-slate-700" />
        <p className="text-xs text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl border border-slate-900 shadow-sm overflow-hidden space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-900/60 text-slate-500 text-[10px] font-mono tracking-wider uppercase">
              <th className="px-6 py-3.5">Recipient</th>
              <th className="px-6 py-3.5">Campaign Name</th>
              {showScheduledTime && <th className="px-6 py-3.5">Target Time</th>}
              {showSentTime && <th className="px-6 py-3.5">Dispatched Time</th>}
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Details</th>
            </tr>
          </thead>
          <tbody>
            {emails.map((email) => (
              <tr
                key={email.id}
                className="border-b border-slate-900/40 text-xs text-slate-300 hover:bg-slate-900/10 transition-colors"
              >
                <td className="px-6 py-4 font-mono truncate max-w-[200px]">
                  {email.recipient}
                </td>
                <td className="px-6 py-4 truncate max-w-[150px]">
                  {email.campaign.name}
                </td>
                {showScheduledTime && (
                  <td className="px-6 py-4 text-slate-400">
                    {new Date(email.scheduledTime).toLocaleString()}
                  </td>
                )}
                {showSentTime && (
                  <td className="px-6 py-4 text-slate-400">
                    {email.sentTime ? new Date(email.sentTime).toLocaleString() : '—'}
                  </td>
                )}
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold border uppercase inline-block ${
                      email.status === 'SENT'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : email.status === 'SENDING'
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        : email.status === 'FAILED'
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                    }`}
                  >
                    {email.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onInspect(email)}
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-750 text-[10px] text-slate-400 hover:text-indigo-400 rounded-lg transition-all"
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-900/60 flex justify-between items-center bg-slate-950/20">
          <span className="text-xs text-slate-400 font-mono">
            Page {page} of {totalPages}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1.5 bg-slate-900 border border-slate-800 disabled:border-slate-900/60 text-slate-400 disabled:text-slate-600 rounded-lg hover:text-slate-200 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-1.5 bg-slate-900 border border-slate-800 disabled:border-slate-900/60 text-slate-400 disabled:text-slate-600 rounded-lg hover:text-slate-200 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
