import { create } from 'zustand';
import { v4 } from 'uuid';
import dayjs from 'dayjs';
import type { Book, Chapter, Note, Highlight, ReadingSession, AnnualStats, ReadingStatus } from './types';
import { dbGetAll, dbPut, dbDelete } from './db';

interface ReadingStoreState {
  books: Book[];
  chapters: Chapter[];
  notes: Note[];
  highlights: Highlight[];
  sessions: ReadingSession[];
  currentBookId: string | null;
  currentChapterId: string | null;
  filterTag: string | null;
  filterStatus: ReadingStatus | null;
  searchQuery: string;
  timerInterval: ReturnType<typeof setInterval> | null;
  timerBookId: string | null;
  timerChapterId: string | null;
  timerSeconds: number;
  timerRunning: boolean;

  loadFromDB: () => Promise<void>;
  addBook: (data: Partial<Book> & { title: string }) => Promise<void>;
  updateBook: (id: string, updates: Partial<Book>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  addChapter: (bookId: string, name: string) => Promise<void>;
  updateChapter: (id: string, updates: Partial<Chapter>) => Promise<void>;
  deleteChapter: (id: string) => Promise<void>;
  addNote: (chapterId: string, content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  addHighlight: (chapterId: string, text: string, pageLocation: string) => Promise<void>;
  deleteHighlight: (id: string) => Promise<void>;
  updateProgress: (bookId: string, currentPage: number) => Promise<void>;
  startTimer: (bookId: string, chapterId: string) => void;
  pauseTimer: () => void;
  tickTimer: () => void;
  getStats: (year: number) => AnnualStats;
  setCurrentBook: (id: string | null) => void;
  setCurrentChapter: (id: string | null) => void;
  setFilterTag: (tag: string | null) => void;
  setFilterStatus: (status: ReadingStatus | null) => void;
  setSearchQuery: (query: string) => void;
}

const TAG_COLORS = [
  '#6a994e', '#bc4749', '#e76f51', '#f4a261',
  '#2a9d8f', '#264653', '#e9c46a', '#a7c957',
];

export const useStore = create<ReadingStoreState>((set, get) => ({
  books: [],
  chapters: [],
  notes: [],
  highlights: [],
  sessions: [],
  currentBookId: null,
  currentChapterId: null,
  filterTag: null,
  filterStatus: null,
  searchQuery: '',
  timerInterval: null,
  timerBookId: null,
  timerChapterId: null,
  timerSeconds: 0,
  timerRunning: false,

  loadFromDB: async () => {
    const [books, chapters, notes, highlights, sessions] = await Promise.all([
      dbGetAll<Book>('books'),
      dbGetAll<Chapter>('chapters'),
      dbGetAll<Note>('notes'),
      dbGetAll<Highlight>('highlights'),
      dbGetAll<ReadingSession>('sessions'),
    ]);
    set({ books, chapters, notes, highlights, sessions });
  },

  addBook: async (data) => {
    const now = dayjs().toISOString();
    const book: Book = {
      id: v4(),
      title: data.title,
      author: data.author || '',
      publisher: data.publisher || '',
      isbn: data.isbn || '',
      totalPages: data.totalPages || 0,
      currentPage: data.currentPage || 0,
      status: data.status || 'want',
      coverUrl: data.coverUrl || '',
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
    };
    await dbPut('books', book);
    set((s) => ({ books: [...s.books, book] }));
  },

  updateBook: async (id, updates) => {
    const book = get().books.find((b) => b.id === id);
    if (!book) return;
    const updated: Book = { ...book, ...updates, updatedAt: dayjs().toISOString() };
    await dbPut('books', updated);
    set((s) => ({ books: s.books.map((b) => (b.id === id ? updated : b)) }));
  },

  deleteBook: async (id) => {
    await dbDelete('books', id);
    const chapterIds = new Set(get().chapters.filter((c) => c.bookId === id).map((c) => c.id));
    await Promise.all([...chapterIds].map((cid) => dbDelete('chapters', cid)));
    const noteIds = get().notes.filter((n) => chapterIds.has(n.chapterId)).map((n) => n.id);
    await Promise.all(noteIds.map((nid) => dbDelete('notes', nid)));
    const hlIds = get().highlights.filter((h) => chapterIds.has(h.chapterId)).map((h) => h.id);
    await Promise.all(hlIds.map((hid) => dbDelete('highlights', hid)));
    const sessionIds = get().sessions.filter((s) => s.bookId === id).map((s) => s.id);
    await Promise.all(sessionIds.map((sid) => dbDelete('sessions', sid)));
    set((s) => ({
      books: s.books.filter((b) => b.id !== id),
      chapters: s.chapters.filter((c) => c.bookId !== id),
      notes: s.notes.filter((n) => !chapterIds.has(n.chapterId)),
      highlights: s.highlights.filter((h) => !chapterIds.has(h.chapterId)),
      sessions: s.sessions.filter((se) => se.bookId !== id),
    }));
  },

  addChapter: async (bookId, name) => {
    const bookChapters = get().chapters.filter((c) => c.bookId === bookId);
    const chapter: Chapter = {
      id: v4(),
      bookId,
      name,
      order: bookChapters.length,
    };
    await dbPut('chapters', chapter);
    set((s) => ({ chapters: [...s.chapters, chapter] }));
  },

  updateChapter: async (id, updates) => {
    const chapter = get().chapters.find((c) => c.id === id);
    if (!chapter) return;
    const updated: Chapter = { ...chapter, ...updates };
    await dbPut('chapters', updated);
    set((s) => ({ chapters: s.chapters.map((c) => (c.id === id ? updated : c)) }));
  },

  deleteChapter: async (id) => {
    await dbDelete('chapters', id);
    const noteIds = get().notes.filter((n) => n.chapterId === id).map((n) => n.id);
    await Promise.all(noteIds.map((nid) => dbDelete('notes', nid)));
    const hlIds = get().highlights.filter((h) => h.chapterId === id).map((h) => h.id);
    await Promise.all(hlIds.map((hid) => dbDelete('highlights', hid)));
    set((s) => ({
      chapters: s.chapters.filter((c) => c.id !== id),
      notes: s.notes.filter((n) => n.chapterId !== id),
      highlights: s.highlights.filter((h) => h.chapterId !== id),
    }));
  },

  addNote: async (chapterId, content) => {
    const note: Note = {
      id: v4(),
      chapterId,
      content,
      createdAt: dayjs().toISOString(),
    };
    await dbPut('notes', note);
    set((s) => ({ notes: [...s.notes, note] }));
  },

  deleteNote: async (id) => {
    await dbDelete('notes', id);
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
  },

  addHighlight: async (chapterId, text, pageLocation) => {
    const highlight: Highlight = {
      id: v4(),
      chapterId,
      text,
      pageLocation,
      createdAt: dayjs().toISOString(),
    };
    await dbPut('highlights', highlight);
    set((s) => ({ highlights: [...s.highlights, highlight] }));
  },

  deleteHighlight: async (id) => {
    await dbDelete('highlights', id);
    set((s) => ({ highlights: s.highlights.filter((h) => h.id !== id) }));
  },

  updateProgress: async (bookId, currentPage) => {
    const book = get().books.find((b) => b.id === bookId);
    if (!book) return;
    const status: ReadingStatus =
      currentPage >= book.totalPages ? 'read' :
      book.status === 'want' ? 'reading' :
      book.status;
    const updated: Book = { ...book, currentPage, status, updatedAt: dayjs().toISOString() };
    await dbPut('books', updated);
    set((s) => ({ books: s.books.map((b) => (b.id === bookId ? updated : b)) }));
  },

  startTimer: (bookId, chapterId) => {
    const { timerRunning, timerInterval } = get();
    if (timerRunning) {
      if (timerInterval) clearInterval(timerInterval);
    }
    const interval = setInterval(() => {
      get().tickTimer();
    }, 1000);
    set({
      timerInterval: interval,
      timerBookId: bookId,
      timerChapterId: chapterId,
      timerSeconds: 0,
      timerRunning: true,
    });
  },

  pauseTimer: () => {
    const { timerInterval, timerBookId, timerChapterId, timerSeconds, timerRunning } = get();
    if (!timerRunning || !timerBookId) return;
    if (timerInterval) clearInterval(timerInterval);
    const session: ReadingSession = {
      id: v4(),
      bookId: timerBookId,
      chapterId: timerChapterId || '',
      duration: timerSeconds,
      date: dayjs().toISOString(),
    };
    dbPut('sessions', session);
    set((s) => ({
      sessions: [...s.sessions, session],
      timerInterval: null,
      timerBookId: null,
      timerChapterId: null,
      timerSeconds: 0,
      timerRunning: false,
    }));
  },

  tickTimer: () => {
    set((s) => ({ timerSeconds: s.timerSeconds + 1 }));
  },

  getStats: (year: number) => {
    const { books, sessions } = get();
    const yearSessions = sessions.filter((s) => dayjs(s.date).year() === year);

    const monthlyPages: AnnualStats['monthlyPages'] = [];
    for (let m = 0; m < 12; m++) {
      const monthStr = String(m + 1).padStart(2, '0');
      const bookIdsInMonth = new Set(
        yearSessions.filter((s) => dayjs(s.date).month() === m).map((s) => s.bookId)
      );
      let pages = 0;
      bookIdsInMonth.forEach((bid) => {
        const book = books.find((b) => b.id === bid);
        if (book) pages += book.currentPage;
      });
      monthlyPages.push({ month: monthStr, pages });
    }

    const tagMap = new Map<string, number>();
    books.forEach((b) => {
      b.tags.forEach((t) => {
        tagMap.set(t, (tagMap.get(t) || 0) + 1);
      });
    });
    const tagDistribution: AnnualStats['tagDistribution'] = Array.from(tagMap.entries()).map(
      ([tag, count], i) => ({
        tag,
        count,
        color: TAG_COLORS[i % TAG_COLORS.length],
      })
    );

    const dateSet = new Set<string>();
    sessions.forEach((s) => {
      const d = dayjs(s.date).format('YYYY-MM-DD');
      if (dayjs(s.date).year() === year) dateSet.add(d);
    });
    const sortedDates = Array.from(dateSet).sort();
    const cumulativeDays: AnnualStats['cumulativeDays'] = [];
    let cumDays = 0;
    sortedDates.forEach((date) => {
      cumDays += 1;
      cumulativeDays.push({ date, days: cumDays });
    });

    return { monthlyPages, tagDistribution, cumulativeDays };
  },

  setCurrentBook: (id) => set({ currentBookId: id }),
  setCurrentChapter: (id) => set({ currentChapterId: id }),
  setFilterTag: (tag) => set({ filterTag: tag || null }),
  setFilterStatus: (status) => set({ filterStatus: status || null }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
