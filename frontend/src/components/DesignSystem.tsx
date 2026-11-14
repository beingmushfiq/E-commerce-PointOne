import React, { useState } from 'react';
import {
  ShoppingBag, Search, Sparkles, ArrowRight,
  X, Package, AlertTriangle, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProductItem } from '../types/ui';
import { useCurrency } from '../contexts/CurrencyContext';
import { SpotlightCard } from './SpotlightCard';
import { cn } from '../utils/cn';

/* -------------------------------------------------------------------------- */
/* 1. EDITORIAL BUTTON                                                        */
/* -------------------------------------------------------------------------- */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'inverted' | 'amber' | 'white' | 'outlineLight';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const EditorialButton = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-xs font-semibold',
    lg: 'px-7 py-3 text-sm font-semibold',
  };

  const variantClasses = {
    primary:
      'bg-zinc-900 text-white hover:bg-black dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 shadow-md hover:shadow-lg active:scale-95',
    secondary:
      'bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-white dark:border-zinc-800 dark:hover:bg-zinc-800 active:scale-95',
    outline:
      'bg-transparent text-zinc-900 border border-zinc-300 hover:border-zinc-900 dark:text-white dark:border-zinc-700 dark:hover:border-amber-400 active:scale-95',
    outlineLight:
      'bg-white/10 text-white border border-white/30 hover:border-white hover:bg-white/20 backdrop-blur-sm active:scale-95 shadow-sm',
    ghost:
      'bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800',
    inverted:
      'bg-white text-zinc-950 hover:bg-zinc-100 shadow-md active:scale-95 border border-white/20',
    white:
      'bg-white text-zinc-950 hover:bg-zinc-100 font-semibold shadow-md active:scale-95 border border-white/20',
    amber:
      'bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold shadow-md hover:shadow-amber-500/20 active:scale-95',
  };

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl transition duration-200 cursor-pointer select-none font-sans',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {icon && <span className="shrink-0">{icon}</span>}
    </button>
  );
});

EditorialButton.displayName = 'EditorialButton';

/* -------------------------------------------------------------------------- */
/* 2. EDITORIAL PRODUCT CARD                                                  */
/* -------------------------------------------------------------------------- */
interface ProductCardProps {
  product: ProductItem;
  onAddToCart: (product: ProductItem) => void;
  onClick?: () => void;
}

