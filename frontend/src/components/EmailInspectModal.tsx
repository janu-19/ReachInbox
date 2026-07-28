import React from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { EmailRow } from './EmailsTable.js';

interface EmailInspectModalProps {
  email: EmailRow | null;
  onClose: () => void;
}

export const EmailInspectModal: React.FC<EmailInspectModalProps> = ({ email, onClose }) => {
  if (!email) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-2xl p-6 rounded-2xl border border-slate-850 shadow-2xl relative max-h-[85vh] overflow-y-auto space-y-6">
        {/* Modal Header */}
        <div className="flex justify-between items-start border-b border-slate-900 pb-3">
          <div>
            <span className="text-[10px] text-indigo-400 font-mono block uppercase">
              campaign: {email.campaign.name}
            </span>
            <h3 className="text-lg font-bold text-slate-200">
              Recipient Job Detail
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-300 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-900">
            <span className="text-[10px] text-slate-500 block uppercase">RECIPIENT EMAIL</span>
            <span className="text-slate-300 font-medium">{email.recipient}</span>
          </div>

          <div className="space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-900">
            <span className="text-[10px] text-slate-500 block uppercase">BULLMQ JOB ID</span>
            <span className="text-slate-300">{email.jobId || '—'}</span>
          </div>

          <div className="space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-900">
            <span className="text-[10px] text-slate-500 block uppercase">TARGET DEPARTURE TIME</span>
            <span className="text-slate-400 flex items-center space-x-1">
              <Calendar size={12} />
              <span>{new Date(email.scheduledTime).toLocaleString()}</span>
            </span>
          </div>

          <div className="space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-900">
            <span className="text-[10px] text-slate-500 block uppercase">ACTUAL DELIVERED TIME</span>
            <span className="text-slate-400">
              {email.sentTime ? new Date(email.sentTime).toLocaleString() : 'Pending'}
            </span>
          </div>

          <div className="md:col-span-2 space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-900">
            <span className="text-[10px] text-slate-500 block uppercase">SUBJECT SENT</span>
            <span className="text-slate-300 font-sans block pt-1">{email.campaign.subject}</span>
          </div>

          <div className="md:col-span-2 space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-900">
            <span className="text-[10px] text-slate-500 block uppercase">RECIPIENT CUSTOM VARIABLES</span>
            <pre className="text-[10px] text-indigo-300/80 max-h-32 overflow-y-auto whitespace-pre-wrap pt-1 font-mono">
              {email.variables
                ? typeof email.variables === 'string'
                  ? JSON.stringify(JSON.parse(email.variables), null, 2)
                  : JSON.stringify(email.variables, null, 2)
                : '{}'}
            </pre>
          </div>

          {email.error && (
            <div className="md:col-span-2 space-y-1.5 bg-rose-500/5 p-3 rounded-xl border border-rose-500/10 text-rose-300/90">
              <span className="text-[10px] text-rose-400 block uppercase font-bold flex items-center space-x-1">
                <AlertCircle size={12} />
                <span>SMTPEngine Error Trace</span>
              </span>
              <div className="text-[10px] max-h-32 overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed py-1">
                {email.error}
              </div>
            </div>
          )}

          <div className="md:col-span-2 space-y-1.5 bg-slate-900/30 p-3 rounded-xl border border-slate-900">
            <span className="text-[10px] text-slate-500 block uppercase">IDEMPOTENCY LEDGER KEY</span>
            <span className="text-[10px] text-slate-400 font-mono select-all block break-all">
              {email.idempotencyKey}
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end border-t border-slate-900 pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-750 text-slate-300 rounded-xl text-xs font-semibold"
          >
            Close Audit Dialog
          </button>
        </div>
      </div>
    </div>
  );
};
