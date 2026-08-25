import { useEffect, useState, useCallback } from 'react';
import { Users as UsersIcon, ShieldCheck, ShieldX, Trash2, UserRound, Store, Crown } from 'lucide-react';
import { adminApi, getErrorMessage } from '../../services/api';
import type { AdminUser } from '../../types';
import {
  Button, Badge, LoadingSpinner, EmptyState, ErrorBanner,
  Pagination, Select, ConfirmDialog, Card,
} from '../../components/ui';
import { formatDate, timeAgo } from '../../utils/format';

const ROLE_ICON: Record<string, typeof UserRound> = { customer: UserRound, vendor: Store, admin: Crown };
const ROLE_BADGE: Record<string, 'blue' | 'amber' | 'purple'> = { customer: 'blue', vendor: 'amber', admin: 'purple' };

export const AdminUsersPage = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggleTarget, setToggleTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [acting, setActing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    adminApi
      .users({
        page,
        limit: 12,
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      })
      .then((res) => {
        const d = res.data.data;
        setUsers(d.users as AdminUser[]);
        setPages(d.pages as number);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, roleFilter, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load]);

  const doToggle = async () => {
    if (!toggleTarget) return;
    setActing(true);
    try {
      await adminApi.setUserStatus(toggleTarget._id, toggleTarget.status === 'active' ? 'suspended' : 'active');
      setToggleTarget(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
      setToggleTarget(null);
    } finally {
      setActing(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    setActing(true);
    try {
      await adminApi.deleteUser(deleteTarget._id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleteTarget(null);
    } finally {
      setActing(false);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-500">Manage platform accounts</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          aria-label="Search users"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input-base max-w-xs"
        />
        <select aria-label="Filter by role" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="input-base max-w-[160px]">
          <option value="">All roles</option>
          <option value="customer">Customers</option>
          <option value="vendor">Vendors</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} onRetry={load} /></div>}

      {loading ? (
        <LoadingSpinner full label="Loading users…" />
      ) : users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users found" message="Try a different search or filter." />
      ) : (
        <>
          <Card className="divide-y divide-slate-100 overflow-hidden p-0">
            {users.map((u) => {
              const Icon = ROLE_ICON[u.role] ?? UserRound;
              return (
                <div key={u._id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50/70">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-600' : u.role === 'vendor' ? 'bg-amber-100 text-amber-600' : 'bg-primary-100 text-primary-600'
                  }`}>
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {u.name}
                      {u.status === 'suspended' && <Badge color="red" className="ml-2">suspended</Badge>}
                    </p>
                    <p className="truncate text-xs text-slate-400">{u.email}</p>
                  </div>
                  <Badge color={ROLE_BADGE[u.role] ?? 'slate'}>{u.role}</Badge>
                  <span className="hidden text-xs text-slate-400 sm:block" title={formatDate(u.createdAt)}>
                    joined {timeAgo(u.createdAt)}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setToggleTarget(u)} title={u.status === 'active' ? 'Suspend' : 'Reactivate'}>
                    {u.status === 'active' ? <ShieldX size={16} /> : <ShieldCheck size={16} />}
                  </Button>
                  <Button size="sm" variant="ghost" className="!text-red-500 hover:!bg-red-50" onClick={() => setDeleteTarget(u)} title="Delete user">
                    <Trash2 size={15} />
                  </Button>
                </div>
              );
            })}
          </Card>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={!!toggleTarget}
        title={toggleTarget?.status === 'active' ? 'Deactivate this user?' : 'Reactivate this user?'}
        message={
          toggleTarget?.status === 'active'
            ? `${toggleTarget?.name} will no longer be able to sign in.`
            : `${toggleTarget?.name} will regain access to their account.`
        }
        confirmLabel={toggleTarget?.status === 'active' ? 'Deactivate' : 'Activate'}
        danger={toggleTarget?.status === 'active'}
        loading={acting}
        onConfirm={doToggle}
        onCancel={() => setToggleTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete user permanently?"
        message={`${deleteTarget?.name}'s account and all associated data (events, bookings, reviews) will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete forever"
        danger
        loading={acting}
        onConfirm={doDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
