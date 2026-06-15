import type { NotificationItem } from '@/types';
import type { NotificationSetting } from '@/types';

let notificationList: NotificationItem[] = [];
let listeners: Array<() => void> = [];
let settings: NotificationSetting = {
  enabled: true,
  soundEnabled: true,
  volume: 0.3,
};

function emitChange() {
  for (const fn of listeners) fn();
}

export function subscribe(listener: () => void): () => void {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function getSnapshot(): NotificationItem[] {
  return notificationList;
}

export function getSettings(): NotificationSetting {
  return { ...settings };
}

export function updateSettings(newSettings: Partial<NotificationSetting>): void {
  settings = { ...settings, ...newSettings };
}

export function addNotification(item: NotificationItem): void {
  if (!settings.enabled) return;
  const exists = notificationList.find((n) => n.subscriptionId === item.subscriptionId && !n.read);
  if (exists) return;
  notificationList = [item, ...notificationList];
  emitChange();
  if (settings.soundEnabled) {
    playNotificationSound(settings.volume);
  }
  setTimeout(() => {
    notificationList = notificationList.filter((n) => n.id !== item.id);
    emitChange();
  }, 5000);
}

export function markAsRead(id: string): void {
  notificationList = notificationList.filter((n) => n.id !== id);
  emitChange();
}

export function markAllAsRead(): void {
  notificationList = [];
  emitChange();
}

export function playNotificationSound(volume: number = 0.3): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // ignore audio errors
  }
}

export function checkExpiringSubscriptions(
  subscriptions: Array<{ id: string; name: string; nextBillingDate: string }>
): void {
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  for (const sub of subscriptions) {
    const billingDate = new Date(sub.nextBillingDate);
    if (billingDate <= threeDaysLater && billingDate >= now) {
      const daysLeft = Math.ceil((billingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      addNotification({
        id: `notif-${sub.id}-${Date.now()}`,
        subscriptionId: sub.id,
        message: `「${sub.name}」将在${daysLeft}天内扣款`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  }
}

let checkInterval: ReturnType<typeof setInterval> | null = null;

export function startExpiryCheck(
  getSubscriptions: () => Array<{ id: string; name: string; nextBillingDate: string }>
): void {
  if (checkInterval) return;
  checkExpiringSubscriptions(getSubscriptions());
  checkInterval = setInterval(() => {
    checkExpiringSubscriptions(getSubscriptions());
  }, 8 * 60 * 60 * 1000);
}

export function stopExpiryCheck(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}
