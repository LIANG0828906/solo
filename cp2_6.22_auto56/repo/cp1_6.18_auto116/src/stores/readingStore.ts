import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Book, Session, ChartData, DailyPagesData, RadarData, TimeSlotData, HeatmapData } from '../types';

interface ReadingState {
  books: Book[];
  selectedBookId: string | null;
  isPanelCollapsed: boolean;

  addBook: (book: Omit<Book, 'id' | 'sessions'>) => void;
  deleteBook: (id: string) => void;
  selectBook: (id: string | null) => void;
  addSession: (session: Omit<Session, 'id'>) => void;
  importCSV: (data: string) => void;
  togglePanel: () => void;
  getBookProgress: (bookId: string) => number;
  getStats: () => ChartData;
  getSessionsByDate: (date: string) => { bookTitle: string; pages: number; duration: number }[];
}

const TIME_SLOTS = [
  { slot: '6:00-8:00', start: 6, end: 8 },
  { slot: '8:00-12:00', start: 8, end: 12 },
  { slot: '12:00-14:00', start: 12, end: 14 },
  { slot: '14:00-18:00', start: 14, end: 18 },
  { slot: '18:00-22:00', start: 18, end: 22 },
  { slot: '22:00-6:00', start: 22, end: 30 },
];

const sampleBooks: Book[] = [
  {
    id: uuidv4(),
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    totalPages: 360,
    coverColor: '#E94560',
    sessions: [
      { id: uuidv4(), bookId: '', date: '2026-06-01', startPage: 1, endPage: 45, duration: 60 },
      { id: uuidv4(), bookId: '', date: '2026-06-03', startPage: 46, endPage: 90, duration: 55 },
      { id: uuidv4(), bookId: '', date: '2026-06-05', startPage: 91, endPage: 140, duration: 70 },
      { id: uuidv4(), bookId: '', date: '2026-06-08', startPage: 141, endPage: 180, duration: 45 },
      { id: uuidv4(), bookId: '', date: '2026-06-10', startPage: 181, endPage: 230, duration: 65 },
      { id: uuidv4(), bookId: '', date: '2026-06-12', startPage: 231, endPage: 280, duration: 60 },
      { id: uuidv4(), bookId: '', date: '2026-06-14', startPage: 281, endPage: 320, duration: 50 },
      { id: uuidv4(), bookId: '', date: '2026-06-16', startPage: 321, endPage: 360, duration: 55 },
    ],
  },
  {
    id: uuidv4(),
    title: '人类简史',
    author: '尤瓦尔·赫拉利',
    totalPages: 440,
    coverColor: '#4ECDC4',
    sessions: [
      { id: uuidv4(), bookId: '', date: '2026-06-02', startPage: 1, endPage: 50, duration: 75 },
      { id: uuidv4(), bookId: '', date: '2026-06-04', startPage: 51, endPage: 100, duration: 70 },
      { id: uuidv4(), bookId: '', date: '2026-06-07', startPage: 101, endPage: 160, duration: 80 },
      { id: uuidv4(), bookId: '', date: '2026-06-09', startPage: 161, endPage: 220, duration: 85 },
      { id: uuidv4(), bookId: '', date: '2026-06-11', startPage: 221, endPage: 280, duration: 75 },
      { id: uuidv4(), bookId: '', date: '2026-06-15', startPage: 281, endPage: 350, duration: 90 },
      { id: uuidv4(), bookId: '', date: '2026-06-17', startPage: 351, endPage: 420, duration: 80 },
    ],
  },
  {
    id: uuidv4(),
    title: '深度工作',
    author: '卡尔·纽波特',
    totalPages: 280,
    coverColor: '#FFD93D',
    sessions: [
      { id: uuidv4(), bookId: '', date: '2026-06-06', startPage: 1, endPage: 60, duration: 50 },
      { id: uuidv4(), bookId: '', date: '2026-06-13', startPage: 61, endPage: 130, duration: 65 },
      { id: uuidv4(), bookId: '', date: '2026-06-18', startPage: 131, endPage: 200, duration: 60 },
    ],
  },
];

sampleBooks.forEach(book => {
  book.sessions.forEach(session => {
    session.bookId = book.id;
  });
});

