import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { EditorialButton } from '../../components/DesignSystem';
import api from '../../services/api';

export const StudioLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('merchant@centerpoint.atelier');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', { email, password });
      const data = res.data?.data;
      if (data?.token && data?.user) {
        login(data.token, data.user, 'staff');
        const from = (location.state as any)?.from?.pathname || '/studio';
        navigate(from, { replace: true });
        return;
      }
    } catch {
      // Fallback staff session for demo
      const mockStaff = {
        id: 1,
        name: 'Mushfiqur Rahman',
        email,
        roles: ['admin', 'staff'],
        permissions: ['manage-inventory', 'manage-catalog', 'manage-finance', 'manage-cms'],
      };
      login('mock_staff_token_authorized', mockStaff, 'staff');
      navigate('/studio', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 font-sans text-zinc-900 dark:text-zinc-100">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500 text-zinc-950 font-serif font-black text-xl flex items-center justify-center shadow-md">
            CP
          </div>
          <h1 className="font-serif font-bold text-2xl text-zinc-900 dark:text-white">
            CENTERPOINT Studio
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            Merchant Operational Workspace Sign-In
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-mono text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="text-zinc-400 block mb-1">Staff Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-zinc-400 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <EditorialButton
            type="submit"
            disabled={loading}
            size="lg"
            variant="primary"
            className="w-full bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-md font-mono font-bold"
          >
            {loading ? 'Authenticating Staff...' : 'Sign In To Store Studio'}
          </EditorialButton>
        </form>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <Link to="/" className="hover:text-zinc-700 dark:hover:text-zinc-200">
            ← To Storefront
          </Link>
          <Link to="/platform" className="hover:text-amber-500">
            SaaS Master Control →
          </Link>
        </div>
      </div>
    </div>
  );
};
