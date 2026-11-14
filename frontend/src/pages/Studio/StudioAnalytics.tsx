import React from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';

export const StudioAnalytics: React.FC = () => {
  const { formatPrice } = useCurrency();

  const salesChannels = [
    { channel: 'Online Storefront (Web & Mobile)', orders: 142, revenue: 1980000, percentage: '79.6%' },
    { channel: 'Concierge Private Direct Orders', orders: 28, revenue: 420000, percentage: '16.9%' },
    { channel: 'Social / Chat Assistants', orders: 14, revenue: 85000, percentage: '3.5%' },
  ];

  const topProducts = [
    { name: 'Royal Tourbillon Complication', sku: 'CP-HORO-092', sold: 14, revenue: 1330000 },
    { name: 'Heritage Chronometer Ingot', sku: 'CP-HORO-041', sold: 21, revenue: 945000 },
    { name: 'Bespoke Alligator Watch Portfolio', sku: 'CP-LTHR-012', sold: 38, revenue: 210000 },
  ];

  return (
    <div className="space-y-8">
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 font-bold block mb-1">
          Business Intelligence
        </span>
        <h1 className="font-serif font-bold text-3xl text-zinc-900 dark:text-white">
          Analytics & Performance Drill-Down
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Actionable metrics on order velocity, customer repeat acquisition, and revenue channels.
        </p>
      </div>

      {/* Channel Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
          <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-white">
            Revenue Channel Contribution
          </h3>
          <div className="space-y-3">
            {salesChannels.map((c) => (
              <div key={c.channel} className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-700/60 space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{c.channel}</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">{c.percentage}</span>
                </div>
                <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                  <span>{c.orders} Acquisitions</span>
                  <span>{formatPrice(c.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Masterpieces */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
          <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-white">
            Top Performing SKUs
          </h3>
          <div className="space-y-3">
            {topProducts.map((p) => (
              <div key={p.sku} className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-700/60 flex justify-between items-center text-xs font-mono">
                <div>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-sans block">{p.name}</span>
                  <span className="text-[10px] text-zinc-400">{p.sku} • {p.sold} Acquired</span>
                </div>
                <span className="font-bold text-zinc-900 dark:text-white">{formatPrice(p.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
