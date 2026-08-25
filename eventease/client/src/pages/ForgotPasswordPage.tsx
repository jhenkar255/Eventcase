import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { Button, Input, SuccessBanner } from '../components/ui';
import { authApi, getErrorMessage } from '../services/api';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        {sent ? (
          <div className="card-base p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <MailCheck size={26} className="text-emerald-600" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">Check your inbox</h1>
            <p className="mt-2 text-sm text-slate-500">
              If an account exists for <strong>{email}</strong>, a password reset link has been sent.
            </p>
            <Link to="/login" className="mt-6 inline-block">
              <Button variant="outline">Back to login</Button>
            </Link>
          </div>
        ) : (
          <div className="card-base p-8">
            <Link to="/login" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-800">
              <ArrowLeft size={15} /> Back to login
            </Link>
            <h1 className="text-xl font-extrabold text-slate-900">Forgot your password?</h1>
            <p className="mt-1.5 text-sm text-slate-500">Enter your email and we'll send you a reset link.</p>
            {error && (
              <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}
            <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
              <Input
                id="fp-email"
                label="Email address"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <Button type="submit" fullWidth loading={loading}>
                Send reset link
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
