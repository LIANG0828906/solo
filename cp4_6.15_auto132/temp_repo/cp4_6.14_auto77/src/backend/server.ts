import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  coverUrl: string;
  isBorrowed: boolean;
  currentBorrower?: string;
  borrowDate?: string;
}

export interface BorrowRecord {
  id: string;
  bookId: string;
  borrowerName: string;
  borrowDate: string;
  returnDate?: string;
}

let books: Book[] = [
  {
    id: uuidv4(),
    isbn: '9787544253994',
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    category: '小说',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20hundred%20years%20of%20solitude&image_size=square',
    isBorrowed: false,
  },
  {
    id: uuidv4(),
    isbn: '9787115428028',
    title: 'JavaScript高级程序设计',
    author: 'Nicholas C. Zakas',
    category: '科技',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20javascript%20programming&image_size=square',
    isBorrowed: false,
  },
  {
    id: uuidv4(),
    isbn: '9787508647357',
    title: '人类简史',
    author: '尤瓦尔·赫拉利',
    category: '非虚构',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20sapiens%20history&image_size=square',
    isBorrowed: false,
  },
  {
    id: uuidv4(),
    isbn: '9787532754687',
    title: '小王子',
    author: '安托万·德·圣-埃克苏佩里',
    category: '儿童',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20little%20prince&image_size=square',
    isBorrowed: false,
  },
  {
    id: uuidv4(),
    isbn: '9787549556229',
    title: '艺术的故事',
    author: '贡布里希',
    category: '艺术',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20story%20of%20art&image_size=square',
    isBorrowed: false,
  },
];

let borrowRecords: BorrowRecord[] = [];

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

app.get('/api/books', (req: Request, res: Response) => {
  const { category, search } = req.query;
  let filteredBooks = [...books];

  if (category && category !== '全部') {
    filteredBooks = filteredBooks.filter(book => book.category === category);
  }

  if (search) {
    const keyword = String(search).toLowerCase();
    filteredBooks = filteredBooks.filter(book =>
      book.title.toLowerCase().includes(keyword)
    );
  }

  res.json(filteredBooks);
});

app.post('/api/books', (req: Request, res: Response) => {
  const { isbn, title, author, category, coverUrl } = req.body;

  if (!isbn || !title || !author || !category) {
    return res.status(400).json({ error: '必填字段缺失' });
  }

  const newBook: Book = {
    id: uuidv4(),
    isbn,
    title,
    author,
    category,
    coverUrl: coverUrl || '',
    isBorrowed: false,
  };

  books.push(newBook);
  res.status(201).json(newBook);
});

app.post('/api/books/:id/borrow', (req: Request, res: Response) => {
  const { id } = req.params;
  const { borrowerName } = req.body;

  if (!borrowerName) {
    return res.status(400).json({ error: '借阅者姓名必填' });
  }

  const bookIndex = books.findIndex(book => book.id === id);
  if (bookIndex === -1) {
    return res.status(404).json({ error: '图书不存在' });
  }

  if (books[bookIndex].isBorrowed) {
    return res.status(400).json({ error: '图书已借出' });
  }

  const borrowDate = formatDate(new Date());
  books[bookIndex] = {
    ...books[bookIndex],
    isBorrowed: true,
    currentBorrower: borrowerName,
    borrowDate,
  };

  const record: BorrowRecord = {
    id: uuidv4(),
    bookId: id,
    borrowerName,
    borrowDate,
  };
  borrowRecords.push(record);

  res.json({ book: books[bookIndex], record });
});

app.post('/api/books/:id/return', (req: Request, res: Response) => {
  const { id } = req.params;

  const bookIndex = books.findIndex(book => book.id === id);
  if (bookIndex === -1) {
    return res.status(404).json({ error: '图书不存在' });
  }

  if (!books[bookIndex].isBorrowed) {
    return res.status(400).json({ error: '图书未借出' });
  }

  const returnDate = formatDate(new Date());
  books[bookIndex] = {
    ...books[bookIndex],
    isBorrowed: false,
    currentBorrower: undefined,
    borrowDate: undefined,
  };

  const recordIndex = borrowRecords.findIndex(
    r => r.bookId === id && !r.returnDate
  );
  if (recordIndex !== -1) {
    borrowRecords[recordIndex] = {
      ...borrowRecords[recordIndex],
      returnDate,
    };
  }

  res.json({ book: books[bookIndex], returnDate });
});

app.get('/api/books/:id/history', (req: Request, res: Response) => {
  const { id } = req.params;
  const history = borrowRecords
    .filter(r => r.bookId === id)
    .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime());
  res.json(history);
});

app.listen(PORT, () => {
  console.log(`图书管理后端服务运行在 http://localhost:${PORT}`);
});
