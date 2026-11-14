import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Server, Users, CreditCard, Globe, Flag,
  ShieldCheck, LifeBuoy, Sliders, LogOut,
  Terminal, Cpu
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { StatusPulse } from '../components/DesignSystem';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

export const PlatformLayout: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    { label: 'Command Center', path: '/platform', icon: <Terminal className="w-4 h-4" /> },
    { label: 'Tenants Directory', path: '/platform/tenants', icon: <Server className="w-4 h-4" /> },
    { label: 'Commercial & Billing', path: '/platform/commercial', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'Domains & SSL', path: '/platform/domains', icon: <Globe className="w-4 h-4" /> },
    { label: 'Operators & RBAC', path: '/platform/operators', icon: <Users className="w-4 h-4" /> },
    { label: 'Modules & Flags', path: '/platform/modules', icon: <Flag className="w-4 h-4" /> },
    { label: 'Infrastructure Probes', path: '/platform/infrastructure', icon: <Cpu className="w-4 h-4" />, badge: 'Healthy' },
    { label: 'Security & Audit Logs', path: '/platform/security', icon: <ShieldCheck className="w-4 h-4" /> },
    { label: 'Support Operations', path: '/platform/support', icon: <LifeBuoy className="w-4 h-4" /> },
    { label: 'System Maintenance', path: '/platform/system', icon: <Sliders className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100 font-sans">
      {/* 1. OPERATOR SIDEBAR (DARK-FIRST) */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900/90 flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Header */}
          <div className="h-16 px-4 border-b border-zinc-800 flex items-center justify-between">
            <Link to="/platform" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-zinc-950 flex items-center justify-center font-mono font-bold text-sm shadow-md">
                MC
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-sm tracking-tight text-white">
                  CENTERPOINT
                </span>
                <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase -mt-0.5">
                  Master Control
                </span>
              </div>
            </Link>

            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
              PROD
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/platform' && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono font-medium transition ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Operator Profile Footer */}
        <div className="p-4 border-t border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] font-mono font-bold text-amber-400 shrink-0">
                OP
              </div>
              <div className="truncate">
                <span className="text-zinc-200 font-semibold block truncate">
                  Platform Admin
                </span>
                <span className="text-[10px] font-mono text-zinc-500 block truncate">
                  superadmin@centerpoint
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                logout('platform');
                navigate('/platform/login');
              }}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
              title="Sign Out of Platform"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-500">
            <span>SaaS Core v1.0</span>
            <Link to="/studio" className="hover:text-amber-400 transition">
              To Store Studio →
            </Link>
          </div>
        </div>
      </aside>

      {/* 2. OPERATIONAL CANVAS */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Operational Bar */}
        <header className="h-16 px-6 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono">
              <StatusPulse status="healthy" />
              <span className="text-zinc-400">All Clusters Operational</span>
            </div>
            <span className="text-zinc-700">|</span>
            <span className="text-xs font-mono text-zinc-400">
              Active Tenants: <strong className="text-white">14</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              target="_blank"
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition"
            >
              Live Storefront
            </Link>
          </div>
        </header>

        {/* Platform Content Viewport */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
