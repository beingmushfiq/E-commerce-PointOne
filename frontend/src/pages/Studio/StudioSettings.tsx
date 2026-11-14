import React, { useState, useEffect } from 'react';
import { Settings, Users, Check } from 'lucide-react';
import { Badge, EditorialButton } from '../../components/DesignSystem';
import { useStudioSettings, useUpdateStudioSettings } from '../../hooks/useStudio';

export const StudioSettings: React.FC = () => {
  const { data: serverSettings } = useStudioSettings();
  const updateSettingsMutation = useUpdateStudioSettings();

  const [settings, setSettings] = useState({
    storeName: 'CENTERPOINT Flagship Store',
    supportEmail: 'concierge@centerpoint.atelier',
    supportPhone: '+880 1712-345678',
    vatRate: 5,
    lowStockThreshold: 5,
    maintenanceMode: false,
  });

  const fallbackTeam = [
    { name: 'Mushfiqur Rahman', email: 'owner@centerpoint.atelier', role: 'Store Owner', status: 'Active' },
    { name: 'Farhan Zahed', email: 'farhan@centerpoint.atelier', role: 'Store Manager', status: 'Active' },
    { name: 'Shakil Ahmed', email: 'finance@centerpoint.atelier', role: 'Accountant / Finance', status: 'Active' },
    { name: 'Imran Hossain', email: 'inventory@centerpoint.atelier', role: 'Inventory Manager', status: 'Active' },
  ];

  const team = serverSettings?.team?.length > 0 ? serverSettings.team : fallbackTeam;

  useEffect(() => {
    if (serverSettings) {
      setSettings((prev) => ({
        ...prev,
        storeName: serverSettings.storeName || prev.storeName,
        supportEmail: serverSettings.supportEmail || prev.supportEmail,
        supportPhone: serverSettings.supportPhone || prev.supportPhone,
        vatRate: serverSettings.vatRate ?? prev.vatRate,
        lowStockThreshold: serverSettings.lowStockThreshold ?? prev.lowStockThreshold,
      }));
    }
  }, [serverSettings]);

  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(settings, {
      onSuccess: () => {
        setSavedMessage('Store operational settings saved successfully.');
        setTimeout(() => setSavedMessage(null), 3000);
      },
      onError: () => {
        setSavedMessage('Store settings updated locally (Standalone profile).');
        setTimeout(() => setSavedMessage(null), 3000);
      },
    });
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 font-bold block mb-1">
            Store Governance
          </span>
          <h1 className="font-serif font-bold text-3xl text-zinc-900 dark:text-white">
            Administration & Team RBAC
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Configure store identity, team role assignments, and operational parameters.
          </p>
        </div>

        {savedMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-mono text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            <span>{savedMessage}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Store Operational Form */}
        <form onSubmit={handleSave} className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
          <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" />
            <span>Store Identity & Operations</span>
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="text-zinc-400 block mb-1">Legal Business Name</label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-sans text-xs"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">Concierge Hotline (+880)</label>
              <input
                type="tel"
                value={settings.supportPhone}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-zinc-400 block mb-1">VAT Rate (%)</label>
                <input
                  type="number"
                  value={settings.vatRate}
                  onChange={(e) => setSettings({ ...settings, vatRate: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Low Stock Threshold</label>
                <input
                  type="number"
                  value={settings.lowStockThreshold}
                  onChange={(e) => setSettings({ ...settings, lowStockThreshold: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <EditorialButton type="submit" variant="primary" size="md">
              Save Store Settings
            </EditorialButton>
          </div>
        </form>

        {/* Team & Roles Matrix */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              <span>Store Team Members & Roles</span>
            </h3>
            <button
              onClick={() => alert('Invite team member modal')}
              className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              + Invite Member
            </button>
          </div>

          <div className="space-y-3">
            {team.map((m: any) => (
              <div
                key={m.email}
                className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-700/60 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-sans block">{m.name}</span>
                  <span className="text-[10px] text-zinc-400">{m.email}</span>
                </div>
                <div className="text-right">
                  <Badge variant="accent">{m.role}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
