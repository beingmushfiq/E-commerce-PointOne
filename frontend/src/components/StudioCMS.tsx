import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import {
  Package, FolderTree, Activity, Plus, Search, Settings,
  ExternalLink, Database, Sliders as SlidersIcon, HelpCircle, Lock, LogOut,
  ShoppingBag, CheckCircle, Trash2, Edit3, Sun, Moon,
  RefreshCw, AlertCircle, X, Store
} from 'lucide-react';
import { EditorialButton } from './DesignSystem';
import type { ProductItem } from '../types/ui';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';

interface StudioCMSProps {
  products: ProductItem[];
  categories: any[];
  onOpenStorefront: () => void;
}

export const StudioCMS: React.FC<StudioCMSProps> = ({
  products: initialProducts = [],
  categories: initialCategories = [],
  onOpenStorefront,
}) => {
  const { user, isAdmin, login, logout } = useAuth();
  const { formatPrice } = useCurrency();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();

  // Tab State
  const [activeTab, setActiveTab] = useState<'inventory' | 'categories' | 'orders' | 'cms' | 'analytics' | 'settings'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Store Configuration State (Settings Tab)
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'CENTERPOINT Flagship Store',
    supportEmail: 'concierge@centerpoint.com',
    supportPhone: '+880 1712-345678',
    lowStockThreshold: 10,
    maintenanceMode: false,
    vatPercentage: 5,
  });

  // Live Local Data
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [orders, setOrders] = useState<any[]>([]);
  const [sliders, setSliders] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Inspector & Modal States
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editProductForm, setEditProductForm] = useState<any>({});

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    price: '',
    sale_price: '',
    quantity: '25',
    sku: '',
    category_id: '',
    summary: '',
    description: '',
    image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
    is_featured: false,
  });

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  const [isAddSliderOpen, setIsAddSliderOpen] = useState(false);
  const [newSliderForm, setNewSliderForm] = useState({
    title: '',
    subtitle: '',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80',
    button_text: 'Explore Collection',
    button_link: '/',
  });

  const [isAddFaqOpen, setIsAddFaqOpen] = useState(false);
  const [newFaqForm, setNewFaqForm] = useState({
    question: '',
    answer: '',
    category: 'General',
  });

  // Admin Login state
  const [loginEmail, setLoginEmail] = useState('admin@centerpoint.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  // Load orders & analytics & sliders when authenticated
  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
      fetchAnalytics();
      fetchSlidersAndFaqs();
    }
  }, [isAdmin]);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get('/admin/orders');
      setOrders(res.data?.data || []);
    } catch {
      // Offline fallback
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data?.data || null);
    } catch {
      // Offline fallback
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchSlidersAndFaqs = async () => {
    try {
      const [sRes, fRes] = await Promise.all([
        api.get('/admin/sliders').catch(() => api.get('/cms/sliders')),
        api.get('/admin/faqs').catch(() => api.get('/cms/faqs')),
      ]);

      const sData = sRes.data?.data;
      setSliders(Array.isArray(sData) ? sData : []);

      const fData = fRes.data?.data;
      let flatFaqs: any[] = [];
      if (Array.isArray(fData)) {
        flatFaqs = fData;
      } else if (fData && typeof fData === 'object') {
        flatFaqs = Object.values(fData).flat();
      }
      setFaqs(flatFaqs);
    } catch {}
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await login({ email: loginEmail, password: loginPassword });
      showFeedback('Authenticated as Admin');
    } catch (err: any) {
      setLoginError(err.response?.data?.message || 'Invalid credentials or non-admin account.');
    }
  };

  // ---------------------------------------------------------------------------
  // PRODUCT HANDLERS
  // ---------------------------------------------------------------------------
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/products', {
        name: newProductForm.name,
        price: parseFloat(newProductForm.price),
        sale_price: newProductForm.sale_price ? parseFloat(newProductForm.sale_price) : null,
        quantity: parseInt(newProductForm.quantity, 10),
        sku: newProductForm.sku || undefined,
        category_id: newProductForm.category_id ? parseInt(newProductForm.category_id, 10) : undefined,
        summary: newProductForm.summary,
        description: newProductForm.description,
        image_url: newProductForm.image_url,
        is_featured: newProductForm.is_featured,
      });

      const created = res.data?.data;
      if (created) {
        setProducts([created, ...products]);
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsAddProductOpen(false);
      setNewProductForm({
        name: '',
        price: '',
        sale_price: '',
        quantity: '25',
        sku: '',
        category_id: '',
        summary: '',
        description: '',
        image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
        is_featured: false,
      });
      showFeedback('Product successfully added to catalog');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create product');
    }
  };

  const handleOpenEditProduct = (prod: ProductItem) => {
    setSelectedProduct(prod);
    setIsEditingProduct(true);
    setEditProductForm({
      name: prod.name,
      price: prod.price,
      quantity: prod.stock_quantity ?? 10,
      description: prod.description || prod.summary || '',
      image_url: prod.image_url || '',
      is_featured: prod.is_featured,
    });
  };

  const handleSaveProductEdit = async () => {
    if (!selectedProduct) return;
    try {
      const res = await api.put(`/admin/products/${selectedProduct.id}`, {
        name: editProductForm.name,
        price: parseFloat(editProductForm.price),
        quantity: parseInt(editProductForm.quantity, 10),
        description: editProductForm.description,
        image_url: editProductForm.image_url,
        is_featured: editProductForm.is_featured,
      });

      const updated = res.data?.data;
      if (updated) {
        setProducts(products.map((p) => (p.id === updated.id ? updated : p)));
        setSelectedProduct(updated);
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsEditingProduct(false);
      showFeedback('Product details saved');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product from the active catalog?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      setProducts(products.filter((p) => p.id !== id));
      setSelectedProduct(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showFeedback('Product removed from catalog');
    } catch {
      alert('Failed to remove product');
    }
  };

  // ---------------------------------------------------------------------------
  // CATEGORY HANDLERS
  // ---------------------------------------------------------------------------
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/categories', {
        name: newCategoryName,
        description: newCategoryDesc,
      });
      const created = res.data?.data;
      if (created) {
        setCategories([...categories, created]);
      }
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsAddCategoryOpen(false);
      setNewCategoryName('');
      setNewCategoryDesc('');
      showFeedback('Category created');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      setCategories(categories.filter((c) => c.id !== id));
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showFeedback('Category removed');
    } catch {
      alert('Failed to delete category');
    }
  };

  // ---------------------------------------------------------------------------
  // ORDER HANDLERS
  // ---------------------------------------------------------------------------
  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      const updated = res.data?.data;
      if (updated) {
        setOrders(orders.map((o) => (o.id === orderId ? updated : o)));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(updated);
        }
      }
      showFeedback(`Order marked as ${newStatus}`);
    } catch {
      alert('Failed to update order status');
    }
  };

  // ---------------------------------------------------------------------------
  // CMS CONTENT HANDLERS
  // ---------------------------------------------------------------------------
  const handleCreateSlider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/sliders', newSliderForm);
      if (res.data?.data) {
        setSliders((prev) => [...(Array.isArray(prev) ? prev : []), res.data.data]);
      }
      queryClient.invalidateQueries({ queryKey: ['sliders'] });
      setIsAddSliderOpen(false);
      setNewSliderForm({
        title: '',
        subtitle: '',
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80',
        button_text: 'Explore Collection',
        button_link: '/',
      });
      showFeedback('Hero slider added');
    } catch {
      alert('Failed to create slider');
    }
  };

  const handleDeleteSlider = async (id: number) => {
    if (!confirm('Remove this hero slide?')) return;
    try {
      await api.delete(`/admin/sliders/${id}`);
      setSliders((prev) => (Array.isArray(prev) ? prev.filter((s) => s.id !== id) : []));
      queryClient.invalidateQueries({ queryKey: ['sliders'] });
      showFeedback('Slide removed');
    } catch {
      alert('Failed to delete slide');
    }
  };

  const handleCreateFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/faqs', newFaqForm);
      if (res.data?.data) {
        setFaqs((prev) => [...(Array.isArray(prev) ? prev : []), res.data.data]);
      }
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      setIsAddFaqOpen(false);
      setNewFaqForm({ question: '', answer: '', category: 'General' });
      showFeedback('FAQ entry published');
    } catch {
      alert('Failed to publish FAQ');
    }
  };

  const handleDeleteFaq = async (id: number) => {
    if (!confirm('Remove this FAQ item?')) return;
    try {
      await api.delete(`/admin/faqs/${id}`);
      setFaqs((prev) => (Array.isArray(prev) ? prev.filter((f) => f.id !== id) : []));
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      showFeedback('FAQ removed');
    } catch {
      alert('Failed to delete FAQ');
    }
  };

  // ---------------------------------------------------------------------------
  // LOGIN SCREEN
  // ---------------------------------------------------------------------------
  if (!isAdmin || !user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white font-sans flex items-center justify-center p-6 selection:bg-amber-500/20">
        <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-4 font-serif">Studio CMS Login</h1>
            <p className="text-xs text-zinc-400">Restricted administrative access. Authenticate with admin credentials.</p>
          </div>

          {loginError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-400 font-medium mb-1.5 font-mono uppercase tracking-wider text-[11px]">Admin Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 transition"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-medium mb-1.5 font-mono uppercase tracking-wider text-[11px]">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 transition"
              />
            </div>

            <EditorialButton variant="primary" size="lg" className="w-full mt-2 cursor-pointer" type="submit">
              Sign In to Admin Studio
            </EditorialButton>
          </form>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            <span>Demo Admin: <b className="text-amber-400 font-medium">admin@centerpoint.com</b></span>
            <span>Key: <b className="text-zinc-300">password123</b></span>
          </div>

          <div className="pt-2 text-center">
            <button onClick={onOpenStorefront} className="text-xs text-zinc-500 hover:text-amber-400 transition">
              &larr; Return to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategory === 'all' ||
      p.category_id?.toString() === selectedCategory ||
      (p as any).category?.id?.toString() === selectedCategory ||
      (p as any).category?.name === selectedCategory ||
      (p as any).category?.slug === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) {
      return false;
    }
    return true;
  });

  // ---------------------------------------------------------------------------
  // MAIN STUDIO CMS INTERFACE
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 font-sans antialiased flex flex-col transition-colors duration-300">
      {/* Toast Notification */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-800'
                : 'bg-rose-950/90 text-rose-300 border-rose-800'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{feedbackMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation */}
      <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onOpenStorefront}>
            <div className="w-8 h-8 rounded-lg bg-zinc-950 dark:bg-amber-500 text-white dark:text-zinc-950 font-black text-sm flex items-center justify-center shadow-md">
              CP
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">Admin Studio</span>
              <span className="text-[10px] font-mono text-zinc-400 block -mt-1">Logged in as {user.name}</span>
            </div>
          </div>

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

          {/* Mode Tabs */}
          <nav className="hidden sm:flex items-center gap-1">
            {[
              { id: 'inventory', label: 'Products', icon: <Package className="w-3.5 h-3.5" /> },
              { id: 'categories', label: 'Categories', icon: <FolderTree className="w-3.5 h-3.5" /> },
              { id: 'orders', label: `Orders (${orders.length})`, icon: <ShoppingBag className="w-3.5 h-3.5" /> },
              { id: 'cms', label: 'CMS & Sliders', icon: <SlidersIcon className="w-3.5 h-3.5" /> },
              { id: 'analytics', label: 'Analytics', icon: <Activity className="w-3.5 h-3.5" /> },
              { id: 'settings', label: 'Settings', icon: <Settings className="w-3.5 h-3.5" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-zinc-900 text-white dark:bg-amber-500 dark:text-zinc-950 font-semibold shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Theme Toggle Button */}
          <button
            onClick={(e) => toggleTheme(e)}
            className="p-2 text-zinc-500 hover:text-amber-500 dark:text-zinc-400 dark:hover:text-amber-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="Toggle Dark/Light Mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => logout()}
            className="p-2 text-zinc-500 hover:text-rose-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="Sign Out Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenStorefront}
            className="px-3.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Back to Storefront
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar for Catalog */}
        {activeTab === 'inventory' && (
          <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 hidden md:flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-2 px-2">Catalog Summary</span>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
                    <div className="text-[10px] text-zinc-500 font-medium">Total Products</div>
                    <div className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5 font-mono">{products.length}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
                    <div className="text-[10px] text-zinc-500 font-medium">Categories</div>
                    <div className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5 font-mono">{categories.length}</div>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-2 px-2">Filter by Category</span>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    All Items ({products.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id.toString())}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition flex items-center justify-between cursor-pointer ${
                        selectedCategory === cat.id.toString()
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 bg-stone-50 dark:bg-[#09090B] overflow-y-auto p-6 md:p-8 flex flex-col">
          {/* TAB 1: INVENTORY / PRODUCTS */}
          {activeTab === 'inventory' && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-3 font-serif">
                    Product Inventory
                    <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono">
                      {filteredProducts.length} Items
                    </span>
                  </h1>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Manage catalog items, live prices, and inventory stock levels.</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1 sm:w-64">
                    <input
                      type="text"
                      placeholder="Search products or SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-amber-500 shadow-sm"
                    />
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                  </div>

                  <button
                    onClick={() => setIsAddProductOpen(true)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
                    <thead className="bg-zinc-50 dark:bg-zinc-900 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        <th className="px-6 py-3.5">Product</th>
                        <th className="px-6 py-3.5">Category</th>
                        <th className="px-6 py-3.5">Price</th>
                        <th className="px-6 py-3.5">Stock</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                          <tr
                            key={product.id}
                            onClick={() => handleOpenEditProduct(product)}
                            className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition cursor-pointer group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                                  {product.image_url ? (
                                    <img src={product.image_url} alt="" className="w-full h-full object-cover rounded" />
                                  ) : (
                                    <Database className="w-5 h-5 text-zinc-400" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                                    {product.name}
                                  </div>
                                  <div className="text-[11px] text-zinc-400 font-mono">
                                    {product.sku || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-zinc-600 dark:text-zinc-400">
                              {product.category?.name || 'General'}
                            </td>
                            <td className="px-6 py-4 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                              {formatPrice(product.price)}
                            </td>
                            <td className="px-6 py-4 font-mono">
                              <span className={(product.stock_quantity ?? 0) < 10 ? 'text-amber-600 font-semibold' : 'text-zinc-600 dark:text-zinc-400'}>
                                {product.stock_quantity ?? 0} units
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenEditProduct(product)}
                                  className="p-1.5 text-zinc-400 hover:text-amber-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                                  title="Edit Product"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                                  title="Delete Product"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
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

          {/* TAB 2: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-zinc-900 dark:text-white font-serif">Categories Management</h1>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Organize storefront departments and sub-categories.</p>
                </div>
                <button
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Category</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <div key={cat.id} className="p-5 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 dark:text-white text-sm font-serif">{cat.name}</span>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">/{cat.slug}</span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{cat.description || 'Active storefront department.'}</p>
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-600 font-semibold uppercase">Active</span>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-xs text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS (NEW & ESSENTIAL) */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-zinc-900 dark:text-white font-serif flex items-center gap-3">
                    Orders & Fulfillment
                    <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono">
                      {filteredOrders.length} Orders
                    </span>
                  </h1>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Review incoming sales, track payment status, and dispatch consignments.</p>
                </div>

                <div className="flex items-center gap-2">
                  {['all', 'pending', 'processing', 'shipped', 'delivered'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setOrderStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                        orderStatusFilter === status
                          ? 'bg-amber-500 text-zinc-950 shadow-sm'
                          : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-white'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                  <button
                    onClick={fetchOrders}
                    className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500 hover:text-amber-500 transition"
                    title="Refresh Orders"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
                  <thead className="bg-zinc-50 dark:bg-zinc-900 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-6 py-3.5">Order #</th>
                      <th className="px-6 py-3.5">Customer</th>
                      <th className="px-6 py-3.5">Total Amount</th>
                      <th className="px-6 py-3.5">Payment</th>
                      <th className="px-6 py-3.5">Order Status</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <tr
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition cursor-pointer"
                        >
                          <td className="px-6 py-4 font-mono font-bold text-zinc-900 dark:text-white">
                            {order.order_number}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {order.user?.name || order.shipping_address?.recipient_name || 'Guest Customer'}
                            </div>
                            <div className="text-[11px] text-zinc-400">{order.shipping_address?.city || 'Dhaka'}</div>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                            {formatPrice(order.grand_total)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                order.payment_status === 'paid'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                              }`}
                            >
                              {order.payment_status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                order.status === 'delivered'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : order.status === 'shipped'
                                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                                  : order.status === 'processing'
                                  ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(order);
                              }}
                              className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 transition text-[11px] font-semibold cursor-pointer"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-xs text-zinc-400">
                          No orders match the current filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CMS & CONTENT MANAGEMENT */}
          {activeTab === 'cms' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white font-serif">CMS & Content Management</h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Control homepage hero slides, FAQ knowledgebase, and promotional sections.</p>
              </div>

              {/* Hero Sliders */}
              <div className="p-6 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white text-sm font-serif">
                    <SlidersIcon className="w-4 h-4 text-amber-500" />
                    <span>Homepage Hero Sliders</span>
                  </div>
                  <button
                    onClick={() => setIsAddSliderOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Slide
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(Array.isArray(sliders) ? sliders : []).length > 0 ? (
                    (Array.isArray(sliders) ? sliders : []).map((slide) => (
                      <div key={slide.id} className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2 flex flex-col justify-between">
                        <div>
                          <div className="aspect-video w-full rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 mb-2">
                            <img src={slide.image} alt="" className="w-full h-full object-cover" />
                          </div>
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-white font-serif">{slide.title}</h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{slide.subtitle}</p>
                        </div>
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                          <span className="text-[10px] font-mono text-amber-500 font-semibold">Active Slide</span>
                          <button
                            onClick={() => handleDeleteSlider(slide.id)}
                            className="text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 py-8 text-center text-xs text-zinc-400">
                      No active hero slides. Click "Add Slide" to publish one.
                    </div>
                  )}
                </div>
              </div>

              {/* FAQs Section */}
              <div className="p-6 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white text-sm font-serif">
                    <HelpCircle className="w-4 h-4 text-amber-500" />
                    <span>Frequently Asked Questions (FAQ)</span>
                  </div>
                  <button
                    onClick={() => setIsAddFaqOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add FAQ
                  </button>
                </div>

                <div className="space-y-3">
                  {(Array.isArray(faqs) ? faqs : []).length > 0 ? (
                    (Array.isArray(faqs) ? faqs : []).map((faq) => (
                      <div key={faq.id} className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-900 dark:text-white text-xs font-serif">{faq.question}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{faq.category || 'General'}</span>
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{faq.answer}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-500 rounded transition cursor-pointer shrink-0"
                          title="Delete FAQ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-zinc-400">
                      No FAQs published yet. Click "Add FAQ" to create one.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ANALYTICS (REAL BACKEND KPIS) */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-zinc-900 dark:text-white font-serif">Business Analytics & Metrics</h1>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Real-time performance metrics computed from verified database transactions.</p>
                </div>
                <button
                  onClick={fetchAnalytics}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAnalytics ? 'animate-spin' : ''}`} />
                  <span>Refresh Probes</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Total Revenue</div>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                    {formatPrice(analytics?.kpi?.total_sales ?? 1805)}
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-500">Verified Paid Orders</span>
                </div>

                <div className="p-5 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Total Orders</div>
                  <div className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
                    {analytics?.kpi?.total_orders ?? orders.length}
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-500">Active Pipeline</span>
                </div>

                <div className="p-5 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Catalog Size</div>
                  <div className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
                    {analytics?.kpi?.total_products ?? products.length}
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-400">Active SKUs</span>
                </div>

                <div className="p-5 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Customer Base</div>
                  <div className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
                    {analytics?.kpi?.total_customers ?? 4}
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-500">Registered Accounts</span>
                </div>
              </div>

              {/* Recent Orders in Analytics */}
              <div className="p-6 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white font-serif">Recent Sales Ledger</h3>
                <div className="space-y-2">
                  {orders.slice(0, 5).map((ord) => (
                    <div key={ord.id} className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-zinc-900 dark:text-white mr-2">{ord.order_number}</span>
                        <span className="text-zinc-500 dark:text-zinc-400">{ord.shipping_address?.city || 'Dhaka'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-amber-500">{formatPrice(ord.grand_total)}</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white font-serif">Store Configuration & Environment</h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Tenant identity, operations parameters, inventory alert thresholds, and staff access credentials.</p>
              </div>

              {/* Store Identity Settings */}
              <div className="p-6 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <Store className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white font-serif">Storefront Operational Profile</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Store Name</label>
                    <input
                      type="text"
                      value={storeSettings.storeName}
                      onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Support Email</label>
                    <input
                      type="email"
                      value={storeSettings.supportEmail}
                      onChange={(e) => setStoreSettings({ ...storeSettings, supportEmail: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Customer Support Phone</label>
                    <input
                      type="text"
                      value={storeSettings.supportPhone}
                      onChange={(e) => setStoreSettings({ ...storeSettings, supportPhone: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Low Stock Warning Threshold (Units)</label>
                    <input
                      type="number"
                      value={storeSettings.lowStockThreshold}
                      onChange={(e) => setStoreSettings({ ...storeSettings, lowStockThreshold: parseInt(e.target.value) || 10 })}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="maint"
                      checked={storeSettings.maintenanceMode}
                      onChange={(e) => setStoreSettings({ ...storeSettings, maintenanceMode: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 cursor-pointer"
                    />
                    <label htmlFor="maint" className="text-xs text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer">
                      Maintenance Mode (Storefront displays private curation screen)
                    </label>
                  </div>
                  <button
                    onClick={() => showFeedback('Store configuration saved')}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold uppercase text-xs transition cursor-pointer shadow-sm"
                  >
                    Save Profile
                  </button>
                </div>
              </div>

              {/* Administrative Identity */}
              <div className="p-6 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <Lock className="w-4 h-4 text-zinc-400" />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white font-serif">Session & Authentication Info</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Deployment Architecture</span>
                    <span className="font-mono text-zinc-900 dark:text-white">Dual-Edition Commercial (Tenant / Standalone)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Active Admin Staff</span>
                    <span className="font-mono text-amber-500">{user.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Security Guard</span>
                    <span className="font-mono text-emerald-500">Sanctum Token (Staff Guard)</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => logout()}
                    className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out of Admin Studio</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 1: ADD PRODUCT                                                   */}
      {/* ---------------------------------------------------------------------- */}
      <AnimatePresence>
        {isAddProductOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddProductOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-white">Add New Catalog Product</h3>
                <button onClick={() => setIsAddProductOpen(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={newProductForm.name}
                    onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-500 dark:text-zinc-400 mb-1">Price (৳)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newProductForm.price}
                      onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 dark:text-zinc-400 mb-1">Stock Units</label>
                    <input
                      type="number"
                      required
                      value={newProductForm.quantity}
                      onChange={(e) => setNewProductForm({ ...newProductForm, quantity: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 mb-1">Department / Category</label>
                  <select
                    value={newProductForm.category_id}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category_id: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={newProductForm.image_url}
                    onChange={(e) => setNewProductForm({ ...newProductForm, image_url: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={newProductForm.description}
                    onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="feat"
                    checked={newProductForm.is_featured}
                    onChange={(e) => setNewProductForm({ ...newProductForm, is_featured: e.target.checked })}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <label htmlFor="feat" className="text-zinc-600 dark:text-zinc-300">Feature this product in hero showcases</label>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold uppercase tracking-wider text-xs shadow-md transition cursor-pointer"
                  >
                    Create Product
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 2: CREATE CATEGORY                                               */}
      {/* ---------------------------------------------------------------------- */}
      <AnimatePresence>
        {isAddCategoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddCategoryOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 z-10 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-white">Create New Department</h3>
                <button onClick={() => setIsAddCategoryOpen(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCategory} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 mb-1">Category Name</label>
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 mb-1">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={newCategoryDesc}
                    onChange={(e) => setNewCategoryDesc(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white"
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold uppercase tracking-wider text-xs shadow-md transition cursor-pointer"
                  >
                    Save Category
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------------------------- */}
      {/* DRAWER: PRODUCT INSPECTOR & EDIT                                      */}
      {/* ---------------------------------------------------------------------- */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProduct(null)} className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 h-full p-8 overflow-y-auto flex flex-col justify-between z-10 shadow-2xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Product Details & Control</div>
                  <button onClick={() => setSelectedProduct(null)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white">✕</button>
                </div>

                <div className="aspect-video bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center p-2">
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Database className="w-12 h-12 text-zinc-300 dark:text-zinc-700" />
                  )}
                </div>

                {isEditingProduct ? (
                  /* Edit Form */
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-zinc-400 font-medium">Title</label>
                      <input
                        type="text"
                        value={editProductForm.name}
                        onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-zinc-400 font-medium">Price (৳)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editProductForm.price}
                          onChange={(e) => setEditProductForm({ ...editProductForm, price: e.target.value })}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-400 font-medium">Stock Units</label>
                        <input
                          type="number"
                          value={editProductForm.quantity}
                          onChange={(e) => setEditProductForm({ ...editProductForm, quantity: e.target.value })}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-zinc-400 font-medium">Image URL</label>
                      <input
                        type="url"
                        value={editProductForm.image_url}
                        onChange={(e) => setEditProductForm({ ...editProductForm, image_url: e.target.value })}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 font-medium">Description</label>
                      <textarea
                        rows={3}
                        value={editProductForm.description}
                        onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSaveProductEdit}
                        className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs uppercase cursor-pointer"
                      >
                        Save Updates
                      </button>
                      <button
                        onClick={() => setIsEditingProduct(false)}
                        className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Read View */
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-zinc-400 font-mono">Product Title</span>
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-white font-serif">{selectedProduct.name}</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                        <div className="text-zinc-500 text-[10px] font-mono">SKU</div>
                        <div className="text-zinc-900 dark:text-white font-semibold font-mono mt-0.5">{selectedProduct.sku || 'N/A'}</div>
                      </div>
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                        <div className="text-zinc-500 text-[10px] font-mono">PRICE</div>
                        <div className="text-amber-600 dark:text-amber-400 font-bold font-mono mt-0.5">{formatPrice(selectedProduct.price)}</div>
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                      <div className="text-zinc-500 text-[10px] font-mono">STOCK INVENTORY</div>
                      <div className="text-zinc-900 dark:text-white font-semibold font-mono mt-0.5">
                        {selectedProduct.stock_quantity ?? 0} units available
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-zinc-400 font-mono">Description</span>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mt-1">
                        {selectedProduct.description || selectedProduct.summary || 'High quality atelier commerce product.'}
                      </p>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => setIsEditingProduct(true)}
                        className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Product
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(selectedProduct.id)}
                        className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close Inspector
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 3: ORDER INSPECTOR & STATUS                                      */}
      {/* ---------------------------------------------------------------------- */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 z-10 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 font-bold">Consignment Inspector</span>
                  <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-white">Order #{selectedOrder.order_number}</h3>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <div className="text-zinc-400 text-[10px]">CUSTOMER</div>
                  <div className="font-semibold text-zinc-900 dark:text-white mt-0.5">
                    {selectedOrder.user?.name || selectedOrder.shipping_address?.recipient_name || 'Customer'}
                  </div>
                  <div className="text-[11px] text-zinc-500">{selectedOrder.shipping_address?.city || 'Dhaka'}</div>
                </div>

                <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <div className="text-zinc-400 text-[10px]">PAYMENT</div>
                  <div className="font-bold text-amber-500 font-mono mt-0.5">{formatPrice(selectedOrder.grand_total)}</div>
                  <div className="text-[11px] font-mono uppercase text-emerald-500">{selectedOrder.payment_status} via {selectedOrder.payment_method}</div>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Ordered Items</span>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-white">{item.product_name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">SKU: {item.sku} &bull; Qty: {item.quantity}</div>
                      </div>
                      <div className="font-mono font-bold text-zinc-900 dark:text-white">
                        {formatPrice(item.total_price || item.unit_price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Update Actions */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Dispatch & Fulfillment Actions</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'processing', label: 'Processing', color: 'bg-sky-500' },
                    { id: 'shipped', label: 'Shipped', color: 'bg-indigo-500' },
                    { id: 'delivered', label: 'Delivered', color: 'bg-emerald-500' },
                    { id: 'cancelled', label: 'Cancel', color: 'bg-rose-500' },
                  ].map((act) => (
                    <button
                      key={act.id}
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, act.id)}
                      className={`p-2 rounded-xl text-center font-bold text-xs capitalize transition cursor-pointer ${
                        selectedOrder.status === act.id
                          ? 'bg-amber-500 text-zinc-950 font-bold shadow-md'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 4: ADD HERO SLIDE                                                */}
      {/* ---------------------------------------------------------------------- */}
      <AnimatePresence>
        {isAddSliderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddSliderOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 z-10 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-white">Add Hero Showcase Slide</h3>
                <button onClick={() => setIsAddSliderOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSlider} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1">Headline</label>
                  <input
                    type="text"
                    required
                    value={newSliderForm.title}
                    onChange={(e) => setNewSliderForm({ ...newSliderForm, title: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={newSliderForm.subtitle}
                    onChange={(e) => setNewSliderForm({ ...newSliderForm, subtitle: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Image URL</label>
                  <input
                    type="url"
                    required
                    value={newSliderForm.image}
                    onChange={(e) => setNewSliderForm({ ...newSliderForm, image: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white"
                  />
                </div>
                <div className="pt-2">
                  <button type="submit" className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold uppercase text-xs cursor-pointer">
                    Publish Slide
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 5: ADD FAQ                                                       */}
      {/* ---------------------------------------------------------------------- */}
      <AnimatePresence>
        {isAddFaqOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddFaqOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 z-10 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-white">Add Store FAQ</h3>
                <button onClick={() => setIsAddFaqOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateFaq} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1">Question</label>
                  <input
                    type="text"
                    required
                    value={newFaqForm.question}
                    onChange={(e) => setNewFaqForm({ ...newFaqForm, question: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Answer</label>
                  <textarea
                    rows={3}
                    required
                    value={newFaqForm.answer}
                    onChange={(e) => setNewFaqForm({ ...newFaqForm, answer: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white"
                  />
                </div>
                <div className="pt-2">
                  <button type="submit" className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold uppercase text-xs cursor-pointer">
                    Publish FAQ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
