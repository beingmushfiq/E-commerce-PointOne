import React, { useState } from 'react';
import { Warehouse, ArrowRightLeft } from 'lucide-react';
import { Badge } from '../../components/DesignSystem';

export const StudioInventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stocks' | 'warehouses' | 'movements'>('stocks');

  const warehouses = [
    { id: 'wh-1', name: 'Banani Central Vault', location: 'Banani, Dhaka', capacity: '1,200 units', manager: 'Imran Hossain', status: 'Active' },
    { id: 'wh-2', name: 'Gulshan Atelier Boutique', location: 'Gulshan 2, Dhaka', capacity: '450 units', manager: 'Nabila Karim', status: 'Active' },
    { id: 'wh-3', name: 'Chittagong Port Hub', location: 'Agrabad, Chittagong', capacity: '2,500 units', manager: 'Rafiqul Islam', status: 'Active' },
  ];

  const stocks = [
    { sku: 'CP-HORO-092', product: 'Royal Tourbillon Complication', warehouse: 'Banani Central Vault', onHand: 18, reserved: 2, available: 16, reorderPoint: 5 },
    { sku: 'CP-HORO-041', product: 'Heritage Chronometer Ingot', warehouse: 'Gulshan Atelier Boutique', onHand: 8, reserved: 1, available: 7, reorderPoint: 4 },
    { sku: 'CP-HORO-108', product: 'Artisanal Grand Calendar Tourbillon', warehouse: 'Banani Central Vault', onHand: 3, reserved: 1, available: 2, reorderPoint: 3 },
    { sku: 'CP-LTHR-012', product: 'Bespoke Alligator Watch Portfolio', warehouse: 'Chittagong Port Hub', onHand: 35, reserved: 0, available: 35, reorderPoint: 10 },
  ];

  const movements = [
    { id: 'MOV-1029', sku: 'CP-HORO-092', type: 'Transfer', from: 'Chittagong Port Hub', to: 'Banani Central Vault', qty: 5, date: '14 Nov 2026, 03:00 PM', operator: 'Imran Hossain' },
    { id: 'MOV-1028', sku: 'CP-HORO-041', type: 'Sale Reserve', from: 'Gulshan Atelier Boutique', to: 'Customer Consignment', qty: 1, date: '14 Nov 2026, 11:15 AM', operator: 'System Ledger' },
    { id: 'MOV-1027', sku: 'CP-LTHR-012', type: 'Procurement Receipt', from: 'Geneva Atelier Supplier', to: 'Chittagong Port Hub', qty: 20, date: '12 Nov 2026, 09:30 AM', operator: 'Rafiqul Islam' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 font-bold block mb-1">
            Physical Ledger
          </span>
          <h1 className="font-serif font-bold text-3xl text-zinc-900 dark:text-white">
            Multi-Warehouse Inventory & Custody
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Maintain strict physical inventory balances, warehouse transfers, and immutable custody audit trails.
          </p>
        </div>

        <button
          onClick={() => alert('New transfer modal triggered.')}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-mono font-bold text-xs tracking-wider shadow flex items-center gap-2 transition cursor-pointer"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Initiate Stock Transfer</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 text-xs font-mono font-bold">
        <button
          onClick={() => setActiveTab('stocks')}
          className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
            activeTab === 'stocks'
              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Active Stock Matrix
        </button>
        <button
          onClick={() => setActiveTab('warehouses')}
          className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
            activeTab === 'warehouses'
              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Warehouses & Vaults
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
            activeTab === 'movements'
              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Immutable Movement Ledger
        </button>
      </div>

      {/* Tab 1: Stocks */}
      {activeTab === 'stocks' && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px]">
                <th className="p-4">SKU Code & Product</th>
                <th className="p-4">Storage Vault</th>
                <th className="p-4">On Hand</th>
                <th className="p-4">Reserved</th>
                <th className="p-4">Available to Sell</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {stocks.map((stk) => (
                <tr key={stk.sku} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                  <td className="p-4">
                    <span className="font-semibold text-zinc-900 dark:text-white font-sans text-xs block">
                      {stk.product}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">{stk.sku}</span>
                  </td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-300">{stk.warehouse}</td>
                  <td className="p-4 font-bold text-zinc-900 dark:text-white">{stk.onHand}</td>
                  <td className="p-4 text-amber-600 dark:text-amber-400 font-semibold">{stk.reserved}</td>
                  <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">{stk.available}</td>
                  <td className="p-4">
                    <Badge variant={stk.available <= stk.reorderPoint ? 'danger' : 'success'}>
                      {stk.available <= stk.reorderPoint ? 'Low Stock Warning' : 'Optimal Allocation'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Warehouses */}
      {activeTab === 'warehouses' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {warehouses.map((wh) => (
            <div
              key={wh.id}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                  <Warehouse className="w-5 h-5" />
                </div>
                <Badge variant="success">{wh.status}</Badge>
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-white">{wh.name}</h3>
                <p className="text-xs text-zinc-500 font-mono">{wh.location}</p>
              </div>
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs font-mono space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Capacity:</span>
                  <span className="text-zinc-800 dark:text-zinc-200">{wh.capacity}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Custodian:</span>
                  <span className="text-zinc-800 dark:text-zinc-200">{wh.manager}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Movement Ledger */}
      {activeTab === 'movements' && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px]">
                <th className="p-4">Transfer Entry</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Origin & Destination</th>
                <th className="p-4">Quantity</th>
                <th className="p-4">Authorized Custodian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {movements.map((mov) => (
                <tr key={mov.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                  <td className="p-4">
                    <span className="font-bold text-zinc-900 dark:text-white block">#{mov.id}</span>
                    <span className="text-[10px] text-zinc-400 font-normal">{mov.date}</span>
                  </td>
                  <td className="p-4 font-bold text-amber-600 dark:text-amber-400">{mov.sku}</td>
                  <td className="p-4">
                    <span className="text-zinc-800 dark:text-zinc-200 block">{mov.from}</span>
                    <span className="text-[10px] text-zinc-400">→ {mov.to}</span>
                  </td>
                  <td className="p-4 font-bold text-zinc-900 dark:text-white">{mov.qty} Units</td>
                  <td className="p-4 text-zinc-500">{mov.operator}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
