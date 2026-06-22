import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import type { Book } from '../types';

interface BookStore {
  books: Book[];
  isLoading: boolean;
  fetchBooks: () => Promise<void>;
  addBook: (book: Book) => Promise<void>;
  removeBook: (bookId: string) => Promise<void>;
  updateBookStatus: (bookId: string, status: Book['status']) => Promise<void>;
  updateBook: (bookId: string, updates: Partial<Book>) => Promise<void>;
  getBookById: (bookId: string) => Book | undefined;
  getBookByIsbn: (isbn: string) => Book | undefined;
}

const idbStorage = {
  getItem: async (name: string) => {
    const value = await get(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string) => {
    await set(name, value);
  },
  removeItem: async (name: string) => {
    await del(name);
  },
};

export const useBookStore = create<BookStore>()(
  persist(
    (set, get) => ({
      books: [],
      isLoading: true,

      fetchBooks: async () => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 100));
        set({ isLoading: false });
      },

      addBook: async (book) => {
        set((state) => ({ books: [book, ...state.books] }));
      },

      removeBook: async (bookId) => {
        set((state) => ({
          books: state.books.filter((b) => b.id !== bookId),
        }));
      },

      updateBookStatus: async (bookId, status) => {
        set((state) => ({
          books: state.books.map((b) =>
            b.id === bookId ? { ...b, status } : b
          ),
        }));
      },

      updateBook: async (bookId, updates) => {
        set((state) => ({
          books: state.books.map((b) =>
            b.id === bookId ? { ...b, ...updates } : b
          ),
        }));
      },

      getBookById: (bookId) => {
        return get().books.find((b) => b.id === bookId);
      },

      getBookByIsbn: (isbn) => {
        return get().books.find((b) => b.isbn === isbn);
      },
    }),
    {
      name: 'pageturner-books',
      storage: createJSONStorage(() => idbStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
          if (state.books.length === 0) {
            state.books = generateSampleBooks();
          }
        }
      },
    }
  )
);

function generateSampleBooks(): Book[] {
  const categories: Book['category'][] = ['小说', '非虚构', '科技', '生活', '儿童'];
  const conditions: Book['condition'][] = ['全新', '良好', '一般'];
  const statuses: Book['status'][] = ['在馆', '借出', '漂流', '在馆'];

  const sampleData = [
    { title: '百年孤独', author: '加西亚·马尔克斯', isbn: '9787544253994', category: '小说' as const },
    { title: '人类简史', author: '尤瓦尔·赫拉利', isbn: '9787508647357', category: '非虚构' as const },
    { title: '深入理解计算机系统', author: 'Randal E. Bryant', isbn: '9787111544937', category: '科技' as const },
    { title: '中国菜谱大全', author: '王森', isbn: '9787512623781', category: '生活' as const },
    { title: '安徒生童话', author: '汉斯·安徒生', isbn: '9787020089789', category: '儿童' as const },
    { title: '三体', author: '刘慈欣', isbn: '9787536692930', category: '小说' as const },
    { title: '活着', author: '余华', isbn: '9787506365437', category: '小说' as const },
    { title: '原则', author: '瑞·达利欧', isbn: '9787508683805', category: '非虚构' as const },
    { title: 'JavaScript高级程序设计', author: 'Nicholas C. Zakas', isbn: '9787115545466', category: '科技' as const },
    { title: '小王子', author: '安托万·德·圣-埃克苏佩里', isbn: '9787020042494', category: '儿童' as const },
    { title: '围城', author: '钱钟书', isbn: '9787020098569', category: '小说' as const },
    { title: '思考，快与慢', author: '丹尼尔·卡尼曼', isbn: '9787508633558', category: '非虚构' as const },
    { title: '算法导论', author: 'Thomas H. Cormen', isbn: '9787111407010', category: '科技' as const },
    { title: '家庭收纳整理全书', author: '近藤麻理惠', isbn: '9787544276306', category: '生活' as const },
    { title: '格林童话', author: '格林兄弟', isbn: '9787020089772', category: '儿童' as const },
    { title: '红楼梦', author: '曹雪芹', isbn: '9787020002207', category: '小说' as const },
    { title: '万历十五年', author: '黄仁宇', isbn: '9787108009821', category: '非虚构' as const },
    { title: '设计模式', author: 'Erich Gamma', isbn: '9787111211266', category: '科技' as const },
    { title: '养花实用手册', author: '张鲁归', isbn: '9787533528416', category: '生活' as const },
    { title: '伊索寓言', author: '伊索', isbn: '9787020077007', category: '儿童' as const },
  ];

  return sampleData.map((data, index) => ({
    id: `book-sample-${index + 1}`,
    ...data,
    coverUrl: '',
    condition: conditions[index % conditions.length],
    status: statuses[index % statuses.length],
    createdAt: Date.now() - index * 86400000,
    tags: [data.category, conditions[index % conditions.length]],
  }));
}
