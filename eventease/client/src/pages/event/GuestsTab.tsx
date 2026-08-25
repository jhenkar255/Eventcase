import { useState } from 'react';
import { Plus, Users, Trash2, Mail, Search, Pencil, Clock } from 'lucide-react';
import { eventApi, getErrorMessage } from '../../services/api';
import type { Guest, Task } from '../../types';
import { Button, Input, Select, Modal, ConfirmDialog, EmptyState, Badge, statusBadgeColor } from '../../components/ui';
import { formatTime12 } from '../../utils/format';

/* ---------------- GUESTS TAB ---------------- */
interface GuestProps {
  eventId: string;
  guests: Guest[];
  reload: () => void;
}

export const GuestsTab = ({ eventId, guests, reload }: GuestProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', guestCount: '1', rsvpStatus: 'pending' });
  const [search, setSearch] = useState('');
  const [rsvpFilter, setRsvpFilter] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Guest | null>(null);
  const [invitedMsg, setInvitedMsg] = useState('');

  const filtered = guests.filter((g) => {
    if (rsvpFilter && g.rsvpStatus !== rsvpFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return g.name.toLowerCase().includes(q) || (g.email ?? '').toLowerCase().includes(q) || (g.phone ?? '').includes(q);
    }
    return true;
  });

  const stats = {
    totalPeople: guests.reduce((s, g) => s + g.guestCount, 0),
    confirmed: guests.filter((g) => g.rsvpStatus === 'confirmed').reduce((s, g) => s + g.guestCount, 0),
    pending: guests.filter((g) => g.rsvpStatus === 'pending').reduce((s, g) => s + g.guestCount, 0),
    declined: guests.filter((g) => g.rsvpStatus === 'declined').reduce((s, g) => s + g.guestCount, 0),
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', guestCount: '1', rsvpStatus: 'pending' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (g: Guest) => {
    setEditing(g);
    setForm({ name: g.name, email: g.email ?? '', phone: g.phone ?? '', guestCount: String(g.guestCount), rsvpStatus: g.rsvpStatus });
    setError('');
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return setError('Guest name is required');
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return setError('Please enter a valid email');
    if (Number(form.guestCount) < 1) return setError('Party size must be at least 1');
    setSaving(true);
    setError('');
    try {
      const body = { name: form.name, email: form.email, phone: form.phone, guestCount: Number(form.guestCount), rsvpStatus: form.rsvpStatus };
      if (editing) await eventApi.updateGuest(eventId, editing._id, body);
      else await eventApi.addGuest(eventId, body);
      setModalOpen(false);
      reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const invite = async (g: Guest) => {
    setInvitedMsg('');
    try {
      const res = await eventApi.inviteGuest(eventId, g._id);
      setInvitedMsg(res.data.message);
      setTimeout(() => setInvitedMsg(''), 3500);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    await eventApi.deleteGuest(eventId, deleteTarget._id).catch(() => {});
    setDeleteTarget(null);
    reload();
  };

  return (
    <div>
      {/* Stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Total invited', stats.totalPeople, 'text-slate-900'],
          ['Confirmed', stats.confirmed, 'text-emerald-600'],
          ['Pending', stats.pending, 'text-amber-600'],
          ['Declined', stats.declined, 'text-red-500'],
        ].map(([label, value, color]) => (
          <div key={String(label)} className="rounded-xl border border-slate-200/70 bg-white p-3.5 text-center shadow-card">
            <p className={`text-xl font-extrabold ${color}`}>{value as number}</p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input id="guest-search" placeholder="Search guests…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <select
          aria-label="Filter by RSVP"
          value={rsvpFilter}
          onChange={(e) => setRsvpFilter(e.target.value)}
          className="input-base max-w-[160px]"
        >
          <option value="">All RSVP</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="declined">Declined</option>
        </select>
        <div className="flex-1" />
        <Button onClick={openCreate}><Plus size={16} /> Add guest</Button>
      </div>

      {invitedMsg && (
        <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">{invitedMsg}</div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title={guests.length === 0 ? 'No guests yet' : 'No matching guests'} message={guests.length === 0 ? 'Add your guest list to track invitations and RSVPs.' : 'Try a different search or RSVP filter.'} action={guests.length === 0 ? <Button onClick={openCreate}><Plus size={15} /> Add first guest</Button> : undefined} />
      ) : (
        <div className="card-base divide-y divide-slate-100 overflow-hidden">
          {filtered.map((g) => (
            <div key={g._id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50/70">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                g.rsvpStatus === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : g.rsvpStatus === 'declined' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'
              }`}>
                {g.name.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{g.name} <span className="font-normal text-slate-400">· party of {g.guestCount}</span></p>
                <p className="truncate text-xs text-slate-500">{[g.email, g.phone].filter(Boolean).join(' · ') || 'No contact info'}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                g.rsvpStatus === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : g.rsvpStatus === 'declined' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
              }`}>{g.rsvpStatus}</span>
              <button onClick={() => invite(g)} title="Send invitation" aria-label={`Send invitation to ${g.name}`} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-primary-50 hover:text-primary-600">
                <Mail size={16} />
              </button>
              <button onClick={() => openEdit(g)} title="Edit guest" aria-label={`Edit ${g.name}`} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                <Pencil size={15} />
              </button>
              <button onClick={() => setDeleteTarget(g)} title="Remove guest" aria-label={`Remove ${g.name}`} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit guest' : 'Add guest'} wide>
        <div className="space-y-4">
          {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{error}</div>}
          <Input id="g-name" label="Full name" required placeholder="e.g. Amit Patel" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="g-email" label="Email" type="email" placeholder="amit@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <Input id="g-phone" label="Phone" placeholder="+91 …" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="g-count" label="Total people (incl. family)" type="number" min={1} required value={form.guestCount} onChange={(e) => setForm((f) => ({ ...f, guestCount: e.target.value }))} />
            <Select
              id="g-rsvp"
              label="RSVP status"
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'declined', label: 'Declined' },
              ]}
              value={form.rsvpStatus}
              onChange={(e) => setForm((f) => ({ ...f, rsvpStatus: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Save changes' : 'Add guest'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Remove guest?" message={`${deleteTarget?.name} will be removed from the guest list.`} confirmLabel="Remove" danger onConfirm={remove} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
};

/* ---------------- SCHEDULE TAB ---------------- */
interface ScheduleProps {
  tasks: Task[];
}

const ScheduleTab = ({ tasks }: ScheduleProps) => {
  const sorted = [...tasks].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.startTime.localeCompare(b.startTime)
  );

  if (sorted.length === 0) {
    return <EmptyState icon={Clock} title="Nothing scheduled yet" message="Add tasks in the Tasks tab and they'll appear here as a timeline." />;
  }

  const byDay = sorted.reduce<Record<string, Task[]>>((acc, t) => {
    const key = new Date(t.date).toDateString();
    (acc[key] ||= []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(byDay).map(([day, items]) => (
        <div key={day}>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">{day}</h3>
          <ol className="relative space-y-0 border-l-2 border-primary-100 pl-6 ml-3">
            {items.map((t, i) => (
              <li key={t._id} className={`relative pb-6 ${i === items.length - 1 ? 'pb-1' : ''}`}>
                <span className={`absolute -left-[31px] top-1 flex h-4 w-4 rounded-full border-2 border-white shadow ${
                  t.status === 'completed' ? 'bg-emerald-500' : t.status === 'in-progress' ? 'bg-amber-400' : 'bg-primary-500'
                }`} />
                <div className="card-base p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{t.title}</p>
                      {t.description && <p className="mt-0.5 text-xs text-slate-500">{t.description}</p>}
                    </div>
                    <Badge color={statusBadgeColor(t.status)}>{formatTime12(t.startTime)} – {formatTime12(t.endTime)}</Badge>
                  </div>
                  {t.assignedTo && <p className="mt-2 flex items-center gap-1 text-xs text-slate-400"><Users size={11} /> {t.assignedTo}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
};

export { ScheduleTab };
