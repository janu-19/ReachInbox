import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { EmailsTable, EmailRow } from '../components/EmailsTable.js';
import { EmailInspectModal } from '../components/EmailInspectModal.js';

export const SentEmails: React.FC = () => {
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [selectedEmail, setSelectedEmail] = useState<EmailRow | null>(null);

  useEffect(() => {
    fetchSentEmails();
  }, [page]);

  const fetchSentEmails = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sent', {
        params: { page, limit },
      });
      setEmails(response.data.data);
      setTotalPages(response.data.meta.totalPages || 1);
    } catch (err) {
      console.error('Error fetching sent email history', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sent History</h1>
        <p className="text-xs text-slate-400">
          Trace completed campaigns, check dispatched times, and analyze failure records.
        </p>
      </div>

      {/* Main Table logs */}
      <EmailsTable
        emails={emails}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        showScheduledTime={false} // Focus on actual sent times for historical audit
        showSentTime={true}
        onInspect={setSelectedEmail}
        emptyMessage="No historical sent or failed campaign dispatches discovered."
      />

      {/* Detail Overlay Inspect Modal */}
      <EmailInspectModal
        email={selectedEmail}
        onClose={() => setSelectedEmail(null)}
      />
    </div>
  );
};
