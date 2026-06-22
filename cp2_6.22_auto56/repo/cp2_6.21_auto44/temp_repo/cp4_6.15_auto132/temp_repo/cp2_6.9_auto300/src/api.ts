import { v4 as uuidv4 } from 'uuid';
import type { Book, Category, BorrowRecord } from './types';

const categories: Category[] = ['经', '史', '子', '集'];

const bookData = [
  { title: '论语', author: '孔子', category: '经' as Category, colophon: '学而时习之，不亦说乎', edition: '宋版', volumeCount: 20 },
  { title: '孟子', author: '孟子', category: '经' as Category, colophon: '得道者多助，失道者寡助', edition: '元版', volumeCount: 14 },
  { title: '大学', author: '曾子', category: '经' as Category, colophon: '修身齐家治国平天下', edition: '明版', volumeCount: 1 },
  { title: '中庸', author: '子思', category: '经' as Category, colophon: '君子中庸，小人反中庸', edition: '清版', volumeCount: 1 },
  { title: '诗经', author: '佚名', category: '经' as Category, colophon: '关关雎鸠，在河之洲', edition: '宋版', volumeCount: 30 },
  { title: '尚书', author: '佚名', category: '经' as Category, colophon: '人心惟危，道心惟微', edition: '唐版', volumeCount: 58 },
  { title: '礼记', author: '戴圣', category: '经' as Category, colophon: '礼者，人道之极也', edition: '汉版', volumeCount: 49 },
  { title: '周易', author: '周文王', category: '经' as Category, colophon: '天行健，君子以自强不息', edition: '宋版', volumeCount: 10 },
  { title: '春秋', author: '孔子', category: '经' as Category, colophon: '春秋笔法，微言大义', edition: '晋版', volumeCount: 30 },
  { title: '左传', author: '左丘明', category: '史' as Category, colophon: '多行不义必自毙', edition: '宋版', volumeCount: 60 },
  { title: '史记', author: '司马迁', category: '史' as Category, colophon: '究天人之际，通古今之变', edition: '汉版', volumeCount: 130 },
  { title: '汉书', author: '班固', category: '史' as Category, colophon: '史家之绝唱，无韵之离骚', edition: '唐版', volumeCount: 100 },
  { title: '后汉书', author: '范晔', category: '史' as Category, colophon: '精诚所至，金石为开', edition: '宋版', volumeCount: 90 },
  { title: '三国志', author: '陈寿', category: '史' as Category, colophon: '天下大势，分久必合', edition: '晋版', volumeCount: 65 },
  { title: '资治通鉴', author: '司马光', category: '史' as Category, colophon: '鉴于往事，有资于治道', edition: '宋版', volumeCount: 294 },
  { title: '战国策', author: '刘向', category: '史' as Category, colophon: '合纵连横，纵横捭阖', edition: '汉版', volumeCount: 33 },
  { title: '新唐书', author: '欧阳修', category: '史' as Category, colophon: '以史为镜，可以知兴替', edition: '宋版', volumeCount: 225 },
  { title: '宋史', author: '脱脱', category: '史' as Category, colophon: '华夏民族之文化，历数千载之演进', edition: '元版', volumeCount: 496 },
  { title: '老子', author: '李耳', category: '子' as Category, colophon: '道可道，非常道', edition: '汉版', volumeCount: 2 },
  { title: '庄子', author: '庄周', category: '子' as Category, colophon: '天地与我并生，而万物与我为一', edition: '晋版', volumeCount: 33 },
  { title: '墨子', author: '墨翟', category: '子' as Category, colophon: '兼相爱，交相利', edition: '战国版', volumeCount: 15 },
  { title: '韩非子', author: '韩非', category: '子' as Category, colophon: '法不阿贵，绳不挠曲', edition: '秦版', volumeCount: 20 },
  { title: '荀子', author: '荀况', category: '子' as Category, colophon: '青，取之于蓝，而青于蓝', edition: '汉版', volumeCount: 32 },
  { title: '孙子兵法', author: '孙武', category: '子' as Category, colophon: '知彼知己，百战不殆', edition: '春秋版', volumeCount: 13 },
  { title: '鬼谷子', author: '鬼谷子', category: '子' as Category, colophon: '审定有无，以其实虚', edition: '战国版', volumeCount: 3 },
  { title: '吕氏春秋', author: '吕不韦', category: '子' as Category, colophon: '流水不腐，户枢不蠹', edition: '秦版', volumeCount: 26 },
  { title: '淮南子', author: '刘安', category: '子' as Category, colophon: '塞翁失马，焉知非福', edition: '汉版', volumeCount: 21 },
  { title: '楚辞', author: '屈原', category: '集' as Category, colophon: '路漫漫其修远兮，吾将上下而求索', edition: '汉版', volumeCount: 17 },
  { title: '李太白集', author: '李白', category: '集' as Category, colophon: '天生我材必有用，千金散尽还复来', edition: '宋版', volumeCount: 30 },
  { title: '杜工部集', author: '杜甫', category: '集' as Category, colophon: '会当凌绝顶，一览众山小', edition: '唐版', volumeCount: 60 },
  { title: '东坡乐府', author: '苏轼', category: '集' as Category, colophon: '但愿人长久，千里共婵娟', edition: '宋版', volumeCount: 2 },
  { title: '稼轩长短句', author: '辛弃疾', category: '集' as Category, colophon: '众里寻他千百度', edition: '宋版', volumeCount: 12 },
  { title: '漱玉词', author: '李清照', category: '集' as Category, colophon: '莫道不销魂，帘卷西风，人比黄花瘦', edition: '宋版', volumeCount: 6 },
  { title: '陶渊明集', author: '陶渊明', category: '集' as Category, colophon: '采菊东篱下，悠然见南山', edition: '南北朝版', volumeCount: 10 },
  { title: '王维诗集', author: '王维', category: '集' as Category, colophon: '空山新雨后，天气晚来秋', edition: '唐版', volumeCount: 10 },
  { title: '昌黎先生集', author: '韩愈', category: '集' as Category, colophon: '业精于勤，荒于嬉', edition: '宋版', volumeCount: 40 },
  { title: '柳河东集', author: '柳宗元', category: '集' as Category, colophon: '千山鸟飞绝，万径人踪灭', edition: '唐版', volumeCount: 45 },
  { title: '临川先生文集', author: '王安石', category: '集' as Category, colophon: '春风又绿江南岸，明月何时照我还', edition: '宋版', volumeCount: 100 },
  { title: '欧阳文忠公集', author: '欧阳修', category: '集' as Category, colophon: '醉翁之意不在酒，在乎山水之间也', edition: '宋版', volumeCount: 153 },
];

