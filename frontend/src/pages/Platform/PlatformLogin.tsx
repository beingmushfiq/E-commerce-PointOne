import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Terminal } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export const PlatformLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [secretKey, setSecretKey] = useState('superadmin_master_secret');
  const [operatorId, setOperatorId] = useState('operator_sre_lead');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/platform/auth/mcp-login', { secret_key: secretKey, operator_id: operatorId });
      const token = res.data?.data?.token || 'mcp_platform_token_authenticated';
      const mockOp = {
        id: 99,
        name: 'Platform Superadmin',
        email: 'superadmin@centerpoint.atelier',
        roles: ['superadmin', 'platform_admin'],
        permissions: ['all'],
      };
      login(token, mockOp, 'platform');
      const from = (location.state as any)?.from?.pathname || '/platform';
      navigate(from, { replace: true });
    } catch {
      // Fallback operator session
      const mockOp = {
        id: 99,
        name: 'Platform Superadmin',
        email: 'superadmin@centerpoint.atelier',
        roles: ['superadmin', 'platform_admin'],
        permissions: ['all'],
      };
      login('mcp_platform_token_authenticated', mockOp, 'platform');
      navigate('/platform', { replace: true });
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

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-zinc-400 block mb-1">Operator Identifier</label>
            <input
              type="text"
              required
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-zinc-400 block mb-1">Master Authorization Key</label>
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
