export type NotificationType = 'completed' | 'reviewed' | 'claimed';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  content: string;
  taskId: string;
  read: boolean;
  createdAt: Date;
}

const STORAGE_KEY = 'microtasks_notifications';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function reviveDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(reviveDates);
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (key === 'createdAt') {
      result[key] = value ? new Date(value) : value;
    } else if (typeof value === 'object' && value !== null) {
      result[key] = reviveDates(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function readFromStorage(): Notification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return reviveDates(parsed);
  } catch {
    return [];
  }
}

function writeToStorage(notifications: Notification[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

export function initNotifications(): Notification[] {
  const existing = readFromStorage();
  if (existing.length > 0) return existing;

  const now = Date.now();
  const mockNotifications: Notification[] = [
    {
      id: generateId(),
      userId: 'user_004',
      type: 'completed',
      content: '您发布的「借用一下电钻，装个书架」任务已被完成，快去确认吧！',
      taskId: 'mock_task_3',
      read: false,
      createdAt: new Date(now - 2 * 60 * 60 * 1000),
    },
    {
      id: generateId(),
      userId: 'user_006',
      type: 'reviewed',
      content: '您发布的「PS修图，帮忙调一下照片色调」任务已被评价，获得5星好评！',
      taskId: 'mock_task_4',
      read: true,
      createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: generateId(),
      userId: 'user_002',
      type: 'claimed',
      content: '您发布的「周末帮忙打扫下房间卫生」任务已被小华认领啦！',
      taskId: 'mock_task_2',
      read: false,
      createdAt: new Date(now - 5 * 60 * 60 * 1000),
    },
  ];

  writeToStorage(mockNotifications);
  return mockNotifications;
}

export function getNotifications(): Notification[] {
  const notifications = readFromStorage();
  if (notifications.length === 0) return initNotifications();
  return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getUnreadCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}

type CreateNotificationData = Omit<Notification, 'id' | 'read' | 'createdAt'>;

export function createNotification(data: CreateNotificationData): Notification {
  const notifications = getNotifications();
  const newNotification: Notification = {
    ...data,
    id: generateId(),
    read: false,
    createdAt: new Date(),
  };
  notifications.unshift(newNotification);
  writeToStorage(notifications);
  return newNotification;
}

export function markAsRead(id: string): Notification | undefined {
  const notifications = getNotifications();
  const index = notifications.findIndex((n) => n.id === id);
  if (index === -1) return undefined;
  notifications[index] = { ...notifications[index], read: true };
  writeToStorage(notifications);
  return notifications[index];
}

export function markAllAsRead(): void {
  const notifications = getNotifications().map((n) => ({ ...n, read: true }));
  writeToStorage(notifications);
}
