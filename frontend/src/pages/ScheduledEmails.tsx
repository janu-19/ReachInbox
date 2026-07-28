import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { EmailsTable, EmailRow } from '../components/EmailsTable.js';
import { EmailInspectModal } from '../components/EmailInspectModal.js';

export const ScheduledEmails: React.FC = () => {
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [selectedEmail, setSelectedEmail] = useState<EmailRow | null>(null);

  useEffect(() => {
    fetchScheduledEmails();
  }, [page]);

  const fetchScheduledEmails = async () => {
    setLoading(true);
    try {
      const response = await api.get('/scheduled', {
        params: { page, limit },
      });
      setEmails(response.data.data);
      setTotalPages(response.data.meta.totalPages || 1);
    } catch (err) {
      console.error('Error fetching scheduled emails', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scheduled Queue</h1>
        <p className="text-xs text-slate-400">
          Monitor pending dispatches and active sending worker slots.
        </p>
      </div>

      {/* Main Table logs */}
      <EmailsTable
        emails={emails}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        showScheduledTime={true}
        showSentTime={false} // Don't show sent times since these are pending/scheduled!
        onInspect={setSelectedEmail}
        emptyMessage="No pending or scheduled email dispatches found in the active worker queue."
      />

      {/* Detail Overlay Inspect Modal */}
      <EmailInspectModal
        email={selectedEmail}
        onClose={() => setSelectedEmail(null)}
      />
    </div>
  );
};
