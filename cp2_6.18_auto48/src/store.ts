import { create } from 'zustand';
import type {
  DonationItem,
  ClaimRecord,
  Notification,
  ItemStatus,
  AddItemInput,
  AddClaimInput,
} from './utils/dataManager';
import {
  getAllItems,
  addItem as dmAddItem,
  updateItemStatus as dmUpdateItemStatus,
  getAllClaims,
  addClaim as dmAddClaim,
  updateClaimStatus as dmUpdateClaimStatus,
  getNotifications,
  addNotification as dmAddNotification,
  markNotificationRead as dmMarkNotificationRead,
  markAllNotificationsRead as dmMarkAllNotificationsRead,
  getUnreadNotificationCount,
} from './utils/dataManager';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppStore {
  items: DonationItem[];
  claims: ClaimRecord[];
  notifications: Notification[];
  unreadCount: number;
  toast: ToastState;
  loadData: () => void;
  addItem: (input: AddItemInput) => DonationItem;
  claimItem: (input: AddClaimInput) => ClaimRecord | null;
  completeDonation: (itemId: string) => void;
  loadNotifications: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  showToast: (message: string, type?: ToastState['type']) => void;
  hideToast: () => void;
}

let toastTimer: number | null = null;

export const useAppStore = create<AppStore>((set, get) => ({
  items: [],
  claims: [],
  notifications: [],
  unreadCount: 0,
  toast: { show: false, message: '', type: 'info' },

  loadData: () => {
    const items = getAllItems();
    const claims = getAllClaims();
    const notifications = getNotifications();
    set({
      items,
      claims,
      notifications,
      unreadCount: getUnreadNotificationCount(),
    });
  },

  addItem: (input) => {
    const newItem = dmAddItem(input);
    set((state) => ({ items: [newItem, ...state.items] }));
    get().showToast('物品发布成功', 'success');
    return newItem;
  },

  claimItem: (input) => {
    const { items } = get();
    const item = items.find((i) => i.id === input.itemId);
    if (!item || item.status !== '待认领') {
      get().showToast('该物品已被认领', 'error');
      return null;
    }
    const newClaim = dmAddClaim(input);
    dmUpdateItemStatus(input.itemId, '已认领');
    dmAddNotification({
      itemId: item.id,
      itemName: item.name,
      message: `物品「${item.name}」已被 ${input.claimantName} 认领`,
    });
    set((state) => ({
      claims: [...state.claims, newClaim],
      items: state.items.map((i) =>
        i.id === input.itemId ? { ...i, status: '已认领' as ItemStatus } : i
      ),
      notifications: getNotifications(),
      unreadCount: getUnreadNotificationCount(),
    }));
    get().showToast('认领成功', 'success');
    return newClaim;
  },

  completeDonation: (itemId) => {
    const { items, claims } = get();
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    dmUpdateItemStatus(itemId, '已完成');
    const itemClaims = claims.filter((c) => c.itemId === itemId && c.status === '待确认');
    itemClaims.forEach((c) => dmUpdateClaimStatus(c.id, '已完成'));
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, status: '已完成' as ItemStatus } : i
      ),
      claims: state.claims.map((c) =>
        c.itemId === itemId && c.status === '待确认' ? { ...c, status: '已完成' } : c
      ),
    }));
    get().showToast('已确认捐赠完成', 'success');
  },

  loadNotifications: () => {
    set({
      notifications: getNotifications(),
      unreadCount: getUnreadNotificationCount(),
    });
  },

  markNotificationRead: (id) => {
    dmMarkNotificationRead(id);
    set({
      notifications: getNotifications(),
      unreadCount: getUnreadNotificationCount(),
    });
  },

  markAllNotificationsRead: () => {
    dmMarkAllNotificationsRead();
    set({
      notifications: getNotifications(),
      unreadCount: 0,
    });
  },

  showToast: (message, type = 'info') => {
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    set({ toast: { show: true, message, type } });
    toastTimer = window.setTimeout(() => {
      set({ toast: { show: false, message: '', type: 'info' } });
    }, 3000);
  },

  hideToast: () => {
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    set({ toast: { show: false, message: '', type: 'info' } });
  },
}));
