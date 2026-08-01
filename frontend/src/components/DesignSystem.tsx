import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Eye, ShoppingBag, Sparkles, Activity, Package, HardDrive, ArrowRight
} from 'lucide-react';
import type { ProductItem } from '../types/ui';
export type { ProductItem };

// --- 1. EDITORIAL BUTTON (LIGHT MODE) ---
interface EditorialButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'bronze';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const EditorialButton: React.FC<EditorialButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  className = '',
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center font-medium tracking-wide transition-all duration-300 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.98]";
  
  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-xs rounded-lg gap-1.5",
    md: "px-5 py-2.5 text-xs uppercase tracking-[0.15em] rounded-xl gap-2",
    lg: "px-8 py-3.5 text-sm uppercase tracking-[0.2em] rounded-xl gap-2.5"
  };

  const variantStyles = {
    primary: "bg-[#18181b] text-white hover:bg-black shadow-md hover:shadow-lg",
    secondary: "bg-[#f4f4f5] text-[#18181b] hover:bg-[#e4e4e7] border border-[#e4e4e7]",
    ghost: "bg-transparent text-[#71717a] hover:text-[#18181b] hover:bg-black/5",
    outline: "bg-transparent text-[#18181b] border border-[#d4d4d8] hover:border-[#18181b] hover:bg-black/5",
    bronze: "bg-[#b45309] text-white hover:bg-[#92400e] shadow-md shadow-amber-900/10"
  };

  return (
    <button
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
      {icon && <span className="opacity-80 transition-transform group-hover:translate-x-0.5">{icon}</span>}
    </button>
  );
};

