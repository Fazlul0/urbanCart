import { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';
import { getReturnPath, takeReturnPath } from '../utils/authReturn';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = getReturnPath(location.state?.from, '/');
  const openShare = Boolean(location.state?.openShare);
  const authPrompt = Boolean(location.state?.authPrompt);
  const afterAuthState = openShare ? { openShare: true } : undefined;
  const registerState = {
    from,
    ...(openShare ? { openShare: true } : {}),
    ...(authPrompt ? { authPrompt: true } : {}),
  };
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={takeReturnPath(from)} replace state={afterAuthState} />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(takeReturnPath(from), { replace: true, state: afterAuthState });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login — Nogor Car</title>
      </Helmet>
      <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden flex items-center justify-center px-4 py-16 bg-[radial-gradient(ellipse_at_top,_rgba(201,162,39,0.12),_transparent_50%)]">
        <div className="w-full max-w-md min-w-0">
          <div className="text-center mb-8">
            <Logo size="sm" align="center" />
            <h1 className="font-display text-3xl mt-6 mb-2">Welcome Back</h1>
            <p className="text-brand-muted text-sm">
              {authPrompt
                ? 'অ্যাড, বাই বা শেয়ার করতে লগইন করুন। অ্যাকাউন্ট না থাকলে রেজিস্ট্রেশন করুন।'
                : 'Sign in to continue shopping'}
            </p>
          </div>
          {authPrompt && (
            <div className="mb-4 rounded-xl border border-brand-gold/40 bg-brand-gold/10 px-4 py-3 text-sm text-brand-black leading-relaxed" lang="bn">
              অর্ডার বা শেয়ার করতে লগইন করুন। নতুন ইউজার হলে{' '}
              <span className="font-semibold">রেজিস্ট্রেশন করুন</span> বাটনে ক্লিক করে অ্যাকাউন্ট তৈরি করুন।
            </div>
          )}
          <p className="text-center mb-4" lang="bn">
            <Link
              to="/register"
              state={registerState}
              className="inline-flex items-center justify-center w-full sm:w-auto min-h-12 px-5 py-3 rounded-xl border-2 border-brand-gold text-base sm:text-lg font-semibold text-brand-black bg-white hover:bg-brand-gold/15 transition"
            >
              অ্যাকাউন্ট নেই? রেজিস্ট্রেশন করুন
            </Link>
          </p>
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-brand-border rounded-2xl p-8 shadow-sm space-y-4"
          >
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
