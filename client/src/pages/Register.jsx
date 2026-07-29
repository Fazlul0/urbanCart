import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';

const Register = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', mobile: '' });
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Register — UrbanCart</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-[radial-gradient(ellipse_at_top,_rgba(201,162,39,0.12),_transparent_50%)]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Logo className="justify-center" size="lg" />
            <h1 className="font-display text-3xl mt-6 mb-2">Create Account</h1>
            <p className="text-brand-muted text-sm">Join UrbanCart today</p>
          </div>
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
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating...' : 'Create Account'}
            </button>
            <p className="text-center text-sm text-brand-muted pt-2">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-gold font-medium hover:underline">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
};

export default Register;
