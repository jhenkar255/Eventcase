import { useState } from 'react';
import { Plus, Wallet, Trash2, PieChart } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { eventApi, getErrorMessage } from '../../services/api';
import type { Expense } from '../../types';
import { Button, Input, Select, Modal, ConfirmDialog, EmptyState, Card } from '../../components/ui';
import { formatCurrency, formatDate, toISODateInput } from '../../utils/format';
import { EXPENSE_CATEGORIES } from '../../utils/constants';

const COLORS = ['#3b6cf6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#64748b'];

interface Props {
  eventId: string;
  expenses: Expense[];
  budget: number;
  reload: () => void;
}

export const BudgetTab = ({ eventId, expenses, budget, reload }: Props) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ category: 'Venue', description: '', amount: '', date: toISODateInput(new Date()) });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const spent = expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = budget - spent;
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  const byCategory = EXPENSE_CATEGORIES.map((c) => ({
    name: c,
    value: expenses.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.value > 0);

  const save = async () => {
    if (!form.description.trim()) return setError('Description is required');
    const amt = Number(form.amount);
    if (!amt || amt <= 0) return setError('Amount must be greater than zero');
    setSaving(true);
    setError('');
    try {
      await eventApi.addExpense(eventId, {
        category: form.category,
        description: form.description,
        amount: amt,
        date: new Date(`${form.date}T12:00:00`).toISOString(),
      });
      setModalOpen(false);
      setForm({ category: 'Venue', description: '', amount: '', date: toISODateInput(new Date()) });
      reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    await eventApi.deleteExpense(eventId, deleteTarget._id).catch(() => {});
    setDeleteTarget(null);
    reload();
  };

  return (
    <div>
      {/* Summary cards */}
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400"><Wallet size={13} /> Total budget</p>
          <p className="mt-1.5 text-2xl font-extrabold text-slate-900">{formatCurrency(budget)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total spent</p>
          <p className={`mt-1.5 text-2xl font-extrabold ${pct >= 100 ? 'text-red-600' : 'text-primary-700'}`}>{formatCurrency(spent)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Remaining</p>
          <p className={`mt-1.5 text-2xl font-extrabold ${remaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(remaining)}</p>
        </Card>
      </div>

      {/* Progress bar */}
      <div className="card-base mb-5 p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700">Budget used</span>
          <span className={`font-bold ${pct >= 100 ? 'text-red-600' : 'text-slate-900'}`}>{pct}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {remaining < 0 && (
          <p className="mt-2 text-sm font-semibold text-red-600">Over budget by {formatCurrency(Math.abs(remaining))}</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Expenses list */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Expenses ({expenses.length})</h3>
            <Button size="sm" onClick={() => setModalOpen(true)}><Plus size={15} /> Add expense</Button>
          </div>

          {expenses.length === 0 ? (
            <EmptyState icon={Wallet} title="No expenses tracked yet" message="Add expenses to see where your budget goes." action={<Button onClick={() => setModalOpen(true)}><Plus size={15} /> Add first expense</Button>} />
          ) : (
            <div className="card-base divide-y divide-slate-100 overflow-hidden">
              {expenses.map((e) => (
                <div key={e._id} className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50/70">
                  <span className="rounded-lg bg-primary-50 px-2 py-1 text-xs font-bold text-primary-700">{e.category}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{e.description}</p>
                    <p className="text-xs text-slate-400">{formatDate(e.date)}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(e.amount)}</span>
                  <button onClick={() => setDeleteTarget(e)} aria-label={`Delete expense: ${e.description}`} className="rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div>
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-slate-500"><PieChart size={14} /> Breakdown</h3>
          {byCategory.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-400">
              Chart appears once you add expenses
            </div>
          ) : (
            <div className="card-base p-4" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend iconSize={9} wrapperStyle={{ fontSize: 11 }} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Add expense modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add expense">
        <div className="space-y-4">
          {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{error}</div>}
          <Select id="exp-cat" label="Category" options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          <Input id="exp-desc" label="Description" required placeholder="e.g. Catering advance payment" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="exp-amt" label="Amount (₹)" type="number" min={1} required placeholder="e.g. 25000" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
            <Input id="exp-date" label="Date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Add expense</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete expense?" message={`${deleteTarget?.description} (${formatCurrency(deleteTarget?.amount ?? 0)}) will be removed.`} confirmLabel="Delete" danger onConfirm={remove} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
};
