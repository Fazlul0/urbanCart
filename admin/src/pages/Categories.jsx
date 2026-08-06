import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUploader from '../components/ImageUploader';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../services/api';

const Categories = ({ categoryType = 'general' }) => {
  const isFood = categoryType === 'food';
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', image: '', isActive: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getCategories({ type: categoryType });
      setCategories(res.data.categories);
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
    setForm({ name: '', description: '', image: '', isActive: true });
    setModal('create');
  };

  const openEdit = (cat) => {
    setForm({
      name: cat.name,
      description: cat.description || '',
      image: cat.image || '',
      isActive: cat.isActive,
    });
    setModal(cat);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, type: categoryType };
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
          <p className="text-sm text-neutral-500">{categories.length} categories</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> {isFood ? 'Add Food Category' : 'Add Category'}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-neutral-500">Loading...</p>
        ) : (
          categories.map((c) => (
            <div key={c._id} className="card overflow-hidden">
              {c.image && (
                <div className="aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                  <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{c.name}</h3>
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{c.description}</p>
                    <span
                      className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                        c.isActive ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex gap-1">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <form onSubmit={handleSave} className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">
                {modal === 'create' ? 'Add Category' : 'Edit Category'}
              </h3>
              <button type="button" onClick={() => setModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
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
            <div className="flex justify-end gap-2">
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
