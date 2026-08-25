import { useEffect, useState, useCallback } from 'react';
import { Save, Clock } from 'lucide-react';
import { vendorApi, getErrorMessage } from '../../services/api';
import type { Vendor } from '../../types';
import { LoadingSpinner, ErrorBanner, Button, Card } from '../../components/ui';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface DayRow {
  day: string;
  enabled: boolean;
  from: string;
  to: string;
}

export const VendorAvailabilityPage = () => {
  const [rows, setRows] = useState<DayRow[]>(DAYS.map((d) => ({ day: d, enabled: d === 'Saturday' || d === 'Sunday', from: '09:00', to: '18:00' })));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    vendorApi
      .myProfile()
      .then((res) => {
        const v = (res.data.data as { vendor?: Vendor } | null)?.vendor;
        if (v?.availability?.length) {
          setRows(
            DAYS.map((d) => {
              const found = v.availability.find((a) => a.day === d);
              return found
                ? { day: d, enabled: found.open, from: found.from.slice(0, 5), to: found.to.slice(0, 5) }
                : { day: d, enabled: false, from: '09:00', to: '18:00' };
            })
          );
        }
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const update = (day: string, patch: Partial<DayRow>) =>
    setRows((rs) => rs.map((r) => (r.day === day ? { ...r, ...patch } : r)));

  const save = async () => {
    // validate enabled rows
    for (const r of rows.filter((x) => x.enabled)) {
      if (r.from >= r.to) return setError(`${r.day}: end time must be after start time.`);
    }
    setSaving(true); setError(''); setSaved(false);
    try {
      await vendorApi.updateAvailability(
        rows.map((r) => ({ day: r.day, open: r.enabled, from: r.from, to: r.to }))
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner full label="Loading availability…" />;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold text-slate-900">Weekly Availability</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">Set the days and hours you accept bookings</p>

      {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{error}</div>}
      {saved && (
        <div role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
          <Save size={15} /> Availability updated!
        </div>
      )}

      <Card className="divide-y divide-slate-100 overflow-hidden p-0">
        {rows.map((r) => (
          <div key={r.day} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
            <label className="flex w-36 cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={r.enabled}
                onChange={(e) => update(r.day, { enabled: e.target.checked })}
                aria-label={`Available on ${r.day}`}
                className="h-4 w-4 accent-primary-600"
              />
              <span className={`text-sm font-semibold ${r.enabled ? 'text-slate-900' : 'text-slate-400'}`}>{r.day}</span>
            </label>

            {r.enabled ? (
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} className="text-primary-500" />
                <input type="time" value={r.from} onChange={(e) => update(r.day, { from: e.target.value })} aria-label={`${r.day} start time`} className="input-base !w-auto py-1.5" />
                <span className="text-slate-400">to</span>
                <input type="time" value={r.to} onChange={(e) => update(r.day, { to: e.target.value })} aria-label={`${r.day} end time`} className="input-base !w-auto py-1.5" />
              </div>
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-400">Not available</span>
            )}
          </div>
        ))}
      </Card>

      <div className="mt-5">
        <Button onClick={save} loading={saving}><Save size={15} /> Save availability</Button>
      </div>
    </div>
  );
};
