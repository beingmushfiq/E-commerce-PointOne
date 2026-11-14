import React from 'react';
import { Link } from 'react-router-dom';
import {
  Server, Activity, CreditCard,
  Cpu, Terminal
} from 'lucide-react';
import { Badge, StatusPulse } from '../../components/DesignSystem';

export const PlatformDashboard: React.FC = () => {
  const platformMetrics = {
    totalTenants: 14,
    activeTenants: 11,
    trialTenants: 2,
    suspendedTenants: 1,
    mrr: 420000,
    gmv30d: 48200000,
    failedProbes: 0,
    queueWorkersActive: 12,
  };

  const infrastructureProbes = [
    { service: 'Central Control Database (MySQL Primary)', status: 'healthy', latency: '1.2ms', checkTime: '4s ago' },
    { service: 'Tenant DB Shard Pool (14 Databases)', status: 'healthy', latency: '2.8ms', checkTime: '2s ago' },
    { service: 'Redis Cache & Session Cluster', status: 'healthy', latency: '0.4ms', checkTime: '1s ago' },
    { service: 'Async Worker Queue (Laravel Horizon)', status: 'healthy', latency: '0 pending', checkTime: '5s ago' },
    { service: 'S3-Compatible Object Storage (Wasabi/AWS)', status: 'healthy', latency: '42ms', checkTime: '12s ago' },
  ];

  const recentTenants = [
    { id: 'TNT-001', name: 'Atelier Horology Flagship', domain: 'store.centerpoint.atelier', plan: 'Enterprise Atelier', status: 'Active', dbStatus: 'Connected' },
    { id: 'TNT-002', name: 'Maison Silk & Cashmere', domain: 'maison.silk.atelier', plan: 'Growth Tier', status: 'Active', dbStatus: 'Connected' },
    { id: 'TNT-003', name: 'Precision Audio Studio BD', domain: 'audio.precision.bd', plan: 'Growth Tier', status: 'Trial', dbStatus: 'Connected' },
    { id: 'TNT-004', name: 'Vogue Leather Goods', domain: 'vogue.leather.com', plan: 'Starter', status: 'Suspended', dbStatus: 'Isolated' },
  ];

  const auditEvents = [
    { actor: 'superadmin', role: 'Platform Superadmin', action: 'Tenant Provisioning Completed', target: 'TNT-003 (precision.bd)', time: '14m ago', status: 'success' },
    { actor: 'ops_lead', role: 'Platform Operations', action: 'Custom Domain SSL Renewed', target: 'store.centerpoint.atelier', time: '1h ago', status: 'success' },
    { actor: 'superadmin', role: 'Platform Superadmin', action: 'Tenant Suspension Enforced', target: 'TNT-004 (vogue.leather)', time: '3h ago', status: 'warning' },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-500 font-bold block mb-1">
            Global Infrastructure Console
          </span>
          <h1 className="font-serif font-bold text-3xl text-white">
            Platform Command Center
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            Real-time multi-tenant SaaS health, subscription telemetry, and operational audit log.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/platform/tenants"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-xs tracking-wider shadow flex items-center gap-2 transition"
          >
            <Server className="w-4 h-4" />
            <span>Manage Tenants Directory</span>
          </Link>
        </div>
      </div>

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>Active Tenant Fleet</span>
            <Server className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-mono font-bold text-2xl text-white">
            {platformMetrics.activeTenants} / {platformMetrics.totalTenants}
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            {platformMetrics.trialTenants} in trial • {platformMetrics.suspendedTenants} suspended
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>Monthly Recurring (MRR)</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-mono font-bold text-2xl text-white">
            ৳ {platformMetrics.mrr.toLocaleString()}
          </div>
          <span className="text-[11px] font-mono text-emerald-400">
            +12.8% subscription growth
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>Ecosystem GMV (30D)</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-mono font-bold text-2xl text-white">
            ৳ {(platformMetrics.gmv30d / 1000000).toFixed(1)}M
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            Across 14 merchant storefronts
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>Platform Service Health</span>
            <StatusPulse status="healthy" />
          </div>
          <div className="font-mono font-bold text-2xl text-emerald-400">
            100% OPERATIONAL
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            Zero critical service incidents
          </span>
        </div>
      </div>

      {/* Infrastructure Probes & Active Tenants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Real Infrastructure Probes */}
        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-amber-500" />
              <span>Real-Time Infrastructure Probes</span>
            </h3>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Continuous</span>
            </span>
          </div>

          <div className="space-y-3">
            {infrastructureProbes.map((probe, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs font-mono"
              >
                <div className="truncate pr-2">
                  <span className="text-zinc-200 font-semibold block truncate">{probe.service}</span>
                  <span className="text-[10px] text-zinc-500">Checked {probe.checkTime}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-emerald-400 font-bold">{probe.latency}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                    PASS
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Tenant Registry Preview */}
        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-amber-500" />
              <span>SaaS Tenant Fleet</span>
            </h3>
            <Link to="/platform/tenants" className="text-xs font-mono text-amber-400 hover:underline">
              View All 14 →
            </Link>
          </div>

          <div className="space-y-3">
            {recentTenants.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <span className="font-bold text-white block">{t.name}</span>
                  <span className="text-[10px] text-zinc-500">{t.domain} • {t.plan}</span>
                </div>
                <div className="text-right">
                  <Badge variant={t.status === 'Active' ? 'success' : t.status === 'Trial' ? 'accent' : 'danger'}>
                    {t.status}
                  </Badge>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">{t.dbStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Central Security Audit Trail */}
      <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
        <h3 className="font-serif font-bold text-lg text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-amber-500" />
          <span>Privileged Operator Audit Stream</span>
        </h3>

        <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Operator</th>
                <th className="p-3.5">Action Executed</th>
                <th className="p-3.5">Target Scope</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {auditEvents.map((evt, idx) => (
                <tr key={idx} className="hover:bg-zinc-900/40 transition">
                  <td className="p-3.5 text-white font-bold">{evt.actor}</td>
                  <td className="p-3.5 text-zinc-300">{evt.action}</td>
                  <td className="p-3.5 text-amber-400">{evt.target}</td>
                  <td className="p-3.5 text-zinc-500">{evt.time}</td>
                  <td className="p-3.5 text-right">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      CONFIRMED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
