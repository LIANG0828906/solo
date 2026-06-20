import { useEffect, useState } from 'react';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { SubscriptionForm } from '@/modules/subscription/SubscriptionForm';
import { SubscriptionCard } from '@/modules/subscription/SubscriptionCard';
import { CalendarView } from '@/modules/calendar/CalendarView';
import { StatisticsPanel } from '@/modules/stats/StatisticsPanel';
import { subscribe, getSnapshot, markAsRead, markAllAsRead, getSettings, updateSettings } from '@/utils/notification';
import { Plus, Download, Upload, Bell, BellOff, Settings, X, Volume2, VolumeX } from 'lucide-react';
import type { Subscription, NotificationItem, NotificationSetting } from '@/types';

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
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting>(getSettings());
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
        if (!validateSubscriptionData(data)) {
          alert('JSON文件格式不正确，请检查数据格式');
          return;
        }
        await importSubscriptions(data);
      } catch (err) {
        alert('导入失败：JSON文件格式损坏或无法解析');
      }
    };
    input.click();
  };

  const validateSubscriptionData = (data: unknown): data is Subscription[] => {
    if (!Array.isArray(data)) return false;
    return data.every((item) => {
      if (typeof item !== 'object' || item === null) return false;
      const sub = item as Record<string, unknown>;
      return (
        typeof sub.id === 'string' &&
        typeof sub.name === 'string' &&
        typeof sub.price === 'number' &&
        typeof sub.billingCycle === 'string' &&
        ['monthly', 'quarterly', 'yearly'].includes(sub.billingCycle as string) &&
        typeof sub.nextBillingDate === 'string' &&
        typeof sub.category === 'string' &&
        ['entertainment', 'tool', 'storage', 'other'].includes(sub.category as string) &&
        typeof sub.note === 'string'
      );
    });
  };

  const handleSaveSettings = (newSettings: Partial<NotificationSetting>) => {
    updateSettings(newSettings);
    setNotificationSettings(getSettings());
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
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ color: 'var(--color-text-secondary)', background: 'var(--color-card)' }}
              title="设置"
            >
              <Settings size={14} />
            </button>
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
              onClick={() => markAsRead(n.id)}
              className="flex-shrink-0"
              style={{ color: 'var(--color-text-secondary)' }}
              title="标记已读"
            >
              <BellOff size={14} />
            </button>
          </div>
        ))}
        {notifications.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-[10px] text-right pr-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            全部已读
          </button>
        )}
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

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                通知设置
              </h3>
              <button onClick={() => setShowSettings(false)} style={{ color: 'var(--color-text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    到期提醒通知
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                    订阅到期前3天内弹出通知
                  </p>
                </div>
                <button
                  onClick={() => handleSaveSettings({ enabled: !notificationSettings.enabled })}
                  className={`w-12 h-6 rounded-full transition-colors relative`}
                  style={{ background: notificationSettings.enabled ? 'var(--color-accent)' : 'var(--color-border)' }}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                    style={{
                      left: notificationSettings.enabled ? '26px' : '2px',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    提示音效
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                    弹出通知时播放提示音
                  </p>
                </div>
                <button
                  onClick={() => handleSaveSettings({ soundEnabled: !notificationSettings.soundEnabled })}
                  className={`w-12 h-6 rounded-full transition-colors relative`}
                  style={{
                    background: notificationSettings.soundEnabled ? 'var(--color-accent)' : 'var(--color-border)',
                    opacity: notificationSettings.enabled ? 1 : 0.5,
                  }}
                  disabled={!notificationSettings.enabled}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                    style={{
                      left: notificationSettings.soundEnabled ? '26px' : '2px',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>

              {notificationSettings.soundEnabled && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      音量
                    </p>
                    <div className="flex items-center gap-1">
                      <VolumeX size={14} style={{ color: 'var(--color-text-secondary)' }} />
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {Math.round(notificationSettings.volume * 100)}%
                      </span>
                      <Volume2 size={14} style={{ color: 'var(--color-text-secondary)' }} />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={notificationSettings.volume}
                    onChange={(e) => handleSaveSettings({ volume: parseFloat(e.target.value) })}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${notificationSettings.volume * 100}%, var(--color-border) ${notificationSettings.volume * 100}%, var(--color-border) 100%)`,
                    }}
                  />
                </div>
              )}

              <button
                onClick={() => setShowSettings(false)}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white mt-2"
                style={{ background: 'var(--color-accent)' }}
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
