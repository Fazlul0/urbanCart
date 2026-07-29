import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
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
  category: '',
  availability: 'in_stock',
  stockQuantity: 0,
  tags: '',
  featured: false,
  images: [{ url: '', isThumbnail: true }],
  specifications: '',
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | product
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async (q = search) => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        getAdminProducts({ search: q || undefined, limit: 50 }),
        getCategories(),
      ]);
      setProducts(p.data.products);
      setCategories(c.data.categories);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm({ ...emptyForm, category: categories[0]?._id || '' });
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
      category: product.category?._id || product.category,
      availability: product.availability,
      stockQuantity: product.stockQuantity,
      tags: (product.tags || []).join(', '),
      featured: product.featured,
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
        category: form.category,
        availability: form.availability,
        stockQuantity: Number(form.stockQuantity),
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        featured: form.featured,
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
      load();
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
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Products</h2>
          <p className="text-sm text-neutral-500">{products.length} products</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(search)}
          placeholder="Search products..."
          className="input-field pl-9"
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr className="text-left text-neutral-500">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-neutral-500">
                  Loading...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-neutral-500">
                  No products
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p._id} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.images?.[0]?.url || 'https://placehold.co/60/111/C9A227?text=UC'}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium line-clamp-1">{p.name}</p>
                        {p.featured && (
                          <span className="text-xs text-brand-gold">Featured</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.category?.name || '—'}</td>
                  <td className="px-4 py-3 font-medium">{formatBDT(p.price)}</td>
                  <td className="px-4 py-3">{p.stockQuantity}</td>
                  <td className="px-4 py-3 capitalize text-xs">{p.availability?.replace('_', ' ')}</td>
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
              <div className="sm:col-span-2">
                <label className="text-xs font-medium mb-1 block">Tags (comma separated)</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium mb-1 block">
                  Image URLs (Cloudinary ready)
                </label>
                {form.images.map((img, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      value={img.url}
                      onChange={(e) => {
                        const images = [...form.images];
                        images[i] = { ...images[i], url: e.target.value };
                        setForm({ ...form, images });
                      }}
                      className="input-field"
                      placeholder="https://..."
                    />
                    <label className="flex items-center gap-1 text-xs shrink-0">
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
                      Thumb
                    </label>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      images: [...form.images, { url: '', isThumbnail: false }],
                    })
                  }
                  className="text-xs text-brand-gold"
                >
                  + Add image URL
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
