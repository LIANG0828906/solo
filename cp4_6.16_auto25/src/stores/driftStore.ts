import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { DriftRecord, Book, BookStatus } from '@/types';
import {
  getAllRecords,
  saveRecords,
  getRecordsByBookId,
} from '@/utils/idb';

interface DriftStore {
  records: DriftRecord[];
  loading: boolean;
  initialized: boolean;

  fetchRecords: () => Promise<void>;
  fetchRecordsForBook: (bookId: string) => Promise<DriftRecord[]>;
  addRecord: (record: Omit<DriftRecord, 'id' | 'timestamp'>) => Promise<DriftRecord>;
  addManualRecord: (
    bookId: string,
    toLocation: string,
    toLat: number,
    toLng: number,
    note: string,
    operatorName: string
  ) => Promise<DriftRecord | null>;
  getRecordsByBook: (bookId: string) => DriftRecord[];
  deleteRecordsForBook: (bookId: string) => Promise<void>;
  getRecordCountByUser: (userName: string) => number;
  getRecentBooksByUser: (userName: string, bookIds: string[], limit: number) => string[];
}

export const useDriftStore = create<DriftStore>((set, get) => ({
  records: [],
  loading: false,
  initialized: false,

  fetchRecords: async () => {
    set({ loading: true });
    try {
      const records = await getAllRecords();
      set({ records, initialized: true });
    } finally {
      set({ loading: false });
    }
  },

  fetchRecordsForBook: async (bookId) => {
    const records = await getRecordsByBookId(bookId);
    const existingIds = new Set(get().records.map((r) => r.id));
    const newRecords = records.filter((r) => !existingIds.has(r.id));
    if (newRecords.length > 0) {
      set((state) => ({ records: [...state.records, ...newRecords] }));
    }
    return records;
  },

  addRecord: async (recordData) => {
    const newRecord: DriftRecord = {
      ...recordData,
      id: uuidv4(),
      timestamp: Date.now(),
    };

    const records = [...get().records, newRecord];
    set({ records });
    await saveRecords(records);

    return newRecord;
  },

  addManualRecord: async (
    bookId,
    toLocation,
    toLat,
    toLng,
    note,
    operatorName
  ) => {
    const records = get().getRecordsByBook(bookId);
    if (records.length === 0) return null;

    const lastRecord = records[records.length - 1];

    return get().addRecord({
      bookId,
      fromLocation: lastRecord.toLocation,
      toLocation,
      fromLat: lastRecord.toLat,
      fromLng: lastRecord.toLng,
      toLat,
      toLng,
      statusChange: null,
      note,
      operatorName,
    });
  },

  getRecordsByBook: (bookId) => {
    return get().records
      .filter((r) => r.bookId === bookId)
      .sort((a, b) => a.timestamp - b.timestamp);
  },

  deleteRecordsForBook: async (bookId) => {
    const records = get().records.filter((r) => r.bookId !== bookId);
    set({ records });
    await saveRecords(records);
  },

  getRecordCountByUser: (userName) => {
    return get().records.filter((r) => r.operatorName === userName).length;
  },

  getRecentBooksByUser: (userName, _bookIds, limit) => {
    const userRecords = get().records
      .filter((r) => r.operatorName === userName)
      .sort((a, b) => b.timestamp - a.timestamp);

    const bookIds = new Set<string>();
    for (const record of userRecords) {
      bookIds.add(record.bookId);
      if (bookIds.size >= limit) break;
    }

    return Array.from(bookIds);
  },
}));

export function setupBookEventListeners() {
  window.addEventListener('book:created', ((e: CustomEvent) => {
    const { book }: { book: Book } = e.detail;
    void autoCreateInitialRecord(book);
  }) as EventListener);

  window.addEventListener('book:updated', ((e: CustomEvent) => {
    const {
      oldBook,
      newBook,
      statusChanged,
      locationChanged,
    }: {
      oldBook: Book;
      newBook: Book;
      statusChanged: boolean;
      locationChanged: boolean;
    } = e.detail;

    if (statusChanged || locationChanged) {
      void autoCreateDriftRecord(oldBook, newBook);
    }
  }) as EventListener);

  window.addEventListener('book:deleted', ((e: CustomEvent) => {
    const { bookId }: { bookId: string } = e.detail;
    void useDriftStore.getState().deleteRecordsForBook(bookId);
  }) as EventListener);
}

async function autoCreateInitialRecord(book: Book) {
  const record = await useDriftStore.getState().addRecord({
    bookId: book.id,
    fromLocation: '',
    toLocation: book.currentLocation,
    fromLat: book.currentLat,
    fromLng: book.currentLng,
    toLat: book.currentLat,
    toLng: book.currentLng,
    statusChange: book.status as BookStatus,
    note: '书籍初始登记',
    operatorName: book.creatorName,
  });

  return record;
}

async function autoCreateDriftRecord(oldBook: Book, newBook: Book) {
  const statusChange: BookStatus | null =
    oldBook.status !== newBook.status ? newBook.status : null;

  const note = statusChange
    ? `状态变更: ${oldBook.status} → ${newBook.status}`
    : '位置更新';

  const record = await useDriftStore.getState().addRecord({
    bookId: newBook.id,
    fromLocation: oldBook.currentLocation,
    toLocation: newBook.currentLocation,
    fromLat: oldBook.currentLat,
    fromLng: oldBook.currentLng,
    toLat: newBook.currentLat,
    toLng: newBook.currentLng,
    statusChange,
    note,
    operatorName: '系统',
  });

  return record;
}
