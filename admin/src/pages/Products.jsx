import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Search, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUploader from '../components/ImageUploader';
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} from '../services/api';
import { formatBDT } from '../utils/helpers';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  compareAtPrice: '',
  category: '',
  availability: 'in_stock',
  stockQuantity: 0,
  tags: '',
  featured: false,
  freeDelivery: false,
  unitType: 'piece',
  minOrder: 1,
  sortOrder: 1,
  productCode: '',
  productSourcing: '',
  images: [{ url: '', type: 'image', isThumbnail: true }],
  specifications: '',
};

const Products = ({ productType = 'general' }) => {
  const isFood = productType === 'food';
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [modal, setModal] = useState(null); // null | 'create' | product
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const PAGE_SIZE = 50;

  const load = async (q = search, pageNum = page) => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        getAdminProducts({
          search: q || undefined,
          limit: PAGE_SIZE,
          page: pageNum,
          type: productType,
        }),
        getCategories({ type: productType }),
      ]);
      setProducts(
        [...(p.data.products || [])].sort(
          (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)
        )
      );
      setPagination(
        p.data.pagination || {
          page: pageNum,
          limit: PAGE_SIZE,
          total: (p.data.products || []).length,
          pages: 1,
        }
      );
      setCategories(c.data.categories);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    load(search, 1);
  }, [productType]);

  const openCreate = () => {
    setForm({
      ...emptyForm,
      category: categories[0]?._id || '',
      unitType: isFood ? 'kg' : 'piece',
      minOrder: isFood ? 0.5 : 1,
      sortOrder: 1,
    });
    setModal('create');
  };

  const openEdit = (product) => {
    const specs = product.specifications
      ? typeof product.specifications === 'object'
        ? Object.entries(
            product.specifications instanceof Map
              ? Object.fromEntries(product.specifications)
              : product.specifications
          )
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n')
        : ''
      : '';
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      compareAtPrice:
        product.compareAtPrice != null && product.compareAtPrice !== ''
          ? product.compareAtPrice
          : '',
      category: product.category?._id || product.category,
      availability: product.availability,
      stockQuantity: product.stockQuantity,
      tags: (product.tags || []).join(', '),
      featured: product.featured,
      freeDelivery: !!product.freeDelivery,
      unitType: product.unitType || 'piece',
      minOrder: product.minOrder ?? 1,
      sortOrder: product.sortOrder ?? 0,
      productCode: product.productCode || '',
      productSourcing: product.productSourcing || '',
      images: product.images?.length
        ? product.images
        : [{ url: '', isThumbnail: true }],
      specifications: specs,
    });
    setModal(product);
  };

  const parseSpecs = (text) => {
    const obj = {};
    text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        const [k, ...rest] = line.split(':');
        if (k && rest.length) obj[k.trim()] = rest.join(':').trim();
      });
    return obj;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        compareAtPrice:
          form.compareAtPrice === '' || form.compareAtPrice == null
            ? null
            : Number(form.compareAtPrice),
        category: form.category,
        availability: form.availability,
        stockQuantity: Number(form.stockQuantity),
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        featured: form.featured,
        freeDelivery: form.freeDelivery,
        productType,
        unitType: form.unitType,
        minOrder: Number(form.minOrder) || 1,
        sortOrder: Number(form.sortOrder) || 0,
        productCode: String(form.productCode || '').trim().toUpperCase(),
        productSourcing: String(form.productSourcing || '').trim(),
        images: form.images.filter((i) => i.url.trim()),
        specifications: parseSpecs(form.specifications),
      };

      if (modal === 'create') {
        await createProduct(payload);
        toast.success('Product created');
      } else {
        await updateProduct(modal._id, payload);
        toast.success('Product updated');
      }
      setModal(null);
      load(search, page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted');
      load(search, page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= products.length) return;
    const next = [...products];
    [next[index], next[target]] = [next[target], next[index]];
    try {
      const base = (pagination.page - 1) * pagination.limit;
      await Promise.all(
        next.map((p, i) => updateProduct(p._id, { sortOrder: base + i + 1 }))
      );
      load(search, page);
    } catch {
      toast.error('Could not reorder');
    }
  };

  const goToPage = (nextPage) => {
    const p = Math.max(1, Math.min(pagination.pages || 1, nextPage));
    setPage(p);
    load(search, p);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">{isFood ? 'Food Products' : 'Products'}</h2>
          <p className="text-sm text-neutral-500">
            {pagination.total} products · lower order number shows first on the store
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> {isFood ? 'Add Food Item' : 'Add Product'}
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setPage(1);
              load(search, 1);
            }
          }}
          placeholder="Search products..."
          className="input-field pl-9"
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr className="text-left text-neutral-500">
              <th className="px-4 py-3 font-medium w-16">Order</th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Min order</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Sourcing</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="px-4 py-12 text-center text-neutral-500">
                  Loading...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-12 text-center text-neutral-500">
                  No products
                </td>
              </tr>
            ) : (
              products.map((p, index) => (
                <tr key={p._id} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        type="button"
                        title="Move up"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                        className="p-1 hover:bg-neutral-100 rounded disabled:opacity-30"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <span className="text-xs font-semibold text-neutral-600">
                        {p.sortOrder ?? index + 1}
                      </span>
                      <button
                        type="button"
                        title="Move down"
                        disabled={index === products.length - 1}
                        onClick={() => move(index, 1)}
                        className="p-1 hover:bg-neutral-100 rounded disabled:opacity-30"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/\.(mp4|webm)(\?|$)/i.test(p.images?.[0]?.url || '') ||
                      p.images?.[0]?.type === 'video' ? (
                        <video
                          src={p.images?.[0]?.url}
                          muted
                          playsInline
                          preload="metadata"
                          className="w-10 h-10 rounded-lg object-cover bg-neutral-100"
                        />
                      ) : (
                        <img
                          src={p.images?.[0]?.url || 'https://placehold.co/60/111/C9A227?text=UC'}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium line-clamp-1">{p.name}</p>
                        <div className="flex gap-2 mt-0.5">
                          {p.featured && (
                            <span className="text-xs text-brand-gold">Featured</span>
                          )}
                          {p.freeDelivery && (
                            <span className="text-xs text-green-600">Free delivery</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.category?.name || '—'}</td>
                  <td className="px-4 py-3 font-medium">
                    {formatBDT(p.price)}
                    {isFood && (
                      <span className="text-xs text-neutral-500"> / {p.unitType || 'piece'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    Min {p.minOrder ?? 1}{' '}
                    {isFood && p.unitType && p.unitType !== 'piece' ? p.unitType : 'pcs'}
                  </td>
                  <td className="px-4 py-3">{p.stockQuantity}</td>
                  <td className="px-4 py-3 capitalize text-xs">{p.availability?.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-xs text-neutral-600 max-w-[140px] truncate" title={p.productSourcing || ''}>
                    {p.productSourcing || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-neutral-100 rounded">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="p-1.5 hover:bg-red-50 text-red-600 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-neutral-500">
            Page {pagination.page} of {pagination.pages} · showing {products.length} of{' '}
            {pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-ghost text-sm disabled:opacity-40"
              disabled={pagination.page <= 1 || loading}
              onClick={() => goToPage(pagination.page - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn-ghost text-sm disabled:opacity-40"
              disabled={pagination.page >= pagination.pages || loading}
              onClick={() => goToPage(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/40">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-xl w-full max-w-2xl my-8 p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {modal === 'create' ? 'Add Product' : 'Edit Product'}
              </h3>
              <button type="button" onClick={() => setModal(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium mb-1 block">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium mb-1 block">Product code</label>
                <input
                  value={form.productCode}
                  onChange={(e) => setForm({ ...form, productCode: e.target.value })}
                  className="input-field font-mono"
                  placeholder="Auto if empty (e.g. SM-ABC12345)"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium mb-1 block">
                  Product sourcing <span className="text-neutral-400 font-normal">(admin only)</span>
                </label>
                <input
                  value={form.productSourcing}
                  onChange={(e) => setForm({ ...form, productSourcing: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Supplier name, market, China, local…"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium mb-1 block">Description</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Price (BDT)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Old / compare-at price{' '}
                  <span className="text-neutral-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.compareAtPrice}
                  onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
                  className="input-field"
                  placeholder="Shown struck through if higher"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Category</label>
                <select
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Display order <span className="text-neutral-400 font-normal">(1 = first)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Availability</label>
                <select
                  value={form.availability}
                  onChange={(e) => setForm({ ...form, availability: e.target.value })}
                  className="input-field"
                >
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="preorder">Pre-order</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={form.stockQuantity}
                  onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                  className="input-field"
                />
              </div>
              {isFood && (
                <div>
                  <label className="text-xs font-medium mb-1 block">Unit Type</label>
                  <select
                    value={form.unitType}
                    onChange={(e) => setForm({ ...form, unitType: e.target.value })}
                    className="input-field"
                  >
                    <option value="piece">Piece</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Minimum order ({isFood ? form.unitType : 'pcs'})
                </label>
                <input
                  type="number"
                  min={isFood ? '0.01' : '1'}
                  step={isFood ? '0.01' : '1'}
                  required
                  value={form.minOrder}
                  onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium mb-1 block">Tags (comma separated)</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="sm:col-span-2 space-y-3">
                <label className="text-xs font-medium block">
                  Product media (paste image/video or pick a file)
                </label>
                {form.images.map((img, i) => (
                  <div key={i} className="border border-neutral-200 rounded-lg p-3 space-y-2">
                    <ImageUploader
                      fit="product"
                      allowUrlPaste={false}
                      allowVideo
                      label={img.url ? 'Replace media' : 'Upload image or video'}
                      value={img.url}
                      onUploaded={(url, meta) => {
                        const images = [...form.images];
                        const type =
                          meta?.type ||
                          (/\.(mp4|webm)(\?|$)/i.test(url) ? 'video' : 'image');
                        images[i] = { ...images[i], url, type };
                        setForm({ ...form, images });
                      }}
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="radio"
                          name="thumb"
                          checked={img.isThumbnail}
                          onChange={() => {
                            const images = form.images.map((im, idx) => ({
                              ...im,
                              isThumbnail: idx === i,
                            }));
                            setForm({ ...form, images });
                          }}
                        />
                        Main thumbnail
                      </label>
                      {form.images.length > 1 && (
                        <button
                          type="button"
                          className="text-xs text-red-600"
                          onClick={() =>
                            setForm({
                              ...form,
                              images: form.images.filter((_, idx) => idx !== i),
                            })
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      images: [...form.images, { url: '', type: 'image', isThumbnail: false }],
                    })
                  }
                  className="text-xs text-brand-gold"
                >
                  + Add another image/video
                </button>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium mb-1 block">
                  Specifications (one per line: Key: Value)
                </label>
                <textarea
                  rows={3}
                  value={form.specifications}
                  onChange={(e) => setForm({ ...form, specifications: e.target.value })}
                  className="input-field resize-none font-mono text-xs"
                  placeholder="Material: Leather"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                />
                Featured Product
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.freeDelivery}
                  onChange={(e) => setForm({ ...form, freeDelivery: e.target.checked })}
                />
                Free delivery for this product
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModal(null)} className="btn-ghost">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Products;
