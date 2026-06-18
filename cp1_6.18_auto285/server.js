import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const express = require('express');
const cors = require('cors');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({ books: [] }).write();

function generateDailySales(days = 30) {
  const sales = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    sales.push({
      date: date.toISOString().split('T')[0],
      sales: Math.floor(Math.random() * 10)
    });
  }
  return sales;
}

function initSampleBooks() {
  if (db.get('books').value().length > 0) return;

  const categories = ['文学', '科技', '历史', '艺术', '商业'];
  const sampleBooks = [
    { title: '百年孤独', author: '加西亚·马尔克斯', isbn: '978-7-5442-6998-1', stock: 3, price: 45.00, category: '文学' },
    { title: '三体', author: '刘慈欣', isbn: '978-7-5366-9293-0', stock: 50, price: 68.00, category: '科技' },
    { title: '人类简史', author: '尤瓦尔·赫拉利', isbn: '978-7-5086-4965-8', stock: 25, price: 55.00, category: '历史' },
    { title: '艺术的故事', author: '贡布里希', isbn: '978-7-80746-372-6', stock: 4, price: 128.00, category: '艺术' },
    { title: '从0到1', author: '彼得·蒂尔', isbn: '978-7-5086-5028-9', stock: 30, price: 42.00, category: '商业' },
    { title: '活着', author: '余华', isbn: '978-7-5063-3043-5', stock: 2, price: 35.00, category: '文学' },
    { title: '深度学习', author: 'Ian Goodfellow', isbn: '978-7-115-46182-3', stock: 15, price: 168.00, category: '科技' },
    { title: '明朝那些事儿', author: '当年明月', isbn: '978-7-213-04862-4', stock: 40, price: 198.00, category: '历史' },
    { title: '梵高传', author: '欧文·斯通', isbn: '978-7-5302-1205-5', stock: 20, price: 48.00, category: '艺术' },
    { title: '穷查理宝典', author: '彼得·考夫曼', isbn: '978-7-5086-5142-2', stock: 8, price: 98.00, category: '商业' }
  ];

  const books = sampleBooks.map(book => ({
    id: uuidv4(),
    ...book,
    createdAt: new Date().toISOString(),
    dailySales: generateDailySales(30)
  }));

  db.get('books').push(...books).write();
  console.log('已初始化10本示例图书');
}

app.get('/api/books', (req, res) => {
  const books = db.get('books').value();
  res.json(books);
});

app.post('/api/books', (req, res) => {
  const { title, author, isbn, stock, price, category } = req.body;
  
  if (!title || !author || !isbn || stock === undefined || !price || !category) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  const newBook = {
    id: uuidv4(),
    title,
    author,
    isbn,
    stock: Number(stock),
    price: Number(price),
    category,
    createdAt: new Date().toISOString(),
    dailySales: generateDailySales(30)
  };

  db.get('books').push(newBook).write();
  res.status(201).json(newBook);
});

app.put('/api/books/:id', (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, stock, price, category } = req.body;

  const book = db.get('books').find({ id }).value();
  if (!book) {
    return res.status(404).json({ error: '图书不存在' });
  }

  const updatedBook = {
    ...book,
    title: title || book.title,
    author: author || book.author,
    isbn: isbn || book.isbn,
    stock: stock !== undefined ? Number(stock) : book.stock,
    price: price !== undefined ? Number(price) : book.price,
    category: category || book.category
  };

  db.get('books').find({ id }).assign(updatedBook).write();
  res.json(updatedBook);
});

app.delete('/api/books/:id', (req, res) => {
  const { id } = req.params;

  const book = db.get('books').find({ id }).value();
  if (!book) {
    return res.status(404).json({ error: '图书不存在' });
  }

  db.get('books').remove({ id }).write();
  res.json({ message: '删除成功' });
});

app.get('/api/books/stats/sales', (req, res) => {
  const books = db.get('books').value();
  const now = new Date();

  const monthlySales = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlySales.push({ month: monthKey, total: 0 });
  }

  const categoryMap = {};

  books.forEach(book => {
    book.dailySales.forEach(daily => {
      const saleDate = new Date(daily.date);
      const saleMonth = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
      
      const monthEntry = monthlySales.find(m => m.month === saleMonth);
      if (monthEntry) {
        monthEntry.total += daily.sales;
      }
    });

    const totalBookSales = book.dailySales.reduce((sum, d) => sum + d.sales, 0);
    
    if (!categoryMap[book.category]) {
      categoryMap[book.category] = {
        category: book.category,
        total: 0,
        books: []
      };
    }
    categoryMap[book.category].total += totalBookSales;
    categoryMap[book.category].books.push({
      title: book.title,
      sales: totalBookSales
    });
  });

  const categorySales = Object.values(categoryMap).map(cat => ({
    ...cat,
    books: cat.books.sort((a, b) => b.sales - a.sales)
  }));

  res.json({
    monthlySales,
    categorySales
  });
});

initSampleBooks();

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