export const EditorialProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onClick,
}) => {
  const { formatPrice } = useCurrency();
  const [imageError, setImageError] = useState(false);

  const fallbackImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
  const displayImage = !imageError && product.image_url ? product.image_url : fallbackImage;

  return (
    <SpotlightCard className="group flex flex-col h-full cursor-pointer">
      {/* Product Image Frame */}
      <div
        onClick={onClick}
        className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden"
      >
        <img
          src={displayImage}
          alt={product.name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Featured Pill */}
        {product.is_featured && (
          <div className="absolute top-3 left-3 z-20">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 dark:bg-zinc-950/90 text-amber-600 dark:text-amber-400 backdrop-blur-md shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
              <Sparkles className="w-2.5 h-2.5" /> Featured
            </span>
          </div>
        )}

        {/* Quick Add Overlay on Desktop Hover */}
        <div className="absolute inset-x-3 bottom-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="w-full py-2.5 rounded-xl bg-zinc-900/95 hover:bg-black text-amber-400 text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-lg flex items-center justify-center gap-2 transition active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add to Bag</span>
          </button>
        </div>
      </div>

      {/* Product Information */}
      <div onClick={onClick} className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
            <span>{product.sku || 'CP-ATELIER'}</span>
            <span className={(product.stock_quantity ?? 0) > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-zinc-400'}>
              {(product.stock_quantity ?? 0) > 0 ? 'In Stock' : 'Pre-order'}
            </span>
          </div>

          <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-100 mt-1 line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {product.name}
          </h3>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
            {product.summary || product.description}
          </p>
        </div>

        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block">Price</span>
            <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
              {formatPrice(product.price)}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-amber-500 hover:text-zinc-950 transition sm:hidden"
            title="Add to Bag"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </SpotlightCard>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. CART DRAWER COMPONENT                                                   */
/* -------------------------------------------------------------------------- */
interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: any[];
  onUpdateQuantity?: (id: number, qty: number) => void;
  onRemoveItem?: (id: number) => void;
  onProceedCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onProceedCheckout,
}) => {
  const { formatPrice } = useCurrency();
  const subtotal = cartItems.reduce((acc, item) => acc + (parseFloat(item.price || item.product?.price || 0) * item.quantity), 0);
  const freeShippingThreshold = 50000; // 50,000 BDT
  const progressToFreeShip = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Body */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-[#09090B] border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100 font-sans"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h2 className="font-serif font-bold text-lg">Your Curated Bag ({cartItems.length})</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Progress Indicator */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="flex items-center justify-between font-mono mb-1.5">
                <span>Free Express Shipping</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  {progressToFreeShip >= 100 ? 'Unlocked!' : `${progressToFreeShip}% Reached`}
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressToFreeShip}%` }}
                />
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 divide-y divide-zinc-100 dark:divide-zinc-800/80" data-lenis-prevent>
              {cartItems.length > 0 ? (
                cartItems.map((item, idx) => (
                  <div key={idx} className="py-4 flex gap-4 first:pt-0 last:pb-0">
                    <div className="w-20 h-20 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shrink-0">
                      <img
                        src={item.product?.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-serif font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1">
                          {item.product?.name || 'Curated Product'}
                        </h4>
                        <span className="text-[11px] font-mono text-zinc-400">
                          {item.product?.sku || 'ATELIER-01'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-zinc-500">Qty: {item.quantity}</span>
                        <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                          {formatPrice((item.price || item.product?.price || 0) * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 py-16 space-y-3">
                  <Package className="w-12 h-12 stroke-[1.2]" />
                  <p className="font-serif text-base text-zinc-600 dark:text-zinc-400">Your bag is currently empty.</p>
                  <p className="text-xs text-zinc-400 max-w-xs">Explore our curated collections to discover exceptional timepieces and handcrafted goods.</p>
                </div>
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {cartItems.length > 0 && (
              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 space-y-4">
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-zinc-500">
                    <span>Subtotal</span>
                    <span className="font-mono text-zinc-900 dark:text-zinc-100">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-500">
                    <span>Delivery</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {subtotal >= freeShippingThreshold ? 'Complimentary' : formatPrice(120)}
                    </span>
                  </div>
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-2" />
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span>Total Amount</span>
                    <span className="font-mono text-base text-zinc-900 dark:text-zinc-100">
                      {formatPrice(subtotal >= freeShippingThreshold ? subtotal : subtotal + 120)}
                    </span>
                  </div>
                </div>

                <EditorialButton
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    onClose();
                    onProceedCheckout();
                  }}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Proceed to Secure Checkout
                </EditorialButton>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/* -------------------------------------------------------------------------- */
/* 4. COMMAND PALETTE (⌘K)                                                    */
/* -------------------------------------------------------------------------- */
export const CommandPalette: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  onSelectProduct: (p: ProductItem) => void;
}> = ({ isOpen, onClose, products, onSelectProduct }) => {
  const [query, setQuery] = useState('');
  const { formatPrice } = useCurrency();

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku?.toLowerCase().includes(query.toLowerCase()) ||
      p.summary?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-10"
          >
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-zinc-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search products, SKUs, or collections (e.g. Royal, Watch, Wool)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
              />
              <kbd className="px-2 py-1 text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded border border-zinc-200 dark:border-zinc-700">
                ESC
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2" data-lenis-prevent>
              {filtered.length > 0 ? (
                filtered.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProduct(p);
                      onClose();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=60'}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{p.name}</h4>
                        <span className="text-[10px] font-mono text-zinc-400">{p.sku}</span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                      {formatPrice(p.price)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-zinc-400">
                  No products matched your search.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* -------------------------------------------------------------------------- */
/* 5. SKELETON LOADERS (ACCESSIBLE & STABLE LAYOUT)                          */
/* -------------------------------------------------------------------------- */
export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => (
  <div className="w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 space-y-3 animate-pulse">
    <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-1/4 mb-4" />
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 items-center">
          {Array.from({ length: columns }).map((_, c) => (
            <div
              key={c}
              className={`h-10 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg ${
                c === 0 ? 'w-2/5' : 'flex-1'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonCard: React.FC = () => (
  <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4 animate-pulse">
    <div className="aspect-square w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
    <div className="space-y-2">
      <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-2/3" />
      <div className="h-3 bg-zinc-100 dark:bg-zinc-800/60 rounded w-1/2" />
    </div>
    <div className="flex justify-between items-center pt-2">
      <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-1/4" />
      <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-1/3" />
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/* 6. EMPTY STATE CARD                                                        */
/* -------------------------------------------------------------------------- */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyStateCard: React.FC<EmptyStateProps> = ({
  icon = <Package className="w-10 h-10 text-zinc-400" />,
  title,
  description,
  actionText,
  onAction,
}) => (
  <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40">
    <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 mb-4 text-zinc-600 dark:text-zinc-300">
      {icon}
    </div>
    <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-1">
      {title}
    </h3>
    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-6 leading-relaxed">
      {description}
    </p>
    {actionText && onAction && (
      <EditorialButton onClick={onAction} size="sm" variant="primary">
        {actionText}
      </EditorialButton>
    )}
  </div>
);

/* -------------------------------------------------------------------------- */
/* 7. PERMISSION DENIED NOTICE                                                */
/* -------------------------------------------------------------------------- */
export const PermissionDenied: React.FC<{
  requiredRole?: string;
  description?: string;
  onBack?: () => void;
}> = ({
  requiredRole = 'Staff Privilege',
  description = 'You do not have the required role permissions to view or perform operations in this domain.',
  onBack,
}) => (
  <div className="min-h-[60vh] flex items-center justify-center p-6">
    <div className="max-w-md w-full p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl text-center">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4">
        <Lock className="w-6 h-6" />
      </div>
      <h3 className="font-serif font-bold text-xl text-zinc-900 dark:text-zinc-100 mb-2">
        Access Restricted
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
        {description}
      </p>
      <div className="inline-block px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono font-semibold text-zinc-600 dark:text-zinc-300 mb-6">
        Required: {requiredRole}
      </div>
      {onBack && (
        <div>
          <EditorialButton onClick={onBack} variant="outline" size="sm">
            Return to Authorized View
          </EditorialButton>
        </div>
      )}
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/* 8. DESTRUCTIVE CONFIRMATION MODAL                                          */
/* -------------------------------------------------------------------------- */
export const DestructiveConfirmModal: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Action',
  isDangerous = true,
  onConfirm,
  onCancel,
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2.5 rounded-xl ${isDangerous ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="font-serif font-bold text-lg text-zinc-900 dark:text-zinc-100">
              {title}
            </h4>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
            {message}
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-xs font-semibold rounded-xl text-white shadow transition cursor-pointer ${
                isDangerous
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

/* -------------------------------------------------------------------------- */
/* 9. SEMANTIC BADGE & STATUS PULSE                                           */
/* -------------------------------------------------------------------------- */
export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';
  size?: 'sm' | 'md';
  className?: string;
}> = ({ children, variant = 'neutral', size = 'sm', className = '' }) => {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
    info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
    neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
    accent: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full font-mono font-medium border', styles[variant], sizes[size], className)}>
      {children}
    </span>
  );
};

export const StatusPulse: React.FC<{ status: 'healthy' | 'warning' | 'error' | 'idle' }> = ({ status }) => {
  const colors = {
    healthy: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    idle: 'bg-zinc-400',
  };

  return (
    <span className="relative flex h-2 w-2">
      {status !== 'idle' && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colors[status]}`} />
      )}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${colors[status]}`} />
    </span>
  );
};
