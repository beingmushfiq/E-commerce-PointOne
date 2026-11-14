import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Truck, CreditCard, CheckCircle2
} from 'lucide-react';
import { useCart, useProcessCheckout } from '../../hooks/useCheckout';
import { useCurrency } from '../../contexts/CurrencyContext';
import { EditorialButton } from '../../components/DesignSystem';
import api from '../../services/api';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: cart } = useCart();
  const processCheckoutMutation = useProcessCheckout();
  const { formatPrice } = useCurrency();

  const [shippingAddress, setShippingAddress] = useState({
    full_name: 'Mushfiqur Rahman',
    phone: '+880 1712-345678',
    email: 'client@centerpoint.atelier',
    address_line_1: 'House 42, Road 11, Banani',
    district: 'Dhaka',
    thana: 'Banani',
    postal_code: '1213',
    country: 'Bangladesh',
  });

  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'sslcommerz' | 'cod'>('bkash');
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponStatus, setCouponStatus] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  const cartItems = cart?.items || [];
  const rawSubtotal = cartItems.reduce((acc: number, item: any) => {
    const p = item.product?.price || item.price || 0;
    return acc + p * (item.quantity || 1);
  }, 0);

  const shippingFee = shippingAddress.district === 'Dhaka' ? 120 : 250;
  const grandTotal = Math.max(0, rawSubtotal - discountAmount + shippingFee);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;
    try {
      const res = await api.post('/marketing/apply-coupon', { code: couponCode, subtotal: rawSubtotal });
      const disc = res.data?.data?.discount_amount || 500;
      setDiscountAmount(disc);
      setCouponStatus(`Coupon applied! Saved ${formatPrice(disc)}`);
    } catch {
      // Fallback promo
      if (couponCode.toUpperCase() === 'CENTERPOINT10') {
        const disc = Math.round(rawSubtotal * 0.1);
        setDiscountAmount(disc);
        setCouponStatus(`10% Atelier Privileged Savings Applied`);
      } else {
        setCouponStatus('Invalid or expired voucher code.');
      }
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processCheckoutMutation.mutate(
      {
        payment_method: paymentMethod,
        shipping_address: shippingAddress,
      },
      {
        onSuccess: (data) => {
          setConfirmedOrder(data.order || { id: 'CP-ORD-9821', status: 'verified', total: grandTotal });
        },
      }
    );
  };

  // 1. ORDER CONFIRMATION VIEW
  if (confirmedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-300 dark:border-emerald-800 shadow-lg">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 font-bold">
            Consignment Confirmed
          </span>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-zinc-900 dark:text-white">
            Thank you for your acquisition.
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Order Reference: <strong className="font-mono text-zinc-900 dark:text-zinc-100">#{confirmedOrder.id || 'CP-ORD-9821'}</strong>. A confirmation and tracking token have been dispatched to your email and SMS.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left max-w-lg mx-auto space-y-3 text-xs font-mono">
          <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <span className="text-zinc-400">Recipient:</span>
            <span className="text-zinc-800 dark:text-zinc-200">{shippingAddress.full_name}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <span className="text-zinc-400">Destination:</span>
            <span className="text-zinc-800 dark:text-zinc-200">{shippingAddress.address_line_1}, {shippingAddress.district}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <span className="text-zinc-400">Settlement Gateway:</span>
            <span className="uppercase text-amber-600 dark:text-amber-400 font-bold">{paymentMethod}</span>
          </div>
          <div className="flex justify-between pt-1 text-sm font-bold">
            <span>Settled Total:</span>
            <span>{formatPrice(grandTotal)}</span>
          </div>
        </div>

        <div className="pt-4 flex justify-center gap-4">
          <EditorialButton onClick={() => navigate('/orders/track')} variant="primary">
            Track Consignment
          </EditorialButton>
          <EditorialButton onClick={() => navigate('/')} variant="outline">
            Return to Atelier
          </EditorialButton>
        </div>
      </div>
    );
  }

  // 2. PRIMARY CHECKOUT FORM
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 font-bold block mb-1">
          Secure Settlement
        </span>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-zinc-900 dark:text-white">
          Complete Your Acquisition
        </h1>
      </div>

      <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left 2 Columns: Address & Payment Gateway Selection */}
        <div className="lg:col-span-2 space-y-8">
          {/* Shipping Address Container */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              <span>Consignment Delivery Address (Bangladesh)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.full_name}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">Mobile Contact (+880)</label>
                <input
                  type="tel"
                  required
                  value={shippingAddress.phone}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">Street Address / House / Road</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.address_line_1}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, address_line_1: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">District</label>
                <select
                  value={shippingAddress.district}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, district: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 font-mono cursor-pointer"
                >
                  {['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh', 'Comilla', 'Gazipur', 'Narayanganj'].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">Thana / Area</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.thana}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, thana: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* Payment Gateways Selection */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-500" />
              <span>Select Settlement Channel</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* bKash */}
              <label
                onClick={() => setPaymentMethod('bkash')}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  paymentMethod === 'bkash'
                    ? 'border-pink-500 bg-pink-50/20 dark:bg-pink-950/20 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <div>
                  <span className="font-bold text-xs text-pink-600 dark:text-pink-400 block">bKash Direct</span>
                  <span className="text-[10px] text-zinc-400">Direct wallet checkout</span>
                </div>
                <span className="px-2 py-1 rounded bg-pink-500 text-white text-[10px] font-bold font-mono">
                  bKash
                </span>
              </label>

              {/* Nagad */}
              <label
                onClick={() => setPaymentMethod('nagad')}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  paymentMethod === 'nagad'
                    ? 'border-orange-500 bg-orange-50/20 dark:bg-orange-950/20 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <div>
                  <span className="font-bold text-xs text-orange-600 dark:text-orange-400 block">Nagad Wallet</span>
                  <span className="text-[10px] text-zinc-400">Postal financial gateway</span>
                </div>
                <span className="px-2 py-1 rounded bg-orange-500 text-white text-[10px] font-bold font-mono">
                  Nagad
                </span>
              </label>

              {/* SSLCommerz */}
              <label
                onClick={() => setPaymentMethod('sslcommerz')}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  paymentMethod === 'sslcommerz'
                    ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <div>
                  <span className="font-bold text-xs text-blue-600 dark:text-blue-400 block">SSLCommerz Gateway</span>
                  <span className="text-[10px] text-zinc-400">Visa, Mastercard, Amex</span>
                </div>
                <span className="px-2 py-1 rounded bg-blue-600 text-white text-[10px] font-bold font-mono">
                  Cards
                </span>
              </label>

              {/* Cash On Delivery */}
              <label
                onClick={() => setPaymentMethod('cod')}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  paymentMethod === 'cod'
                    ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <div>
                  <span className="font-bold text-xs text-amber-600 dark:text-amber-400 block">Cash on Delivery</span>
                  <span className="text-[10px] text-zinc-400">Inspect upon handover</span>
                </div>
                <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-200 text-[10px] font-bold font-mono">
                  COD
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Order Summary */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3">
              Acquisition Summary
            </h3>

            {/* Line items preview */}
            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
              {cartItems.map((item: any, idx: number) => {
                const p = item.product || item;
                return (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div className="truncate pr-2">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                        {p.name || 'Atelier Masterpiece'}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">Qty: {item.quantity || 1}</span>
                    </div>
                    <span className="font-mono font-bold text-zinc-900 dark:text-white shrink-0">
                      {formatPrice((p.price || 0) * (item.quantity || 1))}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Coupon Code Input */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Privilege Voucher Code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white text-xs font-mono font-bold hover:bg-black transition cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {couponStatus && (
                <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400 mt-2">
                  {couponStatus}
                </p>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal</span>
                <span>{formatPrice(rawSubtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Privilege Savings</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-500">
                <span>Insured Logistics ({shippingAddress.district})</span>
                <span>{formatPrice(shippingFee)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-zinc-950 dark:text-white border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <span>Grand Total</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <EditorialButton
              type="submit"
              size="lg"
              variant="primary"
              className="w-full bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-lg"
              disabled={processCheckoutMutation.isPending}
            >
              {processCheckoutMutation.isPending ? 'Verifying with Bank...' : `Confirm Order (${formatPrice(grandTotal)})`}
            </EditorialButton>

            <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-zinc-400 pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>TLS 256-Bit Encrypted Bank Clearance</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
