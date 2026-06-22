import axios from 'axios';
import { Book, Member, BorrowRecord, ReadingNote } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000
});

export const getBooks = (): Promise<Book[]> =>
  api.get('/books').then((res) => res.data);

export const getBookById = (id: string): Promise<Book> =>
  api.get(`/books/${id}`).then((res) => res.data);

export const getClubMembers = (): Promise<Member[]> =>
  api.get('/members').then((res) => res.data);

export const getBorrowHistory = (bookId: string): Promise<BorrowRecord[]> =>
  api.get(`/books/${bookId}/borrow-history`).then((res) => res.data);

export const getMemberBorrowHistory = (
  memberId: string
): Promise<BorrowRecord[]> =>
  api.get(`/members/${memberId}/borrow-history`).then((res) => res.data);

export const addBorrowRecord = (
  record: Omit<BorrowRecord, 'id'>
): Promise<BorrowRecord> =>
  api.post('/borrow-records', record).then((res) => res.data);

export const addNote = (
  note: Omit<ReadingNote, 'id' | 'timestamp'>
): Promise<ReadingNote> =>
  api.post('/reading-notes', note).then((res) => res.data);

export const getNotes = (bookId: string): Promise<ReadingNote[]> =>
  api.get(`/books/${bookId}/notes`).then((res) => res.data);

export const updateBookProgress = (
  bookId: string,
  progress: number
): Promise<Book> =>
  api.patch(`/books/${bookId}/progress`, { progress }).then((res) => res.data);
