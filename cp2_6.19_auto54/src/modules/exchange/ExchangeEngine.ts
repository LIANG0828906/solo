import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ExchangeRecord, ExchangeType, ExchangeStatus } from '../../shared/types';
import { loadStorage, updateStorage } from '../../shared/storage';
import { useBookStore } from '../book/BookManager';
import { useAuthStore } from '../user/UserManager';
import { useNotificationStore } from '../user/UserManager';
import { getDaysRemaining } from '../../shared/utils';

interface ExchangeState {
  records: ExchangeRecord[];
  createRequest: (bookId: string, type: ExchangeType) => ExchangeRecord | null;
  confirmRequest: (recordId: string) => void;
  rejectRequest: (recordId: string) => void;
  completeRecord: (recordId: string) => void;
  checkOverdue: () => void;
  getRecordsByUser: (userId: string) => ExchangeRecord[];
  updateDaysRemaining: () => void;
}

const initialData = loadStorage();
const OVERDUE_CHECK_INTERVAL = 3600000;
const DUE_SOON_DAYS = 2;
const LOST_AFTER_DAYS = 3;

function getAdminUser() {
  const authState = useAuthStore.getState();
  const admin = authState.users.find((u) => u.role === 'admin');
  return admin || { id: 'admin-001', name: '管理员' };
}

