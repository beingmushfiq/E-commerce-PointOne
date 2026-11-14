import React from 'react';
import { Plus, Share2, Globe } from 'lucide-react';
import { Badge } from '../../components/DesignSystem';

export const StudioMarketing: React.FC = () => {
  const coupons = [
    { code: 'CENTERPOINT10', discount: '10% Privileged Savings', usage: '342 uses', status: 'Active', expiry: '31 Dec 2026' },
    { code: 'ATELIERWELCOME', discount: '৳ 1,000 Flat Welcome', usage: '128 uses', status: 'Active', expiry: 'Ongoing' },
    { code: 'VIPHOROLOGY', discount: '15% Private Allocation', usage: '45 uses', status: 'Active', expiry: '30 Nov 2026' },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 font-bold block mb-1">
            Growth & Attribution
          </span>
          <h1 className="font-serif font-bold text-3xl text-zinc-900 dark:text-white">
            Marketing Campaigns & Privileged Vouchers
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage promotional campaigns, coupon codes, pixel event tracking, and Google Merchant XML feeds.
          </p>
        </div>

        <button
          onClick={() => alert('New coupon modal')}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-mono font-bold text-xs tracking-wider shadow flex items-center gap-2 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Voucher Code</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px]">
              <th className="p-4">Voucher Code</th>
              <th className="p-4">Benefit</th>
              <th className="p-4">Redemptions</th>
              <th className="p-4">Expiry</th>
              <th className="p-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {coupons.map((c) => (
              <tr key={c.code} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                <td className="p-4 font-bold text-amber-600 dark:text-amber-400">{c.code}</td>
                <td className="p-4 font-sans font-semibold text-zinc-800 dark:text-zinc-200">{c.discount}</td>
                <td className="p-4 text-zinc-600 dark:text-zinc-400">{c.usage}</td>
                <td className="p-4 text-zinc-500">{c.expiry}</td>
                <td className="p-4 text-right">
                  <Badge variant="success">{c.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Feeds and Attribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-serif font-bold text-base">
            <Globe className="w-4 h-4 text-blue-500" />
            <span>Google Merchant Center XML Feed</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Real-time automated product sync with Google Shopping and Bing Commerce.
          </p>
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate">
            https://api.centerpoint.atelier/v1/marketing/feeds/google-merchant.xml
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-serif font-bold text-base">
            <Share2 className="w-4 h-4 text-purple-500" />
            <span>Attribution & Pixel Engine</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Server-side event dispatching for Meta Conversions API and Google Tag Manager.
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="success">Meta CAPI Active</Badge>
            <Badge variant="success">GA4 E-commerce Active</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};
