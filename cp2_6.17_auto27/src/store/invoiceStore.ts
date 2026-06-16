import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Invoice, InvoiceFormData, InvoiceStatus } from '@/utils/helpers';
import { normalizeDate } from '@/utils/helpers';

const DB_NAME = 'InvoiceHubDB';
const DB_VERSION = 1;
const STORE_NAME = 'invoices';

interface InvoiceStore {
  invoices: Invoice[];
  loading: boolean;
  storageError: boolean;
  loadInvoices: () => Promise<void>;
  addInvoice: (data: InvoiceFormData) => Promise<Invoice>;
  updateInvoice: (id: string, data: Partial<Invoice>) => Promise<Invoice | null>;
  deleteInvoice: (id: string) => Promise<void>;
  getInvoiceById: (id: string) => Invoice | undefined;
  isInvoiceNoUnique: (invoiceNo: string, excludeId?: string) => boolean;
  approveInvoice: (id: string) => Promise<Invoice | null>;
  archiveInvoice: (id: string) => Promise<Invoice | null>;
  getStatistics: (startDate?: string, endDate?: string) => {
    monthlyData: { month: string; amount: number }[];
    customerData: { name: string; value: number }[];
  };
  setStorageError: (error: boolean) => void;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('invoiceNo', 'invoiceNo', { unique: true });
        objectStore.createIndex('status', 'status', { unique: false });
        objectStore.createIndex('date', 'date', { unique: false });
        objectStore.createIndex('customerName', 'customerName', { unique: false });
      }
    };
  });
}

function getAllFromDB(db: IDBDatabase): Promise<Invoice[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function addToDB(db: IDBDatabase, invoice: Invoice): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(invoice);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

function updateInDB(db: IDBDatabase, invoice: Invoice): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(invoice);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

function deleteFromDB(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export const useInvoiceStore = create<InvoiceStore>((set, get) => ({
  invoices: [],
  loading: false,
  storageError: false,

  loadInvoices: async () => {
    set({ loading: true });
    try {
      const db = await openDB();
      const invoices = await getAllFromDB(db);
      db.close();
      set({ invoices, loading: false });
    } catch {
      set({ loading: false, storageError: true });
    }
  },

  addInvoice: async (data: InvoiceFormData) => {
    const now = new Date().toISOString();
    const invoice: Invoice = {
      id: uuidv4(),
      invoiceNo: data.invoiceNo,
      customerName: data.customerName,
      amount: Number(data.amount),
      date: data.date,
      status: data.status || ('pending' as InvoiceStatus),
      createdAt: now,
      updatedAt: now,
    };

    try {
      const db = await openDB();
      await addToDB(db, invoice);
      db.close();
      set((state) => ({ invoices: [...state.invoices, invoice] }));
    } catch {
      set({ storageError: true });
    }

    return invoice;
  },

  updateInvoice: async (id: string, data: Partial<Invoice>) => {
    const state = get();
    const existing = state.invoices.find((inv) => inv.id === id);
    if (!existing) return null;

    const updated: Invoice = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };

    try {
      const db = await openDB();
      await updateInDB(db, updated);
      db.close();
      set((s) => ({
        invoices: s.invoices.map((inv) => (inv.id === id ? updated : inv)),
      }));
      return updated;
    } catch {
      set({ storageError: true });
      return null;
    }
  },

  deleteInvoice: async (id: string) => {
    try {
      const db = await openDB();
      await deleteFromDB(db, id);
      db.close();
      set((state) => ({
        invoices: state.invoices.filter((inv) => inv.id !== id),
      }));
    } catch {
      set({ storageError: true });
    }
  },

  getInvoiceById: (id: string) => {
    return get().invoices.find((inv) => inv.id === id);
  },

  isInvoiceNoUnique: (invoiceNo: string, excludeId?: string) => {
    return !get().invoices.some(
      (inv) => inv.invoiceNo === invoiceNo && inv.id !== excludeId
    );
  },

  approveInvoice: async (id: string) => {
    return get().updateInvoice(id, { status: 'approved' as InvoiceStatus });
  },

  archiveInvoice: async (id: string) => {
    const existing = get().getInvoiceById(id);
    if (!existing || existing.status !== 'approved') return null;
    return get().updateInvoice(id, { status: 'archived' as InvoiceStatus });
  },

  getStatistics: (startDate?: string, endDate?: string) => {
    let filtered = get().invoices;

    const normalizedStart = startDate ? normalizeDate(startDate) : '';
    const normalizedEnd = endDate ? normalizeDate(endDate) : '';

    if (normalizedStart) {
      filtered = filtered.filter((inv) => inv.date >= normalizedStart);
    }
    if (normalizedEnd) {
      filtered = filtered.filter((inv) => inv.date <= normalizedEnd);
    }

    const monthlyMap = new Map<string, number>();
    const customerMap = new Map<string, number>();

    for (const inv of filtered) {
      const month = inv.date.substring(0, 7);
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + inv.amount);
      customerMap.set(inv.customerName, (customerMap.get(inv.customerName) || 0) + inv.amount);
    }

    const monthlyData = Array.from(monthlyMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const customerData = Array.from(customerMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { monthlyData, customerData };
  },

  setStorageError: (error: boolean) => {
    set({ storageError: error });
  },
}));
