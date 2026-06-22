import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { Book, BorrowRecord, ApiResponse } from './types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const books: Book[] = [];
const borrowRecords: BorrowRecord[] = [];

const borrowers = ['张三', '李四', '王五', '赵六', '陈七', '刘八', '周九', '吴十'];

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(date: Date): string {
  return date.toISOString();
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const initialBooksData: Omit<Book, 'id' | 'cover' | 'borrowCount'>[] = [
  { title: '活着', author: '余华', status: 'available', description: '一部描写中国农村家庭变迁的史诗性作品。' },
  { title: '三体', author: '刘慈欣', status: 'available', description: '中国科幻文学的里程碑之作，探讨人类文明与外星文明的碰撞。' },
  { title: '百年孤独', author: '加西亚·马尔克斯', status: 'available', description: '魔幻现实主义文学的代表作，讲述布恩迪亚家族七代人的传奇。' },
  { title: '万历十五年', author: '黄仁宇', status: 'available', description: '以大历史观解读明朝万历年间的社会与政治。' },
  { title: '存在与时间', author: '海德格尔', status: 'available', description: '20世纪存在主义哲学的奠基之作。' },
  { title: '红楼梦', author: '曹雪芹', status: 'available', description: '中国古典小说的巅峰之作，描绘封建社会的兴衰。' },
  { title: '1984', author: '乔治·奥威尔', status: 'available', description: '反乌托邦文学的经典，警示极权主义的危害。' },
  { title: '人类简史', author: '尤瓦尔·赫拉利', status: 'available', description: '从认知革命到科学革命，重新审视人类历史。' },
  { title: '局外人', author: '加缪', status: 'available', description: '荒诞哲学的代表作品，探讨存在的意义。' },
  { title: '围城', author: '钱钟书', status: 'available', description: '以幽默笔触描绘知识分子的生活百态。' },
  { title: '明朝那些事儿', author: '当年明月', status: 'available', description: '以通俗笔法讲述明朝三百年历史。' },
  { title: '查拉图斯特拉如是说', author: '尼采', status: 'available', description: '尼采哲学思想的集中体现，提出超人学说。' },
  { title: '平凡的世界', author: '路遥', status: 'available', description: '记录中国改革开放初期城乡社会的变迁。' },
  { title: '基地', author: '阿西莫夫', status: 'available', description: '科幻文学史上的经典，描绘银河帝国的兴衰。' },
  { title: '苏东坡传', author: '林语堂', status: 'available', description: '记述北宋文豪苏轼的一生及其文学成就。' },
];

const borrowedBookIndexes = [1, 4, 9];

initialBooksData.forEach((bookData, index) => {
  const isBorrowed = borrowedBookIndexes.includes(index);
  const borrowCount = getRandomInt(3, 18);
  const currentBorrower = isBorrowed ? borrowers[getRandomInt(0, borrowers.length - 1)] : undefined;
  const currentBorrowTime = isBorrowed ? formatDate(addDays(new Date(), -getRandomInt(1, 20))) : undefined;

  const book: Book = {
    id: uuidv4(),
    title: bookData.title,
    author: bookData.author,
    cover: `https://placehold.co/200x280/4a5568/FFFFFF/png?text=${encodeURIComponent(bookData.title)}`,
    status: isBorrowed ? 'borrowed' : 'available',
    borrower: currentBorrower,
    borrowTime: currentBorrowTime,
    borrowCount: borrowCount,
    description: bookData.description,
  };

  books.push(book);

  const historyCount = getRandomInt(3, 5);
  for (let i = 0; i < historyCount; i++) {
    const daysAgo = (historyCount - i) * 30 + getRandomInt(1, 20);
    const borrowDate = addDays(new Date(), -daysAgo);
    const returnDate = addDays(borrowDate, getRandomInt(7, 30));

    borrowRecords.push({
      id: uuidv4(),
      bookId: book.id,
      borrower: borrowers[getRandomInt(0, borrowers.length - 1)],
      borrowTime: formatDate(borrowDate),
      returnTime: formatDate(returnDate),
    });
  }

  if (isBorrowed && currentBorrower && currentBorrowTime) {
    borrowRecords.push({
      id: uuidv4(),
      bookId: book.id,
      borrower: currentBorrower,
      borrowTime: currentBorrowTime,
      returnTime: undefined,
    });
  }
});

app.get('/api/books', (req, res) => {
  const keyword = req.query.keyword as string | undefined;
  let filteredBooks = books;

  if (keyword) {
    const lowerKeyword = keyword.toLowerCase();
    filteredBooks = books.filter(
      (book) =>
        book.title.toLowerCase().includes(lowerKeyword) ||
        book.author.toLowerCase().includes(lowerKeyword)
    );
  }

  const response: ApiResponse<Book[]> = {
    success: true,
    data: filteredBooks,
  };
  res.json(response);
});

app.get('/api/books/:id', (req, res) => {
  const { id } = req.params;
  const book = books.find((b) => b.id === id);

  if (!book) {
    const response: ApiResponse<Book> = {
      success: false,
      message: '图书不存在',
    };
    return res.status(404).json(response);
  }

  const response: ApiResponse<Book> = {
    success: true,
    data: book,
  };
  res.json(response);
});

app.post('/api/books/:id/borrow', (req, res) => {
  const { id } = req.params;
  const { borrower } = req.body as { borrower?: string };
  const book = books.find((b) => b.id === id);

  if (!book) {
    const response: ApiResponse<Book> = {
      success: false,
      message: '图书不存在',
    };
    return res.status(404).json(response);
  }

  if (book.status === 'borrowed') {
    const response: ApiResponse<Book> = {
      success: false,
      message: '图书已被借出',
    };
    return res.status(400).json(response);
  }

  if (!borrower || borrower.trim() === '') {
    const response: ApiResponse<Book> = {
      success: false,
      message: '借阅人不能为空',
    };
    return res.status(400).json(response);
  }

  const now = formatDate(new Date());
  book.status = 'borrowed';
  book.borrower = borrower.trim();
  book.borrowTime = now;
  book.borrowCount += 1;

  const record: BorrowRecord = {
    id: uuidv4(),
    bookId: book.id,
    borrower: borrower.trim(),
    borrowTime: now,
    returnTime: undefined,
  };
  borrowRecords.push(record);

  const response: ApiResponse<Book> = {
    success: true,
    data: book,
  };
  res.json(response);
});

app.post('/api/books/:id/return', (req, res) => {
  const { id } = req.params;
  const book = books.find((b) => b.id === id);

  if (!book) {
    const response: ApiResponse<Book> = {
      success: false,
      message: '图书不存在',
    };
    return res.status(404).json(response);
  }

  if (book.status === 'available') {
    const response: ApiResponse<Book> = {
      success: false,
      message: '图书未被借出',
    };
    return res.status(400).json(response);
  }

  const now = formatDate(new Date());
  book.status = 'available';
  book.borrower = undefined;
  book.borrowTime = undefined;

  const unreturnedRecord = borrowRecords.find(
    (r) => r.bookId === book.id && r.returnTime === undefined
  );
  if (unreturnedRecord) {
    unreturnedRecord.returnTime = now;
  }

  const response: ApiResponse<Book> = {
    success: true,
    data: book,
  };
  res.json(response);
});

app.get('/api/books/:id/history', (req, res) => {
  const { id } = req.params;
  const book = books.find((b) => b.id === id);

  if (!book) {
    const response: ApiResponse<BorrowRecord[]> = {
      success: false,
      message: '图书不存在',
    };
    return res.status(404).json(response);
  }

  const records = borrowRecords
    .filter((r) => r.bookId === id)
    .sort((a, b) => new Date(b.borrowTime).getTime() - new Date(a.borrowTime).getTime());

  const response: ApiResponse<BorrowRecord[]> = {
    success: true,
    data: records,
  };
  res.json(response);
});

app.listen(PORT, () => {
  console.log(`[server] Server is running at http://localhost:${PORT}`);
  console.log(`[server] Initialized ${books.length} books and ${borrowRecords.length} borrow records`);
});
