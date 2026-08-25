import { ReactNode, ButtonHTMLAttributes, CSSProperties } from 'react';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export const Card = ({
  children,
  className = '',
  onClick,
  hover,
  style,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  style?: CSSProperties;
}) => (
  <div
    className={`card-base ${onClick || hover ? 'cursor-pointer transition hover:shadow-card-hover' : ''} ${className}`}
    onClick={onClick}
    style={style}
  >
    {children}
  </div>
);

export const SectionTitle = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
    </div>
    {action}
  </div>
);

type BadgeColor = 'gray' | 'blue' | 'green' | 'yellow' | 'amber' | 'red' | 'purple' | 'indigo';

const badgeColors: Record<BadgeColor, string> = {
  gray: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-emerald-50 text-emerald-700',
  yellow: 'bg-amber-50 text-amber-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  purple: 'bg-purple-50 text-purple-700',
  indigo: 'bg-indigo-50 text-indigo-700',
};

export const Badge = ({ color = 'gray', children, className = '' }: { color?: BadgeColor; children: ReactNode; className?: string }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeColors[color]} ${className}`}>
    {children}
  </span>
);

export const statusBadgeColor = (status: string): BadgeColor => {
  switch (status) {
    case 'confirmed': case 'completed': case 'active': case 'approved': case 'paid': case 'successful': return 'green';
    case 'pending': case 'planning': case 'unpaid': case 'in-progress': return 'amber';
    case 'rejected': case 'cancelled': case 'failed': case 'declined': case 'suspended': case 'hidden': return 'red';
    case 'upcoming': case 'ongoing': case 'visible': return 'blue';
    default: return 'gray';
  }
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}

export const Modal = ({ open, onClose, title, children, wide }: ModalProps) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative max-h-[90vh] w-full overflow-y-auto rounded-xl bg-white shadow-xl ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} aria-label="Close dialog" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
};

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({ open, title, message, confirmLabel = 'Confirm', danger, loading, onConfirm, onCancel }: ConfirmDialogProps) => (
  <Modal open={open} onClose={onCancel} title={title}>
    <p className="text-sm text-slate-600">{message}</p>
    <div className="mt-6 flex justify-end gap-3">
      <button onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={loading}
        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'}`}
      >
        {loading ? 'Working…' : confirmLabel}
      </button>
    </div>
  </Modal>
);

interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  count?: number;
}

export const Tabs = ({ tabs, active, onChange }: { tabs: Tab[]; active: string; onChange: (id: string) => void }) => (
  <div className="overflow-x-auto border-b border-slate-200" role="tablist">
    <div className="flex min-w-max gap-1 px-1">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              isActive ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            {Icon && <Icon size={16} />}
            {t.label}
            {t.count !== undefined && (
              <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[11px] font-bold ${isActive ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'}`}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);
