import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  LayoutDashboard,
  Send,
  Mail,
  UserCheck,
  LogOut,
  Sparkles,
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/senders', label: 'Senders', icon: <UserCheck size={20} /> },
    { to: '/compose', label: 'Compose', icon: <Send size={20} /> },
    { to: '/emails', label: 'Emails', icon: <Mail size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-slate-900 flex flex-col justify-between p-4 sticky top-0 h-screen">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center space-x-3 px-2 py-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl bg-gradient-to-r from-white via-slate-100 to-indigo-400 bg-clip-text text-transparent">
                ReachInbox
              </span>
              <span className="block text-[10px] text-indigo-400/80 font-mono tracking-wider">
                EMAIL SCHEDULER
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-indigo-600/10 border border-indigo-500/30 text-indigo-300 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="space-y-4 pt-4 border-t border-slate-900">
          <div className="flex items-center space-x-3 px-2">
            <img
              src={user?.picture || 'https://lh3.googleusercontent.com/a/default-user'}
              alt={user?.name || 'User'}
              className="h-10 w-10 rounded-xl border border-slate-800 object-cover"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.name || 'User Account'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/5 hover:text-rose-300 transition-all duration-200"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 px-8 border-b border-slate-900/60 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md z-40">
          <div>
            <h2 className="text-sm font-semibold text-slate-400">Workspace</h2>
          </div>
          <div className="text-xs text-indigo-400/80 font-mono py-1 px-3 bg-indigo-500/10 rounded-full border border-indigo-500/20">
            Developer Console Active
          </div>
        </header>
        <div className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
};