// --- 2. COMMAND PALETTE (CMD + K) ---
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  onSelectProduct: (product: ProductItem) => void;
  onToggleViewMode: (mode: 'storefront' | 'cms') => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  products = [],
  onSelectProduct,
  onToggleViewMode,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) || 
    p.sku?.toLowerCase().includes(query.toLowerCase()) ||
    p.category?.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          {/* Search Input Bar */}
          <div className="flex items-center px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
            <Search className="w-5 h-5 text-zinc-400 mr-3 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search products, category, or type 'admin'..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none font-sans"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-semibold text-zinc-500 bg-zinc-200/60 border border-zinc-300 rounded">
              ESC
            </kbd>
          </div>

          {/* Quick Mode Shortcuts */}
          <div className="p-2 border-b border-zinc-100 bg-zinc-50/30 flex items-center gap-2 overflow-x-auto text-xs text-zinc-600">
            <span className="px-3 py-1 text-[10px] uppercase tracking-widest font-mono text-zinc-400">Quick Modes:</span>
            <button 
              onClick={() => { onToggleViewMode('storefront'); onClose(); }}
              className="px-3 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition flex items-center gap-1.5 font-medium"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-700" /> Storefront
            </button>
            <button 
              onClick={() => { onToggleViewMode('cms'); onClose(); }}
              className="px-3 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition flex items-center gap-1.5 font-medium"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" /> Admin Studio
            </button>
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto p-2 divide-y divide-zinc-100">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => { onSelectProduct(p); onClose(); }}
                  className="group flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-zinc-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-zinc-900 group-hover:text-amber-700 transition">
                        {p.name}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500">
                        {p.category?.name || 'Store'} • Stock: {p.stock_quantity}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-semibold text-zinc-900">
                      ${Number(p.price).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-zinc-400 font-mono">
                No matching items found. Try typing a product name.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// --- 3. EDITORIAL PRODUCT CARD (LIGHT MODE) ---
interface EditorialProductCardProps {
  product: ProductItem;
  onQuickView: (product: ProductItem) => void;
  onAddToCart: (product: ProductItem) => void;
}

export const EditorialProductCard: React.FC<EditorialProductCardProps> = ({
  product,
  onQuickView,
  onAddToCart,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative flex flex-col bg-white border border-zinc-200/80 hover:border-zinc-300 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl"
    >
      {/* Visual Canvas Container */}
      <div className="relative aspect-[4/5] bg-zinc-50 overflow-hidden cursor-pointer" onClick={() => onQuickView(product)}>
        {/* Category Pill Tag */}
        <div className="absolute top-4 left-4 z-10">
          <span className="px-3 py-1 text-[11px] font-medium tracking-wide text-zinc-700 bg-white/90 backdrop-blur-md rounded-full border border-zinc-200 shadow-sm">
            {product.category?.name || 'Exclusive'}
          </span>
        </div>

        {/* Featured Badge */}
        {product.is_featured && (
          <div className="absolute top-4 right-4 z-10">
            <span className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-amber-800 bg-amber-50 backdrop-blur-md rounded-md border border-amber-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" /> Featured
            </span>
          </div>
        )}

        {/* Image */}
        <div className="w-full h-full flex items-center justify-center p-6 transition-transform duration-500 ease-out group-hover:scale-105">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover rounded-xl shadow-sm"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-400">
              <HardDrive className="w-12 h-12 stroke-[1.2]" />
            </div>
          )}
        </div>

        {/* Quick Action Overlay */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-x-4 bottom-4 z-20 flex gap-2"
        >
          <EditorialButton
            variant="primary"
            size="sm"
            className="flex-1 text-[11px]"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            icon={<ShoppingBag className="w-3.5 h-3.5" />}
          >
            Add to Bag
          </EditorialButton>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="p-2.5 bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 rounded-lg shadow-sm transition"
            title="Quick View"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </div>

      {/* Product Details */}
      <div className="p-5 flex flex-col justify-between flex-1 bg-white">
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1">
            <span>In Stock ({product.stock_quantity})</span>
          </div>
          <h3
            onClick={() => onQuickView(product)}
            className="text-sm font-semibold text-zinc-900 group-hover:text-amber-700 transition line-clamp-1 cursor-pointer"
          >
            {product.name}
          </h3>
          <p className="text-xs text-zinc-500 line-clamp-2 mt-1 font-normal leading-relaxed">
            {product.summary || product.description || 'Premium quality luxury goods.'}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-100 flex items-baseline justify-between">
          <span className="text-xs text-zinc-500 font-medium">Price</span>
          <div className="flex items-baseline gap-2">
            {product.sale_price && (
              <span className="text-xs font-mono line-through text-zinc-400">
                ${Number(product.price).toFixed(2)}
              </span>
            )}
            <span className="text-base font-semibold text-zinc-900">
              ${Number(product.sale_price || product.price).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- 4. CART SHEET DRAWER (LIGHT MODE) ---
interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: any[];
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems = [],
  onCheckout,
}) => {
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md bg-white border-l border-zinc-200 h-full flex flex-col z-10 shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-amber-700" />
              <h2 className="text-sm uppercase tracking-wider font-semibold text-zinc-900">
                Your Shopping Bag ({cartItems.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 divide-y divide-zinc-100">
            {cartItems.length > 0 ? (
              cartItems.map((item, idx) => (
                <div key={idx} className="py-4 flex gap-4 first:pt-0 last:pb-0">
                  <div className="w-16 h-16 rounded-xl bg-zinc-100 border border-zinc-200 shrink-0 overflow-hidden flex items-center justify-center p-1">
                    {item.product?.image_url ? (
                      <img src={item.product.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Package className="w-6 h-6 text-zinc-400" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-900 line-clamp-1">{item.product?.name || item.name}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">Quantity: {item.quantity}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-500">${Number(item.price).toFixed(2)} each</span>
                      <span className="text-zinc-900 font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400">
                <ShoppingBag className="w-12 h-12 stroke-[1] mb-3 text-zinc-300" />
                <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">Your bag is empty</p>
              </div>
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex flex-col gap-4">
              <div className="space-y-2 text-xs font-sans">
                <div className="flex justify-between text-zinc-500">
                  <span>Subtotal</span>
                  <span className="text-zinc-900 font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Standard Delivery</span>
                  <span className="text-emerald-600 font-medium">Free</span>
                </div>
                <div className="pt-2 border-t border-zinc-200 flex justify-between text-sm font-semibold text-zinc-900">
                  <span>Total</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>

              <EditorialButton
                variant="bronze"
                size="lg"
                className="w-full mt-2"
                onClick={() => {
                  onClose();
                  onCheckout();
                }}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Proceed to Checkout
              </EditorialButton>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
