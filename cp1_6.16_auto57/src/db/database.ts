import { v4 as uuidv4 } from 'uuid';
import { User, Book, SwapRequest, SwapHistory } from '../types';
import { getAvatarColor } from '../utils/colors';

const STORAGE_KEY = 'book_swap_db';

interface Database {
  users: User[];
  books: Book[];
  swapRequests: SwapRequest[];
  swapHistory: SwapHistory[];
  currentUserId: string;
}

function generateMockData(): Database {
  const users: User[] = [
    { id: 'user-1', username: '张小明', avatarColor: getAvatarColor('user-1') },
    { id: 'user-2', username: '李小红', avatarColor: getAvatarColor('user-2') },
    { id: 'user-3', username: '王大伟', avatarColor: getAvatarColor('user-3') },
    { id: 'user-4', username: '赵小芳', avatarColor: getAvatarColor('user-4') },
    { id: 'user-5', username: '刘建国', avatarColor: getAvatarColor('user-5') },
  ];

  const bookTemplates = [
    { title: '三体', author: '刘慈欣', category: '科幻' },
    { title: '流浪地球', author: '刘慈欣', category: '科幻' },
    { title: '百年孤独', author: '加西亚·马尔克斯', category: '文学' },
    { title: '活着', author: '余华', category: '文学' },
    { title: '平凡的世界', author: '路遥', category: '文学' },
    { title: '人类简史', author: '尤瓦尔·赫拉利', category: '历史' },
    { title: '明朝那些事儿', author: '当年明月', category: '历史' },
    { title: '万历十五年', author: '黄仁宇', category: '历史' },
    { title: '代码大全', author: 'Steve McConnell', category: '科技' },
    { title: '设计模式', author: 'GoF', category: '科技' },
    { title: '重构', author: 'Martin Fowler', category: '科技' },
    { title: '蒙娜丽莎的微笑', author: '丹·布朗', category: '艺术' },
    { title: '艺术的故事', author: '贡布里希', category: '艺术' },
    { title: '小王子', author: '圣埃克苏佩里', category: '其他' },
    { title: '追风筝的人', author: '卡勒德·胡赛尼', category: '文学' },
    { title: '围城', author: '钱钟书', category: '文学' },
    { title: '红楼梦', author: '曹雪芹', category: '文学' },
    { title: '西游记', author: '吴承恩', category: '文学' },
    { title: '未来简史', author: '尤瓦尔·赫拉利', category: '历史' },
    { title: '枪炮、病菌与钢铁', author: '贾雷德·戴蒙德', category: '历史' },
    { title: 'Python编程', author: 'Eric Matthes', category: '科技' },
    { title: '深入理解计算机系统', author: 'Randal E.Bryant', category: '科技' },
    { title: '算法导论', author: 'Thomas H.Cormen', category: '科技' },
    { title: '西方哲学史', author: '罗素', category: '其他' },
  ];

  const books: Book[] = [];
  const now = Date.now();

  bookTemplates.forEach((template, index) => {
    const userIndex = index % users.length;
    const isAvailable = Math.random() > 0.3;
    books.push({
      id: uuidv4(),
      title: template.title,
      author: template.author,
      category: template.category,
      ownerId: users[userIndex].id,
      isAvailable,
      createdAt: new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000),
    });
  });

  for (let i = 0; i < 20; i++) {
    const userIndex = Math.floor(Math.random() * users.length);
    const catIndex = Math.floor(Math.random() * 6);
    const categories = ['科幻', '文学', '历史', '科技', '艺术', '其他'];
    books.push({
      id: uuidv4(),
      title: `随机书籍${i + 1}`,
      author: `作者${i + 1}`,
      category: categories[catIndex],
      ownerId: users[userIndex].id,
      isAvailable: Math.random() > 0.3,
      createdAt: new Date(now - Math.random() * 60 * 24 * 60 * 60 * 1000),
    });
  }

  return {
    users,
    books,
    swapRequests: [],
    swapHistory: [],
    currentUserId: 'user-1',
  };
}

function loadDatabase(): Database {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const db = JSON.parse(stored);
      db.books = db.books.map((b: Book) => ({
        ...b,
        createdAt: new Date(b.createdAt),
      }));
      db.swapRequests = db.swapRequests.map((r: SwapRequest) => ({
        ...r,
        createdAt: new Date(r.createdAt),
      }));
      db.swapHistory = db.swapHistory.map((h: SwapHistory) => ({
        ...h,
        completedAt: new Date(h.completedAt),
      }));
      return db;
    }
  } catch (e) {
    console.error('Failed to load database:', e);
  }
  const mockData = generateMockData();
  saveDatabase(mockData);
  return mockData;
}

function saveDatabase(db: Database) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Failed to save database:', e);
  }
}

let db: Database = loadDatabase();

