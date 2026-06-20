import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  price: number;
  stock: number;
  category: string;
  coverUrl: string;
  createdAt: string;
}

interface Order {
  id: string;
  orderNo: string;
  items: { bookId: string; book: Book; quantity: number }[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'completed';
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  createdAt: string;
}

let books: Book[] = [
  {
    id: uuidv4(),
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    isbn: '9787544291170',
    price: 45.00,
    stock: 100,
    category: 'novel',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20classic%20literary%20novel%20magic%20realism%20blue%20gold%20elegant&image_size=portrait_4_3',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: '三体',
    author: '刘慈欣',
    isbn: '9787536692930',
    price: 68.00,
    stock: 150,
    category: 'tech',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sci-fi%20book%20cover%20space%20universe%20stars%20dark%20blue%20futuristic&image_size=portrait_4_3',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: '人类简史',
    author: '尤瓦尔·赫拉利',
    isbn: '9787508647357',
    price: 88.00,
    stock: 80,
    category: 'tech',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=history%20book%20cover%20human%20evolution%20timeline%20earth%20warm%20colors&image_size=portrait_4_3',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: '活着',
    author: '余华',
    isbn: '9787506365437',
    price: 35.00,
    stock: 200,
    category: 'novel',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20literary%20book%20cover%20rural%20life%20warm%20sunset%20emotional&image_size=portrait_4_3',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: '小王子',
    author: '安托万·德·圣-埃克苏佩里',
    isbn: '9787544733086',
    price: 29.80,
    stock: 300,
    category: 'novel',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=little%20prince%20book%20cover%20stars%20planet%20fox%20dreamy%20illustration&image_size=portrait_4_3',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: '时间简史',
    author: '史蒂芬·霍金',
    isbn: '9787535744878',
    price: 55.00,
    stock: 120,
    category: 'tech',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=physics%20book%20cover%20black%20hole%20time%20space%20cosmos%20mystical&image_size=portrait_4_3',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: '红楼梦',
    author: '曹雪芹',
    isbn: '9787020002200',
    price: 128.00,
    stock: 60,
    category: 'novel',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20classical%20book%20cover%20red%20chamber%20traditional%20art%20elegant&image_size=portrait_4_3',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: '瓦尔登湖',
    author: '亨利·戴维·梭罗',
    isbn: '9787532742436',
    price: 42.00,
    stock: 90,
    category: 'life',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nature%20book%20cover%20lake%20forest%20cabin%20peaceful%20green%20serene&image_size=portrait_4_3',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: '艺术的故事',
    author: '贡布里希',
    isbn: '9787807463726',
    price: 280.00,
    stock: 40,
    category: 'life',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=art%20history%20book%20cover%20painting%20masterpiece%20elegant%20gold%20frame&image_size=portrait_4_3',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: '苏菲的世界',
    author: '乔斯坦·贾德',
    isbn: '9787506395168',
    price: 78.00,
    stock: 85,
    category: 'tech',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=philosophy%20book%20cover%20mysterious%20girl%20world%20wisdom%20purple%20dreamy&image_size=portrait_4_3',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: '浮生六记',
    author: '沈复',
    isbn: '9787101073973',
    price: 38.00,
    stock: 110,
    category: 'life',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20essay%20book%20cover%20traditional%20ink%20painting%20plum%20blossom%20elegant&image_size=portrait_4_3',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: '代码整洁之道',
    author: 'Robert C. Martin',
    isbn: '9787115217488',
    price: 59.00,
    stock: 75,
    category: 'tech',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=programming%20book%20cover%20code%20clean%20minimal%20tech%20blue%20modern&image_size=portrait_4_3',
    createdAt: new Date().toISOString(),
  },
];

let orders: Order[] = [
  {
    id: uuidv4(),
    orderNo: 'ORD2026061815300004',
    items: [
      {
        bookId: books[4].id,
        book: books[4],
        quantity: 1,
      },
    ],
    totalAmount: 29.80,
    status: 'pending',
    customerName: '赵六',
    customerPhone: '13600136000',
    customerAddress: '深圳市南山区某某科技园A栋',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    orderNo: 'ORD2026061810300001',
    items: [
      {
        bookId: books[0].id,
        book: books[0],
        quantity: 2,
      },
    ],
    totalAmount: 90.00,
    status: 'completed',
    customerName: '张三',
    customerPhone: '13800138000',
    customerAddress: '北京市朝阳区某某街道123号',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    orderNo: 'ORD2026061811450002',
    items: [
      {
        bookId: books[1].id,
        book: books[1],
        quantity: 1,
      },
      {
        bookId: books[3].id,
        book: books[3],
        quantity: 1,
      },
    ],
    totalAmount: 103.00,
    status: 'shipped',
    customerName: '李四',
    customerPhone: '13900139000',
    customerAddress: '上海市浦东新区某某路456号',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    orderNo: 'ORD2026061814200003',
    items: [
      {
        bookId: books[2].id,
        book: books[2],
        quantity: 1,
      },
    ],
    totalAmount: 88.00,
    status: 'paid',
    customerName: '王五',
    customerPhone: '13700137000',
    customerAddress: '广州市天河区某某大道789号',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传 JPEG 和 PNG 格式的图片'));
    }
  },
});

