import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import type { Notification } from '../types';
import { cn } from '../lib/utils';

interface NotificationPanelProps {
  notifications: Notification[];
  currentUserId: string;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

function formatTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

const typeColors: Record<string, string> = {
  completed: 'border-l-emerald-500 bg-emerald-50/40',
  reviewed: 'border-l-blue-500 bg-blue-50/40',
  claimed: 'border-l-amber-500 bg-amber-50/40',
};

export function NotificationPanel({
  notifications,
  currentUserId,
  onMarkRead,
  onMarkAllRead,
}: NotificationPanelProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const userNotifications = notifications.filter((n) => n.userId === currentUserId);
  const unreadCount = userNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          'hover:bg-slate-100 text-slate-600 hover:text-slate-800',
        )}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden origin-top-right">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800 text-sm">通知消息</h3>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <CheckCheck size={14} />
                全部已读
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {userNotifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">暂无通知</div>
            ) : (
              userNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.read) onMarkRead(n.id);
                  }}
                  className={cn(
                    'px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors',
                    'border-l-4 hover:bg-slate-50/80',
                    typeColors[n.type] || 'border-l-slate-200',
                    n.read ? 'opacity-70' : '',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        'text-sm leading-relaxed',
                        n.read ? 'text-slate-600' : 'text-slate-800 font-medium',
                      )}
                    >
                      {n.content}
                    </p>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    )}
                  </div>
                  <div className="mt-1.5 text-xs text-slate-400">
                    {formatTime(n.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={() => setOpen(false)}
              className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationPanel;
