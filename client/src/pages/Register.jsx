import { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';
import { getReturnPath, takeReturnPath } from '../utils/authReturn';
import { getStoredReferral, normalizeReferralMobile } from '../utils/referral';

const PROFESSION_PRESETS = [
  { value: 'কার ব্রোকার', label: 'কার ব্রোকার' },
  { value: 'ড্রাইভার', label: 'ড্রাইভার' },
  { value: '__custom__', label: 'আপনার পেশা লিখুন' },
];

const Register = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = getReturnPath(location.state?.from, '/');
  const openShare = Boolean(location.state?.openShare);
  const authPrompt = Boolean(location.state?.authPrompt);
  const returnState = openShare ? { openShare: true } : undefined;
  const storedRef = getStoredReferral();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
  });
  const [professionChoice, setProfessionChoice] = useState('');
  const [customProfession, setCustomProfession] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={takeReturnPath(from)} replace state={returnState} />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (!professionChoice) {
      toast.error('পেশা নির্বাচন করুন');
      return;
    }
    const profession =
      professionChoice === '__custom__' ? customProfession.trim() : professionChoice;
    if (!profession) {
      toast.error('আপনার পেশা লিখুন');
      return;
    }
    setLoading(true);
    try {
      const referralCode =
        normalizeReferralMobile(storedRef || '') || String(storedRef || '').trim();
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        mobile: form.mobile,
        profession,
        ...(referralCode ? { referralCode } : {}),
      });
      navigate(takeReturnPath(from), { replace: true, state: returnState });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Register — Nogor Car</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-[radial-gradient(ellipse_at_top,_rgba(201,162,39,0.12),_transparent_50%)]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Logo size="sm" align="center" />
            <h1 className="font-display text-3xl mt-6 mb-2">Create Account</h1>
            <p className="text-brand-muted text-sm" lang={authPrompt ? 'bn' : undefined}>
              {authPrompt
                ? 'অর্ডার বা শেয়ার করতে অ্যাকাউন্ট তৈরি করুন।'
                : 'Join Nogor Car today'}
            </p>
          </div>
          <p className="text-center mb-4">
            <Link
              to="/login"
              state={{
                from,
                ...(openShare ? { openShare: true } : {}),
                ...(authPrompt ? { authPrompt: true } : {}),
              }}
              className="inline-flex items-center justify-center w-full sm:w-auto min-h-12 px-5 py-3 rounded-xl border-2 border-brand-gold text-base sm:text-lg font-semibold text-brand-black bg-white hover:bg-brand-gold/15 transition"
            >
              Already have an account? Login
            </Link>
          </p>
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-brand-border rounded-2xl p-8 shadow-sm space-y-4"
          >
            {[
              { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Your name' },
              { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
              { name: 'mobile', label: 'Mobile Number', type: 'tel', placeholder: '01XXXXXXXXX' },
              { name: 'password', label: 'Password', type: 'password', placeholder: 'Min 6 characters' },
            ].map((field) => (
              <div key={field.name}>
                <label className="text-sm font-medium mb-1.5 block">{field.label}</label>
                <input
                  type={field.type}
                  required
                  value={form[field.name]}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  className="input-field"
                  placeholder={field.placeholder}
                />
              </div>
            ))}
            <div>
              <label className="text-sm font-medium mb-1.5 block" htmlFor="profession">
                পেশা
              </label>
              <select
                id="profession"
                required
                value={professionChoice}
                onChange={(e) => setProfessionChoice(e.target.value)}
                className="input-field"
              >
                <option value="" disabled>
                  পেশা নির্বাচন করুন
                </option>
                {PROFESSION_PRESETS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {professionChoice === '__custom__' && (
                <input
                  type="text"
                  required
                  value={customProfession}
                  onChange={(e) => setCustomProfession(e.target.value)}
                  className="input-field mt-2"
                  placeholder="আপনার পেশা লিখুন (Bangla / English)"
                  lang="bn"
                />
              )}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Register;
