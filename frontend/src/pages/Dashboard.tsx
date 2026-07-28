import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { NavLink } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  Mail,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface EmailItem {
  id: string;
  recipient: string;
  scheduledTime: string;
  status: 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED';
  campaign: {
    name: string;
    subject: string;
  };
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    scheduled: 0,
    sent: 0,
    failed: 0,
  });
  const [recentEmails, setRecentEmails] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // Poll data every 10 seconds to show real-time progress of workers!
    const timer = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [scheduledRes, sentRes, failedRes, recentRes] = await Promise.all([
        api.get('/emails?status=SCHEDULED&limit=1'),
        api.get('/emails?status=SENT&limit=1'),
        api.get('/emails?status=FAILED&limit=1'),
        api.get('/emails?limit=6'),
      ]);

      setStats({
        scheduled: scheduledRes.data.meta.total,
        sent: sentRes.data.meta.total,
        failed: failedRes.data.meta.total,
      });
      setRecentEmails(recentRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard statistics', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Scheduled Queue',
      value: stats.scheduled,
      icon: <Clock className="text-indigo-400" size={24} />,
      colorClass: 'border-indigo-500/20 text-indigo-400 bg-indigo-500/5',
      desc: 'Pending worker dispatches',
    },
    {
      title: 'Sent Successfully',
      value: stats.sent,
      icon: <CheckCircle className="text-emerald-400" size={24} />,
      colorClass: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5',
      desc: 'Successfully verified delivers',
    },
    {
      title: 'Failed Attempts',
      value: stats.failed,
      icon: <AlertTriangle className="text-rose-400" size={24} />,
      colorClass: 'border-rose-500/20 text-rose-400 bg-rose-500/5',
      desc: 'Errors requiring review',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Banner / Hero Section */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-900/60 shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-slate-900/40 via-indigo-950/5 to-slate-900/40">
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent flex items-center justify-center md:justify-start space-x-2">
            <Sparkles className="text-indigo-400" size={24} />
            <span>Outbox Operations Control</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-md">
            Monitor background mail workers, trace delays, check idempotency gates, and manage outreach queues.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <NavLink
            to="/compose"
            className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-indigo-600/15"
          >
            <span>Launch Outreach</span>
            <ArrowRight size={16} />
          </NavLink>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          Loading metrics summaries...
        </div>
      ) : (
        <>
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statCards.map((card, idx) => (
              <div
                key={idx}
                className={`glass-panel border p-5 rounded-2xl flex items-start justify-between shadow-sm transition-all duration-300 hover:scale-[1.01] ${card.colorClass}`}
              >
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 font-mono">
                    {card.title}
                  </span>
                  <p className="text-4xl font-extrabold text-slate-100 tracking-tight">
                    {card.value}
                  </p>
                  <span className="text-[10px] text-slate-500 block">{card.desc}</span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900/60 shadow-inner">
                  {card.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Quick-Look Logs */}
          <div className="glass-panel rounded-2xl border border-slate-900/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-900/60 flex justify-between items-center">
              <h3 className="font-semibold text-slate-200 text-sm flex items-center space-x-2">
                <Mail size={16} className="text-indigo-400" />
                <span>Recent Dispatch Activity</span>
              </h3>
              <NavLink
                to="/emails"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                <span>Audit Logs</span>
                <ArrowRight size={14} />
              </NavLink>
            </div>

            {recentEmails.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs font-mono">
                No recent emails processed in this workspace yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900/60 text-slate-500 text-[10px] font-mono tracking-wider uppercase">
                      <th className="px-6 py-3.5">Recipient</th>
                      <th className="px-6 py-3.5">Campaign</th>
                      <th className="px-6 py-3.5">Scheduled Delivery</th>
                      <th className="px-6 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEmails.map((email) => (
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
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border uppercase inline-block ${
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
