import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { eventApi, getErrorMessage } from '../services/api';
import { Button, Input, Select, Textarea, Card } from '../components/ui';
import { EVENT_TYPES } from '../utils/constants';
import { useToast } from '../context/ToastContext';

interface EventFormState {
  name: string;
  type: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  guestCount: string;
  budget: string;
}

const emptyForm: EventFormState = {
  name: '', type: '', description: '', date: '',
  startTime: '10:00', endTime: '14:00', location: '', guestCount: '', budget: '',
};

export const EventFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const mode: 'create' | 'edit' = id ? 'edit' : 'create';
  const [form, setForm] = useState<EventFormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    eventApi
      .get(id)
      .then((res) => {
        const e = res.data.data.event;
        setForm({
          name: e.name,
          type: e.type,
          description: e.description ?? '',
          date: new Date(e.date).toISOString().slice(0, 10),
          startTime: e.startTime,
          endTime: e.endTime,
          location: e.location,
          guestCount: String(e.guestCount),
          budget: String(e.budget),
        });
      })
      .catch((err) => setApiError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id, mode]);

  const set = (k: keyof EventFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Event name is required';
    if (!form.type) errs.type = 'Please select an event type';
    if (!form.date) errs.date = 'Event date is required';
    if (!form.startTime) errs.startTime = 'Start time required';
    if (!form.endTime) errs.endTime = 'End time required';
    if (form.startTime && form.endTime && form.startTime >= form.endTime) errs.endTime = 'End time must be after start time';
    if (!form.location.trim()) errs.location = 'Location is required';
    if (!form.guestCount || Number(form.guestCount) < 1) errs.guestCount = 'Guest count must be at least 1';
    if (form.budget === '' || Number(form.budget) < 0) errs.budget = 'Budget cannot be negative';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setSaving(true);
    try {
      const body = {
        name: form.name,
        type: form.type,
        description: form.description,
        date: new Date(`${form.date}T12:00:00`).toISOString(),
        startTime: form.startTime,
        endTime: form.endTime,
        location: form.location,
        guestCount: Number(form.guestCount),
        budget: Number(form.budget),
      };
      if (mode === 'create') {
        const res = await eventApi.create(body);
        toast('success', 'Event created!');
        navigate(`/events/${res.data.data.event._id}`);
      } else {
        await eventApi.update(id!, body);
        toast('success', 'Event updated!');
        navigate(`/events/${id}`);
      }
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-800">
        <ChevronLeft size={15} /> Back
      </button>
      <h1 className="text-2xl font-extrabold text-slate-900">{mode === 'create' ? 'Create a new event' : 'Edit event'}</h1>
      <p className="mt-1 text-sm text-slate-500">Fill in the details below to {mode === 'create' ? 'start planning' : 'update'} your event.</p>

      {apiError && (
        <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {apiError}
        </div>
      )}

      <Card className="mt-6 p-6">
        <form onSubmit={submit} className="space-y-5" noValidate>
          <Input id="evf-name" label="Event name" required placeholder="e.g. Sharma-Kapoor Wedding" value={form.name} onChange={set('name')} error={errors.name} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              id="evf-type"
              label="Event type"
              required
              placeholder="Select type…"
              options={EVENT_TYPES.map((t) => ({ value: t, label: t }))}
              value={form.type}
              onChange={set('type')}
              error={errors.type}
            />
            <Input id="evf-location" label="Location / City" required placeholder="e.g. Bangalore" value={form.location} onChange={set('location')} error={errors.location} />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <Input id="evf-date" label="Date" type="date" required value={form.date} onChange={set('date')} error={errors.date} />
            <Input id="evf-start" label="Start time" type="time" required value={form.startTime} onChange={set('startTime')} error={errors.startTime} />
            <Input id="evf-end" label="End time" type="time" required value={form.endTime} onChange={set('endTime')} error={errors.endTime} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input id="evf-guests" label="Expected guests" type="number" min={1} required placeholder="e.g. 150" value={form.guestCount} onChange={set('guestCount')} error={errors.guestCount} />
            <Input id="evf-budget" label={`Total budget (₹)`} type="number" min={0} required placeholder="e.g. 500000" value={form.budget} onChange={set('budget')} error={errors.budget} />
          </div>
          <Textarea id="evf-desc" label="Description" placeholder="Tell us more about your event…" value={form.description} onChange={set('description')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" loading={saving}>
              {mode === 'create' ? 'Create event' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
