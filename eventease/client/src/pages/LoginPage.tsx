import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';
import { getErrorMessage } from '../services/api';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      const from = (location.state as { from?: string } | null)?.from;
      const home = user.role === 'admin' ? '/admin/dashboard' : user.role === 'vendor' ? '/vendor/dashboard' : from || '/dashboard';
      navigate(home, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-700 p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-2 text-xl font-extrabold">
          <Sparkles size={22} /> EventEase
        </Link>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-extrabold leading-tight">Plan Your Perfect Event, Effortlessly</h1>
          <p className="mt-4 text-primary-100">
            Discover venues, book trusted vendors, manage budgets and organize every detail — all from one platform.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[['500+', 'Venues'], ['1,200+', 'Vendors'], ['10K+', 'Events']].map(([n, l]) => (
              <div key={l} className="rounded-xl bg-white/10 p-4 backdrop-blur">
                <p className="text-xl font-extrabold">{n}</p>
                <p className="text-xs text-primary-100">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-primary-200">Trusted by event planners across India</p>
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center justify-center gap-2 text-lg font-extrabold text-slate-900 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white"><Sparkles size={17} /></span>
            Event<span className="-ml-2 text-primary-500">Ease</span>
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900">Welcome back</h2>
          <p className="mt-1.5 text-sm text-slate-500">Log in to manage your events</p>

          {error && (
            <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-[42px] z-10 -translate-y-1/2 text-slate-400" aria-hidden />
              <Input
                id="login-email"
                label="Email address"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-[42px] z-10 -translate-y-1/2 text-slate-400" aria-hidden />
              <Input
                id="login-password"
                label="Password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm font-semibold text-primary-600 hover:text-primary-800">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Log in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            New to EventEase?{' '}
            <Link to="/register" className="font-bold text-primary-600 hover:text-primary-800">
              Create an account
            </Link>
          </p>

          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
            <p className="font-bold text-slate-700">Demo accounts</p>
            <p>Customer — priya@example.com / Customer@123</p>
            <p>Vendor — sharma@catering.example.com / Vendor@123</p>
            <p>Admin — admin@eventease.in / Admin@123</p>
          </div>
        </div>
      </div>
    </div>
  );
};
