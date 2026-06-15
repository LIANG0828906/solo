import { get, set, del, keys, values } from 'idb-keyval';
import type { Book, DriftRecord, User } from '@/types';

const BOOKS_KEY = 'books';
const RECORDS_KEY = 'driftRecords';
const USER_KEY = 'user';

export async function getAllBooks(): Promise<Book[]> {
  const books = await get<Book[]>(BOOKS_KEY);
  return books || [];
}

export async function saveBooks(books: Book[]): Promise<void> {
  await set(BOOKS_KEY, books);
}

export async function getAllRecords(): Promise<DriftRecord[]> {
  const records = await get<DriftRecord[]>(RECORDS_KEY);
  return records || [];
}

export async function saveRecords(records: DriftRecord[]): Promise<void> {
  await set(RECORDS_KEY, records);
}

export async function getRecordsByBookId(bookId: string): Promise<DriftRecord[]> {
  const allRecords = await getAllRecords();
  return allRecords
    .filter((r) => r.bookId === bookId)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export async function getUser(): Promise<User | null> {
  const user = await get<User>(USER_KEY);
  return user || null;
}

export async function saveUser(user: User): Promise<void> {
  await set(USER_KEY, user);
}

export async function clearAll(): Promise<void> {
  const allKeys = await keys();
  await Promise.all(allKeys.map((k) => del(k)));
}

export async function getAllData(): Promise<{
  books: Book[];
  records: DriftRecord[];
  user: User | null;
}> {
  const [books, records, user] = await Promise.all([
    getAllBooks(),
    getAllRecords(),
    getUser(),
  ]);
  return { books, records, user };
}

export { keys, values };
