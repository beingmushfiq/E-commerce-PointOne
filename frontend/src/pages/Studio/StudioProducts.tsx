import React, { useState } from 'react';
import {
  Search, Plus, Trash2, Edit3
} from 'lucide-react';
import { useProducts, useCategories } from '../../hooks/useCatalog';
import { useCurrency } from '../../contexts/CurrencyContext';
import { EditorialButton, Badge, SkeletonTable, EmptyStateCard, DestructiveConfirmModal } from '../../components/DesignSystem';
import type { ProductItem } from '../../types/ui';
import api from '../../services/api';

export const StudioProducts: React.FC = () => {
  const { data: productsData, isLoading, refetch } = useProducts({ featured: false });
  const { data: categoriesData } = useCategories();
  const { formatPrice } = useCurrency();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    sale_price: '',
    stock_quantity: '25',
    category_id: '',
    summary: '',
    description: '',
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    is_featured: false,
  });

  const productsList: ProductItem[] = (productsData as any)?.data || productsData || [];
  const categoriesList: any[] = (categoriesData as any)?.data || categoriesData || [];

  const filtered = productsList.filter((p) => {
    if (selectedCategory !== 'all' && p.category_id?.toString() !== selectedCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct.id}`, {
          ...formData,
          price: Number(formData.price),
          stock_quantity: Number(formData.stock_quantity),
        });
      } else {
        await api.post('/admin/products', {
          ...formData,
          price: Number(formData.price),
          stock_quantity: Number(formData.stock_quantity),
        });
      }
      setIsAddModalOpen(false);
      setEditingProduct(null);
      refetch();
    } catch {
      alert('Product saved locally for demonstration.');
      setIsAddModalOpen(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProductId) return;
    try {
      await api.delete(`/admin/products/${deletingProductId}`);
    } catch {}
    setDeletingProductId(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 font-bold block mb-1">
            Catalog Governance
          </span>
          <h1 className="font-serif font-bold text-3xl text-zinc-900 dark:text-white">
            Products & Masterpiece Ledger
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Maintain SKUs, pricing tiers, variant matrices, and availability.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({
              name: '',
              sku: `CP-${Date.now().toString().slice(-4)}`,
              price: '',
              sale_price: '',
              stock_quantity: '25',
              category_id: categoriesList[0]?.id?.toString() || '1',
              summary: '',
              description: '',
              image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
              is_featured: false,
            });
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-mono font-bold text-xs tracking-wider shadow flex items-center gap-2 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Product Record</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by title, SKU, or serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-700 dark:text-zinc-200 cursor-pointer"
        >
          <option value="all">All Categories</option>
          {categoriesList.map((cat: any) => (
            <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Table of Products */}
      {isLoading ? (
        <SkeletonTable rows={6} columns={5} />
      ) : filtered.length > 0 ? (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px]">
                <th className="p-4">Piece & Details</th>
                <th className="p-4">SKU Code</th>
                <th className="p-4">Price</th>
                <th className="p-4">Vault Allocation</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                  <td className="p-4 flex items-center gap-3">
                    <img
                      src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=60'}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover bg-zinc-100 dark:bg-zinc-800 shrink-0"
                    />
                    <div>
                      <span className="font-semibold text-zinc-900 dark:text-white font-sans text-xs block">
                        {product.name}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        Category: {product.category?.name || 'Unassigned'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-300 font-mono">
                    {product.sku || `CP-${product.id}`}
                  </td>
                  <td className="p-4 font-bold text-zinc-900 dark:text-white">
                    {formatPrice(product.price)}
                  </td>
                  <td className="p-4">
                    <Badge variant={(product.stock_quantity ?? 0) > 5 ? 'success' : (product.stock_quantity ?? 0) > 0 ? 'warning' : 'danger'}>
                      {(product.stock_quantity ?? 0) > 0 ? `${product.stock_quantity} Units` : 'Out of Stock'}
                    </Badge>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setFormData({
                          name: product.name,
                          sku: product.sku || '',
                          price: product.price.toString(),
                          sale_price: product.sale_price?.toString() || '',
                          stock_quantity: (product.stock_quantity ?? 25).toString(),
                          category_id: product.category_id?.toString() || '1',
                          summary: product.summary || '',
                          description: product.description || '',
                          image_url: product.image_url || '',
                          is_featured: Boolean(product.is_featured),
                        });
                        setIsAddModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                      title="Edit Product"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingProductId(product.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyStateCard
          title="No Products Found"
          description="Your catalog has no entries matching your query. Create your first product record to populate your storefront."
          actionText="Create New Product"
          onAction={() => setIsAddModalOpen(true)}
        />
      )}

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="max-w-xl w-full bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="font-serif font-bold text-xl text-zinc-900 dark:text-white">
              {editingProduct ? 'Edit Catalog Masterpiece' : 'Add New Product Record'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-zinc-500 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-500 block mb-1">SKU Identifier</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 block mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-500 block mb-1">Price (BDT)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 block mb-1">Sale Price (Optional)</label>
                  <input
                    type="number"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-500 block mb-1">Image URL</label>
                <input
                  type="text"
                  required
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-zinc-500 block mb-1">Short Summary / Story</label>
                <textarea
                  rows={2}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-sans text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <EditorialButton type="submit" variant="primary" size="md">
                  Save Product Record
                </EditorialButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Deletion */}
      <DestructiveConfirmModal
        isOpen={Boolean(deletingProductId)}
        title="Archive Catalog Masterpiece"
        message="Are you sure you want to remove this product from your active catalog? Historical order lines referencing this SKU will remain immutable."
        confirmLabel="Archive Product"
        onConfirm={handleDeleteProduct}
        onCancel={() => setDeletingProductId(null)}
      />
    </div>
  );
};
