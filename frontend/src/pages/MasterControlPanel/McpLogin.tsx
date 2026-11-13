import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';

export const McpLogin: React.FC<{ onLoginSuccess: (token: string, user: any) => void; onBackToStore: () => void }> = ({
  onLoginSuccess,
  onBackToStore,
}) => {
  const [email, setEmail] = useState('superadmin@centerpoint.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/platform/auth/mcp-login', { email, password });
      const { token, user } = res.data.data;
      localStorage.setItem('mcp_token', token);
      onLoginSuccess(token, user);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Access Denied: Invalid Master Control Panel credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-black">
      {/* Background Ambient Aura */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 p-2 flex items-center justify-center text-amber-500 shadow-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg tracking-wider text-white">CENTERPOINT MCP</h1>
            <p className="text-[10px] font-mono tracking-widest text-amber-500 uppercase">OMNIPOTENT CONTROL DECK</p>
          </div>
        </div>

        <button
          onClick={onBackToStore}
          className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1.5 py-1 px-3 rounded-lg border border-zinc-800 hover:bg-zinc-900"
        >
          <span>Return to Storefront</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Login Card */}
      <main className="relative z-10 max-w-md w-full mx-auto my-auto py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-zinc-900/80 backdrop-blur-2xl border border-zinc-800/80 rounded-3xl p-8 shadow-2xl space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold font-serif tracking-tight text-white">Owner Authorization</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Authorized personnel only. Every setting, design token, integration, and operational lever is managed from this deck.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Master Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Master Secret Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs tracking-wider uppercase transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Authenticating Deck...' : 'Unlock Master Control Panel'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-center text-[11px] text-zinc-400 font-mono space-y-1">
            <span className="text-amber-500/90 font-semibold block">Demo Superadmin Access:</span>
            <span>superadmin@centerpoint.com &bull; password123</span>
          </div>

          <div className="pt-2 text-center text-[10px] text-zinc-500 font-mono">
            <span>Isolated Security Protocol · Guard: Platform · Zero Mock Ops</span>
          </div>
        </motion.div>
      </main>

      {/* Footer Attribution */}
      <footer className="relative z-10 text-center text-xs text-zinc-600 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-zinc-900 gap-2">
        <span>CENTERPOINT Flagship Commerce Platform © 2026</span>
        <div className="flex items-center gap-2">
          <span>Engineered by</span>
          <a
            href="https://devcenterpoint.com"
            target="_blank"
            rel="noreferrer"
            className="text-amber-500 hover:text-amber-400 font-semibold transition"
          >
            DevCenterPoint
          </a>
        </div>
      </footer>
    </div>
  );
};

