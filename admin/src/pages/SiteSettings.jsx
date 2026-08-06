import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ImageUploader from '../components/ImageUploader';
import { getSiteSettings, updateSiteSettings } from '../services/api';

const SiteSettings = () => {
  const [form, setForm] = useState({
    siteName: 'UrbanCart',
    logoUrl: '',
    tagline: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSiteSettings()
      .then((res) => {
        const s = res.data.settings;
        setForm({
          siteName: s.siteName || 'UrbanCart',
          logoUrl: s.logoUrl || '',
          tagline: s.tagline || '',
        });
      })
      .catch(() => toast.error('Failed to load site settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.siteName.trim()) {
      toast.error('Site name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await updateSiteSettings({
        siteName: form.siteName.trim(),
        logoUrl: form.logoUrl,
        tagline: form.tagline.trim(),
      });
      const s = res.data.settings;
      setForm({
        siteName: s.siteName,
        logoUrl: s.logoUrl || '',
        tagline: s.tagline || '',
      });
      toast.success('Site branding saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-neutral-500">Loading...</p>;
  }

  const initials = form.siteName
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-semibold">Site Branding</h2>
        <p className="text-sm text-neutral-500">
          Change website name and logo shown on the storefront
        </p>
      </div>

      <form onSubmit={handleSave} className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5 space-y-4">
          <div>
            <label className="text-xs font-medium mb-1 block">Website name</label>
            <input
              className="input-field"
              value={form.siteName}
              onChange={(e) => setForm({ ...form, siteName: e.target.value })}
              placeholder="UrbanCart"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Tagline</label>
            <textarea
              rows={3}
              className="input-field resize-none"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              placeholder="Short description under the brand"
            />
          </div>
          <ImageUploader
            label={form.logoUrl ? 'Replace logo' : 'Upload logo'}
            value={form.logoUrl}
            onUploaded={(url) => setForm({ ...form, logoUrl: url })}
          />
          {form.logoUrl && (
            <button
              type="button"
              className="text-xs text-red-600"
              onClick={() => setForm({ ...form, logoUrl: '' })}
            >
              Remove logo (use initials)
            </button>
          )}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Branding'}
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Preview</p>
          <div className="card p-5 bg-white">
            <div className="flex items-center gap-2.5">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="" className="w-10 h-10 rounded-lg object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-brand-black text-brand-gold flex items-center justify-center font-bold text-sm">
                  {initials || 'UC'}
                </div>
              )}
              <span className="font-semibold text-lg">{form.siteName || 'Site name'}</span>
            </div>
          </div>
          <div className="card overflow-hidden bg-brand-black text-white p-6">
            <div className="flex items-center gap-3 mb-3">
              {form.logoUrl && (
                <img src={form.logoUrl} alt="" className="w-10 h-10 rounded-lg object-contain" />
              )}
              <p className="text-2xl font-semibold">{form.siteName || 'Site name'}</p>
            </div>
            <p className="text-sm text-neutral-400">
              {form.tagline || 'Your tagline appears here on the homepage and footer.'}
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SiteSettings;
