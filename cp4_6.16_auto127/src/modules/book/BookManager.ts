import { v4 as uuidv4 } from 'uuid';
import { useBookStore } from '../../store/bookStore';
import { getLendingHistory } from '../lending/LendingManager';
import type { Book, BookCategory, BookCondition, BookStatus, LendingRecord } from '../../types';

export interface AddBookInput {
  title: string;
  author: string;
  isbn: string;
  category: BookCategory;
  condition: BookCondition;
  status: BookStatus;
  coverUrl?: string;
  tags?: string[];
}

const OPEN_LIBRARY_COVER_API = 'https://covers.openlibrary.org/b/isbn/';

export async function fetchCoverByIsbn(isbn: string): Promise<string> {
  if (!isbn || isbn.length < 10) return '';
  try {
    const url = `${OPEN_LIBRARY_COVER_API}${isbn}-M.jpg?default=false`;
    const response = await fetch(url);
    if (response.ok) {
      return `${OPEN_LIBRARY_COVER_API}${isbn}-L.jpg`;
    }
    return '';
  } catch {
    return '';
  }
}

export interface AddBookResult {
  book: Book;
  driftHistory: LendingRecord[];
}

export async function addBook(input: AddBookInput): Promise<AddBookResult> {
  const coverUrl = input.coverUrl || (await fetchCoverByIsbn(input.isbn));
  const book: Book = {
    id: uuidv4(),
    title: input.title,
    author: input.author,
    isbn: input.isbn,
    coverUrl,
    category: input.category,
    condition: input.condition,
    status: input.status,
    createdAt: Date.now(),
    tags: input.tags || [input.category, input.condition],
  };
  await useBookStore.getState().addBook(book);
  const driftHistory = getLendingHistory(book.id);
  return { book, driftHistory };
}

export async function removeBook(bookId: string): Promise<void> {
  await useBookStore.getState().removeBook(bookId);
}

export function getAllBooks(): Book[] {
  return useBookStore.getState().books;
}

export function getAvailableBooks(): Book[] {
  return getAllBooks().filter((b) => b.status === '在馆');
}

export function getBooksByCategory(category: BookCategory | '全部'): Book[] {
  if (category === '全部') return getAllBooks();
  return getAllBooks().filter((b) => b.category === category);
}

export function searchBooks(keyword: string): Book[] {
  if (!keyword.trim()) return getAllBooks();
  const lower = keyword.toLowerCase();
  return getAllBooks().filter(
    (b) =>
      b.title.toLowerCase().includes(lower) ||
      b.author.toLowerCase().includes(lower) ||
      b.isbn.includes(keyword)
  );
}

export function getBookCategories(): BookCategory[] {
  return ['小说', '非虚构', '科技', '生活', '儿童'];
}

export function getBookConditions(): BookCondition[] {
  return ['全新', '良好', '一般'];
}

export function getBookStatuses(): BookStatus[] {
  return ['在馆', '借出', '漂流', '下架'];
}

export function getStatusColor(status: BookStatus): string {
  switch (status) {
    case '在馆':
      return '#2E7D32';
    case '借出':
      return '#F57C00';
    case '漂流':
      return '#1976D2';
    case '下架':
      return '#757575';
  }
}
