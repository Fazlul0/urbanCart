import { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to={from} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login — UrbanCart</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-[radial-gradient(ellipse_at_top,_rgba(201,162,39,0.12),_transparent_50%)]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Logo className="justify-center" size="lg" />
            <h1 className="font-display text-3xl mt-6 mb-2">Welcome Back</h1>
            <p className="text-brand-muted text-sm">Sign in to continue shopping</p>
          </div>
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
            <p className="text-center text-sm text-brand-muted pt-2">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-gold font-medium hover:underline">
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
