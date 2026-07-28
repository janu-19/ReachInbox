import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Terminal, Mail } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export const Login: React.FC = () => {
  const { loginWithGoogle, loginMock } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleMockLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await loginMock(username);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Background Radial Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-violet-600/10 blur-[120px] pointer-events-none"></div>

      <div className="glass-panel w-full max-w-md p-8 rounded-3xl shadow-2xl relative border border-slate-800/80 max-h-[90vh] overflow-y-auto">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white via-slate-100 to-indigo-400 bg-clip-text text-transparent">
              ReachInbox
            </h1>
            <p className="text-xs text-indigo-400/80 font-mono tracking-widest mt-1">
              EMAIL SCHEDULER SYSTEM
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Real Google Login */}
        <div className="space-y-6">
          <div className="flex justify-center flex-col items-center">
            <p className="text-xs text-slate-400 mb-3 font-medium">Sign in with your Google account</p>
            <div className="w-full flex justify-center bg-slate-900 rounded-xl py-1 overflow-hidden border border-slate-800">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Authentication Failed.')}
                useOneTap={false}
                theme="filled_black"
                shape="rectangular"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800/60"></div>
            <span className="flex-shrink mx-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              OR DEVELOPER BYPASS
            </span>
            <div className="flex-grow border-t border-slate-800/60"></div>
          </div>

          {/* Mock Login Bypass */}
          <form onSubmit={handleMockLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">
                MOCK EMAIL ACCOUNT PREFIX
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Terminal size={16} className="text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. jane_doe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-24 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm placeholder-slate-500 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-xs font-mono text-slate-500">@example.com</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 disabled:text-indigo-400/50 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-indigo-600/15"
            >
              <Mail size={16} />
              <span>{loading ? 'Logging in...' : 'Login with Mock Account'}</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-center text-slate-500 mt-8 font-mono">
          ReachInbox Full-Stack Email Queue Scheduler System
        </p>

      </div>
    </div>
  );
};
