import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { notificationApi } from '../services/api';
import type { AppNotification } from '../types';
import { timeAgo } from '../utils/format';

export const NotificationDropdown = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    notificationApi
      .list({ limit: 8 })
      .then((res) => {
        setItems(res.data.data.notifications as AppNotification[]);
        setUnread(res.data.data.unread);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markRead = async (n: AppNotification) => {
    if (n.read) return;
    await notificationApi.markRead(n._id).catch(() => {});
    load();
  };

  const markAll = async () => {
    await notificationApi.markAllRead().catch(() => {});
    load();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications (${unread} unread)`}
        className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-bold text-slate-900">Notifications</p>
            {unread > 0 && (
              <button onClick={markAll} className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800">
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-400">No notifications yet</p>
            ) : (
              items.map((n) => (
                <button
                  key={n._id}
                  onClick={() => markRead(n)}
                  className={`flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${!n.read ? 'bg-primary-50/50' : ''}`}
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-slate-200' : 'bg-primary-500'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={`truncate text-sm ${n.read ? 'font-medium text-slate-600' : 'font-bold text-slate-900'}`}>{n.title}</span>
                      <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(n.createdAt)}</span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{n.message}</span>
                    {n.link && !n.read && (
                      <Link to={n.link} onClick={() => markRead(n)} className="mt-1 inline-block text-xs font-semibold text-primary-600 hover:underline">
                        View →
                      </Link>
                    )}
                  </span>
                  {!n.read && <Check size={13} className="mt-1 shrink-0 text-primary-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
