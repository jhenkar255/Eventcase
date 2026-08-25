import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Select } from '../components/ui';
import { getErrorMessage } from '../services/api';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'customer' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Please enter a valid email address';
    if (!/^[+\d][\d\s-]{9,14}$/.test(form.phone)) errs.phone = 'Enter a valid phone number (10+ digits)';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
      errs.password = 'Password must include letters and numbers';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await register(form);
      navigate(user.role === 'vendor' ? '/vendor/profile' : '/dashboard', { replace: true });
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-xl font-extrabold text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white"><Sparkles size={18} /></span>
          Event<span className="-ml-2 text-primary-500">Ease</span>
        </Link>
        <div className="card-base p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold text-slate-900">Create your account</h1>
          <p className="mt-1.5 text-sm text-slate-500">Start planning events in minutes</p>

          {apiError && (
            <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {apiError}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <Input id="reg-name" label="Full name" required placeholder="Priya Sharma" value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
            <Input id="reg-email" label="Email address" type="email" required placeholder="you@example.com" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
            <Input id="reg-phone" label="Phone number" required placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" />
            <Select
              id="reg-role"
              label="I want to join as"
              required
              options={[
                { value: 'customer', label: 'Customer — I plan events' },
                { value: 'vendor', label: 'Vendor — I provide services' },
              ]}
              value={form.role}
              onChange={set('role')}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="reg-password" label="Password" type="password" required placeholder="Min 8 chars" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" />
              <Input id="reg-confirm" label="Confirm password" type="password" required placeholder="Repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} autoComplete="new-password" />
            </div>
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-primary-600 hover:text-primary-800">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
