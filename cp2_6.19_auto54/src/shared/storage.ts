import type { AppStorage, Book, ExchangeRecord, Notification, User } from './types';

const STORAGE_KEY = 'book_exchange_app_v1';
const STORAGE_VERSION = 1;

const defaultAdmin: User = {
  id: 'admin-001',
  name: '管理员',
  role: 'admin',
  createdAt: Date.now(),
};

const sampleBooks: Book[] = [
  {
    id: 'book-001',
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    category: '小说',
    isbn: '9787544291170',
    totalQuantity: 3,
    availableQuantity: 3,
    exchangeMode: 'both',
    borrowPeriodDays: 14,
    status: 'available',
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'book-002',
    title: '人类简史',
    author: '尤瓦尔·赫拉利',
    category: '非小说',
    isbn: '9787508647357',
    totalQuantity: 2,
    availableQuantity: 2,
    exchangeMode: 'borrow_only',
    borrowPeriodDays: 21,
    status: 'available',
    createdAt: Date.now() - 86400000 * 20,
  },
  {
    id: 'book-003',
    title: '深入理解计算机系统',
    author: 'Randal E. Bryant',
    category: '技术',
    isbn: '9787111544937',
    totalQuantity: 1,
    availableQuantity: 1,
    exchangeMode: 'both',
    borrowPeriodDays: 30,
    status: 'available',
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'book-004',
    title: '艺术的故事',
    author: '贡布里希',
    category: '艺术',
    isbn: '9787807463726',
    totalQuantity: 2,
    availableQuantity: 2,
    exchangeMode: 'exchange_only',
    borrowPeriodDays: 14,
    status: 'available',
    createdAt: Date.now() - 86400000 * 5,
  },
];

export function getInitialStorage(): AppStorage {
  return {
    auth: {
      users: [defaultAdmin],
      currentUserId: null,
    },
    books: sampleBooks,
    records: [],
    notifications: [],
    meta: {
      version: STORAGE_VERSION,
      lastOverdueCheck: Date.now(),
    },
  };
}

export function loadStorage(): AppStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialStorage();
      saveStorage(initial);
      return initial;
    }
    const data = JSON.parse(raw) as AppStorage;
    if (data.meta?.version !== STORAGE_VERSION) {
      const initial = getInitialStorage();
      saveStorage(initial);
      return initial;
    }
    return data;
  } catch {
    const initial = getInitialStorage();
    saveStorage(initial);
    return initial;
  }
}

export function saveStorage(data: AppStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export function updateStorage<K extends keyof AppStorage>(
  key: K,
  value: AppStorage[K]
): void {
  const storage = loadStorage();
  storage[key] = value;
  saveStorage(storage);
}

export function getUsers(): User[] {
  return loadStorage().auth.users;
}

export function getBooks(): Book[] {
  return loadStorage().books;
}

export function getRecords(): ExchangeRecord[] {
  return loadStorage().records;
}

export function getNotifications(): Notification[] {
  return loadStorage().notifications;
}

export function getCurrentUserId(): string | null {
  return loadStorage().auth.currentUserId;
}
