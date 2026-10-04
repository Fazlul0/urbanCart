import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUploader from '../components/ImageUploader';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadImage,
} from '../services/api';

const Categories = ({ categoryType = 'general' }) => {
  const isFood = categoryType === 'food';
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    image: '',
    icon: '',
    isActive: true,
    hideFromHome: false,
    hideFromProductList: false,
    sortOrder: 0,
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getCategories({ type: categoryType });
      const list = [...(res.data.categories || [])].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)
      );
      setCategories(list);
    } catch {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [categoryType]);

  const openCreate = () => {
    const next =
      categories.reduce((m, c) => Math.max(m, Number(c.sortOrder) || 0), 0) + 1;
    setForm({
      name: '',
      description: '',
      image: '',
      icon: '',
      isActive: true,
      hideFromHome: false,
      hideFromProductList: false,
      sortOrder: next,
    });
    setModal('create');
  };

  const openEdit = (cat) => {
    setForm({
      name: cat.name,
      description: cat.description || '',
      image: cat.image || '',
      icon: cat.icon || '',
      isActive: cat.isActive,
      hideFromHome: !!cat.hideFromHome,
      hideFromProductList: !!cat.hideFromProductList,
      sortOrder: cat.sortOrder ?? 0,
    });
    setModal(cat);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        type: categoryType,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (modal === 'create') {
        await createCategory(payload);
        toast.success('Category created');
      } else {
        await updateCategory(modal._id, payload);
        toast.success('Category updated');
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];
    // Optimistically update UI, then persist sequential sort_order (1-based)
    setCategories(next);
    try {
      await Promise.all(next.map((c, i) => updateCategory(c._id, { sortOrder: i + 1 })));
      await load();
    } catch {
      toast.error('Could not reorder');
      load();
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await deleteCategory(id, false);
      toast.success('Category deleted');
      load();
    } catch (err) {
      const data = err.response?.data;
      if (data?.requiresForce) {
        const ok = confirm(
          `${data.message}\n\nThis will permanently delete ${data.productCount} product(s). Continue?`
        );
        if (!ok) return;
        try {
          await deleteCategory(id, true);
          toast.success(data.productCount ? `Category and products deleted` : 'Category deleted');
          load();
        } catch (e2) {
          toast.error(e2.response?.data?.message || 'Delete failed');
        }
      } else {
        toast.error(data?.message || 'Delete failed');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{isFood ? 'Food Categories' : 'Categories'}</h2>
          <p className="text-sm text-neutral-500">
            {categories.length} categories · lower order number shows first on the store
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> {isFood ? 'Add Food Category' : 'Add Category'}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-neutral-500">Loading...</p>
        ) : (
          categories.map((c, index) => (
            <div key={c._id} className="card overflow-hidden">
              {c.image && (
                <div className="aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                  <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 shrink-0">
                        #{c.sortOrder ?? index + 1}
                      </span>
                      {c.icon ? (
                        <img
                          src={c.icon}
                          alt=""
                          className="w-6 h-6 rounded object-cover shrink-0 border border-neutral-200"
                        />
                      ) : null}
                      <h3 className="font-medium truncate">{c.name}</h3>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{c.description}</p>
                    <span
                      className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                        c.isActive ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {c.hideFromHome ? (
                      <span className="inline-block mt-2 ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Hidden on home
                      </span>
                    ) : null}
                    {c.hideFromProductList ? (
                      <span className="inline-block mt-2 ml-1 text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                        Hidden in All Products
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      title="Move up"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      className="p-1.5 hover:bg-neutral-100 rounded disabled:opacity-30"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      title="Move down"
                      disabled={index === categories.length - 1}
                      onClick={() => move(index, 1)}
                      className="p-1.5 hover:bg-neutral-100 rounded disabled:opacity-30"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-neutral-100 rounded">
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="p-1.5 hover:bg-red-50 text-red-600 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-xl w-full max-w-md my-auto max-h-[min(92vh,880px)] flex flex-col shadow-xl"
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-100 shrink-0">
              <h3 className="font-semibold">
                {modal === 'create' ? 'Add Category' : 'Edit Category'}
              </h3>
              <button type="button" onClick={() => setModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 overflow-y-auto overscroll-contain flex-1 min-h-0">
            <div>
              <label className="text-xs font-medium mb-1 block">Name & icon</label>
              <div className="flex gap-3 items-start">
                <div className="shrink-0 w-[72px]">
                  <div className="w-[72px] h-[72px] rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden flex items-center justify-center">
                    {form.icon ? (
                      <img src={form.icon} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-neutral-400 text-center px-1">Icon</span>
                    )}
                  </div>
                  <label className="mt-1.5 block text-center text-[10px] font-medium text-brand-gold cursor-pointer hover:underline">
                    {form.icon ? 'Change' : 'Add icon'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const res = await uploadImage(file);
                          setForm((f) => ({ ...f, icon: res.data.url }));
                          toast.success('Icon uploaded');
                        } catch (err) {
                          toast.error(err.response?.data?.message || 'Icon upload failed');
                        } finally {
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                  {form.icon ? (
                    <button
                      type="button"
                      className="mt-0.5 w-full text-[10px] text-red-600"
                      onClick={() => setForm({ ...form, icon: '' })}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field"
                    placeholder="Category name"
                  />
                  <input
                    type="url"
                    className="input-field text-xs py-2"
                    placeholder="Or paste icon URL…"
                    onBlur={(e) => {
                      const url = e.target.value.trim();
                      if (/^https?:\/\//i.test(url)) {
                        setForm((f) => ({ ...f, icon: url }));
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>
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
              <label className="text-xs font-medium mb-1 block">Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-field resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Category Image</label>
              <ImageUploader
                fit="category"
                label="Upload category image"
                value={form.image}
                onUploaded={(url) => setForm({ ...form, image: url })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Active
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={form.hideFromHome}
                onChange={(e) => setForm({ ...form, hideFromHome: e.target.checked })}
              />
              <span>
                Hide from home
                <span className="block text-xs text-neutral-500 font-normal">
                  Products stay visible when this category is opened
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={form.hideFromProductList}
                onChange={(e) => setForm({ ...form, hideFromProductList: e.target.checked })}
              />
              <span>
                Hide from All Products list
                <span className="block text-xs text-neutral-500 font-normal">
                  Do not mix these products into Shop All. They still show when this category is selected
                </span>
              </span>
            </label>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-neutral-100 shrink-0 bg-white rounded-b-xl">
              <button type="button" onClick={() => setModal(null)} className="btn-ghost">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Categories;