const generateOrderNo = (): string => {
  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${timestamp}${random}`;
};

app.get('/api/books', (req: Request, res: Response) => {
  res.json(books);
});

app.get('/api/books/:id', (req: Request, res: Response) => {
  const book = books.find((b) => b.id === req.params.id);
  if (!book) {
    return res.status(404).json({ error: '图书不存在' });
  }
  res.json(book);
});

app.post('/api/books', upload.single('cover'), async (req: Request, res: Response) => {
  try {
    const { title, author, isbn, price, stock, category } = req.body;

    if (!title || !author || !isbn || !price || !stock || !category) {
      return res.status(400).json({ error: '请填写所有必填字段' });
    }

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10);

    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ error: '定价必须是有效的数字' });
    }

    if (isNaN(stockNum) || stockNum < 0 || stockNum > 9999) {
      return res.status(400).json({ error: '库存数量必须在 0-9999 之间' });
    }

    let coverUrl = '';

    if (req.file) {
      const filename = `${uuidv4()}.jpg`;
      const outputPath = path.join(uploadsDir, filename);

      await sharp(req.file.buffer)
        .resize(300, null, {
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      coverUrl = `/uploads/${filename}`;
    } else {
      coverUrl = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`book cover ${title} ${author}`)}&image_size=portrait_4_3`;
    }

    const newBook: Book = {
      id: uuidv4(),
      title,
      author,
      isbn,
      price: priceNum,
      stock: stockNum,
      category,
      coverUrl,
      createdAt: new Date().toISOString(),
    };

    books.unshift(newBook);
    res.status(201).json(newBook);
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: '创建图书失败' });
  }
});

app.put('/api/books/:id', upload.single('cover'), async (req: Request, res: Response) => {
  try {
    const bookIndex = books.findIndex((b) => b.id === req.params.id);
    if (bookIndex === -1) {
      return res.status(404).json({ error: '图书不存在' });
    }

    const { title, author, isbn, price, stock, category } = req.body;
    const existingBook = books[bookIndex];

    let coverUrl = existingBook.coverUrl;

    if (req.file) {
      const filename = `${uuidv4()}.jpg`;
      const outputPath = path.join(uploadsDir, filename);

      await sharp(req.file.buffer)
        .resize(300, null, {
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      coverUrl = `/uploads/${filename}`;

      if (existingBook.coverUrl.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, existingBook.coverUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    const updatedBook: Book = {
      ...existingBook,
      title: title || existingBook.title,
      author: author || existingBook.author,
      isbn: isbn || existingBook.isbn,
      price: price !== undefined ? parseFloat(price) : existingBook.price,
      stock: stock !== undefined ? parseInt(stock, 10) : existingBook.stock,
      category: category || existingBook.category,
      coverUrl,
    };

    books[bookIndex] = updatedBook;
    res.json(updatedBook);
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: '更新图书失败' });
  }
});

app.delete('/api/books/:id', (req: Request, res: Response) => {
  const bookIndex = books.findIndex((b) => b.id === req.params.id);
  if (bookIndex === -1) {
    return res.status(404).json({ error: '图书不存在' });
  }

  const deletedBook = books[bookIndex];
  if (deletedBook.coverUrl.startsWith('/uploads/')) {
    const oldPath = path.join(__dirname, deletedBook.coverUrl);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  books.splice(bookIndex, 1);
  res.json({ success: true });
});

app.get('/api/orders', (req: Request, res: Response) => {
  res.json(orders);
});

app.get('/api/orders/:id', (req: Request, res: Response) => {
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  res.json(order);
});

app.post('/api/orders', (req: Request, res: Response) => {
  try {
    const { items, customerName, customerPhone, customerAddress } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: '订单不能为空' });
    }

    if (!customerName || !customerPhone || !customerAddress) {
      return res.status(400).json({ error: '请填写完整的收货信息' });
    }

    let totalAmount = 0;
    const orderItems = items.map((item: { bookId: string; quantity: number }) => {
      const book = books.find((b) => b.id === item.bookId);
      if (!book) {
        throw new Error(`图书 ID ${item.bookId} 不存在`);
      }
      if (book.stock < item.quantity) {
        throw new Error(`图书《${book.title}》库存不足`);
      }
      totalAmount += book.price * item.quantity;
      return {
        bookId: item.bookId,
        book,
        quantity: item.quantity,
      };
    });

    orderItems.forEach((item: { bookId: string; quantity: number }) => {
      const book = books.find((b) => b.id === item.bookId);
      if (book) {
        book.stock -= item.quantity;
      }
    });

    const newOrder: Order = {
      id: uuidv4(),
      orderNo: generateOrderNo(),
      items: orderItems,
      totalAmount,
      status: 'pending',
      customerName,
      customerPhone,
      customerAddress,
      createdAt: new Date().toISOString(),
    };

    orders.unshift(newOrder);
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : '创建订单失败' });
  }
});

app.put('/api/orders/:id/status', (req: Request, res: Response) => {
  const orderIndex = orders.findIndex((o) => o.id === req.params.id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: '订单不存在' });
  }

  const { status } = req.body;
  const validStatuses: Order['status'][] = ['pending', 'paid', 'shipped', 'completed'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: '无效的订单状态' });
  }

  orders[orderIndex].status = status;
  res.json(orders[orderIndex]);
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({ token: 'mock-jwt-token', user: { username: 'admin', role: 'admin' } });
  } else {
    res.status(401).json({ error: '用户名或密码错误' });
  }
});

app.use((error: Error, req: Request, res: Response, next: express.NextFunction) => {
  console.error('Server error:', error);
  if (error.message.includes('File too large')) {
    return res.status(400).json({ error: '图片大小不能超过 2MB' });
  }
  res.status(500).json({ error: error.message || '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  GET    /api/books`);
  console.log(`  GET    /api/books/:id`);
  console.log(`  POST   /api/books`);
  console.log(`  PUT    /api/books/:id`);
  console.log(`  DELETE /api/books/:id`);
  console.log(`  GET    /api/orders`);
  console.log(`  GET    /api/orders/:id`);
  console.log(`  POST   /api/orders`);
  console.log(`  PUT    /api/orders/:id/status`);
});
