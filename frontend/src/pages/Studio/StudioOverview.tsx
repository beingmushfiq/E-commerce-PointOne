import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp, ShoppingBag,
  AlertTriangle, ArrowRight, Store,
  DollarSign, Users, Clock
} from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Badge } from '../../components/DesignSystem';

export const StudioOverview: React.FC = () => {
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const metrics = {
    netSales: 2485000,
    totalOrders: 184,
    avgOrderValue: 13505,
    unfulfilledOrders: 7,
    lowStockItems: 3,
    activeCustomers: 412,
  };

  const workQueue = [
    { id: 'WQ-1', type: 'order', title: 'Unfulfilled Order #CP-ORD-9821', desc: 'bKash paid • Banani, Dhaka • Ready for Steadfast dispatch', urgency: 'high', link: '/studio/orders' },
    { id: 'WQ-2', type: 'order', title: 'Unfulfilled Order #CP-ORD-9820', desc: 'Nagad paid • Gulshan, Dhaka • Awaiting quality check', urgency: 'medium', link: '/studio/orders' },
    { id: 'WQ-3', type: 'stock', title: 'Low Stock Alert: Royal Tourbillon Complication', desc: 'Remaining stock: 2 units in Banani Vault', urgency: 'high', link: '/studio/inventory' },
    { id: 'WQ-4', type: 'cms', title: 'Draft Page Pending Publication: Black Friday 2026', desc: 'Edited 2h ago by Catalog Editor', urgency: 'low', link: '/studio/editor/black-friday' },
  ];

  const recentActivity = [
    { title: 'New Order Received', desc: '#CP-ORD-9821 by Mushfiqur Rahman (৳ 95,000 via bKash)', time: '12m ago', type: 'order' },
    { title: 'Stock Movement Posted', desc: 'Transferred 5 units from Central Hub to Banani Vault', time: '1h ago', type: 'stock' },
    { title: 'Journal Entry Posted', desc: 'Balanced entry #JRN-2026-042 (Debit Inventory ৳ 50,000)', time: '3h ago', type: 'finance' },
    { title: 'Page Published', desc: 'Luxury Editorial Homepage updated via Visual CMS', time: '5h ago', type: 'cms' },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 font-bold block mb-1">
            Store Operations Control
          </span>
          <h1 className="font-serif font-bold text-3xl text-zinc-900 dark:text-white">
            Merchant Studio Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/studio/editor/home"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold font-mono tracking-wider shadow-sm flex items-center gap-2 transition"
          >
            <Store className="w-4 h-4" />
            <span>Open Visual CMS</span>
          </Link>
          <button
            onClick={() => navigate('/studio/products')}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-mono font-semibold transition cursor-pointer"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* 2. Key Business Metrics Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>Net Sales (30D)</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="font-mono font-bold text-2xl text-zinc-900 dark:text-white">
            {formatPrice(metrics.netSales)}
          </div>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold block">
            +18.4% vs previous period
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>Total Orders</span>
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <ShoppingBag className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="font-mono font-bold text-2xl text-zinc-900 dark:text-white">
            {metrics.totalOrders}
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            {metrics.unfulfilledOrders} awaiting courier booking
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>Average Order Value</span>
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <DollarSign className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="font-mono font-bold text-2xl text-zinc-900 dark:text-white">
            {formatPrice(metrics.avgOrderValue)}
          </div>
          <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold block">
            Luxury Tier Segment
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>Customer Base</span>
            <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Users className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="font-mono font-bold text-2xl text-zinc-900 dark:text-white">
            {metrics.activeCustomers}
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            68% repeat patron rate
          </span>
        </div>
      </div>

      {/* 3. Work To Do Queue & Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Work to Do (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Action Items & Operational Queue</span>
            </h3>
            <span className="text-xs font-mono text-zinc-400">4 items require attention</span>
          </div>

          <div className="space-y-3">
            {workQueue.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-zinc-900 dark:text-white">
                      {item.title}
                    </span>
                    <Badge variant={item.urgency === 'high' ? 'danger' : item.urgency === 'medium' ? 'warning' : 'neutral'}>
                      {item.urgency}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                    {item.desc}
                  </p>
                </div>

                <Link
                  to={item.link}
                  className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-amber-500 hover:text-zinc-950 transition text-xs font-mono font-semibold flex items-center gap-1 shrink-0"
                >
                  <span>Resolve</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Feed (1 Col) */}
        <div className="space-y-4">
          <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span>Storefront Activity Stream</span>
          </h3>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
            {recentActivity.map((act, idx) => (
              <div key={idx} className="border-b border-zinc-100 dark:border-zinc-800/80 pb-3 last:border-none last:pb-0 text-xs">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{act.title}</span>
                  <span className="text-[10px] font-mono text-zinc-400">{act.time}</span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px] leading-relaxed">
                  {act.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
