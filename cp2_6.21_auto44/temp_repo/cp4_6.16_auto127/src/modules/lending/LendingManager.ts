import { v4 as uuidv4 } from 'uuid';
import { useLendingStore } from '../../store/lendingStore';
import { useBookStore } from '../../store/bookStore';
import type { LendingRecord, DriftRoutePoint, Book } from '../../types';

const BORROW_PERIOD_DAYS = 30;
const DAY_MS = 86400000;

export interface BorrowInput {
  bookId: string;
  borrowerName: string;
  isDrifting?: boolean;
  location?: string;
}

export interface BorrowResult {
  success: boolean;
  message: string;
  record?: LendingRecord;
}

export async function borrowBook(input: BorrowInput): Promise<BorrowResult> {
  const { bookId, borrowerName, isDrifting = false, location } = input;
  const book = useBookStore.getState().getBookById(bookId);

  if (!book) {
    return { success: false, message: '未找到该图书' };
  }
  if (book.status !== '在馆') {
    return { success: false, message: `当前图书状态为"${book.status}"，无法借阅` };
  }
  if (!borrowerName.trim()) {
    return { success: false, message: '请填写借阅者姓名' };
  }

  const now = Date.now();
  const record: LendingRecord = {
    recordId: uuidv4(),
    bookId,
    borrowerName: borrowerName.trim(),
    borrowDate: now,
    dueDate: now + BORROW_PERIOD_DAYS * DAY_MS,
    returnDate: null,
    isDrifting,
    location,
  };

  await useLendingStore.getState().addRecord(record);
  await useBookStore.getState().updateBookStatus(bookId, isDrifting ? '漂流' : '借出');

  return { success: true, message: '借阅成功', record };
}

export interface ReturnResult {
  success: boolean;
  message: string;
  record?: LendingRecord;
}

export async function returnBook(isbn: string): Promise<ReturnResult> {
  const book = useBookStore.getState().getBookByIsbn(isbn.trim());
  if (!book) {
    return { success: false, message: '未找到该ISBN对应的图书' };
  }

  const activeRecords = useLendingStore
    .getState()
    .getActiveRecords()
    .filter((r) => r.bookId === book.id)
    .sort((a, b) => b.borrowDate - a.borrowDate);

  if (activeRecords.length === 0) {
    return { success: false, message: '该图书没有未归还的借阅记录' };
  }

  const record = activeRecords[0];
  const now = Date.now();
  await useLendingStore.getState().updateRecord(record.recordId, { returnDate: now });
  await useBookStore.getState().updateBookStatus(book.id, '在馆');

  const updatedRecord = { ...record, returnDate: now };
  return { success: true, message: '归还成功', record: updatedRecord };
}

export function getLendingHistory(bookId?: string): LendingRecord[] {
  const store = useLendingStore.getState();
  if (bookId) {
    return store.getRecordsByBookId(bookId);
  }
  return [...store.records].sort((a, b) => b.borrowDate - a.borrowDate);
}

export function getActiveLendings(): LendingRecord[] {
  return useLendingStore.getState().getActiveRecords();
}

export function getOverdueLendings(): LendingRecord[] {
  return useLendingStore.getState().getOverdueRecords();
}

export function isOverdue(record: LendingRecord): boolean {
  if (record.returnDate !== null) return false;
  return record.dueDate < Date.now();
}

export function getDaysRemaining(record: LendingRecord): number {
  if (record.returnDate !== null) return 0;
  return Math.ceil((record.dueDate - Date.now()) / DAY_MS);
}

export function getDriftRoute(bookId: string): DriftRoutePoint[] {
  return useLendingStore.getState().getDriftRoute(bookId);
}

export function getDriftingBooksCount(): number {
  return useLendingStore.getState().getDriftingBooksCount();
}

export function getRecommendedDriftingBooks(book: Book, limit = 3): Book[] {
  const store = useBookStore.getState();
  const lendingStore = useLendingStore.getState();

  const driftingRecords = lendingStore.records.filter(
    (r) => r.returnDate === null && r.isDrifting && r.bookId !== book.id
  );
  const driftingBookIds = Array.from(new Set(driftingRecords.map((r) => r.bookId)));

  const sameCategory = driftingBookIds
    .map((id) => store.getBookById(id))
    .filter((b): b is Book => b !== undefined && b.category === book.category);

  sameCategory.sort(() => Math.random() - 0.5);

  if (sameCategory.length >= limit) {
    return sameCategory.slice(0, limit);
  }

  const others = driftingBookIds
    .map((id) => store.getBookById(id))
    .filter(
      (b): b is Book => b !== undefined && b.category !== book.category
    )
    .sort(() => Math.random() - 0.5);

  return [...sameCategory, ...others].slice(0, limit);
}
