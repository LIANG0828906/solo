import { MenuItem, Order, OrderStatus } from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'OrderFlowDB';
const DB_VERSION = 3;

const STORES = {
  MENU: 'menu',
  ORDERS: 'orders',
  META: 'meta'
};

let db: IDBDatabase | null = null;

export const initDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      if (!database.objectStoreNames.contains(STORES.MENU)) {
        const menuStore = database.createObjectStore(STORES.MENU, { keyPath: 'id' });
        menuStore.createIndex('category', 'category', { unique: false });
      }

      if (!database.objectStoreNames.contains(STORES.ORDERS)) {
        const ordersStore = database.createObjectStore(STORES.ORDERS, { keyPath: 'id' });
        ordersStore.createIndex('status', 'status', { unique: false });
        ordersStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!database.objectStoreNames.contains(STORES.META)) {
        database.createObjectStore(STORES.META, { keyPath: 'key' });
      }

      if (oldVersion >= 1 && oldVersion < 3) {
        const tx = (event.target as IDBOpenDBRequest).transaction;
        if (tx) {
          const menuStore = tx.objectStore(STORES.MENU);
          menuStore.clear();
        }
      }

      const tx = (event.target as IDBOpenDBRequest).transaction;
      if (tx) {
        tx.oncomplete = () => {
          seedInitialData(database);
        };
      }
    };
  });
};

const seedInitialData = (database: IDBDatabase) => {
  const transaction = database.transaction(STORES.MENU, 'readwrite');
  const menuStore = transaction.objectStore(STORES.MENU);
  const countRequest = menuStore.count();

  countRequest.onsuccess = () => {
    if (countRequest.result > 0) return;

    const initialMenu: MenuItem[] = [
      { id: uuidv4(), name: '经典牛肉堡', category: 'burger', price: 28, emoji: '🍔', stock: 50, enabled: true, description: '100%纯牛肉饼配新鲜蔬菜' },
      { id: uuidv4(), name: '双层芝士堡', category: 'burger', price: 35, emoji: '🧀', stock: 45, enabled: true, description: '双层牛肉配浓郁芝士酱' },
      { id: uuidv4(), name: '香辣鸡腿堡', category: 'burger', price: 26, emoji: '🌶️', stock: 40, enabled: true, description: '香酥鸡腿排配秘制辣酱' },
      { id: uuidv4(), name: '培根牛肉堡', category: 'burger', price: 32, emoji: '🥓', stock: 35, enabled: true, description: '烟熏培根配厚切牛肉饼' },
      { id: uuidv4(), name: '鱼排堡', category: 'burger', price: 24, emoji: '🐟', stock: 30, enabled: true, description: '酥脆鱼排配塔塔酱' },
      { id: uuidv4(), name: '蔬菜堡', category: 'burger', price: 22, emoji: '🥬', stock: 25, enabled: true, description: '新鲜时蔬配牛油果酱' },
      { id: uuidv4(), name: '薯条', category: 'snack', price: 12, emoji: '🍟', stock: 100, enabled: true, description: '金黄酥脆现炸薯条' },
      { id: uuidv4(), name: '鸡块', category: 'snack', price: 15, emoji: '🍗', stock: 80, enabled: true, description: '外酥里嫩香辣鸡块' },
      { id: uuidv4(), name: '洋葱圈', category: 'snack', price: 10, emoji: '🧅', stock: 60, enabled: true, description: '香脆洋葱圈配番茄酱' },
      { id: uuidv4(), name: '鸡翅', category: 'snack', price: 18, emoji: '🍖', stock: 50, enabled: true, description: '蜜汁烤鸡翅鲜嫩多汁' },
      { id: uuidv4(), name: '玉米杯', category: 'snack', price: 8, emoji: '🌽', stock: 70, enabled: true, description: '甜玉米粒配黄油酱' },
      { id: uuidv4(), name: '沙拉', category: 'snack', price: 16, emoji: '🥗', stock: 40, enabled: true, description: '新鲜蔬果配凯撒酱' },
      { id: uuidv4(), name: '可乐', category: 'drink', price: 8, emoji: '🥤', stock: 120, enabled: true, description: '冰爽碳酸经典可乐' },
      { id: uuidv4(), name: '橙汁', category: 'drink', price: 12, emoji: '🍊', stock: 60, enabled: true, description: '鲜榨橙汁维C满满' },
      { id: uuidv4(), name: '咖啡', category: 'drink', price: 15, emoji: '☕', stock: 50, enabled: true, description: '现磨阿拉比卡咖啡豆' },
      { id: uuidv4(), name: '奶茶', category: 'drink', price: 14, emoji: '🧋', stock: 45, enabled: true, description: '丝滑奶茶配Q弹珍珠' },
      { id: uuidv4(), name: '牛奶', category: 'drink', price: 10, emoji: '🥛', stock: 40, enabled: true, description: '新鲜全脂纯牛奶' },
      { id: uuidv4(), name: '柠檬水', category: 'drink', price: 9, emoji: '🍋', stock: 55, enabled: true, description: '清新柠檬配蜂蜜调味' }
    ];

    initialMenu.forEach(item => menuStore.add(item));
  };
};

