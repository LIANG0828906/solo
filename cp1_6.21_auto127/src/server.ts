import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, '..', 'data');
const BOOKS_FILE = path.join(DATA_DIR, 'books.json');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  isBorrowed: boolean;
  color: string;
}

interface Record {
  id: string;
  bookId: string;
  bookTitle: string;
  borrower: string;
  borrowDate: string;
  returnDate: string | null;
  isReturned: boolean;
}

function ensureDataFiles(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BOOKS_FILE)) {
      fs.writeFileSync(BOOKS_FILE, '[]', 'utf-8');
    }
    if (!fs.existsSync(RECORDS_FILE)) {
      fs.writeFileSync(RECORDS_FILE, '[]', 'utf-8');
    }
  } catch (err) {
    console.error('Error ensuring data files:', err);
  }
}

function readBooks(): Book[] {
  try {
    ensureDataFiles();
    const data = fs.readFileSync(BOOKS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading books:', err);
    return [];
  }
}

function writeBooks(books: Book[]): void {
  try {
    ensureDataFiles();
    const tempFile = BOOKS_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(books, null, 2), 'utf-8');
    fs.renameSync(tempFile, BOOKS_FILE);
  } catch (err) {
    console.error('Error writing books:', err);
    throw err;
  }
}

function readRecords(): Record[] {
  try {
    ensureDataFiles();
    const data = fs.readFileSync(RECORDS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading records:', err);
    return [];
  }
}

function writeRecords(records: Record[]): void {
  try {
    ensureDataFiles();
    const tempFile = RECORDS_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(records, null, 2), 'utf-8');
    fs.renameSync(tempFile, RECORDS_FILE);
  } catch (err) {
    console.error('Error writing records:', err);
    throw err;
  }
}

const COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316',
  '#F59E0B', '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6'
];

function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

ensureDataFiles();

app.get('/api/books', (_req: Request, res: Response) => {
  try {
    const books = readBooks();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read books' });
  }
});

app.post('/api/books', (req: Request, res: Response) => {
  try {
    const { title, author, isbn } = req.body;
    if (!title || !author || !isbn) {
      return res.status(400).json({ error: 'Title, author and ISBN are required' });
    }
    const books = readBooks();
    const newBook: Book = {
      id: uuidv4(),
      title: String(title),
      author: String(author),
      isbn: String(isbn),
      isBorrowed: false,
      color: getRandomColor(),
    };
    books.push(newBook);
    writeBooks(books);
    res.status(201).json(newBook);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create book' });
  }
});

app.delete('/api/books/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const books = readBooks();
    const bookIndex = books.findIndex((b) => b.id === id);
    if (bookIndex === -1) {
      return res.status(404).json({ error: 'Book not found' });
    }
    const book = books[bookIndex];
    if (book.isBorrowed) {
      return res.status(400).json({ error: 'Cannot delete a borrowed book' });
    }
    books.splice(bookIndex, 1);
    writeBooks(books);

    const records = readRecords();
    const updatedRecords = records.filter((r) => r.bookId !== id || r.isReturned);
    writeRecords(updatedRecords);

    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

app.get('/api/records', (_req: Request, res: Response) => {
  try {
    const records = readRecords();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read records' });
  }
});

app.post('/api/records', (req: Request, res: Response) => {
  try {
    const { bookId, borrower, borrowDate } = req.body;
    if (!bookId || !borrower || !borrowDate) {
      return res.status(400).json({ error: 'Book ID, borrower and borrow date are required' });
    }
    const books = readBooks();
    const bookIndex = books.findIndex((b) => b.id === bookId);
    if (bookIndex === -1) {
      return res.status(404).json({ error: 'Book not found' });
    }
    if (books[bookIndex].isBorrowed) {
      return res.status(400).json({ error: 'Book is already borrowed' });
    }

    const records = readRecords();
    const newRecord: Record = {
      id: uuidv4(),
      bookId: String(bookId),
      bookTitle: books[bookIndex].title,
      borrower: String(borrower),
      borrowDate: String(borrowDate),
      returnDate: null,
      isReturned: false,
    };
    records.push(newRecord);
    writeRecords(records);

    books[bookIndex].isBorrowed = true;
    writeBooks(books);

    res.status(201).json(newRecord);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create record' });
  }
});

app.patch('/api/records/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { returnDate } = req.body;
    if (!returnDate) {
      return res.status(400).json({ error: 'Return date is required' });
    }
    const records = readRecords();
    const recordIndex = records.findIndex((r) => r.id === id);
    if (recordIndex === -1) {
      return res.status(404).json({ error: 'Record not found' });
    }
    if (records[recordIndex].isReturned) {
      return res.status(400).json({ error: 'Record already returned' });
    }

    records[recordIndex].returnDate = String(returnDate);
    records[recordIndex].isReturned = true;
    writeRecords(records);

    const books = readBooks();
    const bookIndex = books.findIndex((b) => b.id === records[recordIndex].bookId);
    if (bookIndex !== -1) {
      books[bookIndex].isBorrowed = false;
      writeBooks(books);
    }

    res.json(records[recordIndex]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update record' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
