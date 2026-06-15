import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Clock, User } from 'lucide-react';
import { getNotifications, markNotificationRead } from '../../api';
import Skeleton from '../../components/Skeleton';
import type { Notification, NotificationPage } from '../../types';

export default function OverdueNotifier() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async (pageNum: number, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const data: NotificationPage = await getNotifications({
        page: String(pageNum),
        pageSize: '10',
      });
      if (append) {
        setNotifications((prev) => [...prev, ...data.items]);
      } else {
        setNotifications(data.items);
      }
      setHasMore(data.items.length >= data.pageSize && notifications.length + data.items.length < data.total);
    } catch {
      if (!append) setNotifications([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [notifications.length]);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          const next = page + 1;
          setPage(next);
          fetchNotifications(next, true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // error handled silently
    }
  };

  const typeLabel = (type: Notification['type']) => {
    const map = {
      overdue: { text: '逾期提醒', cls: 'bg-red-100 text-red-600' },
      return: { text: '还书提醒', cls: 'bg-yellow-100 text-yellow-700' },
      system: { text: '系统通知', cls: 'bg-blue-100 text-blue-700' },
    };
    const t = map[type];
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.cls}`}>{t.text}</span>;
  };

  return (
    <div className="page-enter pt-20 pb-10 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-bold text-accent">逾期通知</h1>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-secondary/30 text-center text-gray-400">
            最近7天暂无通知
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkRead(n.id)}
                className={`bg-white rounded-xl p-4 border border-secondary/30 shadow-sm cursor-pointer transition-colors ${
                  n.isRead ? 'opacity-60' : 'hover:border-accent/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0 mt-1">
                    {!n.isRead && (
                      <div className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-red-500" />
                    )}
                    <Bell className={`w-5 h-5 ${n.isRead ? 'text-gray-300' : 'text-accent'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {typeLabel(n.type)}
                      <span className="text-xs text-gray-400">
                        {new Date(n.sentAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{n.content}</p>
                    {n.type === 'overdue' && (
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          读者 #{n.readerId}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(n.sentAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div ref={sentinelRef} className="h-4" />
            {loadingMore && (
              <div className="text-center py-4">
                <Skeleton className="h-8 w-32 mx-auto" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
