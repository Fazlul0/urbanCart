import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Camera, Wrench, Droplets, Cog, ChevronRight, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getMembershipSettings,
  applyMembership,
  getMyMembershipApplications,
  getMembershipFacilities,
  uploadImage,
  applyLostCard,
  getMyLostCardApplications,
} from '../../services/api';
import { formatBDT } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { BenefitCard } from './BenefitContent';
import ShareButton from '../ui/ShareButton';

const TAKE_PHOTO_LABEL = 'ক্যামেরা দিয়ে ছবি তুলুন / Take photo';
const RETAKE_LABEL = 'আবার তুলুন / Retake';

/** Front-camera capture → uploadImage; keeps form.photo as URL for API */
const PhotoCapture = ({ label, value, onUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!streaming || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => {});
  }, [streaming]);

  const uploadFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please take a photo');
      return;
    }
    setUploading(true);
    try {
      const res = await uploadImage(file);
      onUploaded(res.data.url);
      toast.success('Photo saved');
      stopStream();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed — please login first');
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) await uploadFile(file);
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      fileInputRef.current?.click();
      return;
    }
    try {
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      setStreaming(true);
    } catch {
      fileInputRef.current?.click();
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        await uploadFile(new File([blob], 'membership-photo.jpg', { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">{label}</label>
      {streaming ? (
        <div className="relative overflow-hidden rounded-xl border border-brand-border bg-neutral-950 aspect-[4/3]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover scale-x-[-1]"
          />
        </div>
      ) : value ? (
        <img
          src={value}
          alt=""
          className="h-40 w-full object-cover rounded-xl border border-brand-border"
        />
      ) : (
        <div className="h-40 rounded-xl border border-dashed border-brand-border bg-neutral-50 flex flex-col items-center justify-center gap-2 text-brand-muted text-sm">
          <Camera size={28} className="text-brand-gold" />
          <span>Front camera photo required</span>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        disabled={uploading}
        onChange={onFileChange}
      />
      <div className="flex flex-col sm:flex-row gap-2">
        {streaming ? (
          <>
            <button
              type="button"
              disabled={uploading}
              onClick={captureFrame}
              className="btn-primary py-2 text-sm w-full sm:flex-1 justify-center"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              {uploading ? 'Uploading...' : TAKE_PHOTO_LABEL}
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={stopStream}
              className="btn-ghost py-2 text-sm"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={uploading}
            onClick={startCamera}
            className="btn-outline py-2 text-sm w-full justify-center"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            {uploading ? 'Uploading...' : value ? RETAKE_LABEL : TAKE_PHOTO_LABEL}
          </button>
        )}
      </div>
    </div>
  );
};

const CardImage = ({ src, label }) => {
  if (!src) return null;
  return (
    <div className="min-w-0">
      {label && (
        <p className="text-[10px] sm:text-xs uppercase tracking-widest text-brand-gold mb-1.5 sm:mb-2">
          {label}
        </p>
      )}
      <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-950 shadow-lg aspect-[1.586/1]">
        <img
          src={src}
          alt={label || 'Membership card'}
          className="w-full h-full object-contain block"
        />
      </div>
    </div>
  );
};

const facilityIcon = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('wash') || n.includes('clean')) return Droplets;
  if (n.includes('equip') || n.includes('part') || n.includes('spare')) return Cog;
  return Wrench;
};

/** Full membership cards + benefits + apply form (used on Home and /membership) */
const MembershipSection = ({ className = '' }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [settings, setSettings] = useState(null);
  const [myApps, setMyApps] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAllBenefits, setShowAllBenefits] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lostApps, setLostApps] = useState([]);
  const [lostSubmitting, setLostSubmitting] = useState(false);
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
    if (!isAuthenticated) {
      setMyApps([]);
      setLostApps([]);
      return;
    }
    getMyMembershipApplications()
      .then((res) => setMyApps(res.data.applications || []))
      .catch(() => {});
    getMyLostCardApplications()
      .then((res) => setLostApps(res.data.applications || []))
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
  const isApproved = latest?.status === 'approved';

  useEffect(() => {
    if (!isApproved) {
      setFacilities([]);
      return;
    }
    getMembershipFacilities()
      .then((res) => setFacilities(res.data.facilities || []))
      .catch(() => setFacilities([]));
  }, [isApproved]);

  const canApply =
    settings?.isActive &&
    (!latest || (latest.status !== 'pending' && latest.status !== 'approved'));

  const frontSrc = settings?.cardFront || settings?.cardImage || settings?.homeImage || '';
  const backSrc = settings?.cardBack || '';
  const benefits = (settings?.features || []).map((f) => String(f).trim()).filter(Boolean);
  const benefitsCollapsed = benefits.length > 2;
  const visibleBenefits =
    benefitsCollapsed && !showAllBenefits ? benefits.slice(0, 2) : benefits;
  const showApplyShare = !benefitsCollapsed || showAllBenefits;

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      toast.error('Please login to apply');
      navigate('/login', { state: { from: location.pathname || '/membership' } });
      return;
    }
    setShowForm(true);
  };

  const handleLostCard = async () => {
    if (!isAuthenticated) {
      toast.error('Please login first');
      navigate('/login', { state: { from: location.pathname || '/' } });
      return;
    }
    setLostSubmitting(true);
    try {
      await applyLostCard({
        fullName: user?.name || '',
        mobile: user?.mobile || '',
        note: 'Lost card replacement request',
      });
      toast.success('Lost card application submitted');
      const res = await getMyLostCardApplications();
      setLostApps(res.data.applications || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit request');
    } finally {
      setLostSubmitting(false);
    }
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
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="w-10 h-10 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!settings) return null;

  if (isApproved) {
    const latestLost = lostApps[0];
    const canLostApply = !latestLost || latestLost.status !== 'pending';
    return (
      <div className={className}>
        <div className="mb-4 sm:mb-5">
          <p className="text-brand-gold text-[10px] sm:text-xs uppercase tracking-widest mb-0.5">
            Member perks
          </p>
          <h2 className="font-display text-lg sm:text-2xl text-brand-black">Your facilities</h2>
          <p className="text-xs sm:text-sm text-brand-muted mt-1">
            Tap a facility to see partner shops and contact details
          </p>
        </div>

        {facilities.length === 0 ? (
          <p className="text-sm text-brand-muted py-8 text-center rounded-xl border border-dashed border-brand-border">
            Partner facilities will appear here soon.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {facilities.map((fac) => {
              const Icon = facilityIcon(fac.name);
              return (
                <Link
                  key={fac._id}
                  to={`/membership/facilities/${fac._id}`}
                  className="group flex flex-col items-center justify-center gap-2 min-h-[96px] sm:min-h-[110px] px-3 py-4 rounded-xl bg-white border border-brand-border text-center hover:border-brand-gold shadow-sm transition"
                >
                  {fac.image ? (
                    <img
                      src={fac.image}
                      alt=""
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-brand-gold/15 text-brand-black flex items-center justify-center">
                      <Icon size={22} />
                    </span>
                  )}
                  <span className="text-sm sm:text-[15px] font-medium text-brand-black group-hover:text-brand-gold transition">
                    {fac.name}
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-brand-muted opacity-0 group-hover:opacity-100 transition"
                  />
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-3 sm:mt-4 rounded-xl border border-brand-border bg-white px-3.5 py-3 sm:px-4 sm:py-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-brand-gold/15 text-brand-black flex items-center justify-center shrink-0">
              <CreditCard size={20} className="text-brand-gold" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-brand-black leading-tight">Lost card</p>
              <p className="text-xs text-brand-muted mt-0.5">
                Replacement fee{' '}
                <span className="font-semibold text-brand-gold">
                  {formatBDT(settings.lostCardFee ?? 200)}
                </span>
                {latestLost ? (
                  <>
                    {' · '}
                    <span
                      className={`capitalize ${
                        latestLost.status === 'approved'
                          ? 'text-green-700'
                          : latestLost.status === 'rejected'
                            ? 'text-red-700'
                            : 'text-amber-800'
                      }`}
                    >
                      {latestLost.status}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
            {canLostApply ? (
              <button
                type="button"
                onClick={handleLostCard}
                disabled={lostSubmitting}
                className="shrink-0 text-xs sm:text-sm font-medium py-2 px-3.5 sm:px-4 rounded-lg bg-brand-gold text-brand-black hover:brightness-95 transition disabled:opacity-60"
              >
                {lostSubmitting ? '…' : 'Apply'}
              </button>
            ) : (
              <span className="shrink-0 text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg">
                Pending
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-4 sm:mb-5">
        <p className="text-brand-gold text-[10px] sm:text-xs uppercase tracking-widest mb-0.5">
          Membership
        </p>
        <h2 className="font-display text-lg sm:text-2xl text-brand-black">
          {settings.title || 'Membership Card'}
        </h2>
        {settings.subtitle ? (
          <p className="text-xs sm:text-sm text-brand-muted mt-1">{settings.subtitle}</p>
        ) : null}
      </div>

      <div
        className={`mb-6 sm:mb-8 grid gap-3 sm:gap-4 ${
          frontSrc && backSrc ? 'grid-cols-2' : 'grid-cols-1 max-w-md'
        }`}
      >
        <div className="min-w-0">
          <CardImage src={frontSrc} label={backSrc ? 'Front' : undefined} />
          {settings.productCode ? (
            <p className="mt-2 text-[10px] sm:text-[11px] font-mono tracking-wider text-brand-muted text-left leading-none">
              {settings.productCode}
            </p>
          ) : null}
        </div>
        {backSrc ? (
          <div className="min-w-0">
            <CardImage src={backSrc} label="Back" />
          </div>
        ) : null}
      </div>

      {benefits.length > 0 && (
        <section className="mb-8 sm:mb-10">
          <div className="mb-5 sm:mb-6">
            <h3 className="font-display text-xl sm:text-2xl md:text-3xl text-brand-black leading-snug">
              Nogor Car Membership কেনো নিবেন?
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {visibleBenefits.map((f, i) => {
              const isHighlight =
                visibleBenefits.length % 2 === 1 && i === visibleBenefits.length - 1;
              return (
                <div
                  key={`${i}-${f.slice(0, 24)}`}
                  className={isHighlight ? 'sm:col-span-2 sm:max-w-xl sm:mx-auto w-full' : ''}
                >
                  <BenefitCard text={f} index={i} />
                </div>
              );
            })}
          </div>
          {benefitsCollapsed ? (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllBenefits((v) => !v)}
                className="btn-outline py-2 px-5 text-sm"
              >
                {showAllBenefits ? 'See less' : 'See more'}
              </button>
            </div>
          ) : null}
        </section>
      )}

      {latest && (
        <div
          className={`rounded-2xl border p-4 sm:p-5 mb-6 sm:mb-8 text-sm break-words ${
            latest.status === 'rejected'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          Your application status: <strong className="capitalize">{latest.status}</strong>
          {latest.adminNote ? ` — ${latest.adminNote}` : ''}
        </div>
      )}

      {!showForm ? (
        showApplyShare ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <p className="text-lg sm:text-xl font-semibold text-brand-gold order-1 sm:order-none">
              {formatBDT(settings.fee)}
            </p>
            <div className="flex items-center gap-2 sm:gap-3 order-2 sm:order-none flex-wrap justify-center">
              {canApply ? (
                <button onClick={handleApplyClick} className="btn-primary px-6 sm:px-8">
                  Apply for Membership
                </button>
              ) : !settings.isActive ? (
                <p className="text-brand-muted">Applications are currently closed.</p>
              ) : null}
              <ShareButton path="/" title={settings.title || 'Membership'} />
            </div>
          </div>
        ) : null
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-brand-border p-5 sm:p-8 space-y-4"
        >
          <h3 className="font-display text-xl sm:text-2xl mb-2">Application form</h3>
          <p className="text-sm text-brand-muted mb-2">
            Fee: <span className="font-semibold text-brand-gold">{formatBDT(settings.fee)}</span>
            {' '}— payable after approval (admin review).
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
              <PhotoCapture
                label="আপনার ছবি / Your photo"
                value={form.photo}
                onUploaded={(url) => setForm({ ...form, photo: url })}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-base font-semibold text-brand-gold">{formatBDT(settings.fee)}</p>
            <div className="flex gap-2">
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" disabled={submitting || !form.photo} className="btn-primary">
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default MembershipSection;
export { MembershipSection };
