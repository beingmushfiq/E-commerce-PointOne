import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { DestructiveConfirmModal } from '../../components/DesignSystem';

export const PlatformTenants: React.FC = () => {
  const [tenants, setTenants] = useState([
    { id: 'TNT-001', name: 'Atelier Horology Flagship', domain: 'store.centerpoint.atelier', plan: 'Enterprise Atelier', status: 'Active', dbName: 'tenant_horology_prod', storage: '14.2 GB / 50 GB', created: '10 Aug 2026' },
    { id: 'TNT-002', name: 'Maison Silk & Cashmere', domain: 'maison.silk.atelier', plan: 'Growth Tier', status: 'Active', dbName: 'tenant_silk_prod', storage: '4.8 GB / 25 GB', created: '18 Sep 2026' },
    { id: 'TNT-003', name: 'Precision Audio Studio BD', domain: 'audio.precision.bd', plan: 'Growth Tier', status: 'Trial', dbName: 'tenant_audio_prod', storage: '1.2 GB / 25 GB', created: '01 Nov 2026' },
    { id: 'TNT-004', name: 'Vogue Leather Goods', domain: 'vogue.leather.com', plan: 'Starter', status: 'Suspended', dbName: 'tenant_vogue_prod', storage: '850 MB / 10 GB', created: '15 Oct 2026' },
  ]);

  const [search, setSearch] = useState('');
  const [suspendingTenant, setSuspendingTenant] = useState<any | null>(null);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [newTenantForm, setNewTenantForm] = useState({
    name: '',
    domain: '',
    plan: 'Growth Tier',
    adminEmail: '',
  });

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.domain.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleSuspend = () => {
    if (!suspendingTenant) return;
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id !== suspendingTenant.id) return t;
        const newStatus = t.status === 'Suspended' ? 'Active' : 'Suspended';
        return { ...t, status: newStatus };
      })
    );
    setSuspendingTenant(null);
  };

  const handleProvisionTenant = (e: React.FormEvent) => {
    e.preventDefault();
    const newT = {
      id: `TNT-00${tenants.length + 1}`,
      name: newTenantForm.name,
      domain: newTenantForm.domain,
      plan: newTenantForm.plan,
      status: 'Active',
      dbName: `tenant_${newTenantForm.name.toLowerCase().replace(/\s+/g, '_')}_prod`,
      storage: '0 MB / 25 GB',
      created: 'Just now',
    };
    setTenants([...tenants, newT]);
    setIsProvisionModalOpen(false);
    alert(`Tenant ${newT.name} successfully provisioned with dedicated database shard.`);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="border-b border-zinc-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-500 font-bold block mb-1">
            Tenant Fleet Control
          </span>
          <h1 className="font-serif font-bold text-3xl text-white">
            SaaS Tenant Registry & Provisioning
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            Orchestrate multi-tenant lifecycle, dedicated database isolation, and plan quotas.
          </p>
        </div>

        <button
          onClick={() => setIsProvisionModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-xs tracking-wider shadow flex items-center gap-2 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New SaaS Tenant</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Filter by tenant ID, business name, or domain..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Tenants Table */}
      <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900 shadow-sm">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px]">
              <th className="p-4">Tenant Identity</th>
              <th className="p-4">Primary Custom Domain</th>
              <th className="p-4">Assigned Plan</th>
              <th className="p-4">Dedicated Shard DB</th>
              <th className="p-4">Storage Quota</th>
              <th className="p-4 text-right">Lifecycle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filtered.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-zinc-800/40 transition">
                <td className="p-4">
                  <span className="font-bold text-white block">{tenant.name}</span>
                  <span className="text-[10px] text-zinc-500">{tenant.id} • Created {tenant.created}</span>
                </td>
                <td className="p-4 text-amber-400 flex items-center gap-1.5">
                  <span>{tenant.domain}</span>
                </td>
                <td className="p-4 text-zinc-300 font-semibold">{tenant.plan}</td>
                <td className="p-4 text-zinc-400">{tenant.dbName}</td>
                <td className="p-4 text-zinc-400">{tenant.storage}</td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => setSuspendingTenant(tenant)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                      tenant.status === 'Suspended'
                        ? 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 hover:bg-rose-900 border border-rose-800'
                    }`}
                  >
                    {tenant.status === 'Suspended' ? 'Reactivate' : 'Suspend'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Provision Modal */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <h3 className="font-serif font-bold text-xl">
              Provision New Multi-Tenant Database Shard
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-mono">
              Idempotently runs tenant database migrations, creates isolated schema, and attaches domain ingress.
            </p>

            <form onSubmit={handleProvisionTenant} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-zinc-400 block mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zurich Complications Boutique"
                  value={newTenantForm.name}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Primary Domain / Subdomain</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. zurich.centerpoint.atelier"
                  value={newTenantForm.domain}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, domain: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Subscription Plan</label>
                <select
                  value={newTenantForm.plan}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, plan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-white cursor-pointer"
                >
                  <option value="Starter">Starter (Single Store, 10GB)</option>
                  <option value="Growth Tier">Growth Tier (Multi-Warehouse, 25GB)</option>
                  <option value="Enterprise Atelier">Enterprise Atelier (Unlimited, Dedicated Shard)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold font-mono hover:bg-amber-400 cursor-pointer shadow"
                >
                  Execute Provisioning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspend Confirmation */}
      <DestructiveConfirmModal
        isOpen={Boolean(suspendingTenant)}
        title={suspendingTenant?.status === 'Suspended' ? 'Reactivate Tenant Commerce' : 'Suspend Tenant Operations'}
        message={`Are you sure you want to update the lifecycle state of ${suspendingTenant?.name}? Storefront access and background webhooks will be restricted accordingly.`}
        confirmLabel={suspendingTenant?.status === 'Suspended' ? 'Reactivate Tenant' : 'Enforce Suspension'}
        isDangerous={suspendingTenant?.status !== 'Suspended'}
        onConfirm={handleToggleSuspend}
        onCancel={() => setSuspendingTenant(null)}
      />
    </div>
  );
};
