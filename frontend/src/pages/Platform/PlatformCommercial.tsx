import React from 'react';
import { Check } from 'lucide-react';
import { Badge } from '../../components/DesignSystem';

export const PlatformCommercial: React.FC = () => {
  const plans = [
    { name: 'Starter Boutique', price: '৳ 15,000 / mo', storage: '10 GB DB', stores: '1 Storefront', fee: '1.5% GMV', tenants: 3 },
    { name: 'Growth Tier', price: '৳ 35,000 / mo', storage: '25 GB DB', stores: '3 Storefronts', fee: '1.0% GMV', tenants: 8, popular: true },
    { name: 'Enterprise Atelier', price: '৳ 85,000 / mo', storage: 'Dedicated DB Shard', stores: 'Unlimited', fee: '0.5% GMV', tenants: 3 },
  ];

  return (
    <div className="space-y-8 font-sans">
      <div className="border-b border-zinc-800 pb-6">
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-500 font-bold block mb-1">
          SaaS Commercialization
        </span>
        <h1 className="font-serif font-bold text-3xl text-white">
          Subscription Tiers & Entitlements
        </h1>
        <p className="text-xs text-zinc-400 mt-1 font-mono">
          Manage platform pricing tiers, feature entitlements, and recurring billing cycles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`p-6 rounded-3xl border bg-zinc-900 space-y-4 shadow-sm flex flex-col justify-between ${
              p.popular ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-zinc-800'
            }`}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-serif font-bold text-lg text-white">{p.name}</h3>
                {p.popular && <Badge variant="accent">Core Tier</Badge>}
              </div>

              <div className="font-mono font-bold text-2xl text-amber-400">
                {p.price}
              </div>

              <div className="pt-2 border-t border-zinc-800 space-y-2 text-xs font-mono text-zinc-300">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{p.storage}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{p.stores}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Platform Fee: {p.fee}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-between items-center text-xs font-mono text-zinc-400">
              <span>Active Subscriptions:</span>
              <span className="font-bold text-white">{p.tenants} Tenants</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
