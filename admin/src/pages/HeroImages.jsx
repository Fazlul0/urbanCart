import { useEffect, useState } from 'react';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUploader from '../components/ImageUploader';
import { getHeroImagesAdmin, createHeroImage, deleteHeroImage, updateHeroImage } from '../services/api';

const HeroImages = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draftUrl, setDraftUrl] = useState('');
  const [alt, setAlt] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getHeroImagesAdmin();
      setImages(res.data.images || []);
    } catch {
      toast.error('Failed to load hero images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!draftUrl) {
      toast.error('Upload an image first');
      return;
    }
    setAdding(true);
    try {
      await createHeroImage({ url: draftUrl, alt: alt || 'Hero banner' });
      toast.success('Hero image added');
      setDraftUrl('');
      setAlt('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this hero image?')) return;
    try {
      await deleteHeroImage(id);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const toggleActive = async (img) => {
    try {
      await updateHeroImage(img._id, { isActive: !img.isActive });
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Hero Images</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Upload background images for the storefront hero carousel (file upload, not links).
        </p>
      </div>

      <div className="card p-5 max-w-lg space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <ImageIcon size={16} /> Add hero image
        </h3>
        <ImageUploader
          fit="hero"
          label="Upload hero background"
          value={draftUrl}
          onUploaded={setDraftUrl}
        />
        <input
          className="input-field"
          placeholder="Alt text (optional)"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
        />
        <button type="button" disabled={adding || !draftUrl} onClick={handleAdd} className="btn-primary">
          <Plus size={16} /> {adding ? 'Adding...' : 'Add to Hero'}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-neutral-500">Loading...</p>
        ) : images.length === 0 ? (
          <div className="card p-10 text-center text-neutral-500 sm:col-span-2 lg:col-span-3">
            No hero images yet. Upload your first banner above.
          </div>
        ) : (
          images.map((img, i) => (
            <div key={img._id} className="card overflow-hidden">
              <img src={img.url} alt={img.alt} className="h-40 w-full object-cover" />
              <div className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">Slide {i + 1}</p>
                  <p className="text-xs text-neutral-500 truncate">{img.alt || '—'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(img)}
                    className={`text-xs px-2 py-1 rounded-full ${
                      img.isActive ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {img.isActive ? 'Active' : 'Hidden'}
                  </button>
                  <button
                    onClick={() => handleDelete(img._id)}
                    className="p-1.5 hover:bg-red-50 text-red-600 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HeroImages;
