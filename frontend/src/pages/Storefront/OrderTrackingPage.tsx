import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { EditorialButton, Badge } from '../../components/DesignSystem';

export const OrderTrackingPage: React.FC = () => {
  const [referenceInput, setReferenceInput] = useState('CP-ORD-9821');
  const [searchedOrder, setSearchedOrder] = useState<any>({
    reference: 'CP-ORD-9821',
    status: 'dispatched',
    courier: 'Steadfast Insured Express',
    tracking_number: 'STF-8829104',
    recipient: 'Mushfiqur Rahman',
    destination: 'House 42, Road 11, Banani, Dhaka',
    estimated_arrival: 'Tomorrow by 4:00 PM',
    timeline: [
      { title: 'Order Placed & Payment Verified', time: '14 Nov 2026, 10:24 AM', completed: true },
      { title: 'Inventory Allocated in Vault', time: '14 Nov 2026, 01:15 PM', completed: true },
      { title: 'Quality Inspection & Verification', time: '14 Nov 2026, 03:40 PM', completed: true },
      { title: 'Handed to Insured Courier (Steadfast)', time: '14 Nov 2026, 06:10 PM', completed: true },
      { title: 'Out for Express Handover', time: 'Estimated 15 Nov, 04:00 PM', completed: false },
    ],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceInput) return;
    setSearchedOrder({
      ...searchedOrder,
      reference: referenceInput.toUpperCase(),
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-2">
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 font-bold">
          Fulfillment Logistics
        </span>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-zinc-900 dark:text-white">
          Track Your Atelier Consignment
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
          Enter your order reference code or consignment number below to view the real-time custody and transit status.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            required
            placeholder="e.g. CP-ORD-9821"
            value={referenceInput}
            onChange={(e) => setReferenceInput(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono uppercase font-bold text-zinc-900 dark:text-zinc-100 shadow-sm focus:outline-none focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
        </div>
        <EditorialButton type="submit" variant="primary" size="md">
          Inspect Order
        </EditorialButton>
      </form>

      {/* Tracking Card */}
      {searchedOrder && (
        <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm space-y-8">
          {/* Order Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6">
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                Consignment Reference
              </span>
              <h3 className="font-mono font-bold text-xl text-zinc-900 dark:text-white mt-0.5">
                #{searchedOrder.reference}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="accent">
                In Transit
              </Badge>
              <div className="text-right text-xs font-mono">
                <span className="text-zinc-400 block text-[10px]">Courier:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{searchedOrder.courier}</span>
              </div>
            </div>
          </div>

          {/* Timeline Visual Progress */}
          <div className="space-y-6">
            <h4 className="font-serif font-bold text-base text-zinc-900 dark:text-white">
              Chain of Custody
            </h4>
            <div className="relative border-l-2 border-amber-500/30 ml-4 space-y-6 pl-6">
              {searchedOrder.timeline.map((step: any, idx: number) => (
                <div key={idx} className="relative">
                  <div
                    className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 ${
                      step.completed
                        ? 'bg-amber-500 border-amber-500 text-zinc-950'
                        : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700'
                    }`}
                  />
                  <div>
                    <h5 className={`text-xs font-semibold ${step.completed ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}`}>
                      {step.title}
                    </h5>
                    <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                      {step.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Destination Details Footer */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-750 flex flex-col sm:flex-row justify-between gap-4 text-xs font-mono">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-zinc-400 block text-[10px]">Delivery Destination:</span>
                <span className="text-zinc-800 dark:text-zinc-200">{searchedOrder.destination}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-zinc-400 block text-[10px]">Recipient:</span>
              <span className="text-zinc-800 dark:text-zinc-200 font-bold">{searchedOrder.recipient}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