const gradients = [
  'linear-gradient(135deg, #8b7355 0%, #a08060 50%, #6b5344 100%)',
  'linear-gradient(135deg, #5c4033 0%, #8b6914 50%, #3e2723 100%)',
  'linear-gradient(135deg, #6d4c41 0%, #8d6e63 50%, #4e342e 100%)',
  'linear-gradient(135deg, #795548 0%, #a1887f 50%, #5d4037 100%)',
  'linear-gradient(135deg, #8d6e63 0%, #bcaaa4 50%, #6d4c41 100%)',
  'linear-gradient(135deg, #c0c0c0 0%, #e0d5c0 50%, #a89880 100%)',
  'linear-gradient(135deg, #a1887f 0%, #d7ccc8 50%, #795548 100%)',
  'linear-gradient(135deg, #bcaaa4 0%, #efebe9 50%, #8d6e63 100%)',
];

let books: Book[] = bookData.map((book, index) => ({
  id: uuidv4(),
  ...book,
  description: `${book.title}乃${book.category}部经典之作，由${book.author}所著，流传千古，为后世所传颂。`,
  isBorrowed: false,
  coverGradient: gradients[index % gradients.length],
  createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
}));

let borrowRecords: BorrowRecord[] = [];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  async getBooks(): Promise<Book[]> {
    await delay(100);
    return [...books];
  },

  async getBookById(id: string): Promise<Book | undefined> {
    await delay(50);
    return books.find(b => b.id === id);
  },

  async getBooksByCategory(category: Category): Promise<Book[]> {
    await delay(50);
    return books.filter(b => b.category === category);
  },

  async searchBooks(keyword: string): Promise<Book[]> {
    await delay(50);
    const lowerKeyword = keyword.toLowerCase();
    return books.filter(
      b => b.title.toLowerCase().includes(lowerKeyword) || b.author.toLowerCase().includes(lowerKeyword)
    );
  },

  async addBook(bookData: Omit<Book, 'id' | 'createdAt' | 'coverGradient' | 'isBorrowed'>): Promise<Book> {
    await delay(100);
    const newBook: Book = {
      ...bookData,
      id: uuidv4(),
      isBorrowed: false,
      coverGradient: gradients[Math.floor(Math.random() * gradients.length)],
      createdAt: new Date().toISOString(),
    };
    books.push(newBook);
    return newBook;
  },

  async updateBook(id: string, updates: Partial<Book>): Promise<Book | undefined> {
    await delay(100);
    const index = books.findIndex(b => b.id === id);
    if (index !== -1) {
      books[index] = { ...books[index], ...updates };
      return books[index];
    }
    return undefined;
  },

  async deleteBook(id: string): Promise<boolean> {
    await delay(100);
    const index = books.findIndex(b => b.id === id);
    if (index !== -1) {
      books.splice(index, 1);
      return true;
    }
    return false;
  },

  async borrowBook(bookId: string, readerName: string, borrowDate: string, returnDate: string): Promise<BorrowRecord | null> {
    await delay(100);
    const book = books.find(b => b.id === bookId);
    if (!book || book.isBorrowed) return null;

    const record: BorrowRecord = {
      id: uuidv4(),
      bookId,
      bookTitle: book.title,
      readerName,
      borrowDate,
      returnDate,
      timestamp: Date.now(),
    };

    book.isBorrowed = true;
    borrowRecords.unshift(record);
    return record;
  },

  async returnBook(bookId: string): Promise<boolean> {
    await delay(100);
    const book = books.find(b => b.id === bookId);
    if (!book) {
      book.isBorrowed = false;
      return true;
    }
    return false;
  },

  async getBorrowRecords(limit = 10): Promise<BorrowRecord[]> {
    await delay(50);
    return borrowRecords.slice(0, limit);
  },

  async getAllBorrowRecords(): Promise<BorrowRecord[]> {
    await delay(50);
    return [...borrowRecords];
  },

  async exportBookList(): Promise<string> {
    await delay(100);
    const header = '书名,作者,分类,版本,册数,状态\n';
    const rows = books.map(b => 
      `${b.title},${b.author},${b.category},${b.edition},${b.volumeCount},${b.isBorrowed ? '已借出' : '在架'}`
    ).join('\n');
    return header + rows;
  },

  getCategories(): { key: Category; label: string }[] {
    return categories.map(c => ({ key: c, label: c }));
  },
};
