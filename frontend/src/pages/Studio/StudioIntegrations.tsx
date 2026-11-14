import React from 'react';
import { Check } from 'lucide-react';
import { Badge } from '../../components/DesignSystem';

export const StudioIntegrations: React.FC = () => {
  const integrations = [
    { id: 'bkash', name: 'bKash Merchant Direct Checkout', type: 'Payment', status: 'Connected', environment: 'Live Production', keyHint: 'bkash_app_••••••••901' },
    { id: 'sslcommerz', name: 'SSLCommerz Multi-Card Gateway', type: 'Payment', status: 'Connected', environment: 'Live Production', keyHint: 'ssl_store_••••••••412' },
    { id: 'steadfast', name: 'Steadfast Courier API', type: 'Logistics', status: 'Connected', environment: 'Live Production', keyHint: 'stf_api_••••••••881' },
    { id: 'pathao', name: 'Pathao Courier & Parcel', type: 'Logistics', status: 'Connected', environment: 'Live Production', keyHint: 'pth_sec_••••••••104' },
    { id: 'redx', name: 'RedX Nationwide Logistics', type: 'Logistics', status: 'Connected', environment: 'Live Production', keyHint: 'redx_••••••••552' },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 font-bold block mb-1">
          Connected Ecosystem
        </span>
        <h1 className="font-serif font-bold text-3xl text-zinc-900 dark:text-white">
          Tenant Integrations & Provider Credentials
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your store's private payment gateways, courier dispatch credentials, and outward webhooks. Secrets are masked.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                {item.type} Gateway
              </span>
              <Badge variant="success">
                <Check className="w-3 h-3 text-emerald-500" /> {item.status}
              </Badge>
            </div>

            <div>
              <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-white">
                {item.name}
              </h3>
              <span className="text-xs font-mono text-zinc-400">{item.environment}</span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">API Key:</span>
              <span className="text-zinc-800 dark:text-zinc-200">{item.keyHint}</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => alert(`Connection probe for ${item.name}: OK (200ms latency)`)}
                className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Test Probe
              </button>
              <button
                onClick={() => alert(`Editing credentials for ${item.name}`)}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white text-xs font-mono hover:bg-black transition cursor-pointer"
              >
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