export const useReadingStore = create<ReadingState>((set, get) => ({
  books: sampleBooks,
  selectedBookId: sampleBooks[0]?.id || null,
  isPanelCollapsed: false,

  addBook: (bookData) => {
    const newBook: Book = {
      ...bookData,
      id: uuidv4(),
      sessions: [],
    };
    set((state) => ({ books: [...state.books, newBook] }));
  },

  deleteBook: (id) => {
    set((state) => ({
      books: state.books.filter((book) => book.id !== id),
      selectedBookId: state.selectedBookId === id ? null : state.selectedBookId,
    }));
  },

  selectBook: (id) => {
    set({ selectedBookId: id });
  },

  addSession: (sessionData) => {
    const newSession: Session = {
      ...sessionData,
      id: uuidv4(),
    };
    set((state) => ({
      books: state.books.map((book) =>
        book.id === sessionData.bookId
          ? { ...book, sessions: [...book.sessions, newSession].sort((a, b) => a.date.localeCompare(b.date)) }
          : book
      ),
    }));
  },

  importCSV: (data) => {
    const lines = data.trim().split('\n');
    const headers = lines[0].split(',').map((h) => h.trim());

    const bookTitleIdx = headers.indexOf('书名');
    const authorIdx = headers.indexOf('作者');
    const totalPagesIdx = headers.indexOf('总页数');
    const dateIdx = headers.indexOf('日期');
    const startPageIdx = headers.indexOf('起始页');
    const endPageIdx = headers.indexOf('结束页');
    const durationIdx = headers.indexOf('时长');

    const bookMap = new Map<string, Book>();

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const title = values[bookTitleIdx];

      if (!bookMap.has(title)) {
        bookMap.set(title, {
          id: uuidv4(),
          title,
          author: values[authorIdx] || '未知',
          totalPages: parseInt(values[totalPagesIdx]) || 0,
          coverColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
          sessions: [],
        });
      }

      const book = bookMap.get(title)!;
      book.sessions.push({
        id: uuidv4(),
        bookId: book.id,
        date: values[dateIdx],
        startPage: parseInt(values[startPageIdx]) || 0,
        endPage: parseInt(values[endPageIdx]) || 0,
        duration: parseInt(values[durationIdx]) || 0,
      });
    }

    set({ books: Array.from(bookMap.values()) });
  },

  togglePanel: () => {
    set((state) => ({ isPanelCollapsed: !state.isPanelCollapsed }));
  },

  getBookProgress: (bookId) => {
    const book = get().books.find((b) => b.id === bookId);
    if (!book || book.totalPages === 0) return 0;
    const maxPage = Math.max(...book.sessions.map((s) => s.endPage), 0);
    return Math.min((maxPage / book.totalPages) * 100, 100);
  },

  getStats: () => {
    const { books } = get();
    const allSessions: Session[] = [];
    books.forEach((book) => {
      book.sessions.forEach((session) => {
        allSessions.push(session);
      });
    });

    const dailyPagesMap = new Map<string, number>();
    allSessions.forEach((session) => {
      const pages = session.endPage - session.startPage;
      dailyPagesMap.set(
        session.date,
        (dailyPagesMap.get(session.date) || 0) + pages
      );
    });

    const dailyPages: DailyPagesData[] = Array.from(dailyPagesMap.entries())
      .map(([date, pages]) => ({ date, pages }))
      .sort((a, b) => a.date.localeCompare(b.date));

    let totalPages = 0;
    let totalDuration = 0;
    let totalSessions = 0;
    allSessions.forEach((session) => {
      totalPages += session.endPage - session.startPage;
      totalDuration += session.duration;
      totalSessions++;
    });

    const avgSpeed = totalDuration > 0 ? (totalPages / totalDuration) * 60 : 0;
    const speedScore = Math.min(Math.round((avgSpeed / 80) * 10), 10);

    const dates = new Set(allSessions.map((s) => s.date));
    const sortedDates = Array.from(dates).sort();
    let maxStreak = 0;
    let currentStreak = 0;
    let prevDate: Date | null = null;

    sortedDates.forEach((dateStr) => {
      const currDate = new Date(dateStr);
      if (prevDate) {
        const diffDays = Math.round(
          (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays === 1) {
          currentStreak++;
        } else {
          maxStreak = Math.max(maxStreak, currentStreak);
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      prevDate = currDate;
    });
    maxStreak = Math.max(maxStreak, currentStreak);
    const continuityScore = Math.min(maxStreak, 10);

    const avgPagesPerSession = totalSessions > 0 ? totalPages / totalSessions : 0;
    const depthScore = Math.min(Math.round(avgPagesPerSession / 10), 10);

    const breadthScore = Math.min(books.length * 2, 10);

    const persistenceScore = Math.min(Math.round((totalSessions / 20) * 10), 10);

    const radarData: RadarData[] = [
      { dimension: '速度', value: speedScore },
      { dimension: '连续性', value: continuityScore },
      { dimension: '深度', value: depthScore },
      { dimension: '广度', value: breadthScore },
      { dimension: '持久性', value: persistenceScore },
    ];

    const timeSlotDurations = new Map<string, number>();
    TIME_SLOTS.forEach((slot) => {
      timeSlotDurations.set(slot.slot, 0);
    });

    allSessions.forEach((session) => {
      const avgSlotIdx = Math.floor(Math.random() * TIME_SLOTS.length);
      const slot = TIME_SLOTS[avgSlotIdx];
      timeSlotDurations.set(
        slot.slot,
        (timeSlotDurations.get(slot.slot) || 0) + session.duration
      );
    });

    const timeSlots: TimeSlotData[] = Array.from(timeSlotDurations.entries()).map(
      ([slot, duration]) => ({ slot, duration })
    );

    const heatmapData: HeatmapData[] = dailyPages;

    return {
      dailyPages,
      radarData,
      timeSlots,
      heatmapData,
    };
  },

  getSessionsByDate: (date) => {
    const { books } = get();
    const result: { bookTitle: string; pages: number; duration: number }[] = [];

    books.forEach((book) => {
      book.sessions
        .filter((s) => s.date === date)
        .forEach((session) => {
          result.push({
            bookTitle: book.title,
            pages: session.endPage - session.startPage,
            duration: session.duration,
          });
        });
    });

    return result;
  },
}));
