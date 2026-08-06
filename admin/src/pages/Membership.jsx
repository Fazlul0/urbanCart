import { useEffect, useState } from 'react';
import { Check, X, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUploader from '../components/ImageUploader';
import {
  getMembershipSettings,
  updateMembershipSettings,
  getMembershipApplications,
  updateMembershipApplication,
} from '../services/api';
import { formatBDT } from '../utils/helpers';

const Membership = () => {
  const [tab, setTab] = useState('settings');
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    fee: 0,
    cardImage: '',
    features: [''],
    isActive: true,
  });
  const [apps, setApps] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');

  const loadSettings = async () => {
    const res = await getMembershipSettings();
    const s = res.data.settings;
    setSettings(s);
    setForm({
      title: s.title || '',
      subtitle: s.subtitle || '',
      fee: s.fee || 0,
      cardImage: s.cardImage || '',
      features: s.features?.length ? s.features : [''],
      isActive: s.isActive !== false,
    });
  };

  const loadApps = async (status = statusFilter) => {
    const res = await getMembershipApplications(status ? { status } : undefined);
    setApps(res.data.applications || []);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadSettings(), loadApps()])
      .catch(() => toast.error('Failed to load membership data'))
      .finally(() => setLoading(false));
  }, []);

  const saveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateMembershipSettings({
        ...form,
        fee: Number(form.fee),
        features: form.features.map((f) => f.trim()).filter(Boolean),
      });
      setSettings(res.data.settings);
      toast.success('Membership settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await updateMembershipApplication(id, { status, adminNote: note });
      toast.success(`Marked as ${status}`);
      setSelected(null);
      setNote('');
      loadApps();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  if (loading) {
    return <p className="text-neutral-500">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Membership</h2>
        <p className="text-sm text-neutral-500">Card preview, features, and applications</p>
      </div>

      <div className="flex gap-2 border-b border-neutral-200">
        {[
          { id: 'settings', label: 'Card & Features' },
          { id: 'apps', label: `Applications (${apps.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t.id
                ? 'border-brand-gold text-brand-black'
                : 'border-transparent text-neutral-500 hover:text-brand-black'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'settings' && (
        <form onSubmit={saveSettings} className="grid lg:grid-cols-2 gap-6">
          <div className="card p-5 space-y-4">
            <div>
              <label className="text-xs font-medium mb-1 block">Title</label>
              <input
                className="input-field"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Subtitle</label>
              <input
                className="input-field"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Membership Fee (BDT)</label>
              <input
                type="number"
                min="0"
                className="input-field"
                value={form.fee}
                onChange={(e) => setForm({ ...form, fee: e.target.value })}
              />
            </div>
            <ImageUploader
              fit="card"
              label="Card preview image"
              value={form.cardImage}
              onUploaded={(url) => setForm({ ...form, cardImage: url })}
            />
            <div className="space-y-2">
              <label className="text-xs font-medium block">Features</label>
              {form.features.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="input-field"
                    value={f}
                    onChange={(e) => {
                      const features = [...form.features];
                      features[i] = e.target.value;
                      setForm({ ...form, features });
                    }}
                    placeholder="Feature benefit"
                  />
                  <button
                    type="button"
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    onClick={() =>
                      setForm({
                        ...form,
                        features: form.features.filter((_, idx) => idx !== i),
                      })
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-sm text-brand-gold flex items-center gap-1"
                onClick={() => setForm({ ...form, features: [...form.features, ''] })}
              >
                <Plus size={14} /> Add feature
              </button>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Accepting applications
            </label>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          <div className="card overflow-hidden bg-brand-black text-white">
            <div className="relative aspect-[16/10] bg-neutral-900">
              {form.cardImage ? (
                <img src={form.cardImage} alt="" className="w-full h-full object-cover opacity-80" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-brand-black" />
              )}
              <div className="absolute inset-0 p-6 flex flex-col justify-between">
                <p className="text-brand-gold text-xs tracking-[0.2em] uppercase">Membership</p>
                <div>
                  <h3 className="text-2xl font-semibold">{form.title || 'Membership Card'}</h3>
                  <p className="text-white/70 text-sm mt-1">{form.subtitle}</p>
                  <p className="text-brand-gold font-semibold mt-3">{formatBDT(form.fee || 0)}</p>
                </div>
              </div>
            </div>
            <ul className="p-5 space-y-2 text-sm">
              {form.features
                .filter((f) => f.trim())
                .map((f) => (
                  <li key={f} className="flex gap-2 text-neutral-300">
                    <Check size={16} className="text-brand-gold shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
            </ul>
          </div>
        </form>
      )}

      {tab === 'apps' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {['', 'pending', 'approved', 'rejected'].map((s) => (
              <button
                key={s || 'all'}
                onClick={() => {
                  setStatusFilter(s);
                  loadApps(s);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${
                  statusFilter === s
                    ? 'bg-brand-black text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {s || 'all'}
              </button>
            ))}
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b">
                <tr className="text-left text-neutral-500">
                  <th className="px-4 py-3 font-medium">Applicant</th>
                  <th className="px-4 py-3 font-medium">Profession</th>
                  <th className="px-4 py-3 font-medium">Mobile</th>
                  <th className="px-4 py-3 font-medium">Fee</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {apps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-neutral-500">
                      No applications
                    </td>
                  </tr>
                ) : (
                  apps.map((a) => (
                    <tr key={a._id} className="border-b border-neutral-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={a.photo}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium">{a.fullName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{a.profession || '—'}</td>
                      <td className="px-4 py-3">{a.mobile}</td>
                      <td className="px-4 py-3">{formatBDT(a.fee)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                            a.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : a.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelected(a);
                            setNote(a.adminNote || '');
                          }}
                          className="text-xs font-medium text-brand-gold hover:underline"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Review Application</h3>
              <button onClick={() => setSelected(null)}>
                <X size={20} />
              </button>
            </div>
            <img
              src={selected.photo}
              alt="Photo"
              className="rounded-lg h-44 w-full object-cover"
            />
            <dl className="text-sm space-y-2">
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Name</dt>
                <dd className="font-medium text-right">{selected.fullName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Profession</dt>
                <dd className="font-medium text-right">{selected.profession || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Mobile</dt>
                <dd className="font-medium">{selected.mobile}</dd>
              </div>
            </dl>
            <div>
              <label className="text-xs font-medium mb-1 block">Admin note</label>
              <textarea
                rows={2}
                className="input-field resize-none"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => updateStatus(selected._id, 'rejected')}
                className="btn-ghost text-red-600"
              >
                Reject
              </button>
              <button
                onClick={() => updateStatus(selected._id, 'pending')}
                className="btn-ghost"
              >
                Mark Pending
              </button>
              <button
                onClick={() => updateStatus(selected._id, 'approved')}
                className="btn-primary"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Membership;
