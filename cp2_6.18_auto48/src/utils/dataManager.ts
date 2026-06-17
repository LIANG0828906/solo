import { v4 as uuidv4 } from 'uuid';

export type ItemCategory = '书籍' | '衣物' | '文具' | '玩具' | '其他';
export type ItemCondition = '全新' | '九成新' | '七成新';
export type ItemStatus = '待认领' | '已认领' | '已完成';

export interface DonationItem {
  id: string;
  name: string;
  category: ItemCategory;
  condition: ItemCondition;
  contactWechat: string;
  description: string;
  image: string;
  status: ItemStatus;
  location: string;
  createdAt: string;
}

export interface ClaimRecord {
  id: string;
  itemId: string;
  claimantName: string;
  claimantContact: string;
  claimedAt: string;
  status: '待确认' | '已完成';
}

const ITEMS_KEY = 'donation_items';
const CLAIMS_KEY = 'donation_claims';
const NOTIFICATIONS_KEY = 'donation_notifications';

export interface Notification {
  id: string;
  itemId: string;
  itemName: string;
  message: string;
  read: boolean;
  createdAt: string;
}

function readFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function writeToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getAllItems(): DonationItem[] {
  return readFromStorage<DonationItem[]>(ITEMS_KEY, []);
}

export function getItemById(id: string): DonationItem | undefined {
  const items = getAllItems();
  return items.find((item) => item.id === id);
}

export interface AddItemInput {
  name: string;
  category: ItemCategory;
  condition: ItemCondition;
  contactWechat: string;
  description: string;
  image: string;
  location?: string;
}

export function addItem(input: AddItemInput): DonationItem {
  const items = getAllItems();
  const newItem: DonationItem = {
    id: uuidv4(),
    name: input.name,
    category: input.category,
    condition: input.condition,
    contactWechat: input.contactWechat,
    description: input.description,
    image: input.image,
    status: '待认领',
    location: input.location || '本社区',
    createdAt: new Date().toISOString(),
  };
  items.unshift(newItem);
  writeToStorage(ITEMS_KEY, items);
  return newItem;
}

export function updateItemStatus(id: string, status: ItemStatus): DonationItem | undefined {
  const items = getAllItems();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return undefined;
  items[index].status = status;
  writeToStorage(ITEMS_KEY, items);
  return items[index];
}

export function getAllClaims(): ClaimRecord[] {
  return readFromStorage<ClaimRecord[]>(CLAIMS_KEY, []);
}

export function getClaimsByItemId(itemId: string): ClaimRecord[] {
  return getAllClaims().filter((claim) => claim.itemId === itemId);
}

export interface AddClaimInput {
  itemId: string;
  claimantName: string;
  claimantContact: string;
}

export function addClaim(input: AddClaimInput): ClaimRecord {
  const claims = getAllClaims();
  const newClaim: ClaimRecord = {
    id: uuidv4(),
    itemId: input.itemId,
    claimantName: input.claimantName,
    claimantContact: input.claimantContact,
    claimedAt: new Date().toISOString(),
    status: '待确认',
  };
  claims.push(newClaim);
  writeToStorage(CLAIMS_KEY, claims);
  return newClaim;
}

export function updateClaimStatus(claimId: string, status: '待确认' | '已完成'): ClaimRecord | undefined {
  const claims = getAllClaims();
  const index = claims.findIndex((claim) => claim.id === claimId);
  if (index === -1) return undefined;
  claims[index].status = status;
  writeToStorage(CLAIMS_KEY, claims);
  return claims[index];
}

export function getNotifications(): Notification[] {
  return readFromStorage<Notification[]>(NOTIFICATIONS_KEY, []);
}

export function addNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>): Notification {
  const notifications = getNotifications();
  const newNotification: Notification = {
    ...notification,
    id: uuidv4(),
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(newNotification);
  writeToStorage(NOTIFICATIONS_KEY, notifications);
  return newNotification;
}

export function markNotificationRead(id: string): void {
  const notifications = getNotifications();
  const index = notifications.findIndex((n) => n.id === id);
  if (index !== -1) {
    notifications[index].read = true;
    writeToStorage(NOTIFICATIONS_KEY, notifications);
  }
}

export function markAllNotificationsRead(): void {
  const notifications = getNotifications().map((n) => ({ ...n, read: true }));
  writeToStorage(NOTIFICATIONS_KEY, notifications);
}

export function getUnreadNotificationCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}

export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 30) return `${diffDay}天前`;
  return date.toLocaleDateString('zh-CN');
}
