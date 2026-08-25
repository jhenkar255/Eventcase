import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus } from 'lucide-react';
import { eventApi, bookingApi, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal, Button, Input, Select, SuccessBanner } from './ui';
import type { Event, Service } from '../types';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  kind: 'vendor' | 'venue';
  targetId: string;
  targetName: string;
  service?: Service | null;
}

const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const BookingModal = ({ open, onClose, kind, targetId, targetName, service }: BookingModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('14:00');
  const [guestCount, setGuestCount] = useState('50');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdId, setCreatedId] = useState('');

  useEffect(() => {
    if (open && user?.role === 'customer') {
      eventApi
        .list({ limit: 50 })
        .then((res) => setEvents(res.data.data.events as Event[]))
        .catch(() => {});
    }
    if (!open) {
      setError(''); setSuccess(''); setLoading(false); setCreatedId('');
      setNotes(''); setDate(''); setEventId('');
    }
  }, [open, user]);

  const submit = async () => {
    setError('');
    if (!eventId) return setError('Please select one of your events for this booking.');
    if (!date) return setError('Please choose a booking date.');
    if (kind === 'vendor' && !service && startTime >= endTime) return setError('End time must be after start time.');

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        eventId,
        date: new Date(`${date}T12:00:00`).toISOString(),
        startTime,
        endTime,
        guestCount: Number(guestCount) || undefined,
        notes,
      };
      if (kind === 'vendor') {
        body.vendorId = targetId;
        if (service) body.serviceId = service._id;
      } else {
        body.venueId = targetId;
      }
      const res = await bookingApi.create(body);
      setSuccess('Booking request sent! The provider will review it shortly.');
      setCreatedId(res.data.data.booking._id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const estimatedAmount = () => {
    if (kind === 'vendor' && service) {
      switch (service.pricingType) {
        case 'Per Person': return service.price * (Number(guestCount) || 1);
        case 'Per Hour': {
          const mins = (Number(endTime.split(':')[0]) * 60 + Number(endTime.split(':')[1])) - (Number(startTime.split(':')[0]) * 60 + Number(startTime.split(':')[1]));
          return service.price * Math.max(1, Math.round(mins / 60));
        }
        default: return service.price;
      }
    }
    return null;
  };

  return (
    <Modal open={open} onClose={onClose} title={`Book ${targetName}`} wide>
      {success ? (
        <div className="space-y-5">
          <SuccessBanner message={success} />
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={() => { onClose(); navigate('/bookings'); }}>
              View my bookings
            </Button>
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {!user ? (
            <>
              <p className="text-sm text-slate-600">Please log in as a customer to make a booking.</p>
              <Button fullWidth onClick={() => navigate('/login', { state: { from: window.location.pathname } })}>
                Log in to continue
              </Button>
            </>
          ) : user.role !== 'customer' ? (
            <p className="text-sm text-slate-600">Only customer accounts can place bookings.</p>
          ) : (
            <>
              {events.length === 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  You don't have an event yet.{' '}
                  <button className="font-bold underline" onClick={() => navigate('/events/create')}>
                    Create an event first
                  </button>{' '}
                  to book {kind === 'venue' ? 'this venue' : 'this vendor'}.
                </div>
              )}
              {error && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}
              {service && (
                <div className="rounded-lg bg-primary-50 px-4 py-3">
                  <p className="text-sm font-bold text-primary-900">{service.name}</p>
                  <p className="text-xs text-primary-700">
                    {service.pricingType === 'Per Person' && `₹${service.price.toLocaleString('en-IN')} per guest`}
                    {service.pricingType === 'Per Hour' && `₹${service.price.toLocaleString('en-IN')} per hour`}
                    {service.pricingType === 'Fixed' && `₹${service.price.toLocaleString('en-IN')} fixed`}
                    {service.pricingType === 'Custom Quote' && 'Custom quote'}
                  </p>
                  {estimatedAmount() !== null && (
                    <p className="mt-1 text-xs font-bold text-primary-800">Estimated total: ₹{estimatedAmount()!.toLocaleString('en-IN')}</p>
                  )}
                </div>
              )}
              <Select
                id="bk-event"
                label="Your event"
                required
                placeholder={events.length ? 'Select event…' : 'No events yet'}
                options={events.map((e) => ({ value: e._id, label: `${e.name} — ${new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` }))}
                value={eventId}
                onChange={(e) => {
                  setEventId(e.target.value);
                  const ev = events.find((x) => x._id === e.target.value);
                  if (ev) {
                    setDate(new Date(ev.date).toISOString().slice(0, 10));
                    setGuestCount(String(ev.guestCount));
                    if (!service) { setStartTime(ev.startTime || '10:00'); setEndTime(ev.endTime || '14:00'); }
                  }
                }}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <Input id="bk-date" label="Date" type="date" required min={new Date().toISOString().slice(0, 10)} value={date} onChange={(e) => setDate(e.target.value)} />
                <Input id="bk-start" label="Start time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                <Input id="bk-end" label="End time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
              {kind === 'vendor' && (
                <Input id="bk-guests" label="Number of guests" type="number" min={1} value={guestCount} onChange={(e) => setGuestCount(e.target.value)} />
              )}
              <label htmlFor="bk-notes" className="label-base">Notes (optional)</label>
              <textarea
                id="bk-notes"
                rows={2}
                className="input-base resize-y"
                placeholder="Special requests, preferences…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">
                <CalendarPlus size={15} className="shrink-0 text-primary-500" />
                No payment is taken now — you'll pay once your request is confirmed.
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button onClick={submit} loading={loading} disabled={events.length === 0}>
                  Send booking request
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
};
