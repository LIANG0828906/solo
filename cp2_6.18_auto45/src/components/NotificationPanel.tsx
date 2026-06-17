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

  const handleToggle = () => {
    setOpen((prev) => !prev);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleToggle}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          'hover:bg-slate-100 text-slate-600 hover:text-slate-800',
        )}
        aria-label="通知"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              minWidth: 18,
              height: 18,
              paddingLeft: 4,
              paddingRight: 4,
              borderRadius: 9999,
              background: '#EF4444',
              color: 'white',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            marginTop: 8,
            width: 320,
            background: 'white',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            border: '1px solid #E5E7EB',
            zIndex: 50,
            overflow: 'hidden',
            transformOrigin: 'top right',
            animation: 'fadeInDown 0.2s ease-out',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid #F3F4F6',
              background: '#F9FAFB',
            }}
          >
            <h3 style={{ fontWeight: 600, color: '#1E293B', fontSize: 14 }}>
              通知消息
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <CheckCheck size={14} />
                全部已读
              </button>
            )}
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {userNotifications.length === 0 ? (
              <div
                style={{
                  padding: '48px 16px',
                  textAlign: 'center',
                  color: '#94A3B8',
                  fontSize: 14,
                }}
              >
                暂无通知
              </div>
            ) : (
              userNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.read) onMarkRead(n.id);
                  }}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #F9FAFB',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    background: n.read ? 'transparent' : '#EFF6FF',
                    borderRadius: 8,
                    margin: 4,
                    boxShadow: n.read ? 'none' : '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = n.read ? '#F9FAFB' : '#DBEAFE';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = n.read ? 'transparent' : '#EFF6FF';
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 13,
                          lineHeight: 1.5,
                          color: n.read ? '#64748B' : '#1E293B',
                          fontWeight: n.read ? 400 : 500,
                          wordBreak: 'break-word',
                        }}
                      >
                        {n.content}
                      </p>
                      <div style={{ marginTop: 4, fontSize: 12, color: '#94A3B8' }}>
                        {formatTime(n.createdAt)}
                      </div>
                    </div>
                    {!n.read && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#EF4444',
                          marginTop: 6,
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div
            style={{
              padding: '8px 16px',
              borderTop: '1px solid #F3F4F6',
              background: '#F9FAFB',
            }}
          >
            <button
              onClick={() => setOpen(false)}
              style={{
                width: '100%',
                padding: '6px 0',
                fontSize: 12,
                color: '#64748B',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 6,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#1E293B')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
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
