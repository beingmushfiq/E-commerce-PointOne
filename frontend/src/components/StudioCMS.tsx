import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, FolderTree, Activity, Plus, Search, Eye, Settings,
  ExternalLink, Database, Sliders as SlidersIcon, HelpCircle, Lock, LogOut
} from 'lucide-react';
import { EditorialButton } from './DesignSystem';
import type { ProductItem } from '../types/ui';
import { useAuth } from '../hooks/useAuth';

interface StudioCMSProps {
  products: ProductItem[];
  categories: any[];
  sliders?: any[];
  faqs?: any[];
  onOpenStorefront: () => void;
}

export const StudioCMS: React.FC<StudioCMSProps> = ({
  products = [],
  categories = [],
  onOpenStorefront,
}) => {
  const { user, isAdmin, login, logout, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'inventory' | 'categories' | 'cms' | 'analytics' | 'settings'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // Admin Login state
  const [loginEmail, setLoginEmail] = useState('admin@centerpoint.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginError, setLoginError] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await login({ email: loginEmail, password: loginPassword });
    } catch (err: any) {
      setLoginError(err.response?.data?.message || 'Invalid credentials or non-admin account.');
    }
  };

  // If loading user state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying Admin Credentials...</span>
        </div>
      </div>
    );
  }

  // If not logged in or not admin, show Admin Authentication Screen
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white font-sans flex items-center justify-center p-6 selection:bg-amber-500/20">
        <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-4">Studio CMS Login</h1>
            <p className="text-xs text-zinc-400">Restricted administrative access. Authenticate with admin credentials.</p>
          </div>

          {loginError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-400 font-medium mb-1.5">Admin Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 transition"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-medium mb-1.5">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 transition"
              />
            </div>

            <EditorialButton variant="primary" size="lg" className="w-full mt-2" type="submit">
              Sign In to Admin Studio
            </EditorialButton>
          </form>

          <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
            <span>Demo Admin: admin@centerpoint.com &bull; password123</span>
            <button onClick={onOpenStorefront} className="text-amber-400 hover:underline">
              Back to Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.category_id?.toString() === selectedCategory || p.category?.name === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#18181b] font-sans antialiased flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 border-b border-zinc-200 bg-white px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onOpenStorefront}>
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white font-black text-sm flex items-center justify-center shadow-md">
              CP
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-900">Admin Studio</span>
              <span className="text-[10px] font-mono text-zinc-400 block -mt-1">Logged in as {user.name}</span>
            </div>
          </div>

          <div className="h-4 w-px bg-zinc-200 hidden sm:block" />

          {/* Mode Tabs */}
          <nav className="hidden sm:flex items-center gap-1">
            {[
              { id: 'inventory', label: 'Products', icon: <Package className="w-3.5 h-3.5" /> },
              { id: 'categories', label: 'Categories', icon: <FolderTree className="w-3.5 h-3.5" /> },
              { id: 'cms', label: 'CMS & Sliders', icon: <SlidersIcon className="w-3.5 h-3.5" /> },
              { id: 'analytics', label: 'Analytics', icon: <Activity className="w-3.5 h-3.5" /> },
              { id: 'settings', label: 'Settings', icon: <Settings className="w-3.5 h-3.5" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-zinc-100 text-zinc-900 font-semibold border border-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => logout()}
            className="p-2 text-zinc-500 hover:text-rose-600 rounded-lg hover:bg-zinc-100 transition"
            title="Sign Out Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenStorefront}
            className="px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg border border-zinc-200 transition flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Back to Storefront
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-zinc-200 bg-white p-4 hidden md:flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-2 px-2">Catalog Summary</span>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                  <div className="text-[10px] text-zinc-500 font-medium">Total Products</div>
                  <div className="text-xl font-bold text-zinc-900 mt-0.5">{products.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                  <div className="text-[10px] text-zinc-500 font-medium">Categories</div>
                  <div className="text-xl font-bold text-zinc-900 mt-0.5">{categories.length}</div>
                </div>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-2 px-2">Category Filter</span>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition ${
                    selectedCategory === 'all' ? 'bg-zinc-100 text-zinc-900 font-semibold border border-zinc-200' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  All Items ({products.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id.toString())}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                      selectedCategory === cat.id.toString() ? 'bg-zinc-100 text-zinc-900 font-semibold border border-zinc-200' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Table / CMS Content Area */}
        <main className="flex-1 bg-[#fafafa] overflow-y-auto p-6 md:p-8 flex flex-col">
          {activeTab === 'inventory' && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-3">
                    Product Inventory
                    <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-zinc-200 text-zinc-700">
                      {filteredProducts.length} Items
                    </span>
                  </h1>
                  <p className="text-xs text-zinc-500 mt-1">Manage stock quantities, pricing, and product details.</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1 sm:w-64">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 shadow-sm"
                    />
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                  </div>

                  <EditorialButton variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                    Add Product
                  </EditorialButton>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-600">
                    <thead className="bg-zinc-50 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
                      <tr>
                        <th className="px-6 py-3.5">Product</th>
                        <th className="px-6 py-3.5">Category</th>
                        <th className="px-6 py-3.5">Price</th>
                        <th className="px-6 py-3.5">Stock</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                          <tr
                            key={product.id}
                            onClick={() => setSelectedProduct(product)}
                            className="hover:bg-zinc-50 transition cursor-pointer group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                                  {product.image_url ? (
                                    <img src={product.image_url} alt="" className="w-full h-full object-cover rounded" />
                                  ) : (
                                    <Database className="w-5 h-5 text-zinc-400" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold text-zinc-900 group-hover:text-amber-700 transition">
                                    {product.name}
                                  </div>
                                  <div className="text-[11px] text-zinc-400">
                                    SKU: {product.sku || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-zinc-600">
                              {product.category?.name || 'General'}
                            </td>
                            <td className="px-6 py-4 font-mono font-semibold text-zinc-900">
                              ${Number(product.price).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 font-mono">
                              <span className={product.stock_quantity < 10 ? 'text-amber-600 font-semibold' : 'text-zinc-600'}>
                                {product.stock_quantity} units
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setSelectedProduct(product)}
                                className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-16 text-center text-xs text-zinc-400">
                            No products match your filter parameters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-zinc-900">Categories Management</h1>
                  <p className="text-xs text-zinc-500 mt-1">Organize storefront departments and sub-categories.</p>
                </div>
                <EditorialButton variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                  Create Category
                </EditorialButton>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <div key={cat.id} className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 text-sm">{cat.name}</span>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase bg-zinc-100 px-2 py-0.5 rounded">/{cat.slug}</span>
                    </div>
                    <p className="text-xs text-zinc-500">Active category displayed in main navigation.</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'cms' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-zinc-900">CMS & Content Management</h1>
                <p className="text-xs text-zinc-500 mt-1">Control homepage sliders, FAQs, blog posts, and navigation menus.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2 font-bold text-zinc-900 text-sm">
                    <SlidersIcon className="w-4 h-4 text-amber-600" />
                    <span>Homepage Hero Sliders</span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-900">Curated Modern Living</div>
                        <div className="text-[11px] text-zinc-500">Active • Sort 1</div>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Live</span>
                    </div>
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-900">Spring / Summer 2026 Collection</div>
                        <div className="text-[11px] text-zinc-500">Active • Sort 2</div>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Live</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2 font-bold text-zinc-900 text-sm">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span>Store FAQs</span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                      <div className="font-semibold text-zinc-900">What is your shipping policy?</div>
                      <div className="text-[11px] text-zinc-500 mt-1">Complimentary express shipping on orders over $150.</div>
                    </div>
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                      <div className="font-semibold text-zinc-900">How do returns work?</div>
                      <div className="text-[11px] text-zinc-500 mt-1">30-day return window with prepaid labels.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-zinc-900">Business Analytics & Metrics</h1>
                <p className="text-xs text-zinc-500 mt-1">Real-time performance metrics and sales overview.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                  <div className="text-xs text-zinc-500 font-medium">Gross Revenue</div>
                  <div className="text-2xl font-black text-zinc-900 mt-1">$48,290.00</div>
                  <span className="text-[10px] font-semibold text-emerald-600">+14.2% from last month</span>
                </div>
                <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                  <div className="text-xs text-zinc-500 font-medium">Total Orders</div>
                  <div className="text-2xl font-black text-zinc-900 mt-1">312</div>
                  <span className="text-[10px] font-semibold text-emerald-600">+8.5% order conversion</span>
                </div>
                <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                  <div className="text-xs text-zinc-500 font-medium">Avg Order Value</div>
                  <div className="text-2xl font-black text-zinc-900 mt-1">$154.78</div>
                  <span className="text-[10px] font-semibold text-zinc-400">Steady trend</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-zinc-900">System Settings</h1>
                <p className="text-xs text-zinc-500 mt-1">Configure workspace parameters and API connections.</p>
              </div>
              <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm space-y-4 max-w-xl">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-2 border-b border-zinc-100">
                    <span className="font-semibold text-zinc-700">Environment</span>
                    <span className="font-mono text-zinc-900">Production v2.4</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-100">
                    <span className="font-semibold text-zinc-700">Admin Account</span>
                    <span className="font-mono text-zinc-900">{user.email}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Product Detail Inspector Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white border-l border-zinc-200 h-full p-8 overflow-y-auto flex flex-col justify-between z-10 shadow-2xl"
            >
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-zinc-100">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Product Details</div>
                  <button onClick={() => setSelectedProduct(null)} className="text-zinc-400 hover:text-zinc-900">✕</button>
                </div>

                <div className="mt-6 aspect-video bg-zinc-50 border border-zinc-200 rounded-2xl overflow-hidden flex items-center justify-center p-4">
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Database className="w-12 h-12 text-zinc-300" />
                  )}
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-400">Title</span>
                    <h2 className="text-lg font-bold text-zinc-900">{selectedProduct.name}</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                      <div className="text-zinc-500">SKU</div>
                      <div className="text-zinc-900 font-semibold mt-0.5">{selectedProduct.sku || 'N/A'}</div>
                    </div>
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                      <div className="text-zinc-500">Price</div>
                      <div className="text-zinc-900 font-semibold mt-0.5">${Number(selectedProduct.price).toFixed(2)}</div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-400">Description</span>
                    <p className="text-xs text-zinc-600 leading-relaxed mt-1">
                      {selectedProduct.description || selectedProduct.summary || 'High quality lifestyle product.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-100">
                <EditorialButton variant="secondary" size="md" className="w-full" onClick={() => setSelectedProduct(null)}>
                  Close Inspector
                </EditorialButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
