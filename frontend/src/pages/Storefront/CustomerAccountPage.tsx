import React, { useState } from 'react';
import { Heart, LifeBuoy, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../../components/DesignSystem';

export const CustomerAccountPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'wishlist' | 'tickets'>('orders');

  const orders = [
    { id: 'CP-ORD-9821', date: '14 Nov 2026', items: 2, total: 95000, status: 'In Transit' },
    { id: 'CP-ORD-9104', date: '28 Oct 2026', items: 1, total: 45000, status: 'Delivered' },
  ];

  const addresses = [
    { title: 'Primary Atelier Residence', name: 'Mushfiqur Rahman', phone: '+880 1712-345678', address: 'House 42, Road 11, Banani, Dhaka 1213' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Account Header */}
      <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-serif font-black text-2xl flex items-center justify-center">
            {user?.name?.[0] || 'C'}
          </div>
          <div>
            <h1 className="font-serif font-bold text-2xl text-zinc-900 dark:text-white">
              {user?.name || 'Valued Atelier Patron'}
            </h1>
            <span className="text-xs font-mono text-zinc-400">
              {user?.email || 'client@centerpoint.atelier'} • Privileged Client Member
            </span>
          </div>
        </div>

        <button
          onClick={() => logout('customer')}
          className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:text-rose-600 hover:border-rose-300 transition flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 text-xs font-mono font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 transition cursor-pointer ${
            activeTab === 'orders'
              ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400'
              : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          Acquisition History
        </button>
        <button
          onClick={() => setActiveTab('addresses')}
          className={`pb-3 transition cursor-pointer ${
            activeTab === 'addresses'
              ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400'
              : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          Saved Addresses
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`pb-3 transition cursor-pointer ${
            activeTab === 'wishlist'
              ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400'
              : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          Wishlist Vault
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`pb-3 transition cursor-pointer ${
            activeTab === 'tickets'
              ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400'
              : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          Concierge Tickets
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-mono"
            >
              <div>
                <span className="font-bold text-sm text-zinc-900 dark:text-white block">
                  #{ord.id}
                </span>
                <span className="text-zinc-400">Date: {ord.date} • {ord.items} Item(s)</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-sm text-zinc-900 dark:text-white">
                  ৳ {ord.total.toLocaleString()}
                </span>
                <Badge variant={ord.status === 'Delivered' ? 'success' : 'accent'}>
                  {ord.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'addresses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs"
            >
              <div className="flex justify-between items-center">
                <span className="font-serif font-bold text-sm text-zinc-900 dark:text-white">{addr.title}</span>
                <Badge variant="accent">Primary</Badge>
              </div>
              <p className="text-zinc-700 dark:text-zinc-300 font-semibold">{addr.name}</p>
              <p className="text-zinc-500 font-mono">{addr.phone}</p>
              <p className="text-zinc-500">{addr.address}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'wishlist' && (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <Heart className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-white mb-1">Your Wishlist Vault is Pristine</h3>
          <p className="text-xs text-zinc-400">Save pieces as you browse to track availability and private allocations.</p>
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <LifeBuoy className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-white mb-1">No Active Concierge Inquiries</h3>
          <p className="text-xs text-zinc-400">Need personal horological consultation or assistance with a custom commission? Reach our concierge anytime.</p>
        </div>
      )}
    </div>
  );
};
