import { useEffect, useState } from 'react';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { SubscriptionForm } from '@/modules/subscription/SubscriptionForm';
import { SubscriptionCard } from '@/modules/subscription/SubscriptionCard';
import { CalendarView } from '@/modules/calendar/CalendarView';
import { StatisticsPanel } from '@/modules/stats/StatisticsPanel';
import { subscribe, getSnapshot, markAllAsRead } from '@/utils/notification';
import { Plus, Download, Upload, Bell, BellOff } from 'lucide-react';
import type { Subscription, NotificationItem } from '@/types';

function useNotificationSnapshot() {
  const [items, setItems] = useState<NotificationItem[]>(getSnapshot());
  useEffect(() => {
    return subscribe(() => setItems(getSnapshot()));
  }, []);
  return items;
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton h-20 w-full" />
      ))}
    </div>
  );
}

function SkeletonCalendar() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-48 mx-auto" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="skeleton h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

function SkeletonStats() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-16 w-full" />
      <div className="skeleton h-40 w-40 mx-auto rounded-full" />
      <div className="skeleton h-10 w-full" />
    </div>
  );
}

export default function App() {
  const { subscriptions, loading, init, importSubscriptions, exportSubscriptions } = useSubscriptionStore();
  const [showForm, setShowForm] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const notifications = useNotificationSnapshot();

  useEffect(() => {
    init();
  }, [init]);

  const handleEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingSub(null);
  };

  const handleExport = () => {
    const data = exportSubscriptions();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtracker-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          await importSubscriptions(data);
        }
      } catch {
        // ignore parse errors
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--color-accent)' }}
            >
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              SubTracker
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleImport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ color: 'var(--color-text-secondary)', background: 'var(--color-card)' }}
              title="导入数据"
            >
              <Upload size={14} />
              <span className="hidden sm:inline">导入</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ color: 'var(--color-text-secondary)', background: 'var(--color-card)' }}
              title="导出数据"
            >
              <Download size={14} />
              <span className="hidden sm:inline">导出</span>
            </button>
            <button
              onClick={() => { setShowForm(true); setEditingSub(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all card-hover"
              style={{ background: 'var(--color-accent)' }}
            >
              <Plus size={14} />
              <span>添加订阅</span>
            </button>
          </div>
        </div>
      </header>

      {/* Notifications */}
      <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {notifications.slice(0, 3).map((n) => (
          <div
            key={n.id}
            className="notification-enter rounded-xl px-4 py-3 flex items-start gap-3 shadow-lg border"
            style={{ background: 'var(--color-card)', borderColor: 'var(--color-accent)' }}
          >
            <Bell size={16} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 2 }} />
            <p className="text-xs flex-1" style={{ color: 'var(--color-text)' }}>{n.message}</p>
            <button
              onClick={() => markAllAsRead()}
              className="flex-shrink-0"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <BellOff size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[30%_40%_30%] gap-5">
          {/* Left - Subscription List */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                订阅列表 ({subscriptions.length})
              </h2>
            </div>
            {loading ? (
              <SkeletonList />
            ) : subscriptions.length === 0 ? (
              <div
                className="text-center py-12 rounded-xl border"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  暂无订阅，点击"添加订阅"开始
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
                {subscriptions.map((sub) => (
                  <SubscriptionCard key={sub.id} subscription={sub} onEdit={handleEdit} />
                ))}
              </div>
            )}
          </section>

          {/* Center - Calendar */}
          <section>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              续费日历
            </h2>
            {loading ? (
              <SkeletonCalendar />
            ) : (
              <CalendarView subscriptions={subscriptions} />
            )}
          </section>

          {/* Right - Statistics */}
          <section>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              月度统计
            </h2>
            {loading ? (
              <SkeletonStats />
            ) : (
              <StatisticsPanel subscriptions={subscriptions} />
            )}
          </section>
        </div>
      </main>

      {/* Form Modal */}
      {showForm && (
        <SubscriptionForm subscription={editingSub} onClose={handleCloseForm} />
      )}
    </div>
  );
}
