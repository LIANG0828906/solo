import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Book, Excerpt, FilterType, HighlightRange, ReadingStatus, WeeklyStat } from './types';

const GRADIENTS = [
  'linear-gradient(135deg, #A8D8B9 0%, #7CB77F 100%)',
  'linear-gradient(135deg, #FFD4A3 0%, #E8A87C 100%)',
  'linear-gradient(135deg, #B8D4E8 0%, #6BA3D6 100%)',
  'linear-gradient(135deg, #E8C5C5 0%, #D68B8B 100%)',
  'linear-gradient(135deg, #D4C5E8 0%, #A78BD6 100%)',
  'linear-gradient(135deg, #C5E8D4 0%, #8BD6A7 100%)',
  'linear-gradient(135deg, #E8E0C5 0%, #D6C28B 100%)',
  'linear-gradient(135deg, #C5D8E8 0%, #8BAFD6 100%)',
];

const getRandomGradient = () => GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];

const createSampleData = (): { books: Book[]; excerpts: Excerpt[] } => {
  const now = new Date().toISOString();
  const books: Book[] = [
    {
      id: uuidv4(),
      title: '人类简史',
      author: '尤瓦尔·赫拉利',
      totalPages: 440,
      progress: 65,
      status: 'reading',
      gradientColor: GRADIENTS[0],
      createdAt: now,
      updatedAt: now,
      progressHistory: [{ date: now, progress: 65 }],
    },
    {
      id: uuidv4(),
      title: '三体',
      author: '刘慈欣',
      totalPages: 302,
      progress: 100,
      status: 'finished',
      gradientColor: GRADIENTS[2],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      title: '活着',
      author: '余华',
      totalPages: 191,
      progress: 0,
      status: 'wishlist',
      gradientColor: GRADIENTS[4],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const excerpts: Excerpt[] = [
    {
      id: uuidv4(),
      bookId: books[0].id,
      content: '我们的语言发展成为一种八卦的工具。根据这一理论，智人主要是一种社会性动物，社会合作是我们生存和繁衍的关键。',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      highlights: [{ start: 0, end: 12 }],
    },
    {
      id: uuidv4(),
      bookId: books[0].id,
      content: '金钱是有史以来最普遍也最有效的互信系统，它能够跨越几乎所有的文化鸿沟。',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      highlights: [],
    },
    {
      id: uuidv4(),
      bookId: books[1].id,
      content: '弱小和无知不是生存的障碍，傲慢才是。',
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      highlights: [{ start: 0, end: 18 }],
    },
  ];

  return { books, excerpts };
};

interface BookStore {
  books: Book[];
  excerpts: Excerpt[];
  currentFilter: FilterType;
  selectedBookId: string | null;
  animationKey: number;

  addBook: (book: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'gradientColor'>) => void;
  updateBook: (id: string, updates: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  setFilter: (filter: FilterType) => void;
  selectBook: (id: string | null) => void;

  addExcerpt: (bookId: string, content: string) => void;
  updateExcerpt: (id: string, content: string) => void;
  deleteExcerpt: (id: string) => void;
  toggleHighlight: (excerptId: string, start: number, end: number) => void;

  getFilteredBooks: () => Book[];
  getExcerptsByBook: (bookId: string) => Excerpt[];
  calculateEstimatedFinish: (bookId: string) => string | null;
  getWeeklyStats: () => WeeklyStat[];
}

const sampleData = createSampleData();

export const useBookStore = create<BookStore>()(
  persist(
    (set, get) => ({
      books: sampleData.books,
      excerpts: sampleData.excerpts,
      currentFilter: 'all',
      selectedBookId: null,
      animationKey: 0,

      addBook: (book) => {
        const now = new Date().toISOString();
        const newBook: Book = {
          ...book,
          id: uuidv4(),
          gradientColor: getRandomGradient(),
          createdAt: now,
          updatedAt: now,
          progressHistory: [{ date: now, progress: book.progress }],
        };
        set((state) => ({ books: [...state.books, newBook] }));
      },

      updateBook: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          books: state.books.map((b) => {
            if (b.id !== id) return b;
            const updated = { ...b, ...updates, updatedAt: now };
            if (updates.progress !== undefined && updates.progress !== b.progress) {
              updated.progressHistory = [
                ...(b.progressHistory || []),
                { date: now, progress: updates.progress },
              ];
            }
            return updated;
          }),
        }));
      },

      deleteBook: (id) => {
        set((state) => ({
          books: state.books.filter((b) => b.id !== id),
          excerpts: state.excerpts.filter((e) => e.bookId !== id),
          selectedBookId: state.selectedBookId === id ? null : state.selectedBookId,
        }));
      },

      setFilter: (filter) => {
        set({ currentFilter: filter, animationKey: Date.now() });
      },

      selectBook: (id) => set({ selectedBookId: id }),

      addExcerpt: (bookId, content) => {
        const newExcerpt: Excerpt = {
          id: uuidv4(),
          bookId,
          content,
          createdAt: new Date().toISOString(),
          highlights: [],
        };
        set((state) => ({ excerpts: [newExcerpt, ...state.excerpts] }));
      },

      updateExcerpt: (id, content) => {
        set((state) => ({
          excerpts: state.excerpts.map((e) =>
            e.id === id ? { ...e, content, highlights: [] } : e
          ),
        }));
      },

      deleteExcerpt: (id) => {
        set((state) => ({
          excerpts: state.excerpts.filter((e) => e.id !== id),
        }));
      },

      toggleHighlight: (excerptId, start, end) => {
        set((state) => ({
          excerpts: state.excerpts.map((e) => {
            if (e.id !== excerptId) return e;
            const exists = e.highlights.some(
              (h) => h.start === start && h.end === end
            );
            return {
              ...e,
              highlights: exists
                ? e.highlights.filter((h) => !(h.start === start && h.end === end))
                : [...e.highlights, { start, end }],
            };
          }),
        }));
      },

      getFilteredBooks: () => {
        const { books, currentFilter } = get();
        if (currentFilter === 'all') return books;
        return books.filter((b) => b.status === currentFilter);
      },

      getExcerptsByBook: (bookId) => {
        return get()
          .excerpts.filter((e) => e.bookId === bookId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      calculateEstimatedFinish: (bookId) => {
        const book = get().books.find((b) => b.id === bookId);
        if (!book || book.progress >= 100) return null;
        if (!book.progressHistory || book.progressHistory.length < 2) {
          const daysLeft = Math.ceil((100 - book.progress) / 5);
          const date = new Date();
          date.setDate(date.getDate() + daysLeft);
          return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
        }
        const history = book.progressHistory;
        const firstEntry = history[0];
        const lastEntry = history[history.length - 1];
        const daysDiff = Math.max(
          1,
          Math.ceil(
            (new Date(lastEntry.date).getTime() - new Date(firstEntry.date).getTime()) /
              86400000
          )
        );
        const progressDiff = lastEntry.progress - firstEntry.progress;
        if (progressDiff <= 0) {
          const daysLeft = Math.ceil((100 - book.progress) / 5);
          const date = new Date();
          date.setDate(date.getDate() + daysLeft);
          return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
        }
        const progressPerDay = progressDiff / daysDiff;
        const daysLeft = Math.ceil((100 - book.progress) / progressPerDay);
        const date = new Date();
        date.setDate(date.getDate() + daysLeft);
        return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
      },

      getWeeklyStats: () => {
        const stats: WeeklyStat[] = [];
        const now = new Date();
        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${
            weekEnd.getMonth() + 1
          }/${weekEnd.getDate()}`;
          let hours = 0;
          get().books.forEach((book) => {
            if (book.progressHistory) {
              const inRange = book.progressHistory.filter((h) => {
                const d = new Date(h.date);
                return d >= weekStart && d <= weekEnd;
              });
              if (inRange.length >= 2) {
                const progressGain = inRange[inRange.length - 1].progress - inRange[0].progress;
                hours += (progressGain * book.totalPages) / 100 / 30;
              }
            }
          });
          stats.push({ week: weekLabel, hours: Math.round(hours * 10) / 10 });
        }
        return stats;
      },
    }),
    {
      name: 'reading-progress-store',
    }
  )
);
