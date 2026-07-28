import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { Plus, Server, Send, AlertTriangle, CheckCircle } from 'lucide-react';

interface SenderAccount {
  id: string;
  name: string;
  email: string;
  provider: 'ETHEREAL' | 'GMAIL' | 'OUTLOOK' | 'CUSTOM_SMTP';
  createdAt: string;
}

export const Senders: React.FC = () => {
  const [senders, setSenders] = useState<SenderAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [provider, setProvider] = useState<'ETHEREAL' | 'GMAIL' | 'OUTLOOK' | 'CUSTOM_SMTP'>('ETHEREAL');
  const [smtpHost, setSmtpHost] = useState('smtp.ethereal.email');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('placeholder_user');
  const [smtpPass, setSmtpPass] = useState('placeholder_pass');

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSenders();
  }, []);

  const fetchSenders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/senders');
      setSenders(response.data);
    } catch (error) {
      console.error('Error fetching senders', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (prov: 'ETHEREAL' | 'GMAIL' | 'OUTLOOK' | 'CUSTOM_SMTP') => {
    setProvider(prov);
    setFormError(null);
    if (prov === 'ETHEREAL') {
      setSmtpHost('smtp.ethereal.email');
      setSmtpPort(587);
      setSmtpUser('placeholder_user');
      setSmtpPass('placeholder_pass');
    } else if (prov === 'GMAIL') {
      setSmtpHost('smtp.gmail.com');
      setSmtpPort(587);
      setSmtpUser('');
      setSmtpPass('');
    } else if (prov === 'OUTLOOK') {
      setSmtpHost('smtp.office365.com');
      setSmtpPort(587);
      setSmtpUser('');
      setSmtpPass('');
    } else {
      setSmtpHost('');
      setSmtpPort(587);
      setSmtpUser('');
      setSmtpPass('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const payload = {
        name,
        email,
        provider,
        smtpHost,
        smtpPort: Number(smtpPort),
        smtpUser,
        smtpPass,
      };

      await api.post('/senders', payload);
      setFormSuccess('Sender SMTP configuration verified and connected successfully!');
      
      // Reset form
      setName('');
      setEmail('');
      handleProviderChange('ETHEREAL');
      
      // Wait a bit, close form, refresh lists
      setTimeout(() => {
        setFormOpen(false);
        setFormSuccess(null);
        fetchSenders();
      }, 1500);

    } catch (error: any) {
      setFormError(
        error.response?.data?.message ||
        'Failed to connect to SMTP server. Verify your connection settings and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SMTP Senders</h1>
          <p className="text-xs text-slate-400">
            Link and manage sender profiles for email dispatches.
          </p>
        </div>
        <button
          onClick={() => setFormOpen(!formOpen)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all duration-200"
        >
          <Plus size={16} />
          <span>{formOpen ? 'Close Form' : 'Add SMTP Sender'}</span>
        </button>
      </div>

      {/* Connection Form Panel */}
      {formOpen && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 shadow-xl space-y-4">
          <h3 className="font-semibold text-slate-200 text-sm flex items-center space-x-2">
            <Server size={18} className="text-indigo-400" />
            <span>Connect SMTP Credentials</span>
          </h3>

          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center space-x-2">
              <AlertTriangle size={16} className="flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center space-x-2">
              <CheckCircle size={16} className="flex-shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">
                DISPLAY NAME
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sales Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">
                SENDER EMAIL ADDRESS
              </label>
              <input
                type="email"
                required
                placeholder="e.g. sales@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">
                SMTP PROVIDER
              </label>
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as any)}
                className="block w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="ETHEREAL">Ethereal Email (Testing)</option>
                <option value="GMAIL">GMail SMTP</option>
                <option value="OUTLOOK">Outlook/Office365</option>
                <option value="CUSTOM_SMTP">Custom SMTP Server</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">
                SMTP SERVER HOST
              </label>
              <input
                type="text"
                required
                placeholder="e.g. smtp.mailtrap.io"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className="block w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">
                SMTP PORT
              </label>
              <input
                type="number"
                required
                value={smtpPort}
                onChange={(e) => setSmtpPort(Number(e.target.value))}
                className="block w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">
                SMTP USERNAME
              </label>
              <input
                type="text"
                required
                placeholder="e.g. sales@company.com"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                className="block w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">
                SMTP PASSWORD
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                className="block w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {provider === 'ETHEREAL' && (
              <div className="md:col-span-2 text-[10px] text-indigo-400/80 bg-indigo-500/5 border border-indigo-500/10 p-2.5 rounded-xl font-mono">
                ℹ️ Prefilled with placeholders. The backend will map this Ethereal SMTP request to utilize the default credentials in your server env keys.
              </div>
            )}

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-xl text-sm font-semibold transition-all duration-200"
              >
                <Send size={16} />
                <span>{submitting ? 'Running SMTP Connection Test...' : 'Verify & Link Account'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Senders List Display */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          Loading SMTP configs...
        </div>
      ) : senders.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-900 space-y-4">
          <Server size={48} className="mx-auto text-slate-700" />
          <div>
            <h3 className="font-semibold text-slate-300">No SMTP Senders Connected</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              You must register at least one sender account before you can compile or schedule email campaigns.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {senders.map((sender) => (
            <div
              key={sender.id}
              className="glass-panel p-5 rounded-2xl border border-slate-900/60 hover:border-slate-800 transition-all duration-200 flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-200 leading-none">{sender.name}</h4>
                  <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 py-1 px-2.5 rounded-full border border-indigo-500/20 uppercase">
                    {sender.provider}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono truncate">{sender.email}</p>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-900/40 pt-3">
                <span>Linked {new Date(sender.createdAt).toLocaleDateString()}</span>
                <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 block animate-pulse"></span>
                  <span>SMTP Validated</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