export const useExchangeStore = create<ExchangeState>((set, get) => {
  const overdueTimer = setInterval(() => {
    get().checkOverdue();
    get().updateDaysRemaining();
  }, OVERDUE_CHECK_INTERVAL);

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      clearInterval(overdueTimer);
    });
  }

  setTimeout(() => {
    get().checkOverdue();
    get().updateDaysRemaining();
  }, 1000);

  return {
    records: initialData.records.map((r) => ({
      ...r,
      daysRemaining: r.dueDate ? getDaysRemaining(r.dueDate) : undefined,
    })),

    createRequest: (bookId, type) => {
      const authState = useAuthStore.getState();
      if (!authState.isLoggedIn()) {
        return null;
      }

      const currentUser = authState.currentUser;
      if (!currentUser) return null;

      const bookStore = useBookStore.getState();
      const book = bookStore.getBook(bookId);
      if (!book) return null;

      if (book.availableQuantity <= 0) {
        return null;
      }

      if (type === 'exchange' && book.exchangeMode === 'borrow_only') {
        return null;
      }
      if (type === 'borrow' && book.exchangeMode === 'exchange_only') {
        return null;
      }

      const admin = getAdminUser();

      const record: ExchangeRecord = {
        id: uuidv4(),
        bookId,
        bookTitle: book.title,
        requesterId: currentUser.id,
        requesterName: currentUser.name,
        acceptorId: admin.id,
        acceptorName: admin.name,
        type,
        status: 'pending',
        createdAt: Date.now(),
      };

      const newRecords = [record, ...get().records];
      set({ records: newRecords });
      updateStorage('records', newRecords);

      bookStore.updateBookQuantity(bookId, -1);

      const notificationStore = useNotificationStore.getState();
      notificationStore.addNotification({
        type: 'info',
        title: '新的交换请求',
        message: `${currentUser.name} 请求${type === 'borrow' ? '借阅' : '交换'}《${book.title}》`,
        userId: admin.id,
      });

      return record;
    },

    confirmRequest: (recordId) => {
      const authState = useAuthStore.getState();
      if (!authState.isAdmin()) {
        return;
      }

      const bookStore = useBookStore.getState();
      const notificationStore = useNotificationStore.getState();

      const newRecords = get().records.map((record) => {
        if (record.id !== recordId) return record;
        if (record.status !== 'pending') return record;

        const book = bookStore.getBook(record.bookId);
        const dueDate = book
          ? Date.now() + book.borrowPeriodDays * 86400000
          : Date.now() + 14 * 86400000;

        notificationStore.addNotification({
          type: 'success',
          title: '请求已确认',
          message: `您的${record.type === 'borrow' ? '借阅' : '交换'}请求《${record.bookTitle}》已被确认`,
          userId: record.requesterId,
        });

        return {
          ...record,
          status: 'active' as ExchangeStatus,
          confirmedAt: Date.now(),
          dueDate,
          daysRemaining: book ? book.borrowPeriodDays : 14,
        };
      });

      set({ records: newRecords });
      updateStorage('records', newRecords);
    },

    rejectRequest: (recordId) => {
      const authState = useAuthStore.getState();
      if (!authState.isAdmin()) {
        return;
      }

      const bookStore = useBookStore.getState();
      const notificationStore = useNotificationStore.getState();

      const newRecords = get().records.map((record) => {
        if (record.id !== recordId) return record;
        if (record.status !== 'pending') return record;

        bookStore.updateBookQuantity(record.bookId, 1);

        notificationStore.addNotification({
          type: 'warning',
          title: '请求已拒绝',
          message: `您的${record.type === 'borrow' ? '借阅' : '交换'}请求《${record.bookTitle}》已被拒绝`,
          userId: record.requesterId,
        });

        return {
          ...record,
          status: 'rejected' as ExchangeStatus,
        };
      });

      set({ records: newRecords });
      updateStorage('records', newRecords);
    },

    completeRecord: (recordId) => {
      const authState = useAuthStore.getState();
      if (!authState.isAdmin()) {
        return;
      }

      const bookStore = useBookStore.getState();
      const notificationStore = useNotificationStore.getState();

      const newRecords = get().records.map((record) => {
        if (record.id !== recordId) return record;
        if (record.status !== 'active' && record.status !== 'overdue') return record;

        bookStore.updateBookQuantity(record.bookId, 1);

        notificationStore.addNotification({
          type: 'success',
          title: '归还完成',
          message: `《${record.bookTitle}》已完成归还，感谢您的使用`,
          userId: record.requesterId,
        });

        return {
          ...record,
          status: 'completed' as ExchangeStatus,
          completedAt: Date.now(),
          daysRemaining: 0,
        };
      });

      set({ records: newRecords });
      updateStorage('records', newRecords);
    },

    checkOverdue: () => {
      const notificationStore = useNotificationStore.getState();
      const bookStore = useBookStore.getState();
      const admin = getAdminUser();
      const now = Date.now();

      const newRecords = get().records.map((record) => {
        if (record.status !== 'active' || !record.dueDate) return record;

        const daysRemaining = getDaysRemaining(record.dueDate);
        let newStatus = record.status as ExchangeStatus;
        let updated = false;

        if (daysRemaining === DUE_SOON_DAYS) {
          notificationStore.addNotification({
            type: 'warning',
            title: '借阅即将到期',
            message: `《${record.bookTitle}》将在 ${DUE_SOON_DAYS} 天后到期，请及时归还`,
            userId: record.requesterId,
          });
        }

        if (daysRemaining === 0 && newStatus !== 'overdue') {
          newStatus = 'overdue';
          updated = true;
          notificationStore.addNotification({
            type: 'error',
            title: '借阅已逾期',
            message: `《${record.bookTitle}》已超过借阅期限，请尽快归还`,
            userId: record.requesterId,
          });
        }

        if (daysRemaining <= -LOST_AFTER_DAYS && newStatus !== 'lost' && newStatus !== 'overdue') {
          newStatus = 'lost';
          updated = true;
          bookStore.updateBookQuantity(record.bookId, 1);
          notificationStore.addNotification({
            type: 'error',
            title: '图书已标记为丢失',
            message: `《${record.bookTitle}》已逾期 ${LOST_AFTER_DAYS} 天未归还，已标记为丢失`,
            userId: admin.id,
          });
        }

        if (updated || daysRemaining !== record.daysRemaining) {
          return {
            ...record,
            status: newStatus,
            daysRemaining,
          };
        }

        return record;
      });

      const recordsChanged = newRecords.some((r, i) => r !== get().records[i]);
      if (recordsChanged) {
        set({ records: newRecords });
        updateStorage('records', newRecords);
      }

      const storage = loadStorage();
      if (now - storage.meta.lastOverdueCheck > OVERDUE_CHECK_INTERVAL) {
        const newMeta = { ...storage.meta, lastOverdueCheck: now };
        updateStorage('meta', newMeta as unknown as typeof storage.meta);
      }
    },

    updateDaysRemaining: () => {
      const newRecords = get().records.map((record) => {
        if (!record.dueDate) return record;
        if (record.status === 'completed' || record.status === 'rejected' || record.status === 'lost') {
          return record;
        }
        const daysRemaining = getDaysRemaining(record.dueDate);
        if (daysRemaining !== record.daysRemaining) {
          return { ...record, daysRemaining };
        }
        return record;
      });

      const changed = newRecords.some((r, i) => r.daysRemaining !== get().records[i]?.daysRemaining);
      if (changed) {
        set({ records: newRecords });
        updateStorage('records', newRecords);
      }
    },

    getRecordsByUser: (userId) => {
      return get().records.filter((r) => r.requesterId === userId || r.acceptorId === userId);
    },
  };
});