export const getAllMenuItems = (): Promise<MenuItem[]> => {
  return new Promise((resolve, reject) => {
    if (!db) { reject(new Error('DB not initialized')); return; }
    
    const transaction = db.transaction(STORES.MENU, 'readonly');
    const store = transaction.objectStore(STORES.MENU);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const updateMenuItem = (item: MenuItem): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) { reject(new Error('DB not initialized')); return; }
    
    const transaction = db.transaction(STORES.MENU, 'readwrite');
    const store = transaction.objectStore(STORES.MENU);
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const addOrder = (order: Order): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) { reject(new Error('DB not initialized')); return; }
    
    const transaction = db.transaction(STORES.ORDERS, 'readwrite');
    const store = transaction.objectStore(STORES.ORDERS);
    const request = store.add(order);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const updateOrderStatus = (orderId: string, status: OrderStatus): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) { reject(new Error('DB not initialized')); return; }
    
    const transaction = db.transaction(STORES.ORDERS, 'readwrite');
    const store = transaction.objectStore(STORES.ORDERS);
    const getRequest = store.get(orderId);

    getRequest.onsuccess = () => {
      const order = getRequest.result;
      if (order) {
        order.status = status;
        const updateRequest = store.put(order);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        reject(new Error('Order not found'));
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

export const getOrdersByStatus = (status: OrderStatus): Promise<Order[]> => {
  return new Promise((resolve, reject) => {
    if (!db) { reject(new Error('DB not initialized')); return; }
    
    const transaction = db.transaction(STORES.ORDERS, 'readonly');
    const store = transaction.objectStore(STORES.ORDERS);
    const index = store.index('status');
    const request = index.getAll(status);

    request.onsuccess = () => resolve(request.result.sort((a, b) => a.createdAt - b.createdAt));
    request.onerror = () => reject(request.error);
  });
};

export const getAllOrders = (): Promise<Order[]> => {
  return new Promise((resolve, reject) => {
    if (!db) { reject(new Error('DB not initialized')); return; }
    
    const transaction = db.transaction(STORES.ORDERS, 'readonly');
    const store = transaction.objectStore(STORES.ORDERS);
    const index = store.index('createdAt');
    const request = index.getAll();

    request.onsuccess = () => resolve(request.result.sort((a, b) => b.createdAt - a.createdAt));
    request.onerror = () => reject(request.error);
  });
};

export const getOrderById = (orderId: string): Promise<Order | undefined> => {
  return new Promise((resolve, reject) => {
    if (!db) { reject(new Error('DB not initialized')); return; }
    
    const transaction = db.transaction(STORES.ORDERS, 'readonly');
    const store = transaction.objectStore(STORES.ORDERS);
    const request = store.get(orderId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getLastSyncTime = (): Promise<number> => {
  return new Promise((resolve, reject) => {
    if (!db) { reject(new Error('DB not initialized')); return; }
    
    const transaction = db.transaction(STORES.META, 'readonly');
    const store = transaction.objectStore(STORES.META);
    const request = store.get('lastSyncTime');

    request.onsuccess = () => resolve(request.result?.value || 0);
    request.onerror = () => reject(request.error);
  });
};

export const setLastSyncTime = (time: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) { reject(new Error('DB not initialized')); return; }
    
    const transaction = db.transaction(STORES.META, 'readwrite');
    const store = transaction.objectStore(STORES.META);
    const request = store.put({ key: 'lastSyncTime', value: time });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