function notifyChange() {
  saveDatabase(db);
  window.dispatchEvent(new CustomEvent('db-updated'));
}

export const database = {
  getCurrentUser(): User {
    return db.users.find(u => u.id === db.currentUserId)!;
  },

  getUserById(id: string): User | undefined {
    return db.users.find(u => u.id === id);
  },

  getAllUsers(): User[] {
    return db.users;
  },

  getBooks(filter?: Partial<Book>): Book[] {
    let books = [...db.books];
    if (filter) {
      books = books.filter(book => {
        return Object.entries(filter).every(([key, value]) => {
          return book[key as keyof Book] === value;
        });
      });
    }
    return books.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getBookById(id: string): Book | undefined {
    return db.books.find(b => b.id === id);
  },

  addBook(book: Omit<Book, 'id' | 'createdAt'>): Book {
    const newBook: Book = {
      ...book,
      id: uuidv4(),
      createdAt: new Date(),
    };
    db.books.unshift(newBook);
    notifyChange();
    return newBook;
  },

  updateBook(id: string, updates: Partial<Book>): Book | undefined {
    const index = db.books.findIndex(b => b.id === id);
    if (index !== -1) {
      db.books[index] = { ...db.books[index], ...updates };
      notifyChange();
      return db.books[index];
    }
    return undefined;
  },

  deleteBook(id: string): boolean {
    const index = db.books.findIndex(b => b.id === id);
    if (index !== -1) {
      db.books.splice(index, 1);
      notifyChange();
      return true;
    }
    return false;
  },

  getBooksByUserId(userId: string): Book[] {
    return this.getBooks({ ownerId: userId } as Partial<Book>);
  },

  getAvailableBooksByUserId(userId: string): Book[] {
    return this.getBooks({ ownerId: userId, isAvailable: true } as Partial<Book>);
  },

  getSwapRequests(filter?: Partial<SwapRequest>): SwapRequest[] {
    let requests = [...db.swapRequests];
    if (filter) {
      requests = requests.filter(req => {
        return Object.entries(filter).every(([key, value]) => {
          return req[key as keyof SwapRequest] === value;
        });
      });
    }
    return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createSwapRequest(request: Omit<SwapRequest, 'id' | 'createdAt' | 'status'>): SwapRequest {
    const targetBook = this.getBookById(request.requestedBookId);
    if (!targetBook || !targetBook.isAvailable) {
      throw new Error('该书籍已被交换');
    }

    const newRequest: SwapRequest = {
      ...request,
      id: uuidv4(),
      status: 'pending',
      createdAt: new Date(),
    };
    db.swapRequests.unshift(newRequest);
    notifyChange();
    return newRequest;
  },

  updateSwapRequestStatus(id: string, status: 'accepted' | 'rejected'): SwapRequest | undefined {
    const index = db.swapRequests.findIndex(r => r.id === id);
    if (index !== -1) {
      db.swapRequests[index].status = status;
      notifyChange();
      return db.swapRequests[index];
    }
    return undefined;
  },

  getPendingRequestsCount(userId: string): number {
    return db.swapRequests.filter(r => r.recipientId === userId && r.status === 'pending').length;
  },

  getSwapHistory(): SwapHistory[] {
    return [...db.swapHistory].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  },

  addSwapHistory(history: Omit<SwapHistory, 'id' | 'completedAt'>): SwapHistory {
    const newHistory: SwapHistory = {
      ...history,
      id: uuidv4(),
      completedAt: new Date(),
    };
    db.swapHistory.unshift(newHistory);
    notifyChange();
    return newHistory;
  },

  executeSwap(requestId: string): boolean {
    const request = db.swapRequests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending') {
      return false;
    }

    const requestedBook = db.books.find(b => b.id === request.requestedBookId);
    const offeredBook = db.books.find(b => b.id === request.offeredBookId);

    if (!requestedBook || !offeredBook || !requestedBook.isAvailable || !offeredBook.isAvailable) {
      return false;
    }

    const tempOwnerId = requestedBook.ownerId;
    requestedBook.ownerId = offeredBook.ownerId;
    offeredBook.ownerId = tempOwnerId;

    requestedBook.isAvailable = false;
    offeredBook.isAvailable = false;

    request.status = 'accepted';

    this.addSwapHistory({
      requestId: request.id,
      user1Id: request.requesterId,
      user2Id: request.recipientId,
      book1Id: request.offeredBookId,
      book2Id: request.requestedBookId,
      status: 'completed',
    });

    notifyChange();
    return true;
  },

  subscribe(callback: () => void): () => void {
    const handler = () => callback();
    window.addEventListener('db-updated', handler);
    return () => window.removeEventListener('db-updated', handler);
  },

  resetDatabase() {
    db = generateMockData();
    saveDatabase(db);
    notifyChange();
  },
};
