import { useState } from 'react';
import { ShieldCheck, CreditCard, Smartphone, Landmark, Wallet } from 'lucide-react';
import { paymentApi, getErrorMessage } from '../services/api';
import type { Booking } from '../types';
import { Modal, Button } from './ui';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/format';

const METHODS = [
  { id: 'upi', label: 'UPI', desc: 'GPay, PhonePe, Paytm', icon: Smartphone },
  { id: 'card', label: 'Card', desc: 'Credit / debit card', icon: CreditCard },
  { id: 'netbanking', label: 'Net Banking', desc: 'All major banks', icon: Landmark },
  { id: 'wallet', label: 'Wallet', desc: 'Wallet balance', icon: Wallet },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  booking: Booking | null;
  onPaid: () => void;
}

export const PaymentModal = ({ open, onClose, booking, onPaid }: Props) => {
  const [method, setMethod] = useState<string>('upi');
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  if (!booking) return null;

  const pay = async () => {
    setPaying(true); setError('');
    try {
      await paymentApi.pay(booking._id, method);
      toast('success', 'Payment successful!');
      setDone(true);
      setTimeout(() => {
        onPaid();
        onClose();
        setDone(false);
      }, 1400);
    } catch (err) {
      setError(getErrorMessage(err));
      setPaying(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Complete payment">
      {done ? (
        <div className="py-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <ShieldCheck size={28} />
          </span>
          <p className="mt-4 text-lg font-extrabold text-slate-900">Payment successful!</p>
          <p className="mt-1 text-sm text-slate-500">Your receipt is available in payments.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Amount summary */}
          <div className="flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3.5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-500">Amount payable</p>
              {typeof booking.vendorId === 'object' && booking.vendorId?.businessName && (
                <p className="text-xs text-slate-500">{booking.vendorId.businessName}</p>
              )}
              {typeof booking.venueId === 'object' && booking.venueId?.name && (
                <p className="text-xs text-slate-500">{booking.venueId.name}</p>
              )}
            </div>
            <p className="text-xl font-extrabold text-primary-700">{formatCurrency(booking.amount)}</p>
          </div>

          {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{error}</div>}

          {/* Method picker */}
          <fieldset>
            <legend className="label-base">Choose payment method</legend>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map(({ id, label, desc, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={method === id}
                  onClick={() => setMethod(id)}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition ${
                    method === id
                      ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600'
                      : 'border-slate-200 hover:border-primary-300'
                  }`}
                >
                  <Icon size={18} className={method === id ? 'mt-0.5 text-primary-600' : 'mt-0.5 text-slate-400'} />
                  <span>
                    <span className="block text-sm font-bold text-slate-900">{label}</span>
                    <span className="block text-[11px] text-slate-400">{desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-[11px] text-slate-500">
            <ShieldCheck size={14} className="shrink-0 text-emerald-500" />
            Demo gateway — no real money will be charged.
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={pay} loading={paying}>
              Pay {formatCurrency(booking.amount)}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
