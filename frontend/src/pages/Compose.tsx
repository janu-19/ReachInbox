import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { useNavigate } from 'react-router-dom';
import { Send, AlertTriangle, CheckCircle, FileSpreadsheet, Keyboard, Sparkles } from 'lucide-react';

interface SenderAccount {
  id: string;
  name: string;
  email: string;
}

interface ParsedRecipient {
  email: string;
  variables?: Record<string, string>;
}

// Custom browser-side CSV parser supporting quotes and dynamically mapping columns
const parseCSVText = (text: string): ParsedRecipient[] => {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
  if (lines.length < 2) {
    throw new Error('CSV must contain a header row and at least one recipient.');
  }

  // Parses a single line split by commas, respecting double quotes
  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());
    return cells;
  };

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim());
  const emailIndex = headers.indexOf('email');

  if (emailIndex === -1) {
    throw new Error('CSV is missing the mandatory "email" header column.');
  }

  const list: ParsedRecipient[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i]);
    if (row.length < headers.length) continue; // Skip malformed/incomplete lines

    const email = row[emailIndex];
    if (!email || !email.includes('@')) continue; // Basic filter for email format

    const variables: Record<string, string> = {};
    headers.forEach((header, idx) => {
      if (idx !== emailIndex) {
        variables[header] = row[idx] || '';
      }
    });

    list.push({
      email,
      variables: Object.keys(variables).length > 0 ? variables : undefined,
    });
  }

  if (list.length === 0) {
    throw new Error('Could not parse any valid recipient rows from the CSV content.');
  }

  return list;
};

