import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { Search, ChevronLeft, ChevronRight, X, MailOpen, AlertCircle, Calendar } from 'lucide-react';

interface EmailItem {
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

export const Emails: React.FC = () => {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>(''); // empty means All
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Selected email detail modal
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);

  useEffect(() => {
    fetchEmails();
  }, [page, status]);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (status) params.status = status;
      if (search.trim()) params.search = search.trim();

      const response = await api.get('/emails', { params });
      setEmails(response.data.data);
      setTotalPages(response.data.meta.totalPages || 1);
    } catch (err) {
      console.error('Error fetching emails list', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEmails();
  };

  const fetchEmailDetails = async (id: string) => {
    try {
      const response = await api.get(`/emails/${id}`);
      setSelectedEmail(response.data);
    } catch (err) {
      console.error('Error fetching email details', err);
    }
  };

  const statusTabs = [
    { label: 'All Logged', value: '' },
    { label: 'Scheduled', value: 'SCHEDULED' },
    { label: 'Sending', value: 'SENDING' },
    { label: 'Sent', value: 'SENT' },
    { label: 'Failed', value: 'FAILED' },
  ];

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-xs text-slate-400">
          Track and trace every scheduled, active, sent, or failed email job.
        </p>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Search recipient email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-24 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm placeholder-slate-500 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search size={16} />
          </div>
          <button
            type="submit"
            className="absolute inset-y-1.5 right-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all"
          >
            Search
          </button>
        </form>

        {/* Tab Selector */}
        <div className="flex bg-slate-900 border border-slate-900 rounded-xl p-1 overflow-x-auto self-start md:self-auto max-w-full">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                status === tab.value
                  ? 'bg-slate-950 text-indigo-300 shadow-sm border border-slate-850'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table logs */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          Loading audit entries...
        </div>
      ) : emails.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-900 space-y-3 font-mono">
          <MailOpen size={32} className="mx-auto text-slate-700 animate-pulse" />
          <p className="text-xs text-slate-500">No matching email logs found.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-900 shadow-sm overflow-hidden space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900/60 text-slate-500 text-[10px] font-mono tracking-wider uppercase">
                  <th className="px-6 py-3.5">Recipient</th>
                  <th className="px-6 py-3.5">Campaign Name</th>
                  <th className="px-6 py-3.5">Target Time</th>
                  <th className="px-6 py-3.5">Sent Time</th>
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
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(email.scheduledTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {email.sentTime ? new Date(email.sentTime).toLocaleString() : '—'}
                    </td>
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
                        onClick={() => fetchEmailDetails(email.id)}
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-900/60 flex justify-between items-center bg-slate-950/20">
              <span className="text-xs text-slate-400 font-mono">
                Page {page} of {totalPages}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 bg-slate-900 border border-slate-800 disabled:border-slate-900/60 text-slate-400 disabled:text-slate-600 rounded-lg hover:text-slate-200 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 bg-slate-900 border border-slate-800 disabled:border-slate-900/60 text-slate-400 disabled:text-slate-600 rounded-lg hover:text-slate-200 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Audit Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl p-6 rounded-2xl border border-slate-850 shadow-2xl relative max-h-[85vh] overflow-y-auto space-y-6">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-900 pb-3">
              <div>
                <span className="text-[10px] text-indigo-400 font-mono block uppercase">
                  campaign: {selectedEmail.campaign.name}
                </span>
                <h3 className="text-lg font-bold text-slate-200">
                  Recipient Job Detail
                </h3>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-900">
                <span className="text-[10px] text-slate-500 block uppercase">RECIPIENT EMAIL</span>
                <span className="text-slate-300 font-medium">{selectedEmail.recipient}</span>
              </div>

              <div className="space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-900">
                <span className="text-[10px] text-slate-500 block uppercase">BULLMQ JOB ID</span>
                <span className="text-slate-300">{selectedEmail.jobId || '—'}</span>
              </div>

              <div className="space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-900">
                <span className="text-[10px] text-slate-500 block uppercase">TARGET DEPARTURE TIME</span>
                <span className="text-slate-400 flex items-center space-x-1">
                  <Calendar size={12} />
                  <span>{new Date(selectedEmail.scheduledTime).toLocaleString()}</span>
                </span>
              </div>

              <div className="space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-900">
                <span className="text-[10px] text-slate-500 block uppercase">ACTUAL DELIVERED TIME</span>
                <span className="text-slate-400">
                  {selectedEmail.sentTime ? new Date(selectedEmail.sentTime).toLocaleString() : 'Pending'}
                </span>
              </div>

              <div className="md:col-span-2 space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-900">
                <span className="text-[10px] text-slate-500 block uppercase">SUBJECT SENT</span>
                <span className="text-slate-300 font-sans block pt-1">{selectedEmail.campaign.subject}</span>
              </div>

              <div className="md:col-span-2 space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-900">
                <span className="text-[10px] text-slate-500 block uppercase">RECIPIENT CUSTOM VARIABLES</span>
                <pre className="text-[10px] text-indigo-300/80 max-h-32 overflow-y-auto whitespace-pre-wrap pt-1 font-mono">
                  {selectedEmail.variables
                    ? typeof selectedEmail.variables === 'string'
                      ? JSON.stringify(JSON.parse(selectedEmail.variables), null, 2)
                      : JSON.stringify(selectedEmail.variables, null, 2)
                    : '{}'}
                </pre>
              </div>

              {selectedEmail.error && (
                <div className="md:col-span-2 space-y-1.5 bg-rose-500/5 p-3 rounded-xl border border-rose-500/10 text-rose-300/90">
                  <span className="text-[10px] text-rose-400 block uppercase font-bold flex items-center space-x-1">
                    <AlertCircle size={12} />
                    <span>SMTPEngine Error Trace</span>
                  </span>
                  <div className="text-[10px] max-h-32 overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed py-1">
                    {selectedEmail.error}
                  </div>
                </div>
              )}

              <div className="md:col-span-2 space-y-1.5 bg-slate-900/30 p-3 rounded-xl border border-slate-900">
                <span className="text-[10px] text-slate-500 block uppercase">IDEMPOTENCY LEDGER KEY</span>
                <span className="text-[10px] text-slate-400 font-mono select-all block break-all">
                  {selectedEmail.idempotencyKey}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-slate-900 pt-3">
              <button
                onClick={() => setSelectedEmail(null)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close Audit Dialog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
