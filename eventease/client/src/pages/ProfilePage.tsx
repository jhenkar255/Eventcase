import { useEffect, useState } from 'react';
import { UserRound, Save, Bell, BellOff, CheckCircle2 } from 'lucide-react';
import { authApi, notificationApi, getErrorMessage } from '../services/api';
import type { AppNotification as NotifType } from '../types';
import { Button, LoadingSpinner, EmptyState, Pagination, Card, Badge, ErrorBanner } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { timeAgo } from '../utils/format';
import { useAuth } from '../context/AuthContext';


export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? '');
    }
  }, [user]);

  const save = async () => {
    if (!name.trim()) return setError('Name is required');
    setSaving(true); setError('');
    try {
      const res = await authApi.updateProfile({ name, phone });
      updateUser(res.data.data.user);
      toast('success', 'Profile updated successfully');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-extrabold text-slate-900">My Profile</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">Manage your account details</p>

      <Card className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-700">
            <UserRound size={30} />
          </span>
          <div>
            <p className="font-bold text-slate-900">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <Badge color={user?.role === 'admin' ? 'purple' : user?.role === 'vendor' ? 'amber' : 'blue'} className="mt-1">
              {user?.role}
            </Badge>
          </div>
        </div>

        {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{error}</div>}

        <div className="space-y-4">
          <div>
            <label htmlFor="p-name" className="label-base">Full name</label>
            <input id="p-name" className="input-base" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="p-email" className="label-base">Email <span className="font-normal text-slate-400">(cannot be changed)</span></label>
            <input id="p-email" className="input-base bg-slate-50 text-slate-500" value={user?.email ?? ''} disabled />
          </div>
          <div>
            <label htmlFor="p-phone" className="label-base">Phone</label>
            <input id="p-phone" className="input-base" placeholder="+91 …" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button onClick={save} loading={saving}><Save size={15} /> Save changes</Button>
        </div>
      </Card>
    </div>
  );
};

/* ---------------- NOTIFICATIONS ---------------- */
export const NotificationsPage = () => {
  const [items, setItems] = useState<NotifType[]>([]);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    notificationApi
      .list({ page, limit: 20 })
      .then((res) => {
        const d = res.data.data;
        setItems(d.notifications as NotifType[]);
        setPages(d.pages as number);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [page]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold text-slate-900">Notifications</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">Booking updates and event reminders</p>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading ? (
        <LoadingSpinner full label="Loading notifications…" />
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" message="You're all caught up!" />
      ) : (
        <>
          <Card className="divide-y divide-slate-100 overflow-hidden">
            {items.map((n) => {
              const Icon = ['booking-accepted', 'booking-completed', 'payment'].includes(n.type) ? CheckCircle2 : n.read ? Bell : BellOff;
              return (
                <button
                  key={n._id}
                  onClick={() => notificationApi.markRead(n._id).then(load)}
                  className={`flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-slate-50 ${!n.read ? 'bg-primary-50/40' : ''}`}
                >
                  <span className={`mt-0.5 rounded-lg p-2 ${n.read ? 'bg-slate-100 text-slate-500' : 'bg-primary-100 text-primary-600'}`}>
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900">{n.title}</span>
                    <span className="mt-0.5 block text-sm text-slate-600">{n.message}</span>
                    <span className="mt-1 block text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-500" aria-label="Unread" />}
                </button>
              );
            })}
          </Card>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      )}
    </div>
  );
};
