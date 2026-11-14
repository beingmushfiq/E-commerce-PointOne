import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, Warehouse,
  Landmark, Megaphone, Sparkles, Palette, FileText,
  Plug, Settings, ChevronLeft, ChevronRight, ExternalLink,
  Moon, Sun, LogOut, User,
  Layers, Store
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  permission?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export const StudioLayout: React.FC = () => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [storeName] = useState('CENTERPOINT Flagship Store');

  const navigationGroups: NavGroup[] = [
    {
      group: 'Overview',
      items: [
        { label: 'Dashboard', path: '/studio', icon: <LayoutDashboard className="w-4 h-4" /> },
      ],
    },
    {
      group: 'Commerce',
      items: [
        { label: 'Orders & Shipments', path: '/studio/orders', icon: <ShoppingBag className="w-4 h-4" /> },
        { label: 'Customers', path: '/studio/customers', icon: <User className="w-4 h-4" /> },
      ],
    },
    {
      group: 'Catalog & Stock',
      items: [
        { label: 'Products & SKUs', path: '/studio/products', icon: <Package className="w-4 h-4" /> },
        { label: 'Categories', path: '/studio/categories', icon: <Layers className="w-4 h-4" /> },
        { label: 'Inventory & Warehouses', path: '/studio/inventory', icon: <Warehouse className="w-4 h-4" /> },
      ],
    },
    {
      group: 'Finance & Ledger',
      items: [
        { label: 'Double-Entry Accounting', path: '/studio/finance', icon: <Landmark className="w-4 h-4" />, badge: 'Ledger' },
      ],
    },
    {
      group: 'Growth & Intelligence',
      items: [
        { label: 'Marketing & Coupons', path: '/studio/marketing', icon: <Megaphone className="w-4 h-4" /> },
        { label: 'Analytics & Insights', path: '/studio/analytics', icon: <FileText className="w-4 h-4" /> },
        { label: 'AI Business Agent', path: '/studio/ai', icon: <Sparkles className="w-4 h-4 text-amber-500" /> },
      ],
    },
    {
      group: 'Storefront CMS',
      items: [
        { label: 'Store Design & Themes', path: '/studio/store-design', icon: <Palette className="w-4 h-4" /> },
        { label: 'Visual Page Builder', path: '/studio/editor/home', icon: <Store className="w-4 h-4 text-amber-600 dark:text-amber-400" />, badge: 'Live Canvas' },
      ],
    },
    {
      group: 'System & Platform',
      items: [
        { label: 'Integrations & Webhooks', path: '/studio/integrations', icon: <Plug className="w-4 h-4" /> },
        { label: 'Store Settings & Team', path: '/studio/settings', icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      {/* 1. PERSISTENT STUDIO SIDEBAR */}
      <aside
        className={`sticky top-0 h-screen shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 flex flex-col justify-between transition-all duration-300 z-30 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div>
          {/* Store Brand Header */}
          <div className="h-16 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <Link to="/studio" className="flex items-center gap-3 overflow-hidden select-none">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-zinc-950 font-serif font-black flex items-center justify-center shrink-0 shadow-sm text-lg">
                CP
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col truncate">
                  <span className="font-serif font-bold text-sm tracking-tight text-zinc-900 dark:text-white truncate">
                    CENTERPOINT
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 tracking-wider uppercase -mt-0.5">
                    Store Studio
                  </span>
                </div>
              )}
            </Link>

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Tenant Context Capsule */}
          {!isSidebarCollapsed && (
            <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-750 flex items-center justify-between text-xs">
              <div className="truncate">
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block">
                  Active Tenant
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                  {storeName}
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Operational" />
            </div>
          )}

          {/* Grouped Nav Items */}
          <div className="px-3 py-4 space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto" data-lenis-prevent>
            {navigationGroups.map((group) => (
              <div key={group.group} className="space-y-1">
                {!isSidebarCollapsed && (
                  <h5 className="px-3 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 font-semibold mb-1">
                    {group.group}
                  </h5>
                )}
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path ||
                    (item.path !== '/studio' && location.pathname.startsWith(item.path));

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition group ${
                        isActive
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 dark:bg-amber-500/20 font-bold'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`}
                      title={isSidebarCollapsed ? item.label : undefined}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      {!isSidebarCollapsed && (
                        <div className="flex-1 flex items-center justify-between">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {!isSidebarCollapsed && <span>View Storefront</span>}
          </Link>
        </div>
      </aside>

      {/* 2. MAIN STUDIO WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto" data-lenis-prevent>
        {/* Top Header */}
        <header className="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-zinc-400 hidden sm:inline">
              Workspace / {storeName}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Visual CMS Page Builder Direct Link */}
            <Link
              to="/studio/editor/home"
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold font-mono tracking-wider shadow-sm flex items-center gap-1.5 transition active:scale-95"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Visual Page Builder</span>
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              aria-label="Toggle theme mode"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
            </button>

            {/* Logout Action */}
            <button
              onClick={() => {
                logout('staff');
                navigate('/studio/login');
              }}
              className="p-2 rounded-xl text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