export const Compose: React.FC = () => {
  const navigate = useNavigate();
  const [senders, setSenders] = useState<SenderAccount[]>([]);
  const [loadingSenders, setLoadingSenders] = useState(true);

  // Form Inputs
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [senderAccountId, setSenderAccountId] = useState('');
  const [startTime, setStartTime] = useState(() => {
    // Default to current time formatted as YYYY-MM-DDTHH:MM
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [delaySeconds, setDelaySeconds] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(100);

  // CSV states
  const [csvMode, setCsvMode] = useState<'upload' | 'paste'>('upload');
  const [csvText, setCsvText] = useState('');
  const [parsedRecipients, setParsedRecipients] = useState<ParsedRecipient[]>([]);
  const [csvSuccessMessage, setCsvSuccessMessage] = useState<string | null>(null);

  // Alert controls
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSenders();
  }, []);

  const fetchSenders = async () => {
    setLoadingSenders(true);
    try {
      const response = await api.get('/senders');
      setSenders(response.data);
      if (response.data.length > 0) {
        setSenderAccountId(response.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching sender profiles', err);
    } finally {
      setLoadingSenders(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setCsvSuccessMessage(null);
    setParsedRecipients([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const list = parseCSVText(text);
        setParsedRecipients(list);
        
        // Find variables list for display
        const sampleVars = list[0].variables ? Object.keys(list[0].variables).join(', ') : 'none';
        setCsvSuccessMessage(`Successfully parsed ${list.length} recipients. Dynamic tags found: ${sampleVars}`);
      } catch (err: any) {
        setError(`CSV Parse Error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteParse = () => {
    setError(null);
    setCsvSuccessMessage(null);
    setParsedRecipients([]);

    try {
      const list = parseCSVText(csvText);
      setParsedRecipients(list);
      const sampleVars = list[0].variables ? Object.keys(list[0].variables).join(', ') : 'none';
      setCsvSuccessMessage(`Successfully parsed ${list.length} recipients. Dynamic tags found: ${sampleVars}`);
    } catch (err: any) {
      setError(`CSV Parse Error: ${err.message}`);
    }
  };

  const handleScheduleCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (parsedRecipients.length === 0) {
      setError('Please parse a valid recipient list first before scheduling.');
      return;
    }

    if (!senderAccountId) {
      setError('Please select a sender profile account.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        subject,
        body: body.replace(/\n/g, '<br/>'), // Support HTML linebreaks in SMTP
        senderAccountId,
        startTime: new Date(startTime).toISOString(),
        delaySeconds: Number(delaySeconds),
        hourlyLimit: Number(hourlyLimit),
        recipients: parsedRecipients,
      };

      await api.post('/schedule', payload);
      setSuccess('Campaign scheduled and queue jobs generated successfully!');
      
      setTimeout(() => {
        navigate('/');
      }, 1500);

    } catch (err: any) {
      if (err.response?.data?.details) {
        console.error('API Validation Details:', err.response.data.details);
        const validationMsgs = err.response.data.details
          .map((d: any) => `${d.field}: ${d.message}`)
          .join(', ');
        setError(`Validation Error - ${validationMsgs}`);
      } else {
        setError(err.response?.data?.message || 'Failed to schedule campaign.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compose Campaign</h1>
        <p className="text-xs text-slate-400">
          Set up template filters, upload CSV mailing lists, and orchestrate delivery speeds.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center space-x-2">
          <AlertTriangle className="flex-shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle className="flex-shrink-0" size={16} />
          <span>{success}</span>
        </div>
      )}

      {loadingSenders ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          Loading campaign resources...
        </div>
      ) : senders.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-900 space-y-4">
          <AlertTriangle className="mx-auto text-amber-500" size={48} />
          <div>
            <h3 className="font-semibold text-slate-300">No Active Sender Connected</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              You must register a validated SMTP sender in the Senders tab before setting up campaign mailers.
            </p>
          </div>
          <button
            onClick={() => navigate('/senders')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
          >
            Connect Sender Now
          </button>
        </div>
      ) : (
        <form onSubmit={handleScheduleCampaign} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Compose Inputs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-900/60 space-y-4 shadow-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">
                  CAMPAIGN NAME
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Outreach 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">
                  EMAIL SUBJECT
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hello {{name}}, exciting updates for {{company}}!"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-400 font-mono">
                    EMAIL BODY (HTML ALLOWED)
                  </label>
                  <span className="text-[10px] text-indigo-400 font-mono flex items-center space-x-1">
                    <Sparkles size={12} />
                    <span>Supports tags like {"{{name}}"}</span>
                  </span>
                </div>
                <textarea
                  required
                  rows={10}
                  placeholder="Hi {{name}},&#10;&#10;I noticed your work at {{company}}..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Recipient Source Upload */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-900/60 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-slate-200 text-sm">Recipients List</h3>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setCsvMode('upload')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      csvMode === 'upload'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileSpreadsheet size={14} />
                    <span>Upload CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCsvMode('paste')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      csvMode === 'paste'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Keyboard size={14} />
                    <span>Paste CSV Text</span>
                  </button>
                </div>
              </div>

              {csvMode === 'upload' ? (
                <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-slate-700 transition-all duration-200 bg-slate-900/30">
                  <input
                    type="file"
                    accept=".csv"
                    id="csv-file-input"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="csv-file-input" className="cursor-pointer block space-y-2">
                    <FileSpreadsheet className="mx-auto text-slate-500" size={32} />
                    <div>
                      <p className="text-xs font-medium text-slate-300">Click to upload recipient CSV</p>
                      <p className="text-[10px] text-slate-500 mt-1">File must include a header row with an "email" column</p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    rows={4}
                    placeholder="email,name,company&#10;alice@test.com,Alice,Google&#10;bob@test.com,Bob,Microsoft"
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handlePasteParse}
                      className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-all"
                    >
                      Parse CSV Text
                    </button>
                  </div>
                </div>
              )}

              {csvSuccessMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center space-x-2 font-mono">
                  <CheckCircle size={14} className="flex-shrink-0" />
                  <span>{csvSuccessMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Scheduling Parameters */}
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-900/60 space-y-5 shadow-sm">
              <h3 className="font-semibold text-slate-200 text-sm border-b border-slate-900/60 pb-2">
                Queue & Speed Settings
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">
                  SEND FROM SENDER PROFILE
                </label>
                <select
                  value={senderAccountId}
                  onChange={(e) => setSenderAccountId(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {senders.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">
                  CAMPAIGN START TIME
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-400 font-mono font-medium">
                    DISPATCH DELAY SPACING
                  </label>
                  <span className="text-xs text-indigo-400 font-mono font-bold">
                    {delaySeconds}s
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(Number(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Seconds between subsequent email sends.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">
                  HOURLY SENDING LIMIT
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={hourlyLimit}
                  onChange={(e) => setHourlyLimit(Number(e.target.value))}
                  className="block w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Max emails pushed within any 1-hour bucket.
                </span>
              </div>

              <div className="pt-4 border-t border-slate-900/60">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-indigo-600/10"
                >
                  <Send size={16} />
                  <span>{submitting ? 'Generating Queue Jobs...' : 'Schedule Campaign'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
