import { useState } from 'react';
import {
  Plus, Clock, User as UserIcon, Trash2, CalendarDays,
} from 'lucide-react';
import { eventApi, getErrorMessage } from '../../services/api';
import type { Task } from '../../types';
import { Button, Input, Modal, ConfirmDialog, EmptyState, Badge, statusBadgeColor } from '../../components/ui';
import { formatDate, formatTime12 } from '../../utils/format';

interface Props {
  eventId: string;
  tasks: Task[];
  reload: () => void;
}

export const TasksTab = ({ eventId, tasks, reload }: Props) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState({ title: '', description: '', date: '', startTime: '10:00', endTime: '11:00', assignedTo: '', status: 'pending' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', date: new Date().toISOString().slice(0, 10), startTime: '10:00', endTime: '11:00', assignedTo: '', status: 'pending' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    setForm({
      title: t.title,
      description: t.description ?? '',
      date: new Date(t.date).toISOString().slice(0, 10),
      startTime: t.startTime,
      endTime: t.endTime,
      assignedTo: t.assignedTo ?? '',
      status: t.status,
    });
    setError('');
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) return setError('Task title is required');
    if (!form.date) return setError('Task date is required');
    if (form.startTime >= form.endTime) return setError('End time must be after start time');
    setSaving(true);
    setError('');
    try {
      const body = {
        title: form.title,
        description: form.description,
        date: new Date(`${form.date}T12:00:00`).toISOString(),
        startTime: form.startTime,
        endTime: form.endTime,
        assignedTo: form.assignedTo,
        status: form.status,
      };
      if (editing) await eventApi.updateTask(eventId, editing._id, body);
      else await eventApi.addTask(eventId, body);
      setModalOpen(false);
      reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (t: Task, status: string) => {
    try {
      await eventApi.updateTask(eventId, t._id, { status });
      reload();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    await eventApi.deleteTask(eventId, deleteTarget._id).catch(() => {});
    setDeleteTarget(null);
    reload();
  };

  const grouped = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    const key = new Date(t.date).toDateString();
    (acc[key] ||= []).push(t);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {tasks.filter((t) => t.status !== 'completed').length} pending · {tasks.filter((t) => t.status === 'completed').length} completed
        </p>
        <Button onClick={openCreate}><Plus size={16} /> Add task</Button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon={Clock} title="No tasks yet" message="Break your event into manageable tasks and assign owners." action={<Button onClick={openCreate}><Plus size={15} /> Create first task</Button>} />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, dayTasks]) => (
            <div key={day}>
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                <CalendarDays size={14} className="text-primary-500" /> {formatDate(day)}
              </p>
              <div className="space-y-2">
                {dayTasks.map((t) => (
                  <div key={t._id} className="card-base flex flex-wrap items-center gap-3 p-4">
                    <span className="w-28 shrink-0 text-sm font-bold text-primary-700">{formatTime12(t.startTime)}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${t.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{t.title}</p>
                      {t.description && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{t.description}</p>}
                      {t.assignedTo && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><UserIcon size={11} /> {t.assignedTo}</p>
                      )}
                    </div>
                    <select
                      value={t.status}
                      onChange={(e) => setStatus(t, e.target.value)}
                      aria-label={`Status for ${t.title}`}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 focus:border-primary-500 focus:outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                    <button onClick={() => openEdit(t)} className="text-sm font-semibold text-primary-600 hover:text-primary-800">Edit</button>
                    <button onClick={() => setDeleteTarget(t)} aria-label={`Delete ${t.title}`} className="text-slate-400 transition hover:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit task' : 'Add task'} wide>
        <div className="space-y-4">
          {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{error}</div>}
          <Input id="task-title" label="Title" required placeholder="e.g. Guest arrival & welcome drinks" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input id="task-date" label="Date" type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            <Input id="task-start" label="Start" type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
            <Input id="task-end" label="End" type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
          </div>
          <Input id="task-assigned" label="Assigned to" placeholder="e.g. Ramesh (Coordinator)" value={form.assignedTo} onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))} />
          <div>
            <label htmlFor="task-status" className="label-base">Status</label>
            <select id="task-status" className="input-base" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <textarea id="task-desc" rows={2} className="input-base resize-y" placeholder="Description (optional)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Save changes' : 'Add task'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete task?" message={`"${deleteTarget?.title}" will be removed.`} confirmLabel="Delete" danger onConfirm={remove} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
};
