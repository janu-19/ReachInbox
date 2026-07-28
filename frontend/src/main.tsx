import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="flex h-screen items-center justify-center p-4">
      <div className="glass-panel p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-slate-800">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent mb-4">
          ReachInbox
        </h1>
        <p className="text-slate-400 mb-6">
          Full-Stack Email Scheduler system architecture is configured.
        </p>
        <div className="text-xs text-indigo-400/70 font-mono py-1.5 px-3 bg-indigo-500/10 rounded-full inline-block">
          Awaiting Task Triggers
        </div>
      </div>
    </div>
  </React.StrictMode>,
);
