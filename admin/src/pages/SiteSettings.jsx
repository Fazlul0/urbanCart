import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import { getSiteSettings, updateSiteSettings } from '../services/api';

const emptyLink = () => ({ label: '', url: '' });

const SiteSettings = () => {
  const [form, setForm] = useState({
    siteName: 'Nogor Car',
    logoUrl: '',
    tagline: '',
    deliveryCharge: 120,
    footerLinks: [emptyLink()],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSiteSettings()
      .then((res) => {
        const s = res.data.settings;
        setForm({
          siteName: s.siteName || 'Nogor Car',
          logoUrl: s.logoUrl || '',
          tagline: s.tagline || '',
          deliveryCharge: s.deliveryCharge != null ? Number(s.deliveryCharge) : 120,
          footerLinks:
            Array.isArray(s.footerLinks) && s.footerLinks.length
              ? s.footerLinks.map((l) => ({ label: l.label || '', url: l.url || '' }))
              : [emptyLink()],
        });
      })
      .catch(() => toast.error('Failed to load site settings'))
      .finally(() => setLoading(false));
  }, []);

  const updateLink = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      footerLinks: prev.footerLinks.map((link, i) =>
        i === index ? { ...link, [key]: value } : link
      ),
    }));
  };

  const addLink = () => {
    setForm((prev) => ({
      ...prev,
      footerLinks: [...prev.footerLinks, emptyLink()].slice(0, 20),
    }));
  };

  const removeLink = (index) => {
    setForm((prev) => ({
      ...prev,
      footerLinks: prev.footerLinks.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.siteName.trim()) {
      toast.error('Site name is required');
      return;
    }
    const footerLinks = form.footerLinks
      .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
      .filter((l) => l.label && l.url);
    setSaving(true);
    try {
      const res = await updateSiteSettings({
        siteName: form.siteName.trim(),
        logoUrl: form.logoUrl,
        tagline: form.tagline.trim(),
        deliveryCharge: Number(form.deliveryCharge) || 0,
        footerLinks,
      });
      const s = res.data.settings;
      setForm({
        siteName: s.siteName,
        logoUrl: s.logoUrl || '',
        tagline: s.tagline || '',
        deliveryCharge: s.deliveryCharge != null ? Number(s.deliveryCharge) : 120,
        footerLinks:
          Array.isArray(s.footerLinks) && s.footerLinks.length
            ? s.footerLinks
            : [emptyLink()],
      });
      toast.success('Site settings saved');
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
          Website name, logo, and footer navigation links
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-5 space-y-4">
            <div>
              <label className="text-xs font-medium mb-1 block">Website name</label>
              <input
                className="input-field"
                value={form.siteName}
                onChange={(e) => setForm({ ...form, siteName: e.target.value })}
                placeholder="Nogor Car"
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
                placeholder="Car accessories for every ride"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Delivery charge (BDT)</label>
              <input
                type="number"
                min="0"
                step="1"
                className="input-field"
                value={form.deliveryCharge}
                onChange={(e) => setForm({ ...form, deliveryCharge: e.target.value })}
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Applied to checkout when the order does not qualify for free delivery. Default 120.
              </p>
            </div>
            <ImageUploader
              fit="logo"
              previewFit="contain"
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
                {form.tagline || 'Your tagline appears here.'}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Footer links</h3>
              <p className="text-xs text-neutral-500">
                Custom labels and URLs (paths like /products or full https:// links)
              </p>
            </div>
            <button type="button" onClick={addLink} className="btn-outline text-sm py-1.5 px-3">
              <Plus size={14} /> Add link
            </button>
          </div>

          <div className="space-y-3">
            {form.footerLinks.map((link, index) => (
              <div key={index} className="grid sm:grid-cols-[1fr_1.4fr_auto] gap-2 items-start">
                <input
                  className="input-field"
                  placeholder="Link name"
                  value={link.label}
                  onChange={(e) => updateLink(index, 'label', e.target.value)}
                />
                <input
                  className="input-field"
                  placeholder="/products or https://…"
                  value={link.url}
                  onChange={(e) => updateLink(index, 'url', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className="p-2.5 rounded-lg text-red-600 hover:bg-red-50"
                  aria-label="Remove link"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {form.footerLinks.length === 0 && (
              <p className="text-sm text-neutral-500">No footer links — add one above.</p>
            )}
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </form>
    </div>
  );
};

export default SiteSettings;
