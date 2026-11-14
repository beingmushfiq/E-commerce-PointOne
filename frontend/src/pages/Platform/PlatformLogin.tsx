import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Terminal } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export const PlatformLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [operatorId, setOperatorId] = useState('superadmin@centerpoint.com');
  const [secretKey, setSecretKey] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/platform/auth/mcp-login', {
        email: operatorId,
        password: secretKey,
        operator_id: operatorId,
        secret_key: secretKey,
      });
      const data = res.data?.data;
      if (data?.token) {
        const opUser = {
          id: data.user?.id || 99,
          name: data.user?.name || 'Platform Superadmin',
          email: data.user?.email || operatorId,
          roles: ['superadmin', 'platform_admin'],
          permissions: ['all'],
        };
        login(data.token, opUser, 'platform');
        const from = (location.state as any)?.from?.pathname || '/platform';
        navigate(from, { replace: true });
        return;
      }
    } catch (err: any) {
      const errMsg =
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.errors?.password?.[0] ||
        err.response?.data?.message ||
        'Authentication failed. Please verify credentials.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 font-mono text-zinc-100">
      <div className="max-w-md w-full bg-zinc-950 rounded-3xl border border-zinc-800 p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500 text-zinc-950 font-mono font-bold text-lg flex items-center justify-center shadow-lg">
            MC
          </div>
          <h1 className="font-serif font-bold text-2xl text-white">
            CENTERPOINT Master Control
          </h1>
          <p className="text-xs text-zinc-400">
            SaaS Infrastructure & Platform Governance Ingress
          </p>
        </div>

        {/* Quick Credentials Pill Selector */}
        <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
          <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block font-semibold">
            Quick-Fill Operator Credentials:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setOperatorId('superadmin@centerpoint.com');
                setSecretKey('password123');
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-[11px] font-mono hover:border-amber-500 text-zinc-300 hover:text-white transition cursor-pointer"
            >
              superadmin@centerpoint.com
            </button>
            <button
              type="button"
              onClick={() => {
                setOperatorId('operator_sre_lead');
                setSecretKey('superadmin_master_secret');
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-[11px] font-mono hover:border-amber-500 text-zinc-300 hover:text-white transition cursor-pointer"
            >
              Master Secret Key
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-zinc-400 block mb-1">Operator Email or Identifier</label>
            <input
              type="text"
              required
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-zinc-400 block mb-1">Master Password or Secret Key</label>
            <input
              type="password"
              required
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold tracking-wider shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Terminal className="w-4 h-4" />
            <span>{loading ? 'Verifying TLS Handshake...' : 'Authenticate Operator'}</span>
          </button>
        </form>

        <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
          <Link to="/" className="hover:text-zinc-300">
            ← To Storefront
          </Link>
          <Link to="/studio" className="hover:text-amber-400">
            Merchant Studio →
          </Link>
        </div>
      </div>
    </div>
  );
};
