import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Check, CreditCard, Loader2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getMembershipSettings,
  applyMembership,
  getMyMembershipApplications,
  uploadImage,
} from '../services/api';
import { formatBDT } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

const FileField = ({ label, value, onUploaded }) => {
  const [uploading, setUploading] = useState(false);

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image');
      return;
    }
    setUploading(true);
    try {
      const res = await uploadImage(file);
      onUploaded(res.data.url);
      toast.success('Uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed — please login first');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">{label}</label>
      {value ? (
        <img src={value} alt="" className="h-32 w-full object-cover rounded-xl border border-brand-border" />
      ) : (
        <div className="h-32 rounded-xl border border-dashed border-brand-border bg-neutral-50 flex items-center justify-center text-brand-muted text-sm">
          No file
        </div>
      )}
      <label className="btn-outline py-2 text-sm cursor-pointer w-full justify-center">
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {uploading ? 'Uploading...' : 'Upload'}
        <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handle} />
      </label>
    </div>
  );
};

const Membership = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [myApps, setMyApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    profession: '',
    mobile: '',
    photo: '',
  });

  useEffect(() => {
    setLoading(true);
    getMembershipSettings()
      .then((res) => setSettings(res.data.settings))
      .catch(() => setSettings(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    getMyMembershipApplications()
      .then((res) => setMyApps(res.data.applications || []))
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        fullName: f.fullName || user.name || '',
        mobile: f.mobile || user.mobile || '',
      }));
    }
  }, [user]);

  const latest = myApps[0];
  const canApply =
    settings?.isActive &&
    (!latest || (latest.status !== 'pending' && latest.status !== 'approved'));

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      toast.error('Please login to apply');
      navigate('/login', { state: { from: '/membership' } });
      return;
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await applyMembership(form);
      toast.success('Application submitted — we will review it shortly');
      setShowForm(false);
      const res = await getMyMembershipApplications();
      setMyApps(res.data.applications || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-6 min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="pt-6 text-center py-20">
        <p className="text-brand-muted">Membership is unavailable right now.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">
          Back home
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Membership — UrbanCart</title>
      </Helmet>

      <div className="pt-6 pb-16">
        <div className="container-uc px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-10">
            <p className="text-brand-gold text-xs tracking-[0.2em] uppercase mb-3 flex items-center justify-center gap-2">
              <CreditCard size={14} /> Membership Card
            </p>
            <h1 className="font-display text-4xl md:text-5xl mb-3">{settings.title}</h1>
            <p className="text-brand-muted max-w-xl mx-auto">{settings.subtitle}</p>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-brand-black text-white mb-10 shadow-xl">
            <div className="relative aspect-[16/9] sm:aspect-[21/9]">
              {settings.cardImage ? (
                <img
                  src={settings.cardImage}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-70"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 via-brand-black to-neutral-900" />
              )}
              <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-gold text-brand-black font-bold text-xs flex items-center justify-center">
                    UC
                  </div>
                  <span className="text-xs tracking-widest text-brand-gold uppercase">UrbanCart</span>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-semibold">{settings.title}</p>
                  <p className="text-brand-gold text-lg mt-2 font-medium">
                    {formatBDT(settings.fee)} membership fee
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-brand-border p-6 sm:p-8 mb-8">
            <h2 className="font-display text-2xl mb-5">Member benefits</h2>
            <ul className="space-y-3">
              {(settings.features || []).map((f) => (
                <li key={f} className="flex gap-3 text-brand-black/90">
                  <Check size={18} className="text-brand-gold shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {latest && (
            <div
              className={`rounded-2xl border p-5 mb-8 text-sm ${
                latest.status === 'approved'
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : latest.status === 'rejected'
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : 'border-amber-200 bg-amber-50 text-amber-900'
              }`}
            >
              Your application status:{' '}
              <strong className="capitalize">{latest.status}</strong>
              {latest.adminNote ? ` — ${latest.adminNote}` : ''}
            </div>
          )}

          {!showForm ? (
            <div className="text-center">
              {canApply ? (
                <button onClick={handleApplyClick} className="btn-primary px-8">
                  Apply for Membership
                </button>
              ) : !settings.isActive ? (
                <p className="text-brand-muted">Applications are currently closed.</p>
              ) : null}
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-brand-border p-6 sm:p-8 space-y-4"
            >
              <h2 className="font-display text-2xl mb-2">Application form</h2>
              <p className="text-sm text-brand-muted mb-4">
                Fee: {formatBDT(settings.fee)} — payable after approval (admin review).
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Full name</label>
                  <input
                    required
                    className="input-field"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Profession</label>
                  <input
                    required
                    className="input-field"
                    value={form.profession}
                    onChange={(e) => setForm({ ...form, profession: e.target.value })}
                    placeholder="e.g. Business, Student"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium mb-1 block">Mobile number</label>
                  <input
                    required
                    className="input-field"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <FileField
                    label="Your photo"
                    value={form.photo}
                    onUploaded={(url) => setForm({ ...form, photo: url })}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 justify-end pt-2">
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.photo}
                  className="btn-primary"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default Membership;
